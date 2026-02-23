-- Миграция: Chrome Extension интеграция
-- Выполни в Supabase SQL Editor

-- Токены расширения
CREATE TABLE IF NOT EXISTS extension_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  name TEXT DEFAULT 'Chrome Extension',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 year'),
  revoked BOOLEAN DEFAULT FALSE,
  last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ext_tokens_token ON extension_tokens(token) WHERE revoked = FALSE;
CREATE INDEX IF NOT EXISTS idx_ext_tokens_user ON extension_tokens(user_id);

ALTER TABLE extension_tokens ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Service role full access ext_tokens" ON extension_tokens FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Обновляем block_events — добавляем timestamp и убираем старые колонки если нужно
ALTER TABLE block_events ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE block_events ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE block_events ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'extension';
