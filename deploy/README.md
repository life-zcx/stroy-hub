# 🚀 Полная техническая документация и руководство по деплою Tormag (`tormag.kz`)

Данный документ содержит полное архитектурное описание всех сервисов, поддоменов, резервного копирования, интеграций и стандартных процедур обновления инфраструктуры **Tormag (`tormag.kz`)**.

---

## 📐 1. Полная архитектурная схема системы

Проект построен по микросервисной контейнеризованной архитектуре под управлением **Docker Compose** и хостового прокси-сервера **Caddy**:

```
                                    [ Пользователи / Клиенты ]
                                                │
                                                ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                             Caddy Web Server (Ubuntu Host Service)                       │
│ - Порты: 80 (HTTP) / 443 (HTTPS)                                                         │
│ - Автоматический выпуск/продление SSL (Let's Encrypt / ZeroSSL)                          │
│ - Редиректы со сторонних доменов (adkulan.ru, kaaspi.shop и др.) на https://tormag.kz    │
└────────┬──────────────────────┬──────────────────────┬──────────────────────┬────────────┘
         │                      │                      │                      │
         ▼                      ▼                      ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌──────────────────┐   ┌──────────────────┐
│ Gateway         │    │ Gateway (Admin) │    │ Webmail          │   │ Stalwart Admin   │
│ tormag.kz       │    │ cabinet.tormag  │    │ mail.tormag.kz   │   │ panel.mail.tormag│
│ (127.0.0.1:8080)│    │ (127.0.0.1:8080)│    │ (127.0.0.1:8890) │   │ (127.0.0.1:8880) │
└────────┬────────┘    └────────┬────────┘    └──────────────────┘   └──────────────────┘
         │                      │
         └──────────┬───────────┘
                    ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                              Внутренний Docker-стек (tormag.kz)                          │
├───────────────────┬──────────────────┬────────────────────┬──────────────────────────────┤
│ Backend (Express) │ AI Service       │ PostgreSQL 15      │ Redis 7                      │
│ - Port: 5000      │ - Port: 5005     │ - Port: 5432       │ - Port: 6379                 │
│ - Prisma ORM      │ - Gemini 2.5     │ - Volume: postgres │ - Cache & Queues             │
└────────┬──────────┴────────┬─────────┴──────────┬─────────┴──────────────┬───────────────┘
         │                   │                    │                        │
         ▼                   ▼                    ▼                        ▼
┌─────────────────┐ ┌─────────────────┐ ┌──────────────────┐      ┌─────────────────┐
│ Cloudflare R2   │ │ Telegram Bot    │ │ DB Backup        │      │ Yandex.Disk     │
│ media.tormag.kz │ │ Уведомления     │ │ (Postgres-Backup)│ ────►│ WebDAV Backup   │
│ (tormag-media)  │ │ Алерты в чат    │ │ (Daily backups)  │      │ Авто-загрузка   │
└─────────────────┘ └─────────────────┘ └──────────────────┘      └─────────────────┘
```

---

## 🌐 2. Полный реестр всех 5 поддоменов и интеграций

| Домен / Поддомен | Протокол | Назначение (Upstream / Исполнитель) | Описание |
| :--- | :--- | :--- | :--- |
| **`tormag.kz`** | HTTPS | `http://127.0.0.1:8080` (Gateway Nginx) | Витринный интернет-магазин строительных материалов |
| **`www.tormag.kz`** | HTTPS | `http://127.0.0.1:8080` (Gateway Nginx) | Зеркало главного сайта с редиректом / поддержкой |
| **`cabinet.tormag.kz`** | HTTPS | `http://127.0.0.1:8080` (Gateway Nginx) | Панель управления администратора и поставщиков |
| **`mail.tormag.kz`** | HTTPS | `http://127.0.0.1:8890` (Roundcube Container) | Веб-интерфейс электронной почты |
| **`panel.mail.tormag.kz`** | HTTPS | `https://127.0.0.1:8880` *(Stalwart TLS)* | Административная панель управления почтовым сервером |
| **`media.tormag.kz`** | HTTPS | Cloudflare R2 (`tormag-media` bucket) | Публичный CDN для картинок товаров, баннеров и логотипов |

### 🔁 Редиректы сторонних доменов в Caddy:
`adkulan.shop`, `www.adkulan.shop`, `hr-payroll.quest`, `www.hr-payroll.quest`, `kaaspi.shop`, `www.kaaspi.shop`, `pizda.asia`, `www.pizda.asia`, `cs2tournaments.asia`, `www.cs2tournaments.asia`, `adkulan.ru`, `www.adkulan.ru` ➡️ 301 Permanent Redirect на `https://tormag.kz`.

---

## 🛠️ 3. Сервисы и их назначение

### 3.1 GitHub Actions (CI/CD)
* **Файл воркфлоу:** `.github/workflows/build-push.yml`
* **Триггер:** Коммит или пуш в ветку `main`.
* **Действие:** Автоматически собирает и пушит 3 Docker-образа в **GitHub Container Registry (GHCR)**:
  1. `ghcr.io/life-zcx/stroy-hub/backend:latest`
  2. `ghcr.io/life-zcx/stroy-hub/ai-service:latest`
  3. `ghcr.io/life-zcx/stroy-hub/gateway:latest`

### 3.2 Gateway (`deploy/nginx/Dockerfile`)
* **Контейнер:** `stroy-hub-gateway-1`
* **Порт хоста:** `8080`
* **Назначение:** Собирает клиентский React-фронтенд (`/usr/share/nginx/html`) и панель администратора (`/usr/share/nginx/html_admin`), проксирует запросы к `/api/` на `backend:5000` и `/api/ai` на `ai-service:5005`.

### 3.3 Backend API (`backend/`)
* **Контейнер:** `stroy-hub-backend-1`
* **Стек:** Node.js (ES Modules), Express, Prisma ORM, PostgreSQL, Redis, Winston Logger.
* **Функции:** Каталог, заказы, корзина, авторизация (JWT), бонусы, отзывы, расчет цен, загрузка файлов в Cloudflare R2, Telegram-уведомления.

### 3.4 AI Service (`ai-service/`)
* **Контейнер:** `stroy-hub-ai-service-1` (порт `5005`)
* **Интеграция:** Google Gemini AI Studio (`gemini-2.5-flash`).
* **Функции:** Умный ИИ-помощник "Tormag AI", парсинг смет, подбор строительных материалов.

### 3.5 База данных PostgreSQL 15 & Бэкапы
* **База данных:** `stroy-hub-db-1` (PostgreSQL 15 Alpine, порт `127.0.0.1:5432`).
* **Контейнер авто-бэкапов:** `stroy-hub-db-backup-1` (`prodrigestivill/postgres-backup-local:15`).
  * Создает дампы `.sql.gz` **каждый день** (`SCHEDULE=@daily`).
  * Хранит 14 дневных, 8 недельных и 12 месячных бэкапов.
* **Интеграция с Яндекс.Диском:** Утилита `backend/src/utils/yandexBackup.js` автоматически загружает свежий дамп на Яндекс.Диск через WebDAV и отправляет отчет в Telegram-чат админа.

### 3.6 Почтовая система (Stalwart + Roundcube)
* **Stalwart Mail Server:** Контейнер `tormag_mail_server` (`stalwartlabs/stalwart:latest`).
  * SMTP (25), SMTPS (465), Submission (587), IMAPS (993).
  * Web Admin UI: `127.0.0.1:8880`.
* **Roundcube Webmail:** Контейнер `tormag_webmail` (`roundcube/roundcubemail:latest`).
  * Веб-клиент почты: `127.0.0.1:8890`.

---

## 🛠️ 4. Первичная настройка чистого VPS (`setup_vps.sh`)

Для автоматической подготовки нового сервера Ubuntu 22.04 / 24.04 запустите:

```bash
git clone https://github.com/life-zcx/stroy-hub.git ~/stroy-hub
cd ~/stroy-hub
sudo bash deploy/setup_vps.sh
```

**Что выполняет скрипт `setup_vps.sh`:**
1. Устанавливает пакеты `curl`, `git`, `ufw`, `htop`, `openssl`, `jq`.
2. Устанавливает Docker & Docker Compose с настройкой ротации логов (макс. 10МБ на файл).
3. Устанавливает и запускает веб-сервер **Caddy**.
4. Настраивает защитный экран **UFW** (открывает порты `22`, `80`, `443`, `25`, `465`, `587`, `993`).
5. Генерирует криптографически стойкие ключи `JWT_SECRET` и `POSTGRES_PASSWORD` в `.env.production`.
6. Генерирует SSH-ключ `github_actions_tormag` для авто-деплоя через GitHub Actions.

---

## 🚀 5. Бесшовный авто-деплой (Continuous Deployment)

Каждый `git push origin main` автоматически вызывают пайплайн `.github/workflows/build-push.yml`:

1. **Сборка Docker-образов:** Сборка и отправка в GitHub Container Registry (GHCR).
2. **SSH-деплой на VPS:** Подключение к серверу и запуск `deploy/deploy.sh`.
3. **Telegram-уведомление:**
   * 🚀 При успешном деплое: отправляет короткий отчет в Telegram (хеш коммита, автор, сообщение).
   * 🚨 При сбое: отправляет аварйный алерт в Telegram с логами ошибки.

### 🔑 Настройка GitHub Secrets (для работы Auto-CD):

Перейдите в **Settings -> Secrets and variables -> Actions** в вашем GitHub репозитории и добавьте:

| Имя Secret | Значение |
| :--- | :--- |
| **`SSH_HOST`** | IP-адрес или домен вашего VPS сервера |
| **`SSH_USERNAME`** | `root` (или ваше имя пользователя) |
| **`SSH_KEY`** | Содержимое приватного ключа (сгенерировано в `setup_vps.sh`) |
| **`SSH_PORT`** | `22` |
| **`TELEGRAM_BOT_TOKEN`** | Токен вашего Telegram-бота |
| **`TELEGRAM_ADMIN_CHAT_ID`** | ID чата администратора |

---

### 📝 Что происходит при выполнении `deploy.sh`:

1. **`git pull origin main`** — скачивает свежий код из репозитория.
2. **Синхронизация Caddyfile:** обновляет маршруты Caddy без простоя.
3. **`docker compose pull`** — скачивает свежие Docker-образы из GHCR.
4. **`docker compose run --rm backend npx prisma migrate deploy`** — безопасно применяет миграции PostgreSQL.
5. **`docker compose up -d`** — перезапускает обновившиеся контейнеры.
6. **`docker image prune -f`** — очищает устаревшие Docker-образы.
7. **Telegram Alert:** отправляет статус релиза с хоста.


---

## 🔍 5. Полезные команды при обслуживании

### 📊 Просмотр логов
```bash
# Логи Caddy
sudo journalctl -u caddy -n 50 --no-pager -f

# Логи Backend API
docker compose -f docker-compose.prod.yml logs -f --tail 100 backend

# Логи Gateway (Nginx шлюза)
docker compose -f docker-compose.prod.yml logs -f --tail 100 gateway

# Логи почтового сервера Stalwart
docker logs -f --tail 100 tormag_mail_server
```

### 🔑 Полезные команды
```bash
# Смена пароля администратора в БД
docker compose --env-file .env.production -f docker-compose.prod.yml run --rm backend npm run change-password

# Начальное заполнение БД (Prisma seed)
docker compose --env-file .env.production -f docker-compose.prod.yml run --rm backend npm run prisma:seed
```

---

## 🔐 6. Переменные окружения (`.env.production`)

Обеспечьте наличие всех обязательных ключей в `.env.production`:

```env
# База данных
POSTGRES_USER=tormag_user
POSTGRES_PASSWORD=надежный_пароль_бд
POSTGRES_DB=tormag

# Безопасность и Сеть
JWT_SECRET=длинный_секретный_ключ_jwt
CORS_ORIGINS=https://tormag.kz,https://www.tormag.kz,https://cabinet.tormag.kz
GATEWAY_PORT=8080
MAX_UPLOAD_SIZE_MB=20

# Почта (SMTP)
SMTP_HOST=mail-server
SMTP_PORT=587
SMTP_USER=info@tormag.kz
SMTP_PASS=пароль_ящика

# Облачное хранилище Cloudflare R2
R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=ваш_access_key
R2_SECRET_ACCESS_KEY=ваш_secret_key
R2_BUCKET_NAME=tormag-media
R2_PUBLIC_URL=https://media.tormag.kz

# Telegram Уведомления и Бот
TELEGRAM_BOT_TOKEN=токен_вашего_бота
TELEGRAM_CHAT_ID=id_чата_заказов
TELEGRAM_ADMIN_CHAT_ID=id_чата_админа

# Яндекс.Диск (Автобэкапы)
YANDEX_DISK_USER=ваш_логин_yandex
YANDEX_DISK_PASS=пароль_приложения_yandex

# ИИ Ассистент (Google Gemini)
GEMINI_API_KEY=ваш_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```
