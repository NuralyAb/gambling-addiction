#!/usr/bin/env node
/**
 * Скрипт миграции admin_logs.
 *
 * Вариант 1 (рекомендуется): SUPABASE_ACCESS_TOKEN в .env
 *   Токен: https://supabase.com/dashboard/account/tokens
 *
 * Вариант 2: DATABASE_URL в .env
 *   postgresql://postgres:[PASSWORD]@db.bzhfhtarlzrqblsydtso.supabase.co:5432/postgres
 *   Пароль: Settings → Database → Connection string
 *
 * Вариант 3: SQL Editor
 *   https://supabase.com/dashboard/project/bzhfhtarlzrqblsydtso/sql
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_REF = "bzhfhtarlzrqblsydtso";

const sql = readFileSync(
  resolve(__dirname, "../supabase/migrations/20240223120000_admin_logs.sql"),
  "utf8"
).replace(/^--.*$/gm, "").trim();

// Вариант 1: Management API
const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
if (token) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    console.error("Ошибка Management API:", res.status, err);
    process.exit(1);
  }
  console.log("Миграция admin_logs выполнена успешно (Management API).");
  process.exit(0);
}

// Вариант 2: pg + DATABASE_URL
const url = process.env.DATABASE_URL;
if (url) {
  let pg;
  try {
    pg = await import("pg");
  } catch {
    console.error("Установите pg: npm install pg");
    process.exit(1);
  }
  const client = new pg.default.Client({ connectionString: url });
  try {
    await client.connect();
    await client.query(sql);
    console.log("Миграция admin_logs выполнена успешно (pg).");
  } catch (e) {
    console.error("Ошибка миграции:", e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
  process.exit(0);
}

// Нет токена и URL
console.error("Добавьте в .env:");
console.error("  SUPABASE_ACCESS_TOKEN  — https://supabase.com/dashboard/account/tokens");
console.error("  или");
console.error("  DATABASE_URL — postgresql://postgres:PASSWORD@db." + PROJECT_REF + ".supabase.co:5432/postgres");
console.error("");
console.error("Или выполните SQL вручную: https://supabase.com/dashboard/project/" + PROJECT_REF + "/sql");
console.error("");
console.error("SQL:");
console.error(sql);
process.exit(1);
