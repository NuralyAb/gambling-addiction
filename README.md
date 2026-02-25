# NoBet

Платформа помощи при игровой зависимости с AI-поддержкой: анализ поведения, предсказание рисков, персональные рекомендации, чат и уведомления доверенному лицу.

## Быстрый старт

```bash
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

## Переменные окружения (.env)

| Переменная | Обязательно | Описание |
|------------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Да | URL проекта Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Да | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Да | Service role key (серверные API) |
| `NEXTAUTH_URL` | Да | URL приложения (http://localhost:3000) |
| `NEXTAUTH_SECRET` | Да | Секрет для JWT |
| `OPENAI_API_KEY` | Для чата | Ключ OpenAI (gpt-4o-mini) |
| `RESEND_API_KEY` | Для email | Верификация, сброс пароля |
| `TELEGRAM_BOT_TOKEN` | Для бота | Токен бота |
| `ADMIN_EMAIL` | Для админки | Email админа (через запятую — несколько) |

## Документация

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — стек, структура проекта, маршрутизация
- **[docs/AI-MODULES.md](docs/AI-MODULES.md)** — нейросеть, sentiment, аномалии, чат: как устроено и почему
- **[docs/FEATURES.md](docs/FEATURES.md)** — что работает: аутентификация, PGSI, дневник, расширение, Telegram, админка
- **[docs/SECURITY.md](docs/SECURITY.md)** — анонимизация, RLS, сроки хранения

## Скрипты

```bash
npm run dev          # Запуск dev-сервера
npm run build        # Сборка
npm run create-admin # Создать пользователя-админа (email из ADMIN_EMAIL)
npm run migrate:admin # Миграция admin_logs (нужен DATABASE_URL или SUPABASE_ACCESS_TOKEN)
```

## Миграции БД

Выполните в Supabase SQL Editor:

- `supabase-migration-admin.sql` — таблица admin_logs
- `supabase-migration-extension.sql` — extension_tokens, block_events
- `supabase-migration-telegram.sql` — колонки Telegram в users
- `supabase-migration-features.sql` — last_alert_sent, last_preventive_sent
- `supabase-migration-unlock-friction.sql` — what_changed, plan, if_lose, impulsive_flag в unlock_requests

## AI-модули (кратко)

| Модуль | Локально | Назначение |
|--------|----------|------------|
| NoBet Neural Network | Да | Предсказание риска рецидива (6→8→4→1) |
| Sentiment (AFINN + RU) | Да | Анализ настроения по тексту дневника |
| Z-score аномалии | Да | Выявление необычных паттернов |
| OpenAI GPT-4o | Нет | Эмпатичный чат (с анонимизацией) |

Подробнее: [docs/AI-MODULES.md](docs/AI-MODULES.md)
