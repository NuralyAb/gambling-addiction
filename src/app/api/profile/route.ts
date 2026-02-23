import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { sendTelegramMessage } from "@/lib/telegram";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  trusted_person_name: z.string().max(100).optional(),
  trusted_person_email: z.string().email().optional().or(z.literal("")),
  tg_username: z.string().max(32).optional(),
  trusted_person_tg: z.string().max(32).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const { data, error } = await supabase
    .from("users")
    .select("name, city, phone, trusted_person_name, trusted_person_email, tg_username, trusted_person_tg, trusted_person_chat_id, email, risk_score")
    .eq("id", userId)
    .single();

  if (error) {
    return NextResponse.json({ error: "Ошибка загрузки профиля" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = profileSchema.parse(body);
    const userId = (session.user as { id: string }).id;

    // Check if trusted_person_tg changed
    const { data: oldProfile } = await supabase
      .from("users")
      .select("trusted_person_tg, trusted_person_chat_id, name, tg_username")
      .eq("id", userId)
      .single();

    const oldTg = (oldProfile?.trusted_person_tg || "").toLowerCase();
    const newTg = (data.trusted_person_tg || "").toLowerCase();
    const trustedTgChanged = newTg && newTg !== oldTg;

    // If trusted person TG changed, reset chat_id so they need to /start again
    const updateData = trustedTgChanged
      ? { ...data, trusted_person_chat_id: null }
      : data;

    const { error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId);

    if (error) {
      return NextResponse.json({ error: "Ошибка обновления профиля" }, { status: 500 });
    }

    // If trusted person already had a chat_id and TG didn't change, send test message
    if (!trustedTgChanged && oldProfile?.trusted_person_chat_id && data.trusted_person_tg) {
      try {
        const userName = data.name || oldProfile?.name || data.tg_username || oldProfile?.tg_username || "пользователь";
        await sendTelegramMessage(
          oldProfile.trusted_person_chat_id,
          `✅ <b>Тест связи</b>\n\nПрофиль пользователя ${userName} обновлён. Подключение к боту работает.`,
          { parse_mode: "HTML" }
        );
      } catch (e) {
        console.error("Test message error:", e);
      }
    }

    return NextResponse.json({
      message: "Профиль обновлён",
      trustedTgChanged,
      hasTrustedChatId: !trustedTgChanged && !!oldProfile?.trusted_person_chat_id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
