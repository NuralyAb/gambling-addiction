# NoBet VPN — Setup

VPN с блокировкой сайтов букмекеров на уровне DNS. Работает на всех устройствах (iOS, Android, Windows, macOS, Linux) через WireGuard.

## Архитектура

```
Устройство → WireGuard (51820/UDP) → VPN сервер → AdGuard DNS → блокировка
                                         ↓
                              Разрешённый трафик → интернет
```

- **WireGuard** — VPN-сервер
- **AdGuard Home** — DNS-фильтр с блоклистом букмекеров

## 1. Запуск VPN

```bash
cd ~/gambling-addiction

# Добавьте в .env:
echo "NOBET_VPN_SERVER_URL=nobet.kz" >> .env
# или: NOBET_VPN_SERVER_URL=ваш_ip_сервера

# Запуск вместе с NoBet (основной проект + VPN):
docker compose -f deploy/docker-compose.prod.yml -f deploy/docker-compose.vpn.yml --env-file .env up -d

# Или только VPN (если NoBet уже запущен):
docker compose -f deploy/docker-compose.vpn.yml --env-file .env up -d
```

## 2. Firewall

Откройте порт для WireGuard:

```bash
sudo ufw allow 51820/udp
sudo ufw reload
```

## 3. Первый запуск AdGuard

1. Откройте `http://ваш-сервер:5181` (или `http://nobet.kz:5181`).
2. Пройдите мастер настройки:
   - Web UI: порт 3000 (внутренний, уже настроен)
   - Admin: логин и пароль
3. **Settings** → **DNS settings** → включите **"Permit all origins"** (чтобы VPN-клиенты могли использовать DNS).
4. **Filters** → **Filter lists** → **Add filter**:
   - URL: `https://raw.githubusercontent.com/blocklistproject/Lists/master/adguard/gambling-ags.txt`
   - Name: `Gambling (Block List Project)`
5. Сохраните и обновите фильтры.

Опционально — дополнительные блоклисты:
- `https://raw.githubusercontent.com/hagezi/dns-blocklists/main/adguard/gambling.txt` (HageZi)

## 4. Получение конфигов WireGuard

```bash
# Показать QR-коды для peer 1, 2, 3:
docker exec -it nobet-wireguard /app/show-peer 1 2 3

# Конфиги лежат в volume, можно скопировать:
docker cp nobet-wireguard:/config/peer1/peer1.conf ./
```

## 5. Подключение на устройствах

1. Установите **WireGuard** (официальное приложение):
   - [iOS](https://apps.apple.com/app/wireguard/id1441195209)
   - [Android](https://play.google.com/store/apps/details?id=com.wireguard.android)
   - [Windows](https://www.wireguard.com/install/)
   - [macOS](https://apps.apple.com/app/wireguard/id1451685025)
2. Отсканируйте QR-код или импортируйте `.conf`.
3. Включите туннель.

Весь трафик пойдёт через VPN, DNS — через AdGuard с блокировкой букмекеров.

## 6. Добавление новых клиентов

```bash
# Увеличьте PEERS в docker-compose.vpn.yml (например, PEERS=5)
# Удалите конфиг и пересоздайте контейнер:
docker compose -f deploy/docker-compose.vpn.yml down
# Отредактируйте PEERS в deploy/docker-compose.vpn.yml
docker compose -f deploy/docker-compose.vpn.yml --env-file .env up -d

# Или используйте имена: PEERS=phone,laptop,tablet
```

## 7. Проверка

```bash
# Логи WireGuard
docker logs nobet-wireguard

# Логи AdGuard
docker logs nobet-adguard

# Тест DNS (с устройства, подключённого к VPN):
nslookup 1xbet.com   # должен вернуть NXDOMAIN или блокирующий IP
```

## Порты (без конфликтов с NoBet)

| Сервис      | Порт      | Назначение          |
|-------------|-----------|---------------------|
| nginx       | 80, 443   | NoBet (без изменений)|
| app         | 3000      | NoBet (внутренний)  |
| WireGuard   | 51820/udp | VPN                 |
| AdGuard UI  | 5181      | Панель AdGuard      |

## Остановка VPN

```bash
docker compose -f deploy/docker-compose.vpn.yml down
```

NoBet продолжит работать — VPN в отдельном compose.
