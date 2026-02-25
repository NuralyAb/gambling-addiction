#!/bin/bash
# Копирует конфиги WireGuard из контейнера в vpn-config для скачивания с сайта
# Запуск из корня проекта: bash deploy/copy-vpn-config.sh

set -e
cd "$(dirname "$0")/.."

mkdir -p vpn-config

for i in 1 2 3; do
  if docker ps --format '{{.Names}}' | grep -q nobet-wireguard; then
    docker cp nobet-wireguard:/config/peer${i}/peer${i}.conf vpn-config/peer${i}.conf 2>/dev/null || true
  fi
done

echo "VPN configs copied to vpn-config/"
ls -la vpn-config/ 2>/dev/null || echo "No configs found (is WireGuard running?)"
