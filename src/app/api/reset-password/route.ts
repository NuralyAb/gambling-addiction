import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { sendResetPasswordEmail } from "@/lib/resend";
import { z } from "zod";

// Request password reset
export async function POST(req: Request) {
  try {
    const { email, token, newPassword } = await req.json();

    // If token + newPassword present, reset the password
    if (token && newPassword) {
      const passwordSchema = z.string().min(8, "Пароль минимум 8 символов");
      passwordSchema.parse(newPassword);

      const { data: user, error } = await supabase
        .from("users")
        .select("id, reset_token_expires")
        .eq("reset_token", token)
        .single();

      if (error || !user) {
        return NextResponse.json(
          { error: "Недействительный или истёкший токен" },
          { status: 400 }
        );
      }

      if (
        user.reset_token_expires &&
        new Date(user.reset_token_expires) < new Date()
      ) {
        return NextResponse.json(
          { error: "Токен истёк. Запросите сброс пароля повторно." },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await supabase
        .from("users")
        .update({
          password: hashedPassword,
          reset_token: null,
          reset_token_expires: null,
        })
        .eq("id", user.id);

      return NextResponse.json({ message: "Пароль успешно изменён" });
    }

    // Otherwise, send reset email
    if (!email) {
      return NextResponse.json({ error: "Email не указан" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .single();

    if (!user) {
      // Don't reveal whether user exists
      return NextResponse.json({
        message: "Если аккаунт существует, на почту отправлена ссылка для сброса пароля.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await supabase
      .from("users")
      .update({
        reset_token: resetToken,
        reset_token_expires: expires.toISOString(),
      })
      .eq("id", user.id);

    try {
      await sendResetPasswordEmail(normalizedEmail, resetToken);
    } catch (emailError) {
      console.error("Reset email error:", emailError);
    }

    return NextResponse.json({
      message: "Если аккаунт существует, на почту отправлена ссылка для сброса пароля.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
