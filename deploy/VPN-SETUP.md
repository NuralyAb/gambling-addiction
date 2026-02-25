# Полный гайд: NoBet VPN на сервере

VPN с блокировкой сайтов букмекеров на уровне DNS. **Не затрагивает** работающий NoBet — отдельные контейнеры, отдельная сеть.

---

## Что будет установлено

| Компонент | Назначение |
|-----------|------------|
| **WireGuard** | VPN-сервер (порт 51820/UDP) |
| **AdGuard Home** | DNS-фильтр с блокировкой букмекеров (панель: порт 5181) |

**Порты — без конфликтов с NoBet:**

| Сервис | Порт | Используется |
|--------|------|--------------|
| nginx | 80, 443 | NoBet ✓ |
| app | 3000 | NoBet ✓ |
| WireGuard | 51820/udp | VPN (новый) |
| AdGuard UI | 5181 | Панель AdGuard (новый) |

---

## Где настраивать блокировку сайтов

**Панель AdGuard:** `http://ваш-сервер:5181` (или `http://nobet.kz:5181`)

| Раздел | Назначение |
|--------|------------|
| **Filters** → **Filter lists** | Добавить блоклисты по URL (gambling, и т.д.) |
| **Filters** → **Custom filtering rules** | Свои правила — домены, которые нужно блокировать вручную |

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
# Запуск только VPN (NoBet не трогаем):
docker compose -f deploy/docker-compose.vpn.yml --env-file .env up -d
```

Ожидаемый вывод:
```
[+] Running 2/2
 ✔ Container nobet-adguard   Started
 ✔ Container nobet-wireguard  Started
```

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

## Шаг 6: Первый запуск AdGuard

1. Откройте в браузере: **http://ваш-сервер:5181**  
   (например: `http://nobet.kz:5181` или `http://123.45.67.89:5181`)

2. **Мастер настройки** (первый раз):
   - Web interface: `0.0.0.0:3000` (оставить по умолчанию)
   - Admin: придумайте логин и пароль
   - Нажмите **Next** → **Next** → **Open dashboard**

3. **DNS для VPN-клиентов**:
   - **Settings** → **DNS settings**
   - Включите **"Permit all origins"**
   - Сохраните

4. **Добавить блоклист букмекеров**:
   - **Filters** → **Filter lists** → **Add filter**
   - URL: `https://raw.githubusercontent.com/blocklistproject/Lists/master/adguard/gambling-ags.txt`
   - Name: `Gambling (Block List Project)`
   - **Save** → **Update** (обновить фильтры)

5. **Опционально** — второй блоклист:
   - URL: `https://raw.githubusercontent.com/hagezi/dns-blocklists/main/adguard/gambling.txt`
   - Name: `Gambling (HageZi)`

6. **Важно: Custom rules** — добавьте зеркала 1xbet и других букмекеров (часто блоклист не покрывает .ru, .kz):
   - **Filters** → **Custom filtering rules** → вставьте и сохраните:

```
||1xbet.ru^
||1xbet.kz^
||1xbet.ua^
||1xbet.org^
||1xstavka.ru^
||1xstavka.kz^
||fonbet.ru^
||melbet.ru^
||melbet.com^
||pin-up.ru^
||pinup.ru^
||mostbet.ru^
||parimatch.ru^
||winline.ru^
||leon.ru^
||bet365.com^
||betway.com^
```

   - Нажмите **Save** → **Update**

---

## Шаг 7: Получить конфиги WireGuard

```bash
# Показать QR-коды для peer 1, 2, 3:
docker exec -it nobet-wireguard /app/show-peer 1 2 3
```

Скопируйте QR-код или конфиг:

```bash
# Скопировать конфиг peer1 на сервер:
docker cp nobet-wireguard:/config/peer1/peer1.conf ./

# Скопировать с сервера на свой компьютер:
scp user@nobet.kz:~/gambling-addiction/peer1.conf ./
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
| Логи AdGuard | `docker logs -f nobet-adguard` |

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

### AdGuard не открывается / «refused to connect» / «Connection reset by peer»

1. **Откройте порт 5181 в firewall:**
   ```bash
   sudo ufw allow 5181/tcp
   sudo ufw reload
   ```

2. **Используйте http (не https):** `http://nobet.kz:5181`

3. **«Connection reset by peer»** — сбросьте конфиг AdGuard (WireGuard не затронут):
   ```bash
   cd ~/gambling-addiction/gambling-addiction
   docker compose -f deploy/docker-compose.vpn.yml stop adguard
   # Удалить volumes AdGuard (имена могут быть deploy_* или <папка>_*):
   for v in $(docker volume ls -q | grep adguard); do docker volume rm $v; done
   docker compose -f deploy/docker-compose.vpn.yml up -d adguard
   ```
   Подождите 15 сек, откройте `http://ваш-сервер:5181` — появится мастер настройки.
   Подождите 10–15 секунд, затем откройте `http://ваш-сервер:5181` — должен появиться мастер настройки.

4. **Проверьте контейнер:** `docker ps | grep adguard` — должен быть Up

5. **Проверка изнутри контейнера:**
   ```bash
   docker exec nobet-adguard wget -qO- http://127.0.0.1:3000 2>/dev/null | head -5
   ```
   Если пусто или ошибка — конфиг повреждён, нужен сброс (п. 3).

6. **Облачный провайдер:** откройте порт 5181 в Security Group панели провайдера.

### DNS не блокирует
- В AdGuard: **Settings** → **DNS settings** → **Permit all origins** включён
- В AdGuard: **Filters** → проверьте, что блоклист добавлен и обновлён

### 1xbet (или другой букмекер) всё ещё открывается

1. **Добавьте Custom rules** — блоклист часто не включает .ru, .kz:
   - AdGuard → **Filters** → **Custom filtering rules**
   - Добавьте: `||1xbet.ru^` и `||1xbet.kz^` (и другие домены)
   - **Save** → **Update**

2. **Проверьте DNS на телефоне:**
   - Подключитесь к VPN
   - В WireGuard нажмите на туннель → **DNS** — должно быть `10.2.0.100` (или IP AdGuard)
   - Если пусто — переподключитесь или пересоздайте конфиг с `NOBET_VPN_SERVER_URL` в .env

3. **Очистите кэш браузера** — закройте вкладку 1xbet, очистите данные браузера, откройте заново

4. **Проверьте, что трафик идёт через VPN:**
   - Откройте https://dnsleaktest.com с телефона при включённом VPN
   - Должен показать ваш VPN/DNS, а не провайдера

5. **Перезапустите AdGuard** (если правила не применились):
   ```bash
   docker restart nobet-adguard
   ```

6. **Браузер использует свой DNS (DoH)** — Chrome/Firefox могут обходить системный DNS:
   - **Chrome (Android):** Settings → Privacy and security → Use secure DNS → отключить или выбрать «Use current service provider»
   - **Safari (iOS):** обычно использует системный DNS — проверьте, что VPN включён до открытия браузера

### NoBet перестал работать после запуска VPN
- VPN не должен влиять на NoBet. Проверьте: `docker ps`
- Контейнеры nobet-app и nobet-nginx должны быть в статусе Up

---

## Остановка VPN

```bash
docker compose -f deploy/docker-compose.vpn.yml down
```

**NoBet продолжит работать** — VPN в отдельном compose-файле.
