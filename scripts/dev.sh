#!/usr/bin/env bash
# Убивает процессы на портах 3000-3005 и запускает dev на 3000
for port in 3000 3001 3002 3003 3004 3005; do
  pid=$(lsof -ti :$port 2>/dev/null)
  if [ -n "$pid" ]; then
    kill -9 $pid 2>/dev/null
    echo "Освобождён порт $port"
  fi
done
exec next dev -p 3000
