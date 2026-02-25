# Полный гайд: NoBet VPN на сервере

VPN с блокировкой сайтов букмекеров на уровне DNS. **Не затрагивает** работающий NoBet — отдельные контейнеры, отдельная сеть.

---

## Что это и как работает

1. **WireGuard** — VPN-сервер. Подключаетесь с телефона/ноутбука → весь трафик идёт через сервер.
2. **Pi-hole** — DNS-фильтр. Перехватывает DNS-запросы (типа «какой IP у 1xbet.ru?») и для доменов из блоклиста возвращает «сайт не найден».
3. **Схема:** Телефон → VPN → WireGuard → Pi-hole (DNS) → если домен в блоклисте → блокировка; иначе → обычный DNS → интернет.

**Пароль Pi-hole:** в `docker-compose.vpn.yml` задан `WEBPASSWORD: "nobet2024"`. Можно сменить в compose или командой `docker exec -it nobet-pihole pihole setpassword`.

---

## Что будет установлено

| Компонент | Назначение |
|-----------|------------|
| **WireGuard** | VPN-сервер (порт 51820/UDP) |
| **Pi-hole** | DNS-фильтр с блокировкой букмекеров (панель: порт 5181) |

**Порты — без конфликтов с NoBet:**

| Сервис | Порт | Используется |
|--------|------|--------------|
| nginx | 80, 443 | NoBet ✓ |
| app | 3000 | NoBet ✓ |
| WireGuard | 51820/udp | VPN (новый) |
| AdGuard UI | 5181 | Панель AdGuard (новый) |

---

## Где настраивать блокировку сайтов

**Панель Pi-hole:**
- **https://nobet.kz/adguard/** (через nginx)
- или `http://ваш-сервер:5181` (если порт открыт)

| Раздел | Назначение |
|--------|------------|
| **Group management** → **Adlists** | Добавить блоклисты по URL |
| **Group management** → **Domain list** | Свои домены для блокировки |

---

## Шаг 0: Подключение к серверу

```bash
ssh user@ваш-сервер
# или
ssh user@nobet.kz
```

---

## Шаг 1: Проверка, что NoBet работает

```bash
# Проверьте, что контейнеры NoBet запущены:
docker ps | grep nobet

# Должны быть: nobet-app, nobet-nginx
# VPN-контейнеров (nobet-wireguard, nobet-adguard) пока нет
```

---

## Шаг 2: Переход в каталог проекта

```bash
cd ~/gambling-addiction
# или путь, где у вас лежит проект
```

---

## Шаг 3: Добавить переменную в .env

```bash
# Откройте .env
nano .env

# Добавьте строку (в конец файла):
NOBET_VPN_SERVER_URL=nobet.kz

# Если домен не настроен — укажите IP сервера:
# NOBET_VPN_SERVER_URL=123.45.67.89

# Сохраните: Ctrl+O, Enter, Ctrl+X
```

---

## Шаг 4: Запуск VPN

```bash
# Вариант A: NoBet + VPN вместе (рекомендуется — AdGuard будет на https://nobet.kz/adguard/)
docker compose -f deploy/docker-compose.prod.yml -f deploy/docker-compose.vpn.yml --env-file .env up -d

# Вариант B: Только VPN (если NoBet уже запущен отдельно)
docker compose -f deploy/docker-compose.vpn.yml --env-file .env up -d
```

Для доступа через **https://nobet.kz/adguard/** нужен вариант A (оба compose вместе).

---

## Шаг 5: Открыть порты в firewall

```bash
sudo ufw allow 51820/udp   # WireGuard VPN
sudo ufw allow 5181/tcp    # AdGuard панель (важно!)
sudo ufw reload
sudo ufw status
```

Должны быть строки: `51820/udp ALLOW` и `5181/tcp ALLOW`.

---

## Шаг 6: Первый запуск Pi-hole

1. Откройте в браузере: **https://nobet.kz/adguard/**  
   (или `http://ваш-сервер:5181`)

2. **Пароль:** по умолчанию `nobet2024` (задано в compose). Сменить: `docker exec -it nobet-pihole pihole setpassword`

3. **Добавить блоклист букмекеров:**
   - **Group management** → **Adlists** → **Add a new adlist**
   - URL: `https://raw.githubusercontent.com/blocklistproject/Lists/master/gambling.txt`
   - Comment: `Gambling`
   - **Save** → **Update Gravity** (обновить списки)

4. **Дополнительные блоклисты** (опционально):
   - `https://raw.githubusercontent.com/dcotecnologia/pihole-lists/master/lists/gambling.txt`

5. **Свои домены** (.ru, .kz часто не в блоклистах):
   - **Group management** → **Domain list** → **Add a new domain**
   - Добавьте по одному: `1xbet.ru`, `1xbet.kz`, `1xstavka.ru`, `fonbet.ru`, `melbet.ru`, `pin-up.ru`, `mostbet.ru`, `parimatch.ru`, `winline.ru`, `leon.ru`

---

## Шаг 7: Получить конфиги WireGuard и включить скачивание с сайта

```bash
# Скопировать конфиги в vpn-config/ (для скачивания с /vpn):
bash deploy/copy-vpn-config.sh

# Права доступа (если 500 при скачивании):
chmod -R 755 vpn-config
```

Скрипт копирует peer1.conf, peer2.conf, peer3.conf из контейнера WireGuard.

Показать QR-коды вручную:

```bash
docker exec -it nobet-wireguard /app/show-peer 1 2 3
```

---

## Шаг 8: Подключение на устройствах

1. Установите **WireGuard**:
   - [iOS](https://apps.apple.com/app/wireguard/id1441195209)
   - [Android](https://play.google.com/store/apps/details?id=com.wireguard.android)
   - [Windows](https://www.wireguard.com/install/)
   - [macOS](https://apps.apple.com/app/wireguard/id1451685025)

2. **На телефоне:** Add tunnel → Scan QR code → отсканируйте QR из шага 7

3. **На компьютере:** Import tunnel(s) from file → выберите `peer1.conf`

4. Включите туннель (переключатель)

---

## Шаг 9: Проверка

```bash
# Логи WireGuard
docker logs nobet-wireguard

# Логи AdGuard
docker logs nobet-adguard

# Тест DNS (с устройства, подключённого к VPN):
nslookup 1xbet.com
# Ожидаемо: NXDOMAIN или 0.0.0.0
```

---

## Сводка команд

| Действие | Команда |
|----------|---------|
| Запуск VPN | `docker compose -f deploy/docker-compose.vpn.yml --env-file .env up -d` |
| Остановка VPN | `docker compose -f deploy/docker-compose.vpn.yml down` |
| Показать QR-коды | `docker exec -it nobet-wireguard /app/show-peer 1 2 3` |
| Логи WireGuard | `docker logs -f nobet-wireguard` |
| Логи Pi-hole | `docker logs -f nobet-pihole` |

---

## Добавление новых клиентов

```bash
# 1. Остановить VPN
docker compose -f deploy/docker-compose.vpn.yml down

# 2. Отредактировать deploy/docker-compose.vpn.yml:
#    PEERS=5   (вместо 3)
# Или имена: PEERS=phone,laptop,tablet,work,home

# 3. Запустить снова
docker compose -f deploy/docker-compose.vpn.yml --env-file .env up -d

# 4. Новые конфиги в peer4, peer5 и т.д.
docker exec -it nobet-wireguard /app/show-peer 4 5
```

---

## Troubleshooting

### VPN не подключается
- Проверьте firewall: `sudo ufw status`
- Проверьте, что порт 51820 открыт: `nc -zv ваш-сервер 51820` (если nc установлен)

### Pi-hole не открывается

1. **Откройте порт 5181 в firewall:** `sudo ufw allow 5181/tcp && sudo ufw reload`
2. **Проверьте контейнер:** `docker ps | grep pihole` — должен быть Up
3. **Логи:** `docker logs nobet-pihole --tail 30`
4. **Облачный провайдер:** откройте порт 5181 в Security Group.

### DNS не блокирует
- В Pi-hole: **Group management** → **Adlists** — проверьте, что блоклист добавлен
- Нажмите **Update Gravity**

### 1xbet (или другой букмекер) всё ещё открывается

1. **Добавьте домены вручную** — блоклист часто не включает .ru, .kz:
   - Pi-hole → **Group management** → **Domain list** → Add: `1xbet.ru`, `1xbet.kz`

2. **Проверьте DNS на телефоне:**
   - Подключитесь к VPN
   - В WireGuard нажмите на туннель → **DNS** — должно быть `10.2.0.100` (IP Pi-hole)
   - Если пусто — переподключитесь или пересоздайте конфиг с `NOBET_VPN_SERVER_URL` в .env

3. **Очистите кэш браузера** — закройте вкладку 1xbet, очистите данные браузера, откройте заново

4. **Проверьте, что трафик идёт через VPN:**
   - Откройте https://dnsleaktest.com с телефона при включённом VPN
   - Должен показать ваш VPN/DNS, а не провайдера

5. **Перезапустите Pi-hole** (если правила не применились):
   ```bash
   docker restart nobet-pihole
   ```

6. **Браузер использует свой DNS (DoH)** — Chrome/Firefox могут обходить системный DNS:
   - **Chrome (Android):** Settings → Privacy and security → Use secure DNS → отключить или выбрать «Use current service provider»
   - **Safari (iOS):** обычно использует системный DNS — проверьте, что VPN включён до открытия браузера

### 500 при скачивании конфига с /vpn

1. **Запустите WireGuard** и скопируйте конфиги:
   ```bash
   docker compose -f deploy/docker-compose.vpn.yml --env-file .env up -d
   bash deploy/copy-vpn-config.sh
   chmod -R 755 vpn-config
   ```

2. **Перезапустите приложение**, чтобы подхватить volume:
   ```bash
   docker compose -f deploy/docker-compose.prod.yml --env-file .env up -d --force-recreate app
   ```

3. **Проверьте**, что файлы есть: `ls -la vpn-config/`

### NoBet перестал работать после запуска VPN
- VPN не должен влиять на NoBet. Проверьте: `docker ps`
- Контейнеры nobet-app и nobet-nginx должны быть в статусе Up

---

## Остановка VPN

```bash
docker compose -f deploy/docker-compose.vpn.yml down
```

**NoBet продолжит работать** — VPN в отдельном compose-файле.
