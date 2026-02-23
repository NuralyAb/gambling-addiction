import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

const pgsiSchema = z.object({
  answers: z.array(z.number().min(0).max(3)).length(9),
});

function getRiskCategory(score: number): string {
  if (score === 0) return "none";
  if (score <= 2) return "low";
  if (score <= 7) return "moderate";
  return "high";
}

function scoreToRiskPercent(score: number): number {
  // Map 0-27 PGSI score to 0-100 riskScore
  return Math.round((score / 27) * 100);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { answers } = pgsiSchema.parse(body);
    const userId = (session.user as { id: string }).id;

    const totalScore = answers.reduce((sum, a) => sum + a, 0);
    const riskCategory = getRiskCategory(totalScore);
    const riskPercent = scoreToRiskPercent(totalScore);

    // Save PGSI result
    const { error: insertError } = await supabase.from("pgsi_results").insert({
      user_id: userId,
      answers,
      total_score: totalScore,
      risk_category: riskCategory,
    });

    if (insertError) {
      console.error("PGSI insert error:", insertError);
      return NextResponse.json({ error: "Ошибка сохранения результата" }, { status: 500 });
    }

    // Update user risk_score and pgsi_completed
    const { error: updateError } = await supabase
      .from("users")
      .update({
        risk_score: riskPercent,
        pgsi_completed: true,
      })
      .eq("id", userId);

    if (updateError) {
      console.error("User update error:", updateError);
    }

    return NextResponse.json({
      totalScore,
      riskCategory,
      riskPercent,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
    }
    console.error("PGSI error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const { data, error } = await supabase
    .from("pgsi_results")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({ completed: false });
  }

  return NextResponse.json({
    completed: true,
    totalScore: data.total_score,
    riskCategory: data.risk_category,
    answers: data.answers,
    createdAt: data.created_at,
  });
}
