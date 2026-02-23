import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

const episodeSchema = z.object({
  episode_date: z.string().optional(),
  amount: z.number().min(0).optional(),
  trigger: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = episodeSchema.parse(body);
    const userId = (session.user as { id: string }).id;

    const { error } = await supabase.from("gambling_episodes").insert({
      user_id: userId,
      episode_date: data.episode_date || new Date().toISOString().split("T")[0],
      amount: data.amount || 0,
      trigger: data.trigger || null,
      notes: data.notes || null,
    });

    if (error) {
      console.error("Episode insert error:", error);
      return NextResponse.json({ error: "Ошибка сохранения" }, { status: 500 });
    }

    return NextResponse.json({ message: "Эпизод записан" }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
    }
    return NextResponse.json({ error: "Внутренняя ошибка" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "20");

  const { data, error } = await supabase
    .from("gambling_episodes")
    .select("*")
    .eq("user_id", userId)
    .order("episode_date", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
