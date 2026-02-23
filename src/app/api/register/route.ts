import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";
import { sendVerificationEmail } from "@/lib/resend";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(8, "Пароль минимум 8 символов"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = registerSchema.parse(body);

    const normalizedEmail = email.toLowerCase();

    // Check if user exists
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
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Ошибка при создании аккаунта" },
        { status: 500 }
      );
    }

    // Send verification email
    try {
      await sendVerificationEmail(normalizedEmail, verificationToken);
    } catch (emailError) {
      console.error("Email send error:", emailError);
      // Don't block registration if email fails
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
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
