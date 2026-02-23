import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  // Parallel queries — all from diary_entries now
  const [userRes, pgsiRes, episodesThisWeek, episodesLastWeek, diaryRes, streakRes] =
    await Promise.all([
      // User data
      supabase
        .from("users")
        .select("name, risk_score, pgsi_completed")
        .eq("id", userId)
        .single(),

      // Latest PGSI result
      supabase
        .from("pgsi_results")
        .select("total_score, risk_category, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),

      // Episodes this week (from diary_entries where type = episode)
      supabase
        .from("diary_entries")
        .select("id, amount, date")
        .eq("user_id", userId)
        .eq("type", "episode")
        .gte("date", getWeekStartISO(0))
        .lte("date", getWeekEndISO(0)),

      // Episodes last week
      supabase
        .from("diary_entries")
        .select("id, amount")
        .eq("user_id", userId)
        .eq("type", "episode")
        .gte("date", getWeekStartISO(1))
        .lte("date", getWeekEndISO(1)),

      // Last 3 diary entries (any type)
      supabase
        .from("diary_entries")
        .select("id, type, notes, mood_before, mood_after, amount, date")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(3),

      // All episode dates for streak (last 90 days)
      supabase
        .from("diary_entries")
        .select("date")
        .eq("user_id", userId)
        .eq("type", "episode")
        .gte("date", daysAgoISO(90))
        .order("date", { ascending: false }),
    ]);

  // Calculate weekly stats
  const thisWeekEpisodes = episodesThisWeek.data || [];
  const lastWeekEpisodes = episodesLastWeek.data || [];

  const thisWeekCount = thisWeekEpisodes.length;
  const lastWeekCount = lastWeekEpisodes.length;

  const thisWeekAmount = thisWeekEpisodes.reduce(
    (sum: number, e: { amount: number }) => sum + (Number(e.amount) || 0),
    0
  );
  const lastWeekAmount = lastWeekEpisodes.reduce(
    (sum: number, e: { amount: number }) => sum + (Number(e.amount) || 0),
    0
  );

  // Calculate streak from diary episode dates
  const episodeDates = (streakRes.data || []).map(
    (e: { date: string }) => e.date.split("T")[0]
  );
  const streak = calculateStreak(episodeDates);

  return NextResponse.json({
    user: userRes.data || { name: null, risk_score: 0 },
    pgsi: pgsiRes.data || null,
    weeklyStats: {
      episodeCount: thisWeekCount,
      totalAmount: thisWeekAmount,
      prevWeekCount: lastWeekCount,
      prevWeekAmount: lastWeekAmount,
      countDelta: thisWeekCount - lastWeekCount,
      amountDelta: thisWeekAmount - lastWeekAmount,
    },
    streak,
    recentDiary: diaryRes.data || [],
  });
}

function getWeekStartISO(weeksAgo: number): string {
  const now = new Date();
  const day = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + 1 - weeksAgo * 7);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

function getWeekEndISO(weeksAgo: number): string {
  const now = new Date();
  const day = now.getDay() || 7;
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - day + 7 - weeksAgo * 7);
  sunday.setHours(23, 59, 59, 999);
  return sunday.toISOString();
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function calculateStreak(episodeDates: string[]): number {
  if (episodeDates.length === 0) return 0;

  const episodeSet = new Set(episodeDates);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayStr = today.toISOString().split("T")[0];
  if (episodeSet.has(todayStr)) return 0;

  let streak = 0;
  const checkDate = new Date(today);

  for (let i = 0; i < 90; i++) {
    checkDate.setDate(checkDate.getDate() - 1);
    const dateStr = checkDate.toISOString().split("T")[0];

    if (episodeSet.has(dateStr)) {
      streak = i + 1;
      break;
    }
  }

  if (streak === 0 && episodeDates.length > 0) {
    const lastEpisode = new Date(episodeDates[0]);
    streak = Math.floor(
      (today.getTime() - lastEpisode.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  return streak;
}
