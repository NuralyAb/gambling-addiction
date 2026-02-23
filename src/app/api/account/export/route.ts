import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id: string })?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    userResult,
    diaryResult,
    pgsiResult,
    blockResult,
    tokenResult,
    chatResult,
    reportResult,
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id, email, name, created_at, updated_at")
      .eq("id", userId)
      .single(),
    supabase
      .from("diary_entries")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("pgsi_results")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("block_events")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase
      .from("extension_tokens")
      .select("id, user_id, name, created_at, expires_at, revoked, last_used_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("weekly_reports")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    user: userResult.data,
    diaryEntries: diaryResult.data || [],
    pgsiResults: pgsiResult.data || [],
    blockEvents: blockResult.data || [],
    chatMessages: chatResult.data || [],
    weeklyReports: reportResult.data || [],
  };

  const dateStr = new Date().toISOString().split("T")[0];

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="safebet-export-${dateStr}.json"`,
    },
  });
}
