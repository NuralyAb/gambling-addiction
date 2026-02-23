import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendTelegramMessage } from "@/lib/telegram";
import { z } from "zod";

const schema = z.object({
  requestId: z.string().uuid(),
  tg: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json();
  const { requestId, tg } = schema.parse(body);

  const cleanTg = tg.replace(/^@/, "");

  const { data: request } = await supabase
    .from("unlock_requests")
    .select("id, user_id, status")
    .eq("id", requestId)
    .single();

  if (!request) {
    return NextResponse.json({ error: "Запрос не найден" }, { status: 404 });
  }

  if (request.status !== "pending") {
    return NextResponse.json({ error: "Запрос уже был обработан" }, { status: 409 });
  }

  const { data: user } = await supabase
    .from("users")
    .select("name, tg_username, tg_chat_id, trusted_person_tg")
    .eq("id", request.user_id)
    .single();

  if (!user || user.trusted_person_tg?.toLowerCase() !== cleanTg.toLowerCase()) {
    return NextResponse.json({ error: "Нет доступа к этому запросу" }, { status: 403 });
  }

  await supabase
    .from("unlock_requests")
    .update({ status: "rejected", reviewed_at: new Date().toISOString() })
    .eq("id", requestId);

  if (user.tg_chat_id) {
    await sendTelegramMessage(
      user.tg_chat_id,
      "❌ Доверенное лицо отклонило ваш запрос на разблокировку. Ограничения остаются активными."
    );
  }

  return NextResponse.json({ success: true, message: "Запрос отклонён" });
}
