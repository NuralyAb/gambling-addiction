import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  trusted_person_name: z.string().max(100).optional(),
  trusted_person_email: z.string().email().optional().or(z.literal("")),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const { data, error } = await supabase
    .from("users")
    .select("name, city, phone, trusted_person_name, trusted_person_email, email, risk_score")
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

    const { error } = await supabase
      .from("users")
      .update(data)
      .eq("id", userId);

    if (error) {
      return NextResponse.json({ error: "Ошибка обновления профиля" }, { status: 500 });
    }

    return NextResponse.json({ message: "Профиль обновлён" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
