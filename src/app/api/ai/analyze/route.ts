import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { predictRisk, MODEL_META as NEURAL_META } from "@/lib/ai/neural-risk";
import type { BehavioralFeatures } from "@/lib/ai/neural-risk";
import { analyzeTrend, MODULE_META as SENTIMENT_META } from "@/lib/ai/sentiment-analysis";
import { analyzeAnomalies, MODULE_META as ANOMALY_META } from "@/lib/ai/anomaly-detector";
import type { BehaviorData, DataPoint } from "@/lib/ai/anomaly-detector";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const since = thirtyDaysAgo.toISOString();

  // Fetch all data in parallel
  const [episodesRes, allDiaryRes, blockRes, userRes] = await Promise.all([
    supabase
      .from("diary_entries")
      .select("date, amount, duration, mood_before, mood_after, triggers, notes")
      .eq("user_id", userId)
      .eq("type", "episode")
      .gte("date", since)
      .order("date", { ascending: true }),
    supabase
      .from("diary_entries")
      .select("date, notes, type")
      .eq("user_id", userId)
      .gte("date", since)
      .order("date", { ascending: true }),
    supabase
      .from("block_events")
      .select("created_at, domain")
      .eq("user_id", userId)
      .gte("created_at", since)
      .order("created_at", { ascending: true }),
    supabase
      .from("users")
      .select("created_at")
      .eq("id", userId)
      .single(),
  ]);

  const episodes = episodesRes.data || [];
  const allDiary = allDiaryRes.data || [];
  const blockEvents = blockRes.data || [];

  // ═══════ MODULE 1: Neural Network Risk Prediction ═══════

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const episodesLast7 = episodes.filter((e) => new Date(e.date) >= sevenDaysAgo);
  const episodesPrev7 = episodes.filter(
    (e) => new Date(e.date) >= fourteenDaysAgo && new Date(e.date) < sevenDaysAgo
  );

  const amountsLast7 = episodesLast7.map((e) => Number(e.amount) || 0);
  const amountsPrev7 = episodesPrev7.map((e) => Number(e.amount) || 0);
  const avgLast = amountsLast7.length > 0 ? amountsLast7.reduce((s, a) => s + a, 0) / amountsLast7.length : 0;
  const avgPrev = amountsPrev7.length > 0 ? amountsPrev7.reduce((s, a) => s + a, 0) / amountsPrev7.length : 0;

  const moodScores = episodes
    .filter((e) => e.mood_before)
    .map((e) => ({ terrible: 1, bad: 2, neutral: 3, good: 4, great: 5 }[e.mood_before as string] || 3));
  const avgMood = moodScores.length > 0 ? moodScores.reduce((s, v) => s + v, 0) / moodScores.length : 3;

  const nightEpisodes = episodes.filter((e) => {
    const h = new Date(e.date).getHours();
    return h >= 22 || h < 6;
  });

  const triggers = new Set<string>();
  episodes.forEach((e) => {
    if (Array.isArray(e.triggers)) e.triggers.forEach((t: string) => triggers.add(t));
  });

  // Streak days
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
  if (episodes.length === 0 && userRes.data) {
    const regDate = new Date(userRes.data.created_at);
    streakDays = Math.floor((now.getTime() - regDate.getTime()) / 86400000);
  }

  const features: BehavioralFeatures = {
    episodeFrequency: episodesLast7.length,
    spendingTrend: avgPrev > 0 ? avgLast / avgPrev : avgLast > 0 ? 2 : 0,
    moodScore: avgMood,
    nightActivityRatio: episodes.length > 0 ? nightEpisodes.length / episodes.length : 0,
    triggerDiversity: triggers.size,
    streakDays,
  };

  const neuralPrediction = predictRisk(features);

  // ═══════ MODULE 2: NLP Sentiment Analysis ═══════

  const diaryTexts = allDiary
    .filter((d) => d.notes && d.notes.trim().length > 0)
    .map((d) => ({ date: d.date, text: d.notes as string }));

  const sentimentTrend = analyzeTrend(diaryTexts);

  // ═══════ MODULE 3: Anomaly Detection ═══════

  // Build daily aggregates for last 30 days
  const dayMap = new Map<string, { spending: number; episodes: number; blocks: number }>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    dayMap.set(key, { spending: 0, episodes: 0, blocks: 0 });
  }

  episodes.forEach((e) => {
    const key = new Date(e.date).toISOString().split("T")[0];
    const day = dayMap.get(key);
    if (day) {
      day.spending += Number(e.amount) || 0;
      day.episodes += 1;
    }
  });

  blockEvents.forEach((e) => {
    const key = new Date(e.created_at).toISOString().split("T")[0];
    const day = dayMap.get(key);
    if (day) day.blocks += 1;
  });

  const sortedDays = Array.from(dayMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  const dailySpending: DataPoint[] = sortedDays.map(([date, d]) => ({
    date, value: d.spending,
  }));
  const dailyEpisodes: DataPoint[] = sortedDays.map(([date, d]) => ({
    date, value: d.episodes,
  }));
  const dailyBlocks: DataPoint[] = sortedDays.map(([date, d]) => ({
    date, value: d.blocks,
  }));

  // Hourly distribution
  const hourCounts = Array(24).fill(0);
  episodes.forEach((e) => hourCounts[new Date(e.date).getHours()]++);
  const hourlyActivity: DataPoint[] = hourCounts.map((count, h) => ({
    date: String(h), label: String(h), value: count,
  }));

  const behaviorData: BehaviorData = {
    dailySpending,
    dailyEpisodes,
    hourlyActivity,
    blockAttempts: dailyBlocks,
  };

  const anomalyReport = analyzeAnomalies(behaviorData);

  // ═══════ Combined response ═══════

  return NextResponse.json({
    timestamp: now.toISOString(),
    modules: {
      neuralNetwork: {
        meta: NEURAL_META,
        prediction: neuralPrediction,
        inputFeatures: features,
      },
      sentimentAnalysis: {
        meta: SENTIMENT_META,
        trend: {
          averageScore: sentimentTrend.averageScore,
          trend: sentimentTrend.trend,
          dominantMood: sentimentTrend.dominantMood,
          negativeStreak: sentimentTrend.negativeStreak,
          warningSignals: sentimentTrend.warningSignals,
          recentVsPrevious: sentimentTrend.recentVsPrevious,
          entryCount: sentimentTrend.entries.length,
        },
      },
      anomalyDetector: {
        meta: ANOMALY_META,
        summary: anomalyReport.summary,
        spending: anomalyReport.spending.stats,
        episodes: anomalyReport.episodes.stats,
        timePatterns: {
          peakHour: anomalyReport.timePatterns.peakHour,
          nightRatio: anomalyReport.timePatterns.nightRatio,
        },
      },
    },
    combinedRisk: {
      neuralScore: neuralPrediction.riskScore,
      sentimentTrend: sentimentTrend.trend,
      anomalyRisk: anomalyReport.summary.overallRisk,
      allWarnings: [
        ...neuralPrediction.featureImportance
          .filter((f) => f.impact === "high")
          .map((f) => `Нейросеть: высокий вклад — ${f.feature}`),
        ...sentimentTrend.warningSignals.map((w) => `NLP: ${w}`),
        ...anomalyReport.summary.alerts.map((a) => `Детектор: ${a}`),
      ],
    },
  });
}
