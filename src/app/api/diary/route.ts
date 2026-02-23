import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

const moodEnum = z.enum(["terrible", "bad", "neutral", "good", "great"]);

const diarySchema = z.object({
  type: z.enum(["episode", "positive"]),
  date: z.string().optional(),
  duration: z.number().min(0).max(1440).optional(),
  amount: z.number().min(0).optional(),
  platform: z.enum(["casino", "bookmaker", "poker", "slots", "other"]).optional(),
  mood_before: moodEnum.optional(),
  mood_after: moodEnum.optional(),
  triggers: z.array(z.string()).optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = diarySchema.parse(body);
    const userId = (session.user as { id: string }).id;

    const { error } = await supabase.from("diary_entries").insert({
      user_id: userId,
      type: data.type,
      date: data.date || new Date().toISOString(),
      duration: data.type === "episode" ? (data.duration || null) : null,
      amount: data.type === "episode" ? (data.amount || 0) : 0,
      platform: data.type === "episode" ? (data.platform || null) : null,
      mood_before: data.mood_before || null,
      mood_after: data.mood_after || null,
      triggers: data.triggers || [],
      notes: data.notes || null,
    });

    if (error) {
      console.error("Diary insert error:", error);
      return NextResponse.json({ error: "Ошибка сохранения" }, { status: 500 });
    }

    return NextResponse.json({ message: "Запись сохранена" }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
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

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const type = searchParams.get("type"); // 'episode' | 'positive' | null (all)
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const offset = (page - 1) * limit;

  // Build query
  let query = supabase
    .from("diary_entries")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (type && (type === "episode" || type === "positive")) {
    query = query.eq("type", type);
  }

  if (dateFrom) {
    query = query.gte("date", dateFrom);
  }

  if (dateTo) {
    query = query.lte("date", dateTo + "T23:59:59.999Z");
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Diary fetch error:", error);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }

  return NextResponse.json({
    entries: data || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  });
}
