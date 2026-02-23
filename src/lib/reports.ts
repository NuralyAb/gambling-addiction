import { supabase } from "@/lib/supabase";
import {
  computeRiskScore,
  buildAnalysisSummary,
  WeeklyReportData,
} from "@/lib/telegram";

export async function generateReport(
  userId: string,
  name: string,
  tgUsername: string
): Promise<WeeklyReportData> {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);

  const [episodesRes, prevEpisodesRes] = await Promise.all([
    supabase
      .from("diary_entries")
      .select("amount, duration, date")
      .eq("user_id", userId)
      .eq("type", "episode")
      .gte("date", weekStart.toISOString())
      .lte("date", now.toISOString()),
    supabase
      .from("diary_entries")
      .select("amount")
      .eq("user_id", userId)
      .eq("type", "episode")
      .gte("date", prevWeekStart.toISOString())
      .lt("date", weekStart.toISOString()),
  ]);

  const episodes = episodesRes.data || [];
  const prevEpisodes = prevEpisodesRes.data || [];

  const totalSessions = episodes.length;
  const totalAmount = episodes.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalTimeMinutes = episodes.reduce((s, e) => s + (Number(e.duration) || 0), 0);
  const nightSessions = episodes.filter((e) => {
    const h = new Date(e.date).getHours();
    return h >= 0 && h < 6;
  }).length;
  const prevWeekAmount = prevEpisodes.reduce(
    (s, e) => s + (Number(e.amount) || 0),
    0
  );

  const [unlockRes, blockRes] = await Promise.all([
    supabase
      .from("unlock_requests")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", weekStart.toISOString()),
    supabase
      .from("block_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("blocked_at", weekStart.toISOString()),
  ]);

  const disableAttempts = unlockRes.count || 0;
  const blockedSites = blockRes.count || 0;

  const { score, level } = computeRiskScore({
    totalSessions,
    totalAmount,
    totalTimeMinutes,
    nightSessions,
    disableAttempts,
    prevWeekAmount,
    blockedSites,
  });

  const analysisSummary = buildAnalysisSummary({
    riskLevel: level,
    totalSessions,
    nightSessions,
    totalAmount,
    disableAttempts,
    blockedSites,
  });

  const weekLabel = `${weekStart.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })} — ${now.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}`;

  return {
    userName: name || "",
    userTg: tgUsername || "",
    weekStart: weekLabel,
    riskScore: score,
    riskLevel: level,
    totalSessions,
    totalAmount,
    totalTimeMinutes,
    nightSessions,
    disableAttempts,
    blockedSites,
    analysisSummary,
    userId,
  };
}
