-- Миграция: Friction 2.0 — дополнительные поля для unlock_requests
-- Выполни в Supabase SQL Editor

ALTER TABLE unlock_requests ADD COLUMN IF NOT EXISTS what_changed TEXT;
ALTER TABLE unlock_requests ADD COLUMN IF NOT EXISTS plan TEXT;
ALTER TABLE unlock_requests ADD COLUMN IF NOT EXISTS if_lose TEXT;
ALTER TABLE unlock_requests ADD COLUMN IF NOT EXISTS impulsive_flag BOOLEAN DEFAULT FALSE;
