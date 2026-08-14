# 🏗️ Tormag (`tormag.kz`) — Оптово-розничный e-commerce гипермаркет строительных материалов

Добро пожаловать в репозиторий проекта **Tormag (`tormag.kz`)**!

---

## 📚 Документация проекта

Для удобного изучения контекста и работы с проектом подготовлены два главных руководства:

1. **[📋 Полный обзор проекта, дизайна и архитектуры (`PROJECT_OVERVIEW.md`)](PROJECT_OVERVIEW.md)**
   * Подробная визия и контекст бизнеса.
   * **Дизайн-система:** цветовые токены (**Tormag Royal Blue `#0062BE`**, **Slate `#0F172A`**, **Emerald `#10B981`**, **Bonus Gold `#F8D56B`**), типографика (`Inter`, `Outfit`), 3D CSS-сцены и верстка для слабовидящих.
   * **Функциональные модули:** Витрина магазина (27 страниц), Админ-панель (19 страниц), ИИ-ассистент "Tormag AI", Почтовый сервис и хранилище Cloudflare R2.
   * **Бизнес-логика:** Кэшбек и бонусы, динамическое ценообразование, промокоды, гарантии и возвраты.

2. **[🚀 Руководство по деплою и обслуживанию (`deploy/README.md`)](deploy/README.md)**
   * Полная схема микросервисов и Caddy Reverse Proxy.
   * **Быстрое обновление в 1 клик:** скрипт [`deploy/deploy.sh`](deploy/deploy.sh).
   * Команды диагностики логов, миграции БД Prisma, резервное копирование и переменные `.env.production`.

---

## ⚡ Быстрый запуск обновления на сервере

```bash
cd ~/stroy-hub
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

---

## 🛠️ Стек технологий

* **Frontend:** React 18, Vite, TailwindCSS (Tormag Palette), Lucide Icons.
* **Admin Panel:** React 18, Vite, Recharts, TailwindCSS.
* **Backend:** Node.js, Express, Prisma ORM, PostgreSQL 15, Redis 7, Winston Logger.
* **AI Service:** Node.js, Express, Google Gemini 2.5 Flash API.
* **Storage & CDN:** Cloudflare R2 (`media.tormag.kz`), Яндекс.Диск WebDAV.
* **Mail Server:** Stalwart Mail Server, Roundcube Webmail.
* **Host Web Server:** Caddy (HTTPS / Automatic Let's Encrypt SSL).

---

## 🗄️ Регламент работы с БД (Database Migrations)

Любое изменение схемы `backend/prisma/schema.prisma` требует обязательного создания файла SQL-миграции в `backend/prisma/migrations/<YYYYMMDD_description>/migration.sql` и вызова `npx prisma generate`. Подробнее в [PROJECT_OVERVIEW.md#7-регламент-работы-с-базой-данных-и-миграциями-database-policy](PROJECT_OVERVIEW.md#7-регламент-работы-с-базой-данных-и-миграциями-database-policy).

