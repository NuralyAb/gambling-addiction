import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

const eventSchema = z.object({
  token: z.string().min(1),
  domain: z.string().min(1).max(255),
  url: z.string().max(2048).optional(),
  timestamp: z.string().optional(),
});

// POST /api/extension/events — receive block event from Chrome Extension
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, domain, url, timestamp } = eventSchema.parse(body);

    // Verify token
    const { data: tokenData } = await supabase
      .from("extension_tokens")
      .select("id, user_id, expires_at, revoked")
      .eq("token", token)
      .single();

    if (!tokenData || tokenData.revoked) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }

    // Save block event
    const { error } = await supabase.from("block_events").insert({
      user_id: tokenData.user_id,
      domain: domain.toLowerCase().replace(/^www\./, ""),
      url: url || null,
      blocked_at: timestamp || new Date().toISOString(),
      source: "extension",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update last_used_at on token
    await supabase.from("extension_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", tokenData.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
