# 🏗️ Tormag (`tormag.kz`) — Оптово-розничный e-commerce гипермаркет строительных материалов

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.2-purple.svg)](https://vitejs.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-5.14-5A67D8.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg)](https://www.docker.com/)

**Tormag (`tormag.kz`)** — это современная микросервисная e-commerce платформа строительных, отделочных и ремонтных материалов для рынка Казахстана. Проект включает высокопроизводительный интернет-магазин, панель управления администратора и поставщиков, автономный ИИ-сервис на базе **Google Gemini 2.5 Flash**, собственную почтовую систему Stalwart/Roundcube и инфраструктуру автоматического деплоя.

---

## 📌 Главные особенности и функционал

* **🛒 Клиентская витрина (28+ страниц):** Поиск и каталог товаров, умная фильтрация, детальная карточка товара, динамическая корзина, оформление с поддержкой физлиц и юрлиц (БИН), личный кабинет с историей заказов и кэшбеком.
* **👑 Панель управления и поставщиков (Admin):** Аналитика продаж, цифровой портрет покупателя, гибкое динамическое ценообразование, журнал изменения цен (`PriceLog`), управление акциями/промокодами, модерация отзывов и возвратов.
* **🤖 ИИ-Ассистент "Tormag AI" (`ai-service`):** Чат-консультант по строительным материалам, автоматическая генерация описаний и спецификаций товаров, OCR-парсинг и расчёт смет.
* **💎 Программа лояльности:** Система начисления и списания бонусных баллов (до 100% от суммы заказа), повышенный кэшбек по категориям.
* **📧 Почтовая инфраструктура:** Почтовый сервер **Stalwart** + веб-интерфейс **Roundcube Webmail**.
* **☁️ Облачное хранилище & CDN:** Интеграция с **Cloudflare R2** (`media.tormag.kz`) и автобэкапы PostgreSQL в **Яндекс.Диск** (WebDAV).

---

## 📐 Архитектура системы

```
                                    [ Пользователи / Клиенты ]
                                                │
                                                ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                            Caddy Web Server (Ubuntu Host Service)                        │
│ Ports: 80 (HTTP) / 443 (HTTPS) | Automatic Let's Encrypt SSL | Subdomain Routing         │
└────────┬──────────────────────┬──────────────────────┬──────────────────────┬────────────┘
         │                      │                      │                      │
         ▼                      ▼                      ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌──────────────────┐   ┌──────────────────┐
│ Gateway (Nginx) │    │ Gateway (Admin) │    │ Webmail          │   │ Stalwart Admin   │
│ tormag.kz       │    │ cabinet.tormag  │    │ mail.tormag.kz   │   │ mailpanel.tormag │
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
│ - Prisma ORM      │ - Gemini 2.5     │ - Database: tormag │ - Cache & Queues             │
└────────┬──────────┴────────┬─────────┴──────────┬─────────┴──────────────┬───────────────┘
         │                   │                    │                        │
         ▼                   ▼                    ▼                        ▼
┌─────────────────┐ ┌─────────────────┐ ┌──────────────────┐      ┌─────────────────┐
│ Cloudflare R2   │ │ Telegram Bot    │ │ DB Backup        │ ────►│ Yandex.Disk     │
│ media.tormag.kz │ │ Нотификации     │ │ (Postgres-Backup)│      │ WebDAV Backup   │
└─────────────────┘ └─────────────────┘ └──────────────────┘      └─────────────────┘
```

---

## 🛠️ Стек технологий

* **Frontend (Storefront & Admin):** React 18, Vite 5, TailwindCSS, Lucide Icons, GSAP, i18next, Recharts (в админке).
* **Backend API:** Node.js (ES Modules), Express.js, Prisma ORM, PostgreSQL 15, Redis 7, Winston Logger, AWS S3 SDK (для Cloudflare R2).
* **AI Service:** Node.js, Express.js, Google Gemini 2.5 Flash API.
* **Mail Server:** Stalwart Mail Server, Roundcube Webmail.
* **Инфраструктура & DevOps:** Docker, Docker Compose, Caddy Reverse Proxy, Nginx Gateway, GitHub Actions (CI/CD), Telegram Bot API.

---

## 📁 Структура проекта

```
stroy-hub/
├── admin/                  # Панель администратора и поставщиков (React + Vite)
├── ai-service/             # Микросервис ИИ-ассистента (Node.js + Google Gemini 2.5)
├── backend/                # Backend REST API (Node.js + Express + Prisma ORM)
│   ├── prisma/             # Схема БД (schema.prisma), миграции и сиды
│   └── src/                # Контроллеры, роуты, сервисы, middleware и утилиты
├── deploy/                 # Конфигурации деплоя (Caddyfile, Nginx gateway, скрипты setup_vps.sh и deploy.sh)
├── frontend/               # Клиентский витринный магазин (React + Vite)
├── mail-service/           # Конфигурация Stalwart Mail Server & Roundcube Webmail
├── docker-compose.yml      # Docker Compose для локальной разработки
├── docker-compose.prod.yml # Docker Compose для production-сервера
├── PROJECT_OVERVIEW.md     # Полное бизнес и техническое описание платформы
└── README.md               # Документация проекта
```

---

## ⚡ Быстрый запуск (Локальное окружение)

### 1. Предварительные требования
* Node.js v18+
* Docker и Docker Compose

### 2. Клонирование и установка зависимостей

```bash
git clone https://github.com/life-zcx/stroy-hub.git
cd stroy-hub

# Установка зависимостей для всех приложений
npm run install:all
```

### 3. Настройка переменных окружения

Создайте файл `.env` в корне проекта на основе шаблона `.env.example`:

```bash
cp .env.example .env
```

Заполните ключевые переменные (`DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY` и др.).

### 4. Запуск контейнеров через Docker Compose

```bash
# Запуск всей инфраструктуры (PostgreSQL, Redis, Backend, Frontend, Admin, AI Service)
npm run docker:up
```

После запуска сервисы доступны по адресам:
* **Frontend (Storefront):** http://localhost:3000
* **Admin Panel:** http://localhost:3001
* **Backend API:** http://localhost:5000
* **AI Microservice:** http://localhost:5005
* **PostgreSQL:** `localhost:5435`

---

## 🚀 Деплой на продакшн-сервер

Для разворачивания и обновления на продакшн-сервере подготовлены автоматизированные скрипты в папке `deploy/`:

1. **Первичная настройка VPS (Ubuntu):**
   ```bash
   sudo bash deploy/setup_vps.sh
   ```
2. **Обновление в 1 клик (Continuous Deployment):**
   ```bash
   chmod +x deploy/deploy.sh
   ./deploy/deploy.sh
   ```

Подробное руководство по деплою, настройке GitHub Actions и репозиторию секретов см. в **[deploy/README.md](deploy/README.md)**.

---

## 🗄️ Регламент работы с базой данных (Prisma Policy)

Каждое изменение схемы базы данных в `backend/prisma/schema.prisma` требует выполнения следующих шагов:
1. Создание SQL-миграции в `backend/prisma/migrations/<YYYYMMDD_description>/migration.sql`.
2. Выполнение `npx prisma generate` в папке `backend/` для обновления Prisma Client.
3. Применение миграций в продакшене через `deploy.sh` (`npx prisma migrate deploy`).

---

## 📚 Дополнительная документация

* **[📋 Полный обзор проекта и бизнес-логики (PROJECT_OVERVIEW.md)](PROJECT_OVERVIEW.md)**
* **[🚀 Руководство по инфраструктуре и деплою (deploy/README.md)](deploy/README.md)**
* **[📧 Документация почтового сервиса (mail-service/README.md)](mail-service/README.md)**


