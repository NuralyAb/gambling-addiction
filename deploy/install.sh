#!/bin/bash
# ============================================
# Установка Docker и Docker Compose на Ubuntu 20.04
# Запуск: sudo bash deploy/install.sh
# ============================================

set -e

echo "=== Обновление пакетов ==="
apt-get update
apt-get upgrade -y

echo "=== Установка зависимостей ==="
apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

echo "=== Добавление GPG ключа Docker ==="
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo "=== Добавление репозитория Docker ==="
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

echo "=== Установка Docker ==="
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "=== Запуск Docker ==="
systemctl enable docker
systemctl start docker

echo "=== Добавление текущего пользователя в группу docker ==="
usermod -aG docker $SUDO_USER 2>/dev/null || true

echo ""
echo "=== Готово! ==="
echo "Docker: $(docker --version)"
echo "Docker Compose: $(docker compose version)"
echo ""
echo "Перелогиньтесь или выполните: newgrp docker"
