#!/bin/bash
# ============================================
# Получение SSL сертификата Let's Encrypt
# Запуск: sudo bash deploy/ssl-setup.sh your-domain.com
#
# Требования: домен должен указывать на IP сервера, порт 80 открыт
# ============================================

set -e

DOMAIN="${1:?Укажите домен: bash deploy/ssl-setup.sh example.com}"
EMAIL="${2:-admin@$DOMAIN}"

echo "=== Установка certbot ==="
apt-get update
apt-get install -y certbot

echo "=== Создание директории для ACME ==="
mkdir -p /var/www/certbot

echo "=== Остановка nginx (освобождаем порт 80) ==="
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"
docker compose -f deploy/docker-compose.prod.yml stop nginx 2>/dev/null || true
docker compose -f deploy/docker-compose.prod-https.yml stop nginx 2>/dev/null || true
sleep 2

echo "=== Получение сертификата (standalone) ==="
certbot certonly --standalone -d "$DOMAIN" -d "www.$DOMAIN" \
  --email "$EMAIL" \
  --agree-tos \
  --non-interactive \
  --preferred-challenges http

echo ""
echo "=== Готово! ==="
echo "Сертификаты: /etc/letsencrypt/live/$DOMAIN/"
echo ""
echo "Запуск с HTTPS:"
echo "  docker compose -f deploy/docker-compose.prod.yml --env-file .env up -d"
