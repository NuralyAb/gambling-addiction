# Документация NoBet

## Содержание

1. **[ARCHITECTURE.md](ARCHITECTURE.md)** — архитектура, стек, структура проекта, маршрутизация
2. **[AI-MODULES.md](AI-MODULES.md)** — AI-модули: как реализованы и почему именно так
3. **[FEATURES.md](FEATURES.md)** — функциональность: что работает и как
4. **[SECURITY.md](SECURITY.md)** — безопасность и конфиденциальность

## Краткая схема потока данных

```
Пользователь → Next.js (middleware) → Protected routes / API
                    ↓
              NextAuth (JWT)
                    ↓
         Supabase (PostgreSQL, RLS)
                    ↓
    AI: neural-risk, sentiment, anomaly (локально)
    AI: OpenAI (чат, с анонимизацией)
                    ↓
    Telegram, Resend, Chrome Extension
```
