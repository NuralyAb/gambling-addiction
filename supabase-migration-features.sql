-- Миграция: Новые фичи (алерты, достижения, превентивные интервенции)
-- Выполни в Supabase SQL Editor

-- Поле для контроля спама алертов
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_alert_sent TIMESTAMPTZ;

-- Поле для превентивных интервенций (не чаще 1 раза в 12ч)
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_preventive_sent TIMESTAMPTZ;
