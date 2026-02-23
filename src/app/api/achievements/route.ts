import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
}

const LEVELS = [
  { min: 0, max: 3, name: "Новичок" },
  { min: 4, max: 8, name: "Боец" },
  { min: 9, max: 14, name: "Воин" },
  { min: 15, max: 21, name: "Герой" },
  { min: 22, max: 27, name: "Мастер" },
  { min: 28, max: Infinity, name: "Легенда" },
];

function getLevel(earnedCount: number) {
  const idx = LEVELS.findIndex((l) => earnedCount >= l.min && earnedCount <= l.max);
  const level = idx === -1 ? 0 : idx;
  const nextLevel = LEVELS[level + 1] || null;
  return {
    level,
    levelName: LEVELS[level].name,
    nextLevel: nextLevel ? { name: nextLevel.name, requires: nextLevel.min } : null,
  };
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor(Math.abs(b.getTime() - a.getTime()) / msPerDay);
}

function computeLongestStreak(episodeDates: Date[], registrationDate: Date, now: Date): number {
  if (episodeDates.length === 0) {
    return daysBetween(registrationDate, now);
  }

  const sorted = [...episodeDates].sort((a, b) => a.getTime() - b.getTime());

  let longest = daysBetween(registrationDate, sorted[0]);

  for (let i = 1; i < sorted.length; i++) {
    const gap = daysBetween(sorted[i - 1], sorted[i]);
    if (gap > longest) longest = gap;
  }

  const lastGap = daysBetween(sorted[sorted.length - 1], now);
  if (lastGap > longest) longest = lastGap;

  return longest;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const [profileRes, episodesRes, urgesRes, blockRes] = await Promise.all([
    supabase
      .from("users")
      .select("created_at, risk_score, pgsi_completed, trusted_person_tg, name, tg_username")
      .eq("id", userId)
      .single(),
    supabase
      .from("diary_entries")
      .select("date, amount")
      .eq("user_id", userId)
      .eq("type", "episode")
      .order("date", { ascending: false }),
    supabase
      .from("diary_entries")
      .select("date")
      .eq("user_id", userId)
      .eq("type", "urge")
      .order("date", { ascending: false }),
    supabase
      .from("block_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  // chat_messages table may not exist — query separately with error handling
  let chatMessageCount = 0;
  try {
    const { data: chatMessages } = await supabase
      .from("chat_messages")
      .select("id")
      .eq("user_id", userId)
      .limit(1);
    chatMessageCount = chatMessages?.length || 0;
  } catch {
    // table doesn't exist
  }

  const profile = profileRes.data;
  const episodes = episodesRes.data;
  const urges = urgesRes.data;
  const blockCount = blockRes.count;

  if (!profile) {
    console.error("Achievements: profile not found", profileRes.error);
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const now = new Date();
  const registrationDate = new Date(profile.created_at);
  const episodeDates = (episodes || []).map((e) => new Date(e.date));
  const urgeEntries = urges || [];
  const totalDiaryEntries = (episodes?.length || 0) + urgeEntries.length;

  // Streak: days since last episode (or since registration)
  const streakDays =
    episodeDates.length > 0
      ? daysBetween(episodeDates[0], now)
      : daysBetween(registrationDate, now);

  const longestStreak = computeLongestStreak(episodeDates, registrationDate, now);

  // Total saved estimate: average episode spend * streak days
  const episodeAmounts = (episodes || []).map((e) => e.amount || 0).filter((a) => a > 0);
  const avgDailySpend =
    episodeAmounts.length > 0
      ? episodeAmounts.reduce((s, a) => s + a, 0) / episodeAmounts.length
      : 0;
  const totalSaved = Math.round(avgDailySpend * streakDays);

  const totalLost = Math.round(episodeAmounts.reduce((s, a) => s + a, 0));
  const episodeCount = (episodes || []).length;
  const avgPerEpisode = episodeCount > 0 ? Math.round(totalLost / episodeCount) : 0;

  const monthNames = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
  const monthlyBreakdown: Array<{ month: string; label: string; amount: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const y = d.getFullYear();
    const m = d.getMonth();
    const monthKey = `${y}-${String(m + 1).padStart(2, "0")}`;
    const amount = (episodes || [])
      .filter((e) => {
        const ed = new Date(e.date);
        return ed.getFullYear() === y && ed.getMonth() === m;
      })
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    monthlyBreakdown.push({ month: monthKey, label: monthNames[m], amount: Math.round(amount) });
  }

  const hasChatMessages = chatMessageCount > 0;
  const hasBlockEvents = (blockCount || 0) > 0;
  const totalBlocked = blockCount || 0;
  const hasPgsi = profile.pgsi_completed === true;
  const hasTrustedPerson = profile.trusted_person_tg != null;
  const daysSinceRegistration = daysBetween(registrationDate, now);

  // Night episodes (22:00-06:00)
  const nightEpisodes = (episodes || []).filter((e) => {
    const h = new Date(e.date).getHours();
    return h >= 22 || h < 6;
  }).length;

  // Unique triggers
  let uniqueTriggerCount = 0;
  try {
    const { data: triggerEntries } = await supabase
      .from("diary_entries")
      .select("triggers")
      .eq("user_id", userId)
      .not("triggers", "is", null);
    const allTriggers = new Set<string>();
    (triggerEntries || []).forEach((e) => {
      if (Array.isArray(e.triggers)) e.triggers.forEach((t: string) => allTriggers.add(t));
      else if (typeof e.triggers === "string") allTriggers.add(e.triggers);
    });
    uniqueTriggerCount = allTriggers.size;
  } catch { /* */ }

  // Education progress from localStorage is client-side only, so check via profile flag or skip
  const hasProfile = !!(profile.name || profile.tg_username);

  const achievements: Achievement[] = [
    // -- Первые шаги --
    {
      id: "first_step",
      title: "Первый шаг",
      description: "Зарегистрироваться в системе",
      icon: "🚀",
      earned: true,
    },
    {
      id: "profile_filled",
      title: "Заполнил профиль",
      description: "Указать имя и Telegram в профиле",
      icon: "👤",
      earned: hasProfile,
    },
    {
      id: "first_diary",
      title: "Первая запись",
      description: "Сделать первую запись в дневнике",
      icon: "📝",
      earned: totalDiaryEntries > 0,
    },
    {
      id: "diary_10",
      title: "Дневник привычка",
      description: "Написать 10 записей в дневнике",
      icon: "📖",
      earned: totalDiaryEntries >= 10,
    },
    {
      id: "diary_50",
      title: "Летописец",
      description: "50 записей в дневнике — настоящая привычка",
      icon: "📚",
      earned: totalDiaryEntries >= 50,
    },

    // -- Серия воздержания --
    {
      id: "one_day_streak",
      title: "Первый день",
      description: "Один день без азартных игр",
      icon: "🌱",
      earned: streakDays >= 1,
    },
    {
      id: "three_day_streak",
      title: "3 дня без игры",
      description: "Продержаться 3 дня без эпизодов",
      icon: "⭐",
      earned: streakDays >= 3,
    },
    {
      id: "week_streak",
      title: "7 дней без игры",
      description: "Целая неделя без азартных игр",
      icon: "🔥",
      earned: streakDays >= 7,
    },
    {
      id: "two_week_streak",
      title: "14 дней без игры",
      description: "Две недели свободы от игр",
      icon: "💪",
      earned: streakDays >= 14,
    },
    {
      id: "month_streak",
      title: "30 дней без игры",
      description: "Целый месяц без азартных игр!",
      icon: "🏆",
      earned: streakDays >= 30,
    },
    {
      id: "two_month_streak",
      title: "60 дней без игры",
      description: "Два месяца — серьёзный результат",
      icon: "🎯",
      earned: streakDays >= 60,
    },
    {
      id: "quarter_streak",
      title: "100 дней без игры",
      description: "Сто дней — невероятное достижение",
      icon: "💎",
      earned: streakDays >= 100,
    },
    {
      id: "half_year_streak",
      title: "Полгода свободы",
      description: "180 дней без азартных игр",
      icon: "🌈",
      earned: streakDays >= 180,
    },
    {
      id: "year_streak",
      title: "Целый год!",
      description: "365 дней свободы — вы легенда",
      icon: "👑",
      earned: streakDays >= 365,
    },

    // -- Борьба с соблазном --
    {
      id: "first_urge_resist",
      title: "Устоял перед соблазном",
      description: "Зафиксировать первый позыв, которому не поддались",
      icon: "🛡️",
      earned: urgeEntries.length > 0,
    },
    {
      id: "five_urge_resist",
      title: "5 раз устоял",
      description: "Пять раз победили желание играть",
      icon: "🏅",
      earned: urgeEntries.length >= 5,
    },
    {
      id: "twenty_urge_resist",
      title: "Несгибаемый",
      description: "20 раз устояли перед соблазном",
      icon: "🦾",
      earned: urgeEntries.length >= 20,
    },
    {
      id: "no_night_episodes",
      title: "Ночной покой",
      description: "Ни одного ночного эпизода (22:00–06:00)",
      icon: "🌙",
      earned: episodeCount > 0 && nightEpisodes === 0,
    },

    // -- Инструменты --
    {
      id: "pgsi_test",
      title: "Прошёл тест PGSI",
      description: "Пройти тест для оценки рисков",
      icon: "📊",
      earned: hasPgsi,
    },
    {
      id: "ai_chat",
      title: "Поговорил с AI",
      description: "Начать диалог с AI-помощником",
      icon: "🤖",
      earned: hasChatMessages,
    },
    {
      id: "extension_installed",
      title: "Установил расширение",
      description: "Начать блокировку сайтов через расширение",
      icon: "🧩",
      earned: hasBlockEvents,
    },
    {
      id: "extension_blocked_10",
      title: "Щит работает",
      description: "Расширение заблокировало 10+ сайтов",
      icon: "🔒",
      earned: totalBlocked >= 10,
    },
    {
      id: "extension_blocked_100",
      title: "Крепость",
      description: "100 заблокированных попыток — защита на максимуме",
      icon: "🏰",
      earned: totalBlocked >= 100,
    },
    {
      id: "trusted_person",
      title: "Добавил доверенное лицо",
      description: "Подключить поддержку близкого человека",
      icon: "🤝",
      earned: hasTrustedPerson,
    },

    // -- Триггеры и самопознание --
    {
      id: "trigger_explorer",
      title: "Исследователь триггеров",
      description: "Определить 3+ различных триггера",
      icon: "🔍",
      earned: uniqueTriggerCount >= 3,
    },

    // -- Финансы --
    {
      id: "saved_10k",
      title: "Первые 10 000 ₸",
      description: "Сэкономить 10 000 ₸ благодаря воздержанию",
      icon: "💰",
      earned: totalSaved >= 10000,
    },
    {
      id: "saved_100k",
      title: "100 000 ₸ в кармане",
      description: "Вы сэкономили 100 000 ₸!",
      icon: "💵",
      earned: totalSaved >= 100000,
    },
    {
      id: "saved_500k",
      title: "Полмиллиона",
      description: "500 000 ₸ сэкономлено — можно гордиться",
      icon: "🤑",
      earned: totalSaved >= 500000,
    },

    // -- Прогресс и здоровье --
    {
      id: "low_risk",
      title: "Низкий риск",
      description: "Достичь оценки риска ниже 30",
      icon: "🌟",
      earned: profile.risk_score != null && profile.risk_score < 30,
    },
    {
      id: "veteran",
      title: "Ветеран платформы",
      description: "Быть на платформе более 30 дней",
      icon: "🎖️",
      earned: daysSinceRegistration >= 30,
    },
    {
      id: "old_timer",
      title: "Старожил",
      description: "На платформе более 90 дней",
      icon: "⏳",
      earned: daysSinceRegistration >= 90,
    },
  ];

  // Assign earnedAt approximations for earned achievements
  const achievementsWithDates = achievements.map((a) => {
    if (!a.earned) return a;

    let earnedAt: string | undefined;
    if (a.id === "first_diary" && episodes && episodes.length > 0) {
      const allDates = [
        ...(episodes || []).map((e) => e.date),
        ...urgeEntries.map((u) => u.date),
      ].sort();
      earnedAt = allDates[0];
    }

    return { ...a, earnedAt };
  });

  const earnedCount = achievementsWithDates.filter((a) => a.earned).length;
  const { level, levelName, nextLevel } = getLevel(earnedCount);

  return NextResponse.json({
    streakDays,
    longestStreak,
    totalSaved,
    totalLost,
    avgPerEpisode,
    monthlyBreakdown,
    achievements: achievementsWithDates,
    earnedCount,
    totalCount: achievements.length,
    level,
    levelName,
    nextLevel,
  });
}
