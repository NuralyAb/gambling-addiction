import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { sendUnlockRequestNotification } from "@/lib/telegram";
import { z } from "zod";

const schema = z.object({
  reason: z.string().max(500).optional(),
  what_changed: z.string().min(1, "Обязательное поле").max(500),
  plan: z.string().min(1, "Обязательное поле").max(500),
  if_lose: z.string().min(1, "Обязательное поле").max(500),
});

const IMPULSIVE_MIN_LENGTH = 20;

// POST /api/unlock-request  — user submits a request to remove blocking
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const issues = "issues" in parsed.error ? parsed.error.issues : (parsed.error as { errors?: { message?: string }[] }).errors;
    const msg = (issues?.[0] as { message?: string })?.message || "Заполните все три вопроса";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const { reason, what_changed, plan, if_lose } = parsed.data;

  // Cooldown: при risk_score > 80 и 5+ unlock за неделю — блокируем на 24ч
  const { data: userProfile } = await supabase
    .from("users")
    .select("risk_score")
    .eq("id", userId)
    .single();
  const riskScore = userProfile?.risk_score ?? 0;
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { count: unlockCount } = await supabase
    .from("unlock_requests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", weekAgo.toISOString());
  if (riskScore > 80 && (unlockCount ?? 0) >= 5) {
    return NextResponse.json(
      { error: "При критическом риске доступен только 5 запросов в неделю. Попробуйте завтра." },
      { status: 429 }
    );
  }

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

  const impulsiveFlag =
    what_changed.length < IMPULSIVE_MIN_LENGTH ||
    plan.length < IMPULSIVE_MIN_LENGTH ||
    if_lose.length < IMPULSIVE_MIN_LENGTH;

  // Create unlock request
  const { data: request, error: insertErr } = await supabase
    .from("unlock_requests")
    .insert({
      user_id: userId,
      reason: [what_changed, plan, if_lose].join("\n\n") || reason,
      what_changed,
      plan,
      if_lose,
      impulsive_flag: impulsiveFlag,
    })
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

  const reasonText = [
    `Что изменилось: ${what_changed}`,
    `План: ${plan}`,
    `Если проиграю: ${if_lose}`,
  ].join("\n");
  const reasonWithImpulsive = impulsiveFlag
    ? `${reasonText}\n\n⚠️ <i>Короткие ответы — возможный импульс</i>`
    : reasonText;

  // Notify trusted person via Telegram if chat_id is set
  if (user?.trusted_person_chat_id) {
    try {
      await sendUnlockRequestNotification(
        user.trusted_person_chat_id,
        user.name || "",
        user.tg_username || "",
        user.risk_score || 0,
        reasonWithImpulsive,
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
