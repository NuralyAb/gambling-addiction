import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { sendTelegramMessage } from "@/lib/telegram";

// POST — manually trigger an alert to trusted person
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await req.json().catch(() => ({}));
  const reason = body.reason || "manual";

  return sendAlert(userId, reason);
}

export async function sendAlert(userId: string, reason: string) {
  const { data: user } = await supabase
    .from("users")
    .select("name, tg_username, trusted_person_tg, trusted_person_chat_id, risk_score")
    .eq("id", userId)
    .single();

  if (!user?.trusted_person_chat_id) {
    return NextResponse.json({ error: "Доверенное лицо не подключено" }, { status: 400 });
  }

  const userName = user.tg_username ? `@${user.tg_username}` : user.name || "Пользователь";

  const alertMessages: Record<string, string> = {
    high_block_rate: `🚨 <b>Тревога: частые попытки доступа</b>\n\n👤 ${userName} пытался зайти на азартные сайты 3+ раза за последний час.\n\n⚠️ Это может говорить о сильном желании играть. Рекомендуем связаться и предложить поддержку.`,
    high_risk_score: `🔴 <b>Тревога: высокий уровень риска</b>\n\n👤 ${userName}\n📊 Риск-скор: ${user.risk_score}/100\n\nСистема обнаружила значительное увеличение активности. Рекомендуем обратить внимание.`,
    night_activity: `🌙 <b>Тревога: ночная активность</b>\n\n👤 ${userName} проявляет активность в ночное время (после 23:00).\n\nНочные сессии часто связаны с повышенным риском. Рекомендуем связаться утром.`,
    manual: `📢 <b>Запрос о помощи</b>\n\n👤 ${userName} просит вашей поддержки.\n\nПожалуйста, свяжитесь и узнайте, как можно помочь.`,
    sos: `🆘 <b>Экстренный запрос</b>\n\n👤 ${userName} нажал кнопку экстренной помощи.\n\nЭто значит, что сейчас особенно тяжело. Пожалуйста, свяжитесь как можно скорее.`,
  };

  const text = alertMessages[reason] || alertMessages.manual;

  try {
    await sendTelegramMessage(user.trusted_person_chat_id, text, { parse_mode: "HTML" });
    return NextResponse.json({ sent: true });
  } catch {
    return NextResponse.json({ error: "Ошибка отправки" }, { status: 500 });
  }
}

// Check block events and auto-alert (called from block-event API)
export async function checkAndAlert(userId: string) {
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

  const { count } = await supabase
    .from("block_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", oneHourAgo);

  if (count && count >= 3) {
    // Check if we already sent an alert recently (don't spam)
    const { data: recentAlert } = await supabase
      .from("users")
      .select("last_alert_sent")
      .eq("id", userId)
      .single();

    const lastAlert = recentAlert?.last_alert_sent
      ? new Date(recentAlert.last_alert_sent).getTime()
      : 0;

    // Only alert once per hour
    if (Date.now() - lastAlert > 3600000) {
      await sendAlertDirect(userId, "high_block_rate");
      await supabase
        .from("users")
        .update({ last_alert_sent: new Date().toISOString() })
        .eq("id", userId);
    }
  }
}

async function sendAlertDirect(userId: string, reason: string) {
  const { data: user } = await supabase
    .from("users")
    .select("name, tg_username, trusted_person_chat_id, risk_score")
    .eq("id", userId)
    .single();

  if (!user?.trusted_person_chat_id) return;

  const userName = user.tg_username ? `@${user.tg_username}` : user.name || "Пользователь";

  const messages: Record<string, string> = {
    high_block_rate: `🚨 <b>Автоматическая тревога</b>\n\n👤 ${userName} пытался зайти на азартные сайты 3+ раз за последний час.\n\n⚠️ Рекомендуем связаться и предложить поддержку.`,
    night_activity: `🌙 <b>Ночная активность</b>\n\n👤 ${userName} активен в ночное время. Рекомендуем обратить внимание.`,
  };

  const text = messages[reason] || messages.high_block_rate;

  try {
    await sendTelegramMessage(user.trusted_person_chat_id, text, { parse_mode: "HTML" });
  } catch {
    // silent
  }
}
