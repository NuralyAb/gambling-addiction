-- Выполни этот SQL в Supabase SQL Editor (Dashboard → SQL Editor → New query)

CREATE TABLE IF NOT EXISTS users (
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
  verification_token TEXT,
  reset_token TEXT,
  reset_token_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Колонки Telegram (для регистрации и доверенного лица)
ALTER TABLE users ADD COLUMN IF NOT EXISTS tg_username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tg_chat_id BIGINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trusted_person_tg TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trusted_person_chat_id BIGINT;
CREATE INDEX IF NOT EXISTS idx_users_trusted_person_tg ON users(trusted_person_tg);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

-- Автообновление updated_at
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

-- Отключи RLS для серверного доступа через service_role key
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Политика: только через service_role (серверные API routes)
CREATE POLICY "Service role full access" ON users
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- ТАСК 2: Таблица результатов PGSI теста
-- ============================================

-- Добавляем поле pgsi_completed в users
ALTER TABLE users ADD COLUMN IF NOT EXISTS pgsi_completed BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS pgsi_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answers INTEGER[] NOT NULL,          -- массив из 9 ответов (0-3)
  total_score INTEGER NOT NULL CHECK (total_score >= 0 AND total_score <= 27),
  risk_category TEXT NOT NULL,          -- 'none', 'low', 'moderate', 'high'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pgsi_user_id ON pgsi_results(user_id);

ALTER TABLE pgsi_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access pgsi" ON pgsi_results
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- ТАСК 3: Игровые эпизоды (legacy, can drop)
-- ============================================

CREATE TABLE IF NOT EXISTS gambling_episodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  episode_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount DECIMAL(12,2) DEFAULT 0,
  trigger TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_episodes_user_date ON gambling_episodes(user_id, episode_date DESC);

ALTER TABLE gambling_episodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access episodes" ON gambling_episodes
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- ТАСК 4: Дневник поведения (расширенный)
-- ============================================

-- Удаляем старую таблицу diary_entries если есть
DROP TABLE IF EXISTS diary_entries;

CREATE TABLE diary_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('episode', 'positive')),
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration INTEGER,                      -- минуты игры (только для episode)
  amount DECIMAL(12,2) DEFAULT 0,        -- потрачено (только для episode)
  platform TEXT,                         -- casino, bookmaker, poker, slots, other
  mood_before TEXT CHECK (mood_before IN ('terrible', 'bad', 'neutral', 'good', 'great')),
  mood_after TEXT CHECK (mood_after IN ('terrible', 'bad', 'neutral', 'good', 'great')),
  triggers JSONB DEFAULT '[]'::jsonb,    -- массив строк: stress, boredom, loneliness, alcohol, ads, other
  notes TEXT,                            -- свободный текст до 500 символов
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diary_user_date ON diary_entries(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_diary_type ON diary_entries(user_id, type);

ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access diary" ON diary_entries
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- ТАСК 6: Чат-сообщения (AI поддержка)
-- ============================================

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_user_date ON chat_messages(user_id, created_at ASC);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access chat" ON chat_messages
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
