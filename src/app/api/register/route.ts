import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";
import { sendVerificationEmail } from "@/lib/resend";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(8, "Пароль минимум 8 символов"),
  tg_username: z
    .string()
    .transform((s) => (s || "").replace(/^@/, "").trim())
    .refine((s) => s.length >= 1, "Telegram username обязателен")
    .refine((s) => s.length <= 32, "Слишком длинный username"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, tg_username } = registerSchema.parse(body);

    const normalizedEmail = email.toLowerCase();

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const { error } = await supabase.from("users").insert({
      email: normalizedEmail,
      password: hashedPassword,
      verification_token: verificationToken,
      email_verified: false,
      risk_score: 0,
      tg_username,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: error.message || "Ошибка при создании аккаунта" },
        { status: 500 }
      );
    }

    try {
      await sendVerificationEmail(normalizedEmail, verificationToken);
    } catch (emailError) {
      console.error("Email send error:", emailError);
    }

    return NextResponse.json(
      { message: "Аккаунт создан. Проверьте почту для подтверждения email." },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("Register error:", error);
    const message =
      error instanceof Error ? error.message : "Внутренняя ошибка сервера";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
