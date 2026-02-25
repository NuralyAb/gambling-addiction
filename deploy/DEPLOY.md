# Деплой SafeBet AI на Ubuntu 20 (nobet.kz)

Полная инструкция по развёртыванию на VPS/сервере с Ubuntu 20.04.

---

## 1. Подготовка сервера

```bash
# Подключитесь к серверу
ssh user@your-server-ip

# Обновите систему
sudo apt update && sudo apt upgrade -y
```

---

## 2. Установка Docker

```bash
# Из корня проекта (или скопируйте deploy/ на сервер)
sudo bash deploy/install.sh

# Перелогиньтесь для применения группы docker
exit
ssh user@your-server-ip
```

---

## 3. Клонирование проекта

```bash
cd ~
git clone https://github.com/NuralyAb/gambling-addiction.git
cd gambling-addiction
```

Или загрузите проект через `scp` / `rsync`:

```bash
rsync -avz --exclude node_modules --exclude .next ./ user@server:~/gambling-addiction/
```

---

## 4. Настройка переменных окружения

```bash
cp .env.example .env
nano .env
```

Заполните обязательные переменные:

| Переменная | Описание |
|------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL вашего Supabase проекта |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key из Supabase |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://nobet.kz` |
| `OPENAI_API_KEY` | Ключ OpenAI для AI-чата |

Опционально: `RESEND_API_KEY`, `TELEGRAM_BOT_TOKEN`, `ADMIN_EMAIL`, `CRON_SECRET`.

---

## 5. Запуск с HTTPS (nobet.kz)

### 5.1 Первый раз: получение SSL

Домен nobet.kz и www.nobet.kz должны указывать на IP сервера. Проверьте: `dig nobet.kz +short`

```bash
cd ~/gambling-addiction

# Вариант A: если nginx ещё не запущен — сразу получаем SSL
sudo mkdir -p /var/www/certbot
sudo bash deploy/ssl-setup.sh nobet.kz admin@nobet.kz

# Вариант B: если уже запущен HTTP — остановите nginx, получите SSL
docker compose -f deploy/docker-compose.prod-http.yml stop nginx
sudo bash deploy/ssl-setup.sh nobet.kz admin@nobet.kz
```

### 5.2 Запуск с HTTPS

```bash
docker compose -f deploy/docker-compose.prod.yml --env-file .env up -d --build

# Проверка
curl -I https://nobet.kz
```

Приложение доступно на https://nobet.kz и https://www.nobet.kz

### 5.3 Только HTTP (без SSL, для теста)

```bash
docker compose -f deploy/docker-compose.prod-http.yml --env-file .env up -d --build
```

---

## 6. Полезные команды

```bash
# Логи приложения
docker logs -f safebet-app

# Логи nginx
docker logs -f safebet-nginx

# Остановка
docker compose -f deploy/docker-compose.prod.yml down

# Обновление после git pull
docker compose -f deploy/docker-compose.prod.yml --env-file .env up -d --build
```

---

## 7. Автозапуск при перезагрузке

Docker Compose с `restart: unless-stopped` уже настроен — контейнеры поднимутся после перезагрузки сервера.

---

## 8. Firewall (ufw)

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## 9. Автообновление SSL (cron)

```bash
sudo crontab -e
# Добавьте строку (обновление каждые 12 часов):
0 */12 * * * certbot renew --quiet --deploy-hook "docker restart safebet-nginx"
```

---

## 10. NEXTAUTH_URL

В `.env` должно быть:

```
NEXTAUTH_URL=https://nobet.kz
```

При изменении перезапустите:

```bash
docker compose -f deploy/docker-compose.prod.yml --env-file .env up -d --force-recreate app
```
