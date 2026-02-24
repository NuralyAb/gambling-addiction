#!/usr/bin/env node
/**
 * Создаёт пользователя-админа (email из ADMIN_EMAIL в .env).
 * Использует Supabase client — DATABASE_URL не нужен.
 *
 * npm run create-admin
 * Пароль по умолчанию: Admin123!
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = (process.env.ADMIN_EMAIL || "admin@gmail.com").trim().toLowerCase();

if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY должны быть в .env");
  process.exit(1);
}

const supabase = createClient(url, key);

const password = process.argv[2] || "Admin123!";
if (password.length < 8) {
  console.error("Пароль должен быть не менее 8 символов");
  process.exit(1);
}

async function main() {
  const { data: existing } = await supabase
    .from("users")
    .select("id, email")
    .eq("email", adminEmail)
    .single();

  if (existing) {
    console.log(`Пользователь ${adminEmail} уже существует.`);
    console.log("Войдите под этим email — он уже в ADMIN_EMAIL.");
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const { error } = await supabase.from("users").insert({
    email: adminEmail,
    password: hashedPassword,
    name: "Admin",
    email_verified: true,
    risk_score: 0,
    tg_username: "admin",
  });

  if (error) {
    console.error("Ошибка создания:", error.message);
    process.exit(1);
  }

  console.log(`Админ ${adminEmail} создан.`);
  console.log(`Пароль: ${password}`);
  console.log("Войдите на /login");
}

main();
