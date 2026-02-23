const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function getUpdates(offset?: number): Promise<TelegramUpdateRaw[]> {
  const params = new URLSearchParams({ timeout: "1", limit: "100" });
  if (offset) params.set("offset", String(offset));
  const res = await fetch(`${API}/getUpdates?${params}`);
  const data = await res.json();
  return data.ok ? data.result || [] : [];
}

export interface TelegramUpdateRaw {
  update_id: number;
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

export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  extra?: {
    parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
    reply_markup?: object;
  }
): Promise<{ ok: boolean; result?: { message_id: number } }> {
  const res = await fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, ...extra }),
  });
  return res.json();
}

export async function editTelegramMessage(
  chatId: number | string,
  messageId: number,
  text: string
) {
  await fetch(`${API}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text }),
  });
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  await fetch(`${API}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

export async function editMessageReplyMarkup(
  chatId: number | string,
  messageId: number,
  replyMarkup?: object
) {
  await fetch(`${API}/editMessageReplyMarkup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      reply_markup: replyMarkup || { inline_keyboard: [] },
    }),
  });
}

export function getFrequencyLabel(freq: string): string {
  switch (freq) {
    case "daily": return "Ежедневно";
    case "every_3_days": return "Каждые 3 дня";
    case "weekly": return "Раз в неделю";
    case "off": return "Выключено";
    default: return "Раз в неделю";
  }
}

export function getFrequencyKeyboard(currentFreq: string) {
  const options = [
    { key: "daily", label: "Ежедневно" },
    { key: "every_3_days", label: "Каждые 3 дня" },
    { key: "weekly", label: "Раз в неделю" },
    { key: "off", label: "Выключить" },
  ];
  return {
    inline_keyboard: options.map((o) => [{
      text: (o.key === currentFreq ? "✅ " : "") + o.label,
      callback_data: `freq_${o.key}`,
    }]),
  };
}

export function getAppUrl(): string {
  return process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export interface WeeklyReportData {
  userName: string;
  userTg: string;
  weekStart: string;
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  totalSessions: number;
  totalAmount: number;
  totalTimeMinutes: number;
  nightSessions: number;
  disableAttempts: number;
  blockedSites?: number;
  analysisSummary: string;
  userId: string;
}

function riskEmoji(level: string) {
  if (level === "HIGH") return "🔴";
  if (level === "MEDIUM") return "🟡";
  return "🟢";
}

function formatMinutes(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}м`;
  return `${h}ч ${m}м`;
}

export async function sendWeeklyReport(
  trustedChatId: number | string,
  data: WeeklyReportData,
  unlockRequestId?: string
): Promise<void> {
  const emoji = riskEmoji(data.riskLevel);
  const riskLabel = data.riskLevel === "HIGH" ? "Высокий" : data.riskLevel === "MEDIUM" ? "Средний" : "Низкий";

  const userName = data.userTg ? "@" + data.userTg : data.userName || "—";
  const hasActivity = data.totalSessions > 0 || data.totalAmount > 0;

  const lines = [
    `📊 <b>Еженедельный отчёт</b>`,
    ``,
    `👤 Пользователь: ${userName}`,
    `📅 Период: ${data.weekStart}`,
    ``,
    `${emoji} <b>Риск-скор: ${data.riskScore}/100</b> (${riskLabel})`,
    ``,
    hasActivity ? `💰 Ставок/депозитов: $${data.totalAmount.toFixed(0)}` : `💰 Ставок/депозитов: $0`,
    `🎰 Сессий: ${data.totalSessions}`,
    hasActivity ? `⏱ Общее время: ${formatMinutes(data.totalTimeMinutes)}` : `⏱ Общее время: 0м`,
    `🌙 Ночных сессий: ${data.nightSessions}`,
    data.disableAttempts > 0 ? `⚠️ Попыток отключить: ${data.disableAttempts}` : null,
    data.blockedSites ? `🛡 Заблокировано сайтов: ${data.blockedSites}` : null,
    ``,
    !hasActivity ? `ℹ️ <i>За этот период записей в дневнике нет. Данные появятся после добавления эпизодов.</i>` : null,
    hasActivity ? `<i>${data.analysisSummary}</i>` : null,
  ].filter((l) => l !== null).join("\n");

  const keyboard =
    unlockRequestId
      ? {
          inline_keyboard: [
            [
              { text: "✅ Одобрить разблокировку", callback_data: `approve_${unlockRequestId}` },
              { text: "❌ Отклонить", callback_data: `reject_${unlockRequestId}` },
            ],
          ],
        }
      : undefined;

  await sendTelegramMessage(trustedChatId, lines, {
    parse_mode: "HTML",
    ...(keyboard ? { reply_markup: keyboard } : {}),
  });
}

export async function sendUnlockRequestNotification(
  trustedChatId: number | string,
  userName: string,
  userTg: string,
  riskScore: number,
  reason: string,
  unlockRequestId: string
): Promise<void> {
  const text = [
    `⚠️ <b>Запрос на снятие блокировки</b>`,
    ``,
    `Пользователь: ${userTg ? "@" + userTg : userName || "—"}`,
    `Риск-скор: ${riskScore}/100`,
    ``,
    `Причина: <i>${reason || "не указана"}</i>`,
    ``,
    `Без вашего подтверждения ограничения останутся активными.`,
  ].join("\n");

  await sendTelegramMessage(trustedChatId, text, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "✅ Одобрить на 24ч", callback_data: `approve_${unlockRequestId}` },
          { text: "❌ Отклонить", callback_data: `reject_${unlockRequestId}` },
        ],
      ],
    },
  });
}

export function computeRiskScore(data: {
  totalSessions: number;
  totalAmount: number;
  totalTimeMinutes: number;
  nightSessions: number;
  disableAttempts: number;
  prevWeekAmount?: number;
  avgSessionMinutes?: number;
  blockedSites?: number;
}): { score: number; level: "LOW" | "MEDIUM" | "HIGH" } {
  let score = 0;

  // Sessions score (0-20)
  score += Math.min(data.totalSessions * 2, 20);

  // Amount score (0-25)
  if (data.totalAmount > 0) {
    score += Math.min(data.totalAmount / 20, 25);
  }

  // Time score (0-20)
  if (data.totalTimeMinutes > 0) {
    score += Math.min(data.totalTimeMinutes / 30, 20);
  }

  // Night sessions (0-15)
  score += Math.min(data.nightSessions * 5, 15);

  // Disable attempts (0-15)
  score += Math.min(data.disableAttempts * 10, 15);

  // Blocked gambling sites (0-10)
  if (data.blockedSites && data.blockedSites > 0) {
    score += Math.min(data.blockedSites * 2, 10);
  }

  // Week-over-week growth (0-5)
  if (data.prevWeekAmount && data.prevWeekAmount > 0) {
    const growth = (data.totalAmount - data.prevWeekAmount) / data.prevWeekAmount;
    if (growth > 0.5) score += 5;
    else if (growth > 0.2) score += 2;
  }

  score = Math.round(Math.min(Math.max(score, 0), 100));

  const level: "LOW" | "MEDIUM" | "HIGH" =
    score >= 61 ? "HIGH" : score >= 31 ? "MEDIUM" : "LOW";

  return { score, level };
}

export function buildAnalysisSummary(data: {
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  totalSessions: number;
  nightSessions: number;
  totalAmount: number;
  disableAttempts: number;
  blockedSites?: number;
}): string {
  if (data.riskLevel === "HIGH") {
    const parts: string[] = [];
    if (data.nightSessions > 2) parts.push("частые ночные сессии");
    if (data.disableAttempts > 0) parts.push(`${data.disableAttempts} попытки отключить систему`);
    if (data.totalAmount > 200) parts.push("высокие потери");
    if (data.blockedSites && data.blockedSites > 5) parts.push(`${data.blockedSites} попыток зайти на азартные сайты`);
    const risk = parts.length > 0 ? `Обнаружены тревожные сигналы: ${parts.join(", ")}. ` : "";
    return `${risk}Рекомендуется сохранить текущие ограничения.`;
  }
  if (data.riskLevel === "MEDIUM") {
    return `Умеренный уровень активности. Рекомендуется продолжать мониторинг.`;
  }
  return `Показатели в норме. Система контроля работает эффективно.`;
}
