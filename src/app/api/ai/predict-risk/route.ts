import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { predictRisk } from "@/lib/ai/neural-risk";
import type { BehavioralFeatures } from "@/lib/ai/neural-risk";

const MOOD_SCORE: Record<string, number> = {
  terrible: 1,
  bad: 2,
  neutral: 3,
  good: 4,
  great: 5,
};

const TRIGGER_LABELS: Record<string, string> = {
  stress: "стресс",
  boredom: "скука",
  loneliness: "одиночество",
  alcohol: "алкоголь",
  ads: "реклама",
  other: "другое",
};

const DAY_NAMES_FULL: Record<number, string> = {
  0: "воскресенье",
  1: "понедельник",
  2: "вторник",
  3: "среда",
  4: "четверг",
  5: "пятница",
  6: "суббота",
};

interface DiaryEntry {
  date: string;
  amount: number;
  duration: number | null;
  mood_before: string | null;
  mood_after: string | null;
  triggers: string[];
  platform: string | null;
}

interface BlockEvent {
  domain: string;
  created_at: string;
}

interface UnlockRequest {
  status: string;
  created_at: string;
}

function isNightHour(hour: number): boolean {
  return hour >= 22 || hour < 6;
}

function computeStreakDays(episodes: DiaryEntry[]): number {
  if (episodes.length === 0) return 0;

  const episodeDates = new Set(
    episodes.map((e) => e.date.split("T")[0])
  );

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];

    if (episodeDates.has(key)) {
      break;
    }
    streak++;
  }

  return streak;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const since = thirtyDaysAgo.toISOString();

  const [diaryResult, blockResult, unlockResult] = await Promise.all([
    supabase
      .from("diary_entries")
      .select("date, amount, duration, mood_before, mood_after, triggers, platform")
      .eq("user_id", userId)
      .eq("type", "episode")
      .gte("date", since)
      .order("date", { ascending: true }),
    supabase
      .from("block_events")
      .select("domain, created_at")
      .eq("user_id", userId)
      .gte("created_at", since)
      .order("created_at", { ascending: true }),
    supabase
      .from("unlock_requests")
      .select("status, created_at")
      .eq("user_id", userId)
      .gte("created_at", since)
      .order("created_at", { ascending: true }),
  ]);

  if (diaryResult.error || blockResult.error || unlockResult.error) {
    console.error("Predict-risk DB errors:", {
      diary: diaryResult.error,
      block: blockResult.error,
      unlock: unlockResult.error,
    });
    return NextResponse.json({ error: "Ошибка загрузки данных" }, { status: 500 });
  }

  const episodes: DiaryEntry[] = diaryResult.data || [];
  const blockEvents: BlockEvent[] = blockResult.data || [];
  const unlockRequests: UnlockRequest[] = unlockResult.data || [];

  const totalDataPoints = episodes.length + blockEvents.length + unlockRequests.length;
  if (totalDataPoints === 0) {
    return NextResponse.json({
      relapseRisk: 5,
      riskLevel: "LOW",
      trend: "stable",
      warnings: [],
      recommendations: ["Начните вести дневник, чтобы получить персональный анализ"],
      patterns: {
        peakHours: [],
        peakDays: [],
        topTriggers: [],
        blockedSitesWeek: 0,
        avgMoodBefore: 0,
        financialTrend: "stable",
        nightActivityPercent: 0,
        episodesLast7: 0,
        episodesPrev7: 0,
        streakDays: 0,
      },
      message: "Недостаточно данных",
    });
  }

  // --- Time pattern analysis ---
  const hourCounts = Array(24).fill(0);
  const dayCounts = Array(7).fill(0);

  for (const ep of episodes) {
    const d = new Date(ep.date);
    hourCounts[d.getHours()]++;
    dayCounts[d.getDay()]++;
  }

  const peakHours = hourCounts
    .map((count, hour) => ({ hour, count }))
    .filter((h) => h.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
    .map((h) => h.hour);

  const peakDays = dayCounts
    .map((count, day) => ({ day, count }))
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((d) => DAY_NAMES_FULL[d.day]);

  // --- Trend: last 7 vs previous 7 days ---
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const episodesLast7 = episodes.filter(
    (e) => new Date(e.date) >= sevenDaysAgo
  ).length;
  const episodesPrev7 = episodes.filter(
    (e) => new Date(e.date) >= fourteenDaysAgo && new Date(e.date) < sevenDaysAgo
  ).length;

  let trend: "increasing" | "decreasing" | "stable" = "stable";
  if (episodesLast7 > episodesPrev7 + 1) {
    trend = "increasing";
  } else if (episodesLast7 + 1 < episodesPrev7) {
    trend = "decreasing";
  }

  // --- Trigger analysis ---
  const triggerCounts: Record<string, number> = {};
  for (const ep of episodes) {
    if (ep.triggers && Array.isArray(ep.triggers)) {
      for (const t of ep.triggers) {
        triggerCounts[t] = (triggerCounts[t] || 0) + 1;
      }
    }
  }

  const topTriggers = Object.entries(triggerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, count]) => ({
      name: TRIGGER_LABELS[key] || key,
      count,
    }));

  // --- Mood analysis ---
  const moodScores = episodes
    .filter((e) => e.mood_before)
    .map((e) => MOOD_SCORE[e.mood_before!] || 3);

  const avgMoodBefore =
    moodScores.length > 0
      ? Math.round((moodScores.reduce((a, b) => a + b, 0) / moodScores.length) * 10) / 10
      : 0;

  // --- Night activity ---
  const nightEpisodes = episodes.filter((e) => isNightHour(new Date(e.date).getHours()));
  const nightActivityPercent =
    episodes.length > 0 ? Math.round((nightEpisodes.length / episodes.length) * 100) : 0;

  // --- Blocked sites last 7 days ---
  const blockedSitesWeek = blockEvents.filter(
    (e) => new Date(e.created_at) >= sevenDaysAgo
  ).length;

  const blockedSitesPrevWeek = blockEvents.filter(
    (e) =>
      new Date(e.created_at) >= fourteenDaysAgo &&
      new Date(e.created_at) < sevenDaysAgo
  ).length;

  // --- Financial escalation ---
  const amountsLast7 = episodes
    .filter((e) => new Date(e.date) >= sevenDaysAgo)
    .map((e) => Number(e.amount) || 0);
  const amountsPrev7 = episodes
    .filter((e) => new Date(e.date) >= fourteenDaysAgo && new Date(e.date) < sevenDaysAgo)
    .map((e) => Number(e.amount) || 0);

  const avgAmountLast7 =
    amountsLast7.length > 0 ? amountsLast7.reduce((a, b) => a + b, 0) / amountsLast7.length : 0;
  const avgAmountPrev7 =
    amountsPrev7.length > 0 ? amountsPrev7.reduce((a, b) => a + b, 0) / amountsPrev7.length : 0;

  let financialTrend: "increasing" | "decreasing" | "stable" = "stable";
  if (avgAmountLast7 > avgAmountPrev7 * 1.2 && avgAmountLast7 > 0) {
    financialTrend = "increasing";
  } else if (avgAmountPrev7 > avgAmountLast7 * 1.2 && avgAmountPrev7 > 0) {
    financialTrend = "decreasing";
  }

  // --- Streak (clean days since last episode) ---
  const streakDays = computeStreakDays(episodes);

  // --- Unlock request pressure ---
  const unlockLast7 = unlockRequests.filter(
    (r) => new Date(r.created_at) >= sevenDaysAgo
  ).length;

  // ========== GBM RISK SCORE (replaces hand-crafted rules) ==========

  const spendingTrend = avgAmountPrev7 > 0
    ? avgAmountLast7 / avgAmountPrev7
    : avgAmountLast7 > 0 ? 2 : 0;

  const gbmFeatures: BehavioralFeatures = {
    episodeFrequency:   episodesLast7,
    spendingTrend,
    moodScore:          avgMoodBefore > 0 ? avgMoodBefore : 3,
    nightActivityRatio: episodes.length > 0 ? nightEpisodes.length / episodes.length : 0,
    triggerDiversity:   Object.keys(triggerCounts).length,
    streakDays,
    // Extended features
    episodesPrev7,
    unlockAttempts7:    unlockLast7,
    blockedSites7:      blockedSitesWeek,
    totalEpisodes30:    episodes.length,
  };

  const gbmResult = predictRisk(gbmFeatures);
  const relapseRisk = gbmResult.riskScore;
  const riskLevel   = gbmResult.riskLevel;
  const daysUntilRelapse = gbmResult.daysUntilRelapse;

  // ========== WARNINGS ==========
  const warnings: string[] = [];

  if (trend === "increasing") {
    warnings.push(
      `Частота эпизодов растёт: ${episodesLast7} за последние 7 дней vs ${episodesPrev7} за предыдущие 7`
    );
  }

  if (nightActivityPercent > 30) {
    warnings.push(
      `Участились ночные сессии (${nightActivityPercent}% эпизодов с 22:00 до 06:00)`
    );
  }

  if (financialTrend === "increasing") {
    warnings.push("Суммы ставок увеличиваются — признак эскалации");
  }

  if (blockedSitesWeek > 10) {
    warnings.push(
      `Частые попытки доступа к заблокированным сайтам (${blockedSitesWeek} за неделю)`
    );
  }

  if (blockedSitesWeek > blockedSitesPrevWeek + 5) {
    warnings.push("Резкий рост попыток обхода блокировки");
  }

  if (avgMoodBefore > 0 && avgMoodBefore <= 2) {
    warnings.push(
      `Низкое настроение перед эпизодами (среднее ${avgMoodBefore}/5) — стресс как триггер`
    );
  }

  if (unlockLast7 >= 2) {
    warnings.push(`Запросы на разблокировку участились (${unlockLast7} за неделю)`);
  }

  if (peakHours.some((h) => isNightHour(h)) && episodes.length >= 3) {
    warnings.push("Пик активности приходится на ночное время");
  }

  // ========== RECOMMENDATIONS ==========
  const recommendations: string[] = [];

  if (avgMoodBefore > 0 && avgMoodBefore <= 2.5) {
    recommendations.push(
      "Попробуйте дыхательное упражнение (4-7-8) при следующем желании играть"
    );
  }

  if (nightActivityPercent > 20) {
    recommendations.push(
      "Установите «комендантский час» для устройств после 22:00"
    );
  }

  if (topTriggers.length > 0) {
    const mainTrigger = topTriggers[0].name;
    recommendations.push(
      `Ваш главный триггер — ${mainTrigger}. Подготовьте альтернативное действие на этот случай`
    );
  }

  if (financialTrend === "increasing") {
    recommendations.push(
      "Установите жёсткий денежный лимит и передайте контроль доверенному лицу"
    );
  }

  if (streakDays >= 7) {
    recommendations.push(
      `Отличная серия: ${streakDays} дней без эпизодов! Продолжайте в том же духе`
    );
  } else if (streakDays >= 1) {
    recommendations.push(
      `Вы держитесь ${streakDays} дн. без эпизодов — каждый день на счету`
    );
  }

  if (blockedSitesWeek > 5) {
    recommendations.push(
      "Попытки зайти на сайты — это нормальная часть процесса. Блокировка работает, продолжайте"
    );
  }

  if (peakDays.length > 0) {
    recommendations.push(
      `Запланируйте активность на ${peakDays[0]} — это ваш самый уязвимый день`
    );
  }

  if (episodes.length >= 3 && recommendations.length < 3) {
    recommendations.push(
      "Поговорите с психологом или позвоните на горячую линию: 8-800-2000-122"
    );
  }

  return NextResponse.json({
    relapseRisk,
    riskLevel,
    daysUntilRelapse,
    trend,
    warnings,
    recommendations,
    patterns: {
      peakHours,
      peakDays,
      topTriggers,
      blockedSitesWeek,
      avgMoodBefore,
      financialTrend,
      nightActivityPercent,
      episodesLast7,
      episodesPrev7,
      streakDays,
    },
  });
}
