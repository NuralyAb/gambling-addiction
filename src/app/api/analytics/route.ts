import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

interface DiaryRow {
  type: string;
  date: string;
  duration: number | null;
  amount: number;
  platform: string | null;
  mood_before: string | null;
  mood_after: string | null;
  triggers: string[];
}

const MOOD_SCORE: Record<string, number> = {
  terrible: 1,
  bad: 2,
  neutral: 3,
  good: 4,
  great: 5,
};

const TRIGGER_LABELS: Record<string, string> = {
  stress: "Стресс",
  boredom: "Скука",
  loneliness: "Одиночество",
  alcohol: "Алкоголь",
  ads: "Реклама",
  other: "Другое",
};

const DAY_NAMES = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  // Fetch all diary entries for last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const { data: entries, error } = await supabase
    .from("diary_entries")
    .select("type, date, duration, amount, platform, mood_before, mood_after, triggers")
    .eq("user_id", userId)
    .gte("date", ninetyDaysAgo.toISOString())
    .order("date", { ascending: true });

  if (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }

  const rows: DiaryRow[] = entries || [];
  const episodes = rows.filter((r) => r.type === "episode");

  // 1. Daily activity (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyMap = new Map<string, { count: number; amount: number }>();
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - 29 + i);
    const key = d.toISOString().split("T")[0];
    dailyMap.set(key, { count: 0, amount: 0 });
  }

  for (const ep of episodes) {
    const dayKey = ep.date.split("T")[0];
    if (dailyMap.has(dayKey)) {
      const cur = dailyMap.get(dayKey)!;
      cur.count++;
      cur.amount += Number(ep.amount) || 0;
    }
  }

  const dailyActivity = Array.from(dailyMap.entries()).map(([date, val]) => ({
    date: new Date(date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
    fullDate: date,
    count: val.count,
    amount: Math.round(val.amount),
  }));

  // 2. Mood before vs after (episode timeline)
  const moodTimeline = episodes
    .filter((e) => e.mood_before && e.mood_after)
    .map((e) => ({
      date: new Date(e.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
      before: MOOD_SCORE[e.mood_before!] || 3,
      after: MOOD_SCORE[e.mood_after!] || 3,
    }));

  // 3. Trigger frequency
  const triggerCounts: Record<string, number> = {};
  for (const ep of episodes) {
    if (ep.triggers && Array.isArray(ep.triggers)) {
      for (const t of ep.triggers) {
        triggerCounts[t] = (triggerCounts[t] || 0) + 1;
      }
    }
  }

  const triggerData = Object.entries(triggerCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({
      name: TRIGGER_LABELS[key] || key,
      value: count,
    }));

  // 4. Hourly distribution
  const hourlyCounts = Array(24).fill(0);
  for (const ep of episodes) {
    const hour = new Date(ep.date).getHours();
    hourlyCounts[hour]++;
  }

  // Group into 6 time blocks for radar
  const timeBlocks = [
    { name: "Ночь\n0-4", value: hourlyCounts.slice(0, 4).reduce((a, b) => a + b, 0) },
    { name: "Утро\n4-8", value: hourlyCounts.slice(4, 8).reduce((a, b) => a + b, 0) },
    { name: "День\n8-12", value: hourlyCounts.slice(8, 12).reduce((a, b) => a + b, 0) },
    { name: "День\n12-16", value: hourlyCounts.slice(12, 16).reduce((a, b) => a + b, 0) },
    { name: "Вечер\n16-20", value: hourlyCounts.slice(16, 20).reduce((a, b) => a + b, 0) },
    { name: "Ночь\n20-24", value: hourlyCounts.slice(20, 24).reduce((a, b) => a + b, 0) },
  ];

  // 5. Insights
  const insights: string[] = [];

  // Total spent this month
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  const monthlyEpisodes = episodes.filter((e) => new Date(e.date) >= thisMonth);
  const monthlySpent = monthlyEpisodes.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  if (episodes.length > 0) {
    // Average mood drop
    const moodDrops = episodes
      .filter((e) => e.mood_before && e.mood_after)
      .map((e) => (MOOD_SCORE[e.mood_before!] || 3) - (MOOD_SCORE[e.mood_after!] || 3));

    if (moodDrops.length > 0) {
      const avgDrop = moodDrops.reduce((a, b) => a + b, 0) / moodDrops.length;
      if (avgDrop > 0) {
        insights.push(
          `После игры ваше настроение падает в среднем на ${avgDrop.toFixed(1)} пункта`
        );
      } else if (avgDrop < 0) {
        insights.push(
          `После игры ваше настроение улучшается в среднем на ${Math.abs(avgDrop).toFixed(1)} пункта`
        );
      }
    }

    // Most common trigger
    if (triggerData.length > 0) {
      const topTrigger = triggerData[0];
      const pct = Math.round((topTrigger.value / episodes.length) * 100);
      insights.push(
        `Основной триггер — ${topTrigger.name.toLowerCase()} (${pct}% эпизодов)`
      );
    }

    // Most common day of week
    const dayCounts = Array(7).fill(0);
    for (const ep of episodes) {
      dayCounts[new Date(ep.date).getDay()]++;
    }
    const maxDay = dayCounts.indexOf(Math.max(...dayCounts));
    if (Math.max(...dayCounts) > 1) {
      insights.push(`Вы чаще всего играете в ${DAY_NAMES[maxDay].toLowerCase()}`);
    }

    // Peak time
    const peakBlock = timeBlocks.reduce((a, b) => (a.value > b.value ? a : b));
    if (peakBlock.value > 0) {
      insights.push(
        `Пиковое время — ${peakBlock.name.replace("\n", " ")} (${peakBlock.value} эпизодов)`
      );
    }

    // Average duration
    const durations = episodes.filter((e) => e.duration).map((e) => e.duration!);
    if (durations.length > 0) {
      const avgDur = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
      insights.push(`Средняя длительность сессии — ${avgDur} минут`);
    }

    // Monthly spending
    if (monthlySpent > 0) {
      insights.push(
        `За этот месяц потрачено: ${new Intl.NumberFormat("ru-RU").format(Math.round(monthlySpent))} \u20BD`
      );
    }
  }

  return NextResponse.json({
    dailyActivity,
    moodTimeline,
    triggerData,
    timeBlocks,
    insights,
    monthlySpent: Math.round(monthlySpent),
    totalEpisodes: episodes.length,
  });
}
