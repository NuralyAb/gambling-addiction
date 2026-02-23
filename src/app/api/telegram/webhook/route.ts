import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  sendTelegramMessage,
  sendWeeklyReport,
  answerCallbackQuery,
  editTelegramMessage,
  editMessageReplyMarkup,
  getFrequencyLabel,
  getFrequencyKeyboard,
  getAppUrl,
} from "@/lib/telegram";
import { generateReport } from "@/lib/reports";

export async function POST(req: Request) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (update.message) {
    const msg = update.message;
    const chatId = msg.chat.id;
    const text = msg.text?.trim() || "";
    const fromUsername = msg.from?.username;

    if (text.startsWith("/start")) {
      await handleStart(chatId, fromUsername);
    } else if (text === "/status") {
      await handleStatus(chatId, fromUsername);
    } else if (text === "/settings") {
      await handleSettings(chatId, fromUsername);
    } else if (text === "/report") {
      await handleReport(chatId, fromUsername);
    } else if (text === "/dashboard" || text === "/app") {
      await handleDashboard(chatId);
    } else if (text === "/help") {
      await sendHelp(chatId);
    }
  }

  if (update.callback_query) {
    const cb = update.callback_query;
    const chatId = cb.from.id;
    const data = cb.data || "";

    if (data.startsWith("approve_")) {
      await handleApprove(chatId, cb.id, data.replace("approve_", ""), cb.message?.message_id);
    } else if (data.startsWith("reject_")) {
      await handleReject(chatId, cb.id, data.replace("reject_", ""), cb.message?.message_id);
    } else if (data.startsWith("freq_")) {
      await handleFrequencyChange(chatId, cb.id, cb.from.username, data.replace("freq_", ""), cb.message?.message_id);
    }
  }

  return NextResponse.json({ ok: true });
}

async function sendHelp(chatId: number) {
  await sendTelegramMessage(chatId, [
    "📋 <b>Доступные команды:</b>",
    "",
    "/start — подключить аккаунт",
    "/status — проверить подопечных",
    "/settings — настроить частоту отчётов",
    "/report — запросить отчёт сейчас",
    "/dashboard — открыть веб-дашборд",
    "/help — эта справка",
  ].join("\n"), { parse_mode: "HTML" });
}

async function handleStart(chatId: number, username?: string) {
  if (!username) {
    await sendTelegramMessage(
      chatId,
      "Добро пожаловать! Для подключения вам нужен публичный Telegram username. Установите его в настройках Telegram и попробуйте снова."
    );
    return;
  }

  const { data: users } = await supabase
    .from("users")
    .select("id, name, tg_username")
    .eq("trusted_person_tg", username);

  if (!users || users.length === 0) {
    await sendTelegramMessage(
      chatId,
      `Аккаунт с доверенным лицом @${username} не найден.\n\nПопросите пользователя указать ваш username (@${username}) в профиле на платформе.`
    );
    return;
  }

  const ids = users.map((u) => u.id);
  await supabase
    .from("users")
    .update({ trusted_person_chat_id: chatId })
    .in("id", ids);

  const names = users.map((u) => u.name || u.tg_username || "пользователь").join(", ");
  const appUrl = getAppUrl();

  await sendTelegramMessage(chatId, [
    `✅ <b>Подключено!</b>`,
    ``,
    `Вы назначены доверенным лицом для: <b>${names}</b>`,
    ``,
    `Что вы будете получать:`,
    `📊 Еженедельные отчёты с риск-скором`,
    `🔐 Запросы на разблокировку с кнопками`,
    ``,
    `<b>Команды:</b>`,
    `/settings — настроить частоту отчётов`,
    `/status — проверить статус подопечных`,
    `/report — запросить отчёт прямо сейчас`,
    `/dashboard — открыть веб-дашборд`,
  ].join("\n"), {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [{ text: "⚙️ Настроить частоту отчётов", callback_data: "freq_show" }],
        [{ text: "📊 Открыть дашборд", web_app: { url: `${appUrl}/trusted` } }],
      ],
    },
  });
}

async function handleStatus(chatId: number, username?: string) {
  if (!username) {
    await sendTelegramMessage(chatId, "Для использования бота нужен публичный username в Telegram.");
    return;
  }

  const { data: users } = await supabase
    .from("users")
    .select("name, tg_username, risk_score, report_frequency")
    .eq("trusted_person_tg", username);

  if (!users || users.length === 0) {
    await sendTelegramMessage(chatId, "Нет подключённых пользователей.");
    return;
  }

  const lines = users.map((u) => {
    const riskEmoji = u.risk_score >= 61 ? "🔴" : u.risk_score >= 31 ? "🟡" : "🟢";
    const freq = getFrequencyLabel(u.report_frequency || "weekly");
    return `${riskEmoji} <b>${u.name || u.tg_username || "—"}</b>\n   Риск: ${u.risk_score || 0}/100 · Отчёты: ${freq}`;
  });

  const appUrl = getAppUrl();

  await sendTelegramMessage(chatId, [
    `👥 <b>Подопечные:</b>`,
    ``,
    ...lines,
  ].join("\n"), {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [{ text: "⚙️ Настроить отчёты", callback_data: "freq_show" }],
        [{ text: "📊 Открыть дашборд", web_app: { url: `${appUrl}/trusted` } }],
      ],
    },
  });
}

async function handleSettings(chatId: number, username?: string) {
  if (!username) {
    await sendTelegramMessage(chatId, "Для настройки нужен публичный username.");
    return;
  }

  const { data: users } = await supabase
    .from("users")
    .select("report_frequency")
    .eq("trusted_person_tg", username)
    .limit(1);

  const currentFreq = users?.[0]?.report_frequency || "weekly";

  await sendTelegramMessage(chatId, [
    `⚙️ <b>Настройка частоты отчётов</b>`,
    ``,
    `Текущая частота: <b>${getFrequencyLabel(currentFreq)}</b>`,
    ``,
    `Выберите, как часто получать отчёты:`,
  ].join("\n"), {
    parse_mode: "HTML",
    reply_markup: getFrequencyKeyboard(currentFreq),
  });
}

async function handleFrequencyChange(
  chatId: number,
  callbackId: string,
  username: string | undefined,
  freq: string,
  messageId?: number
) {
  if (freq === "show") {
    await answerCallbackQuery(callbackId);
    await handleSettings(chatId, username);
    return;
  }

  const validFreqs = ["daily", "every_3_days", "weekly", "off"];
  if (!validFreqs.includes(freq)) {
    await answerCallbackQuery(callbackId, "Неизвестная частота");
    return;
  }

  if (!username) {
    await answerCallbackQuery(callbackId, "Нужен публичный username");
    return;
  }

  await supabase
    .from("users")
    .update({ report_frequency: freq })
    .eq("trusted_person_tg", username);

  await answerCallbackQuery(callbackId, `Частота: ${getFrequencyLabel(freq)}`);

  if (messageId) {
    await editTelegramMessage(chatId, messageId, [
      `⚙️ <b>Частота отчётов обновлена</b>`,
      ``,
      `✅ ${getFrequencyLabel(freq)}`,
      ``,
      freq === "off"
        ? `Автоматические отчёты выключены. Вы можете запросить отчёт вручную: /report`
        : `Вы будете получать отчёты ${getFrequencyLabel(freq).toLowerCase()}.`,
    ].join("\n"));

    try {
      await editMessageReplyMarkup(chatId, messageId, getFrequencyKeyboard(freq));
    } catch { /* markup update may fail if message has no markup */ }
  }
}

async function handleReport(chatId: number, username?: string) {
  if (!username) {
    await sendTelegramMessage(chatId, "Для запроса отчёта нужен публичный username.");
    return;
  }

  const { data: users } = await supabase
    .from("users")
    .select("id, name, tg_username")
    .eq("trusted_person_tg", username);

  if (!users || users.length === 0) {
    await sendTelegramMessage(chatId, "Нет подопечных.");
    return;
  }

  await sendTelegramMessage(chatId, `⏳ Генерирую отчёты для ${users.length} подопечных...`);

  for (const user of users) {
    try {
      const report = await generateReport(user.id, user.name || "", user.tg_username || "");
      await sendWeeklyReport(chatId, report);

      await supabase.from("users").update({ risk_score: report.riskScore, last_report_sent: new Date().toISOString() }).eq("id", user.id);
      await supabase.from("weekly_reports").insert({
        user_id: user.id,
        week_start: new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0],
        risk_score: report.riskScore,
        risk_level: report.riskLevel,
        total_sessions: report.totalSessions,
        total_amount: report.totalAmount,
        total_time_minutes: report.totalTimeMinutes,
        night_sessions: report.nightSessions,
        disable_attempts: report.disableAttempts,
        analysis_summary: report.analysisSummary,
        telegram_report: JSON.stringify(report),
      });
    } catch (e) {
      await sendTelegramMessage(chatId, `❌ Ошибка отчёта для ${user.name || user.tg_username || "?"}: ${e instanceof Error ? e.message : "ошибка"}`);
    }
  }
}

async function handleDashboard(chatId: number) {
  const appUrl = getAppUrl();
  await sendTelegramMessage(chatId, "Откройте дашборд доверенного лица:", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📊 Открыть дашборд", web_app: { url: `${appUrl}/trusted` } }],
      ],
    },
  });
}

async function handleApprove(chatId: number, callbackId: string, requestId: string, messageId?: number) {
  const { data: request } = await supabase
    .from("unlock_requests")
    .select("id, user_id, status")
    .eq("id", requestId)
    .single();

  if (!request) { await answerCallbackQuery(callbackId, "Запрос не найден"); return; }
  if (request.status !== "pending") { await answerCallbackQuery(callbackId, "Уже обработан"); return; }

  const { data: user } = await supabase
    .from("users")
    .select("name, tg_username, trusted_person_chat_id")
    .eq("id", request.user_id)
    .single();

  if (!user || user.trusted_person_chat_id !== chatId) {
    await answerCallbackQuery(callbackId, "Нет доступа");
    return;
  }

  await supabase.from("unlock_requests")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", requestId);

  await answerCallbackQuery(callbackId, "Разблокировка одобрена на 24 часа");

  if (messageId) {
    await editTelegramMessage(chatId, messageId,
      `✅ Вы одобрили запрос на разблокировку от ${user.name || user.tg_username || "пользователь"}.\nДействительно 24 часа.`
    );
  }

  const { data: userData } = await supabase.from("users").select("tg_chat_id").eq("id", request.user_id).single();
  if (userData?.tg_chat_id) {
    await sendTelegramMessage(userData.tg_chat_id, "✅ Доверенное лицо одобрило вашу разблокировку на 24 часа.");
  }
}

async function handleReject(chatId: number, callbackId: string, requestId: string, messageId?: number) {
  const { data: request } = await supabase
    .from("unlock_requests")
    .select("id, user_id, status")
    .eq("id", requestId)
    .single();

  if (!request) { await answerCallbackQuery(callbackId, "Запрос не найден"); return; }
  if (request.status !== "pending") { await answerCallbackQuery(callbackId, "Уже обработан"); return; }

  const { data: user } = await supabase
    .from("users")
    .select("name, tg_username, trusted_person_chat_id, tg_chat_id")
    .eq("id", request.user_id)
    .single();

  if (!user || user.trusted_person_chat_id !== chatId) {
    await answerCallbackQuery(callbackId, "Нет доступа");
    return;
  }

  await supabase.from("unlock_requests")
    .update({ status: "rejected", reviewed_at: new Date().toISOString() })
    .eq("id", requestId);

  await answerCallbackQuery(callbackId, "Запрос отклонён");

  if (messageId) {
    await editTelegramMessage(chatId, messageId,
      `❌ Вы отклонили запрос от ${user.name || user.tg_username || "пользователь"}.\nОграничения остаются.`
    );
  }

  if (user.tg_chat_id) {
    await sendTelegramMessage(user.tg_chat_id, "❌ Доверенное лицо отклонило ваш запрос на разблокировку.");
  }
}

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    from?: { id: number; username?: string };
    text?: string;
  };
  callback_query?: {
    id: string;
    from: { id: number; username?: string };
    data?: string;
    message?: { message_id: number; chat: { id: number } };
  };
}
