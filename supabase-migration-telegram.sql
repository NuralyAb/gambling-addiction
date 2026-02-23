-- Миграция: колонки Telegram для users
-- Выполни в Supabase SQL Editor (Dashboard → SQL Editor → New query)

ALTER TABLE users ADD COLUMN IF NOT EXISTS tg_username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tg_chat_id BIGINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trusted_person_tg TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trusted_person_chat_id BIGINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS report_frequency TEXT DEFAULT 'weekly' CHECK (report_frequency IN ('daily', 'every_3_days', 'weekly', 'off'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_report_sent TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_trusted_person_tg ON users(trusted_person_tg);

-- Таблицы для unlock_requests и weekly_reports (если ещё нет)
CREATE TABLE IF NOT EXISTS unlock_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_unlock_user ON unlock_requests(user_id, status);

ALTER TABLE unlock_requests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Service role full access unlock" ON unlock_requests FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  risk_score INTEGER NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
  total_sessions INTEGER DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  total_time_minutes INTEGER DEFAULT 0,
  night_sessions INTEGER DEFAULT 0,
  disable_attempts INTEGER DEFAULT 0,
  analysis_summary TEXT,
  telegram_report JSONB,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_user ON weekly_reports(user_id, sent_at DESC);

ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Service role full access reports" ON weekly_reports FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
