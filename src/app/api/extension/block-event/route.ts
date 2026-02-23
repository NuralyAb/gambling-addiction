import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  // Auth via Bearer token (user id)
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = authHeader.slice(7).trim();
  if (!userId) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Verify user exists
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .single();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await req.json();

  // Save block event
  const { error } = await supabase.from("block_events").insert({
    user_id: userId,
    domain: body.domain || "unknown",
    blocked_today: body.blockedToday || 0,
    blocked_week: body.blockedWeek || 0,
  });

  if (error) {
    console.error("Block event insert error:", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// GET — get block events for dashboard
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const url = new URL(req.url);

  // Support both Bearer token and session-based auth
  let userId = "";

  if (authHeader?.startsWith("Bearer ")) {
    userId = authHeader.slice(7).trim();
  } else {
    // Try session auth
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    const session = await getServerSession(authOptions);
    userId = (session?.user as { id: string })?.id || "";
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const days = parseInt(url.searchParams.get("days") || "7");

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("block_events")
    .select("id, domain, blocked_today, blocked_week, created_at")
    .eq("user_id", userId)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
