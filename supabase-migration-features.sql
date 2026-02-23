-- Миграция: Новые фичи (алерты, достижения)
-- Выполни в Supabase SQL Editor

-- Поле для контроля спама алертов
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_alert_sent TIMESTAMPTZ;
