import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Токен не указан" }, { status: 400 });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("id")
      .eq("verification_token", token)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "Недействительный или истёкший токен" },
        { status: 400 }
      );
    }

    await supabase
      .from("users")
      .update({
        email_verified: true,
        verification_token: null,
      })
      .eq("id", user.id);

    return NextResponse.json({ message: "Email успешно подтверждён" });
  } catch {
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
