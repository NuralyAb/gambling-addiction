import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { predictRisk } from "@/lib/ai/neural-risk";
import type { BehavioralFeatures } from "@/lib/ai/neural-risk";
import { sendTelegramMessage } from "@/lib/telegram";

// POST /api/ai/preventive-intervention
// Cron: превентивная интервенция при высоком риске срыва
// Отправляет пользователю и/или доверенному лицу сообщение при riskScore > 60 или relapseProbability > 0.7
export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const since = new Date(now);
  since.setDate(since.getDate() - 30);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const { data: users } = await supabase
    .from("users")
    .select("id, name, tg_username, tg_chat_id, trusted_person_chat_id, last_preventive_sent")
    .or("tg_chat_id.not.is.null,trusted_person_chat_id.not.is.null");

  if (!users || users.length === 0) {
    return NextResponse.json({ intervened: 0, message: "Нет пользователей" });
  }

  const intervened: string[] = [];
  const errors: string[] = [];

  for (const user of users) {
    try {
      const [episodesRes, blockRes, unlockRes] = await Promise.all([
        supabase
          .from("diary_entries")
          .select("date, amount, mood_before, mood_after, triggers")
          .eq("user_id", user.id)
          .eq("type", "episode")
          .gte("date", since.toISOString())
          .order("date", { ascending: true }),
        supabase
          .from("block_events")
          .select("created_at, domain")
          .eq("user_id", user.id)
          .gte("created_at", since.toISOString())
          .order("created_at", { ascending: true }),
        supabase
          .from("unlock_requests")
          .select("created_at")
          .eq("user_id", user.id)
          .gte("created_at", since.toISOString()),
      ]);

      const episodes = episodesRes.data || [];
      const blockEvents = blockRes.data || [];
      const unlockRequests = unlockRes.data || [];

      const episodesLast7 = episodes.filter((e) => new Date(e.date) >= sevenDaysAgo);
      const episodesPrev7 = episodes.filter(
        (e) => new Date(e.date) >= fourteenDaysAgo && new Date(e.date) < sevenDaysAgo
      );
      const amountsLast7 = episodesLast7.map((e) => Number(e.amount) || 0);
      const amountsPrev7 = episodesPrev7.map((e) => Number(e.amount) || 0);
      const avgLast = amountsLast7.length ? amountsLast7.reduce((s, a) => s + a, 0) / amountsLast7.length : 0;
      const avgPrev = amountsPrev7.length ? amountsPrev7.reduce((s, a) => s + a, 0) / amountsPrev7.length : 0;

      const moodScores = episodes
        .filter((e) => e.mood_before)
        .map((e) => ({ terrible: 1, bad: 2, neutral: 3, good: 4, great: 5 }[e.mood_before as string] || 3));
      const avgMood = moodScores.length ? moodScores.reduce((s, v) => s + v, 0) / moodScores.length : 3;

      const nightEpisodes = episodes.filter((e) => {
        const h = new Date(e.date).getHours();
        return h >= 22 || h < 6;
      });
      const triggers = new Set<string>();
      episodes.forEach((e) => {
        if (Array.isArray(e.triggers)) e.triggers.forEach((t: string) => triggers.add(t));
      });

      const episodeDates = new Set(episodes.map((e) => new Date(e.date).toISOString().split("T")[0]));
      let streakDays = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        if (episodeDates.has(d.toISOString().split("T")[0])) break;
        streakDays++;
      }

      const unlockLast7 = unlockRequests.filter((r) => new Date(r.created_at) >= sevenDaysAgo).length;
      const blockedDomains7 = new Set(
        blockEvents.filter((e) => new Date(e.created_at) >= sevenDaysAgo).map((e) => e.domain)
      ).size;

      const features: BehavioralFeatures = {
        episodeFrequency: episodesLast7.length,
        spendingTrend: avgPrev > 0 ? avgLast / avgPrev : avgLast > 0 ? 2 : 0,
        moodScore: avgMood,
        nightActivityRatio: episodes.length ? nightEpisodes.length / episodes.length : 0,
        triggerDiversity: triggers.size,
        streakDays,
        episodesPrev7: episodesPrev7.length,
        unlockAttempts7: unlockLast7,
        blockedSites7: blockedDomains7,
        totalEpisodes30: episodes.length,
      };

      const pred = predictRisk(features);
      const isHighRisk = pred.riskScore >= 60 || (pred.relapseProbability ?? 0) >= 0.7;

      if (!isHighRisk) continue;

      const lastPreventive = user.last_preventive_sent ? new Date(user.last_preventive_sent).getTime() : 0;
      if (Date.now() - lastPreventive < 12 * 3600000) continue;

      const appUrl = process.env.NEXTAUTH_URL || "https://nobet.kz";
      const text = [
        "🧠 <b>Превентивное уведомление</b>",
        "",
        `Система обнаружила повышенный риск срыва (${pred.riskScore}/100).`,
        "",
        "Это не приговор — просто напоминание позаботиться о себе.",
        "",
        "💬 <a href=\"" + appUrl + "/help?tab=chat\">Поговорить с поддержкой</a>",
        "🆘 <a href=\"" + appUrl + "/sos\">SOS — экстренная помощь</a>",
      ].join("\n");

      if (user.tg_chat_id) {
        await sendTelegramMessage(user.tg_chat_id, text, { parse_mode: "HTML" });
      }
      if (user.trusted_person_chat_id) {
        const trustedText = [
          "⚠️ <b>Превентивное уведомление</b>",
          "",
          `Пользователь ${user.tg_username ? "@" + user.tg_username : user.name || "—"} имеет повышенный риск срыва (${pred.riskScore}/100).`,
          "",
          "Рекомендуется связаться и предложить поддержку.",
        ].join("\n");
        await sendTelegramMessage(user.trusted_person_chat_id, trustedText, { parse_mode: "HTML" });
      }

      await supabase
        .from("users")
        .update({ last_preventive_sent: now.toISOString() })
        .eq("id", user.id);

      intervened.push(user.name || user.tg_username || user.id);
    } catch (e) {
      errors.push(`${user.id}: ${e instanceof Error ? e.message : "error"}`);
    }
  }

  return NextResponse.json({
    intervened: intervened.length,
    details: { intervened, errors },
    message: `Превентивных интервенций: ${intervened.length}`,
  });
}
