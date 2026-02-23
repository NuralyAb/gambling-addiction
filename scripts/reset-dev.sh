#!/bin/bash
# Сброс dev-сервера при 500 / "missing required error components"

echo "Останавливаем процессы Node..."
pkill -f "next dev" 2>/dev/null || true
sleep 1

echo "Удаляем кэш .next..."
rm -rf .next

echo "Запускаем dev-сервер..."
npm run dev
