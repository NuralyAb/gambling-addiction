import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { sendDisableAttemptNotification } from "@/lib/telegram";

async function resolveUserId(req: Request): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return (session.user as { id: string }).id;
  }
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token.startsWith("sba_")) return null;

  const { data } = await supabase
    .from("extension_tokens")
    .select("user_id, revoked, expires_at")
    .eq("token", token)
    .single();

  if (!data || data.revoked || new Date(data.expires_at) < new Date()) return null;
  return data.user_id;
}

// POST /api/extension/disable-attempt — notify trusted person when user tries to disable extension
// Auth: session (web) or Bearer extension token (popup)
export async function POST(req: Request) {
  const userId = await resolveUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { data: user } = await supabase
    .from("users")
    .select("name, tg_username, trusted_person_chat_id")
    .eq("id", userId)
    .single();

  if (!user?.trusted_person_chat_id) {
    return NextResponse.json({ ok: true });
  }

  try {
    await sendDisableAttemptNotification(
      user.trusted_person_chat_id,
      user.name || "",
      user.tg_username || ""
    );
  } catch (err) {
    console.error("Disable attempt notification error:", err);
  }

  return NextResponse.json({ ok: true });
}
