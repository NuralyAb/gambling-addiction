import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { sendTelegramMessage } from "@/lib/telegram";

// POST /api/telegram/test — send a test message to the trusted person's TG
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const { data: user } = await supabase
    .from("users")
    .select("name, tg_username, trusted_person_tg, trusted_person_chat_id")
    .eq("id", userId)
    .single();

  if (!user) {
    return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  }

  if (!user.trusted_person_tg) {
    return NextResponse.json(
      { error: "Доверенное лицо не указано. Укажите Telegram username в профиле." },
      { status: 400 }
    );
  }

  if (!user.trusted_person_chat_id) {
    return NextResponse.json(
      { error: `Доверенное лицо @${user.trusted_person_tg} ещё не написало /start боту. Попросите их отправить /start.` },
      { status: 400 }
    );
  }

  const userName = user.name || user.tg_username || "пользователь";

  try {
    const result = await sendTelegramMessage(
      user.trusted_person_chat_id,
      [
        `🔔 <b>Тест подключения</b>`,
        ``,
        `Пользователь: ${user.tg_username ? "@" + user.tg_username : userName}`,
        ``,
        `Это тестовое сообщение. Если вы его видите — связь с ботом работает корректно.`,
        ``,
        `Вы будете получать:`,
        `• 📊 Еженедельные отчёты`,
        `• 🔐 Запросы на разблокировку с кнопками одобрения`,
      ].join("\n"),
      { parse_mode: "HTML" }
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: "Не удалось отправить сообщение. Проверьте, что бот не заблокирован." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Тестовое сообщение отправлено" });
  } catch (e) {
    console.error("Telegram test error:", e);
    return NextResponse.json({ error: "Ошибка отправки сообщения" }, { status: 500 });
  }
}
