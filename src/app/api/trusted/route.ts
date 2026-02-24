import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/trusted?tg=username
// Public endpoint for trusted person to view their connected users' dashboards
// Identified by their Telegram username (trusted_person_tg field)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tg = searchParams.get("tg")?.replace(/^@/, "");

  if (!tg) {
    return NextResponse.json({ error: "Telegram username не указан" }, { status: 400 });
  }

  // Find users who have this trusted person
  const { data: users, error } = await supabase
    .from("users")
    .select("id, name, tg_username, risk_score, created_at")
    .eq("trusted_person_tg", tg);

  if (error) {
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }

  if (!users || users.length === 0) {
    return NextResponse.json({ users: [], unlockRequests: [], weeklyReports: [] });
  }

  const userIds = users.map((u) => u.id);

  // Load pending unlock requests
  const { data: unlockRequests } = await supabase
    .from("unlock_requests")
    .select("id, user_id, status, reason, what_changed, plan, if_lose, impulsive_flag, created_at, reviewed_at")
    .in("user_id", userIds)
    .order("created_at", { ascending: false })
    .limit(20);

  // Load recent weekly reports
  const { data: weeklyReports } = await supabase
    .from("weekly_reports")
    .select("id, user_id, week_start, risk_score, risk_level, total_sessions, total_amount, total_time_minutes, night_sessions, disable_attempts, analysis_summary, sent_at")
    .in("user_id", userIds)
    .order("sent_at", { ascending: false })
    .limit(20);

  // Map user IDs to names for frontend
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  return NextResponse.json({
    users,
    unlockRequests: (unlockRequests || []).map((r) => ({
      ...r,
      userName: userMap[r.user_id]?.name || userMap[r.user_id]?.tg_username || "—",
      userTg: userMap[r.user_id]?.tg_username,
    })),
    weeklyReports: (weeklyReports || []).map((r) => ({
      ...r,
      userName: userMap[r.user_id]?.name || userMap[r.user_id]?.tg_username || "—",
      userTg: userMap[r.user_id]?.tg_username,
    })),
  });
}
