import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { sendUnlockRequestNotification } from "@/lib/telegram";
import { z } from "zod";

const schema = z.object({
  reason: z.string().max(500).optional(),
});

// POST /api/unlock-request  — user submits a request to remove blocking
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const body = await req.json();
  const { reason } = schema.parse(body);

  // Check for existing pending request
  const { data: existing } = await supabase
    .from("unlock_requests")
    .select("id, status, created_at")
    .eq("user_id", userId)
    .eq("status", "pending")
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "У вас уже есть активный запрос. Ожидайте ответа доверенного лица." },
      { status: 409 }
    );
  }

  // Create unlock request
  const { data: request, error: insertErr } = await supabase
    .from("unlock_requests")
    .insert({ user_id: userId, reason })
    .select("id")
    .single();

  if (insertErr || !request) {
    return NextResponse.json({ error: "Ошибка создания запроса" }, { status: 500 });
  }

  // Load user profile for notification
  const { data: user } = await supabase
    .from("users")
    .select("name, tg_username, trusted_person_chat_id, trusted_person_tg, risk_score")
    .eq("id", userId)
    .single();

  // Notify trusted person via Telegram if chat_id is set
  if (user?.trusted_person_chat_id) {
    try {
      await sendUnlockRequestNotification(
        user.trusted_person_chat_id,
        user.name || "",
        user.tg_username || "",
        user.risk_score || 0,
        reason || "",
        request.id
      );
    } catch (err) {
      console.error("Telegram notify error:", err);
    }
  }

  return NextResponse.json({
    success: true,
    requestId: request.id,
    message: user?.trusted_person_chat_id
      ? "Запрос отправлен доверенному лицу в Telegram"
      : "Запрос создан. Доверенное лицо ещё не активировало бот — уведомление не отправлено.",
  });
}

// GET /api/unlock-request — get user's unlock requests
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const { data, error } = await supabase
    .from("unlock_requests")
    .select("id, status, reason, created_at, reviewed_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }

  return NextResponse.json(data);
}
