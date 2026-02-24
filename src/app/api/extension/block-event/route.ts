import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { checkAndAlert } from "@/lib/alerts";

async function resolveUserId(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  // If it's an extension token (sba_...), look up in extension_tokens
  if (token.startsWith("sba_")) {
    const { data } = await supabase
      .from("extension_tokens")
      .select("id, user_id, expires_at, revoked")
      .eq("token", token)
      .single();

    if (!data || data.revoked) return null;
    if (new Date(data.expires_at) < new Date()) return null;

    // Update last_used_at
    await supabase.from("extension_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", data.id);

    return data.user_id;
  }

  // Otherwise treat as raw user ID (legacy)
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("id", token)
    .single();

  return user?.id || null;
}

export async function POST(req: Request) {
  const userId = await resolveUserId(req.headers.get("authorization"));
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const domain = (body.domain || "unknown").toLowerCase().replace(/^www\./, "");

  const { error } = await supabase.from("block_events").insert({
    user_id: userId,
    domain,
    blocked_today: body.blockedToday || 0,
    blocked_week: body.blockedWeek || 0,
    blocked_at: body.timestamp || new Date().toISOString(),
    source: "extension",
  });

  if (error) {
    console.error("Block event insert error:", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  // Auto-alert trusted person if too many blocks in 1 hour
  checkAndAlert(userId).catch(() => {});

  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const url = new URL(req.url);

  let userId = await resolveUserId(authHeader);

  if (!userId) {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth");
    const session = await getServerSession(authOptions);
    userId = (session?.user as { id: string })?.id || null;
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const days = parseInt(url.searchParams.get("days") || "7");
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("block_events")
    .select("id, domain, blocked_today, blocked_week, blocked_at, created_at")
    .eq("user_id", userId)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
