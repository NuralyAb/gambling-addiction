#!/bin/bash
# Пересборка с правильными переменными Supabase
# Запуск из корня проекта: bash deploy/rebuild.sh

set -e
cd "$(dirname "$0")/.."

# Проверка .env
if [ ! -f .env ]; then
  echo "Ошибка: .env не найден. Создайте из .env.example"
  exit 1
fi

# Загружаем .env в окружение
set -a
source .env
set +a

# Проверка Supabase
if [[ "$NEXT_PUBLIC_SUPABASE_URL" == *"placeholder"* ]]; then
  echo "Ошибка: NEXT_PUBLIC_SUPABASE_URL в .env содержит placeholder. Укажите реальный URL Supabase."
  exit 1
fi

echo "Сборка с NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL"
echo "Пересборка без кэша..."

docker compose -f deploy/docker-compose.prod.yml --env-file .env build --no-cache
docker compose -f deploy/docker-compose.prod.yml --env-file .env up -d

echo "Готово. Проверьте: docker logs -f nobet-app"
