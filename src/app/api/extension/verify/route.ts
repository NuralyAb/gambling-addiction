import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/extension/verify?token=sba_xxx
// Public endpoint for the extension to verify its token
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ valid: false, error: "Token required" }, { status: 400 });
  }

  const { data } = await supabase
    .from("extension_tokens")
    .select("id, user_id, expires_at, revoked")
    .eq("token", token)
    .single();

  if (!data || data.revoked) {
    return NextResponse.json({ valid: false, error: "Invalid or revoked token" }, { status: 401 });
  }

  if (new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, error: "Token expired" }, { status: 401 });
  }

  // Update last_used_at
  await supabase.from("extension_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);

  return NextResponse.json({ valid: true, userId: data.user_id });
}
