import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  getUpdates,
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

let lastOffset = 0;

// POST /api/telegram/poll
// Manually polls Telegram getUpdates and processes all commands + callbacks.
// Use in dev when webhook is unavailable (localhost).
export async function POST() {
  try {
    const updates = await getUpdates(lastOffset || undefined);

    if (updates.length === 0) {
      return NextResponse.json({ processed: 0, message: "Нет новых сообщений от бота" });
    }

    let processed = 0;
    const results: string[] = [];

    for (const update of updates) {
      lastOffset = update.update_id + 1;

      // Handle text messages
      if (update.message?.text) {
        const chatId = update.message.chat.id;
        const text = update.message.text.trim();
        const username = update.message.from?.username;

        if (text.startsWith("/start")) {
          await handleStart(chatId, username);
          results.push(`/start from @${username || "?"}`);
          processed++;
        } else if (text === "/settings") {
          await handleSettings(chatId, username);
          results.push(`/settings from @${username || "?"}`);
          processed++;
        } else if (text === "/status") {
          await handleStatus(chatId, username);
          results.push(`/status from @${username || "?"}`);
          processed++;
        } else if (text === "/report") {
          await handleReport(chatId, username);
          results.push(`/report from @${username || "?"}`);
          processed++;
        } else if (text === "/dashboard" || text === "/app") {
          await handleDashboard(chatId);
          results.push(`/dashboard from @${username || "?"}`);
          processed++;
        } else if (text === "/help") {
          await sendHelp(chatId);
          results.push(`/help from @${username || "?"}`);
          processed++;
        }
      }

      // Handle callback queries (inline keyboard presses)
      if (update.callback_query) {
        const cb = update.callback_query;
        const chatId = cb.from.id;
        const data = cb.data || "";
        const username = cb.from.username;

        if (data.startsWith("freq_")) {
          await handleFrequencyChange(chatId, cb.id, username, data.replace("freq_", ""), cb.message?.message_id);
          results.push(`freq change from @${username || "?"}: ${data}`);
          processed++;
        } else if (data.startsWith("approve_")) {
          await handleApproveSimple(chatId, cb.id, data.replace("approve_", ""), cb.message?.message_id);
          results.push(`approve from @${username || "?"}`);
          processed++;
        } else if (data.startsWith("reject_")) {
          await handleRejectSimple(chatId, cb.id, data.replace("reject_", ""), cb.message?.message_id);
          results.push(`reject from @${username || "?"}`);
          processed++;
        }
      }
    }

    return NextResponse.json({
      processed,
      total: updates.length,
      results,
      message: processed > 0
        ? `Обработано ${processed} событий`
        : "Новых команд не найдено",
    });
  } catch (e) {
    console.error("Poll error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка polling" },
      { status: 500 }
    );
  }
}

async function sendHelp(chatId: number) {
  await sendTelegramMessage(chatId, [
    "📋 <b>Доступные команды:</b>",
    "", "/start — подключить аккаунт",
    "/status — проверить подопечных",
    "/settings — частота отчётов",
    "/report — запросить отчёт",
    "/dashboard — веб-дашборд",
    "/help — справка",
  ].join("\n"), { parse_mode: "HTML" });
}

async function handleStart(chatId: number, username?: string) {
  if (!username) {
    await sendTelegramMessage(chatId, "Для подключения нужен публичный Telegram username.");
    return;
  }

  const { data: trustedUsers } = await supabase
    .from("users").select("id, name, tg_username").eq("trusted_person_tg", username);

  const { data: selfUsers } = await supabase
    .from("users").select("id, name, tg_username").eq("tg_username", username);

  let linked = false;

  if (trustedUsers && trustedUsers.length > 0) {
    await supabase.from("users").update({ trusted_person_chat_id: chatId }).in("id", trustedUsers.map((u) => u.id));
    const names = trustedUsers.map((u) => u.name || u.tg_username || "пользователь").join(", ");
    const appUrl = getAppUrl();

    await sendTelegramMessage(chatId, [
      `✅ <b>Подключено как доверенное лицо!</b>`,
      ``, `Подопечные: <b>${names}</b>`,
      ``,
      `📊 Еженедельные отчёты с риск-скором`,
      `🔐 Запросы на разблокировку с кнопками`,
      ``,
      `/settings — настроить частоту отчётов`,
      `/status — статус подопечных`,
    ].join("\n"), {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "⚙️ Настроить частоту отчётов", callback_data: "freq_show" }],
          [{ text: "📊 Открыть дашборд", web_app: { url: `${appUrl}/trusted` } }],
        ],
      },
    });
    linked = true;
  }

  if (selfUsers && selfUsers.length > 0) {
    await supabase.from("users").update({ tg_chat_id: chatId }).eq("tg_username", username);
    if (!linked) {
      await sendTelegramMessage(chatId, "✅ Аккаунт привязан к боту. Вы будете получать уведомления.");
    }
    linked = true;
  }

  if (!linked) {
    await sendTelegramMessage(chatId,
      `Аккаунт с @${username} не найден.\n\nПользователь: укажите @${username} при регистрации.\nДоверенное лицо: попросите пользователя указать @${username} в профиле.`
    );
  }
}

async function handleSettings(chatId: number, username?: string) {
  if (!username) { await sendTelegramMessage(chatId, "Нужен публичный username."); return; }

  const { data: users } = await supabase
    .from("users").select("report_frequency").eq("trusted_person_tg", username).limit(1);

  const currentFreq = users?.[0]?.report_frequency || "weekly";

  await sendTelegramMessage(chatId, [
    `⚙️ <b>Частота отчётов</b>`,
    ``, `Текущая: <b>${getFrequencyLabel(currentFreq)}</b>`,
    ``, `Выберите:`,
  ].join("\n"), {
    parse_mode: "HTML",
    reply_markup: getFrequencyKeyboard(currentFreq),
  });
}

async function handleFrequencyChange(
  chatId: number, callbackId: string, username: string | undefined,
  freq: string, messageId?: number
) {
  if (freq === "show") {
    await answerCallbackQuery(callbackId);
    await handleSettings(chatId, username);
    return;
  }

  if (!["daily", "every_3_days", "weekly", "off"].includes(freq)) {
    await answerCallbackQuery(callbackId, "Неизвестная частота");
    return;
  }

  if (!username) { await answerCallbackQuery(callbackId, "Нужен username"); return; }

  await supabase.from("users").update({ report_frequency: freq }).eq("trusted_person_tg", username);
  await answerCallbackQuery(callbackId, `Частота: ${getFrequencyLabel(freq)}`);

  if (messageId) {
    await editTelegramMessage(chatId, messageId, [
      `⚙️ <b>Частота обновлена</b>`,
      ``, `✅ ${getFrequencyLabel(freq)}`,
      ``,
      freq === "off" ? `Авто-отчёты выключены. /report — вручную.` : `Отчёты: ${getFrequencyLabel(freq).toLowerCase()}.`,
    ].join("\n"));
    try { await editMessageReplyMarkup(chatId, messageId, getFrequencyKeyboard(freq)); } catch {}
  }
}

async function handleStatus(chatId: number, username?: string) {
  if (!username) { await sendTelegramMessage(chatId, "Нужен username."); return; }

  const { data: users } = await supabase
    .from("users").select("name, tg_username, risk_score, report_frequency").eq("trusted_person_tg", username);

  if (!users || users.length === 0) {
    await sendTelegramMessage(chatId, "Нет подключённых пользователей.");
    return;
  }

  const appUrl = getAppUrl();
  const lines = users.map((u) => {
    const emoji = u.risk_score >= 61 ? "🔴" : u.risk_score >= 31 ? "🟡" : "🟢";
    return `${emoji} <b>${u.name || u.tg_username || "—"}</b> — ${u.risk_score || 0}/100`;
  });

  await sendTelegramMessage(chatId, `👥 <b>Подопечные:</b>\n\n${lines.join("\n")}`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [{ text: "⚙️ Настроить отчёты", callback_data: "freq_show" }],
        [{ text: "📊 Открыть дашборд", web_app: { url: `${appUrl}/trusted` } }],
      ],
    },
  });
}

async function handleReport(chatId: number, username?: string) {
  if (!username) {
    await sendTelegramMessage(chatId, "Нужен публичный username.");
    return;
  }

  const { data: users } = await supabase
    .from("users")
    .select("id, name, tg_username, trusted_person_chat_id")
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
  await sendTelegramMessage(chatId, "Откройте дашборд:", {
    reply_markup: {
      inline_keyboard: [[{ text: "📊 Открыть дашборд", web_app: { url: `${appUrl}/trusted` } }]],
    },
  });
}

async function handleApproveSimple(chatId: number, callbackId: string, requestId: string, messageId?: number) {
  const { data: request } = await supabase.from("unlock_requests").select("id, user_id, status").eq("id", requestId).single();
  if (!request) { await answerCallbackQuery(callbackId, "Не найден"); return; }
  if (request.status !== "pending") { await answerCallbackQuery(callbackId, "Уже обработан"); return; }

  const { data: user } = await supabase.from("users").select("name, tg_username, trusted_person_chat_id").eq("id", request.user_id).single();
  if (!user || user.trusted_person_chat_id !== chatId) { await answerCallbackQuery(callbackId, "Нет доступа"); return; }

  await supabase.from("unlock_requests").update({ status: "approved", reviewed_at: new Date().toISOString() }).eq("id", requestId);
  await answerCallbackQuery(callbackId, "Одобрено на 24 часа");

  if (messageId) await editTelegramMessage(chatId, messageId, `✅ Одобрено для ${user.name || user.tg_username || "пользователь"}. 24 часа.`);

  const { data: ud } = await supabase.from("users").select("tg_chat_id").eq("id", request.user_id).single();
  if (ud?.tg_chat_id) await sendTelegramMessage(ud.tg_chat_id, "✅ Разблокировка одобрена на 24 часа.");
}

async function handleRejectSimple(chatId: number, callbackId: string, requestId: string, messageId?: number) {
  const { data: request } = await supabase.from("unlock_requests").select("id, user_id, status").eq("id", requestId).single();
  if (!request) { await answerCallbackQuery(callbackId, "Не найден"); return; }
  if (request.status !== "pending") { await answerCallbackQuery(callbackId, "Уже обработан"); return; }

  const { data: user } = await supabase.from("users").select("name, tg_username, trusted_person_chat_id, tg_chat_id").eq("id", request.user_id).single();
  if (!user || user.trusted_person_chat_id !== chatId) { await answerCallbackQuery(callbackId, "Нет доступа"); return; }

  await supabase.from("unlock_requests").update({ status: "rejected", reviewed_at: new Date().toISOString() }).eq("id", requestId);
  await answerCallbackQuery(callbackId, "Отклонён");

  if (messageId) await editTelegramMessage(chatId, messageId, `❌ Отклонено для ${user.name || user.tg_username || "пользователь"}.`);
  if (user.tg_chat_id) await sendTelegramMessage(user.tg_chat_id, "❌ Запрос на разблокировку отклонён.");
}
