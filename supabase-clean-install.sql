-- ============================================
-- ПОЛНАЯ ОЧИСТКА + УСТАНОВКА
-- Выполни этот SQL целиком в Supabase SQL Editor
-- ============================================

-- Удаляем всё старое
DROP TABLE IF EXISTS block_events CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS diary_entries CASCADE;
DROP TABLE IF EXISTS gambling_episodes CASCADE;
DROP TABLE IF EXISTS pgsi_results CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

-- ============================================
-- Гранты на схему public
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- ============================================
-- 1. Таблица users
-- ============================================

CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  city TEXT,
  phone TEXT,
  trusted_person_email TEXT,
  trusted_person_name TEXT,
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  email_verified BOOLEAN DEFAULT FALSE,
  pgsi_completed BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  reset_token TEXT,
  reset_token_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_verification_token ON users(verification_token);
CREATE INDEX idx_users_reset_token ON users(reset_token);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON users
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 2. PGSI результаты
-- ============================================

CREATE TABLE pgsi_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answers INTEGER[] NOT NULL,
  total_score INTEGER NOT NULL CHECK (total_score >= 0 AND total_score <= 27),
  risk_category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pgsi_user_id ON pgsi_results(user_id);

ALTER TABLE pgsi_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access pgsi" ON pgsi_results
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 3. Дневник поведения
-- ============================================

CREATE TABLE diary_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('episode', 'positive')),
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration INTEGER,
  amount DECIMAL(12,2) DEFAULT 0,
  platform TEXT,
  mood_before TEXT CHECK (mood_before IN ('terrible', 'bad', 'neutral', 'good', 'great')),
  mood_after TEXT CHECK (mood_after IN ('terrible', 'bad', 'neutral', 'good', 'great')),
  triggers JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_diary_user_date ON diary_entries(user_id, date DESC);
CREATE INDEX idx_diary_type ON diary_entries(user_id, type);

ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access diary" ON diary_entries
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 4. Чат-сообщения
-- ============================================

CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_user_date ON chat_messages(user_id, created_at ASC);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access chat" ON chat_messages
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 5. Блокировки расширения
-- ============================================

CREATE TABLE block_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  blocked_today INTEGER DEFAULT 0,
  blocked_week INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_block_events_user ON block_events(user_id, created_at DESC);

ALTER TABLE block_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access blocks" ON block_events
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- ГОТОВО! Все таблицы созданы.
-- ============================================
