# Архитектура SafeBet AI

## Обзор

SafeBet AI — платформа помощи при игровой зависимости, использующая 4 AI-модуля: собственную нейросеть, NLP-анализ настроения, детектор аномалий и OpenAI-чат.

## Стек технологий

| Компонент | Технология | Зачем |
|-----------|------------|-------|
| Frontend | Next.js 14 (App Router) | SSR, API routes, оптимизация |
| Auth | NextAuth (Credentials) | JWT-сессии, без OAuth-провайдеров |
| БД | Supabase (PostgreSQL) | RLS, бэкапы, масштабируемость |
| AI-чат | OpenAI GPT-4o-mini | Эмпатичный диалог, streaming |
| Email | Resend | Верификация, сброс пароля |
| Мессенджер | Telegram Bot API | Уведомления, отчёты, бот |

## Структура проекта

```
src/
├── app/
│   ├── (auth)/          # Логин, регистрация, сброс пароля
│   ├── (protected)/     # Защищённые страницы (Sidebar, PGSIGuard)
│   ├── admin/           # Админка (отдельный layout, без Sidebar)
│   ├── api/             # API routes
│   └── page.tsx         # Лендинг
├── components/
├── lib/
│   ├── ai/              # AI-модули (neural-risk, sentiment, anomaly)
│   ├── auth.ts
│   ├── supabase.ts
│   ├── anonymize.ts     # Анонимизация перед OpenAI
│   ├── alerts.ts        # Уведомления доверенному лицу
│   └── telegram.ts
└── middleware.ts        # Защита маршрутов
```

## Маршрутизация и защита

**Middleware** (`src/middleware.ts`) проверяет авторизацию для:
- `/dashboard`, `/profile`, `/diary`, `/ai-insights`, `/analytics`, `/achievements`
- `/support`, `/resources`, `/extension`, `/education`, `/admin`

Неавторизованные пользователи перенаправляются на `/login`.

**PGSIGuard** — клиентский guard: если пользователь не прошёл PGSI-тест, редирект на `/pgsi-test`. Исключение: `/admin` (админ может не проходить тест).

**Почему так:** Разделение на (auth) и (protected) упрощает layout. Админка вынесена отдельно — у админа не должно быть доступа к обычной навигации (дневник, дашборд и т.д.) при работе в админке.
