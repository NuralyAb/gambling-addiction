import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  sendWeeklyReport,
  computeRiskScore,
  buildAnalysisSummary,
  WeeklyReportData,
} from "@/lib/telegram";

// POST /api/reports/weekly
// Generates and sends a weekly report for the current user to their trusted person
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("name, tg_username, trusted_person_tg, trusted_person_chat_id, risk_score")
    .eq("id", userId)
    .single();

  if (userErr || !user) {
    return NextResponse.json({ error: "Ошибка загрузки профиля" }, { status: 500 });
  }

  if (!user.trusted_person_chat_id && !user.trusted_person_tg) {
    return NextResponse.json(
      { error: "Доверенное лицо не настроено или ещё не активировало бота" },
      { status: 400 }
    );
  }

  // Last 7 days from now
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  // Previous 7 days (for comparison)
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
  const prevWeekAmount = prevEpisodes.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const { count: disableAttempts } = await supabase
    .from("unlock_requests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", weekStart.toISOString());

  const { score, level } = computeRiskScore({
    totalSessions,
    totalAmount,
    totalTimeMinutes,
    nightSessions,
    disableAttempts: disableAttempts || 0,
    prevWeekAmount,
  });

  const analysisSummary = buildAnalysisSummary({
    riskLevel: level,
    totalSessions,
    nightSessions,
    totalAmount,
    disableAttempts: disableAttempts || 0,
  });

  const weekLabel = `${weekStart.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })} — ${now.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}`;

  const reportData: WeeklyReportData = {
    userName: user.name || "",
    userTg: user.tg_username || "",
    weekStart: weekLabel,
    riskScore: score,
    riskLevel: level,
    totalSessions,
    totalAmount,
    totalTimeMinutes,
    nightSessions,
    disableAttempts: disableAttempts || 0,
    analysisSummary,
    userId,
  };

  const targetChatId = user.trusted_person_chat_id;
  if (!targetChatId) {
    return NextResponse.json(
      { error: "Доверенное лицо ещё не активировало Telegram бот. Попросите их написать /start боту." },
      { status: 400 }
    );
  }

  try {
    await sendWeeklyReport(targetChatId, reportData);
  } catch (err) {
    console.error("Telegram send error:", err);
    return NextResponse.json({ error: "Ошибка отправки в Telegram" }, { status: 500 });
  }

  await supabase.from("users").update({ risk_score: score }).eq("id", userId);

  await supabase.from("weekly_reports").insert({
    user_id: userId,
    week_start: weekStart.toISOString().split("T")[0],
    risk_score: score,
    risk_level: level,
    total_sessions: totalSessions,
    total_amount: totalAmount,
    total_time_minutes: totalTimeMinutes,
    night_sessions: nightSessions,
    disable_attempts: disableAttempts || 0,
    analysis_summary: analysisSummary,
    telegram_report: JSON.stringify(reportData),
  });

  return NextResponse.json({
    success: true,
    riskScore: score,
    riskLevel: level,
    message: "Отчёт отправлен доверенному лицу",
    debug: {
      period: weekLabel,
      episodes: totalSessions,
      amount: totalAmount,
      timeMinutes: totalTimeMinutes,
      nightSessions,
      disableAttempts: disableAttempts || 0,
    },
  });
}

// GET /api/reports/weekly — returns last 10 weekly reports for user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const { data, error } = await supabase
    .from("weekly_reports")
    .select("*")
    .eq("user_id", userId)
    .order("sent_at", { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }

  return NextResponse.json(data);
}
