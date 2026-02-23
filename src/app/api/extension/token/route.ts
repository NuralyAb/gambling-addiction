import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

// POST — generate new extension token
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const token = `sba_${crypto.randomBytes(32).toString("hex")}`;

  // Revoke any existing active tokens
  await supabase
    .from("extension_tokens")
    .update({ revoked: true })
    .eq("user_id", userId)
    .eq("revoked", false);

  const { data, error } = await supabase
    .from("extension_tokens")
    .insert({
      user_id: userId,
      token,
      expires_at: new Date(Date.now() + 365 * 86400000).toISOString(),
    })
    .select("id, token, created_at, expires_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message || "Ошибка создания токена" }, { status: 500 });
  }

  return NextResponse.json(data);
}

// GET — list user's tokens
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const { data } = await supabase
    .from("extension_tokens")
    .select("id, token, created_at, expires_at, revoked, last_used_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  const active = (data || []).find((t) => !t.revoked);

  return NextResponse.json({ tokens: data || [], active });
}

// DELETE — revoke token
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { searchParams } = new URL(req.url);
  const tokenId = searchParams.get("id");

  if (tokenId) {
    await supabase.from("extension_tokens").update({ revoked: true }).eq("id", tokenId).eq("user_id", userId);
  } else {
    await supabase.from("extension_tokens").update({ revoked: true }).eq("user_id", userId).eq("revoked", false);
  }

  return NextResponse.json({ success: true });
}
