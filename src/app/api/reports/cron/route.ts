import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendWeeklyReport } from "@/lib/telegram";
import { generateReport } from "@/lib/reports";

// POST /api/reports/cron
// Called by external cron (Vercel Cron, GitHub Actions, etc.)
// Checks each user's report_frequency and sends reports when due.
// Protect with CRON_SECRET env var or call from trusted source.
export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const sent: string[] = [];
  const errors: string[] = [];

  // Find users who have trusted_person_chat_id and report_frequency != 'off'
  const { data: users } = await supabase
    .from("users")
    .select("id, name, tg_username, trusted_person_chat_id, report_frequency, last_report_sent, risk_score")
    .not("trusted_person_chat_id", "is", null)
    .neq("report_frequency", "off");

  if (!users || users.length === 0) {
    return NextResponse.json({ sent: 0, message: "Нет пользователей для отправки" });
  }

  for (const user of users) {
    // Dynamic frequency by risk: LOW → weekly, MEDIUM → every_3_days, HIGH → daily (если не задано вручную)
    const riskScore = user.risk_score ?? 0;
    const autoFreq = riskScore >= 61 ? "daily" : riskScore >= 31 ? "every_3_days" : "weekly";
    const freq = user.report_frequency === "off" ? "off" : (user.report_frequency || autoFreq);
    const lastSent = user.last_report_sent ? new Date(user.last_report_sent) : null;
    const hoursSinceLast = lastSent ? (now.getTime() - lastSent.getTime()) / 3600000 : Infinity;

    const intervalHours = freq === "daily" ? 24 : freq === "every_3_days" ? 72 : 168;

    if (hoursSinceLast < intervalHours) continue;

    try {
      const report = await generateReport(user.id, user.name, user.tg_username);

      await sendWeeklyReport(user.trusted_person_chat_id, report);

      await supabase.from("users")
        .update({ risk_score: report.riskScore, last_report_sent: now.toISOString() })
        .eq("id", user.id);

      await supabase.from("weekly_reports").insert({
        user_id: user.id,
        week_start: new Date(now.getTime() - 7 * 86400000).toISOString().split("T")[0],
        risk_score: report.riskScore,
        risk_level: report.riskLevel,
        total_sessions: report.totalSessions,
        total_amount: report.totalAmount,
        total_time_minutes: report.totalTimeMinutes,
        night_sessions: report.nightSessions,
        disable_attempts: report.disableAttempts,
        analysis_summary: report.analysisSummary,
        telegram_report: JSON.stringify(report),
      });

      sent.push(user.name || user.tg_username || user.id);
    } catch (e) {
      errors.push(`${user.id}: ${e instanceof Error ? e.message : "error"}`);
    }
  }

  return NextResponse.json({
    sent: sent.length,
    errors: errors.length,
    details: { sent, errors },
    message: `Отправлено ${sent.length} отчётов`,
  });
}

