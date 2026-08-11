#!/bin/bash
set -e

# Load Telegram environment variables if .env.production exists
if [ -f ".env.production" ]; then
    export $(grep -v '^#' .env.production | xargs)
fi

BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
CHAT_ID="${TELEGRAM_ADMIN_CHAT_ID:-$TELEGRAM_CHAT_ID}"

send_telegram() {
    local message="$1"
    if [ -n "$BOT_TOKEN" ] && [ -n "$CHAT_ID" ]; then
        curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
            -d "chat_id=${CHAT_ID}" \
            -d "parse_mode=Markdown" \
            -d "text=${message}" > /dev/null || true
    fi
}

error_handler() {
    local line_number=$1
    echo "❌ Error occurred at line ${line_number}!"
    local commit_hash=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    send_telegram "🚨 *[Deploy Failed] Ошибка при обновлении Tormag!*%0A%0A📍 *Строка:* ${line_number}%0A📌 *Коммит:* \`${commit_hash}\`%0A⚠️ Проверьте логи на сервере."
    exit 1
}

trap 'error_handler $LINENO' ERR

echo "========================================================="
echo " 🚀 Tormag Production Deployment & Update Script"
echo "========================================================="

# 1. Pull latest code from main branch
echo "[1/5] Pulling latest code from git..."
git pull origin main

COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
COMMIT_MSG=$(git log -1 --pretty=%B 2>/dev/null | head -n 1 || echo "No commit message")

# 2. Update host Caddy configuration
if [ -f "deploy/Caddyfile" ]; then
    echo "[2/5] Updating Caddy configuration and reloading..."
    sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
    sudo systemctl reload caddy || echo "⚠️ Warning: Could not reload Caddy. Ensure Caddy is running."
fi

# 3. Pull newest Docker images built by GitHub Actions
echo "[3/5] Pulling latest Docker images..."
docker compose --env-file .env.production -f docker-compose.prod.yml pull

# 4. Run Prisma database migrations
echo "[4/5] Running Prisma database migrations..."
docker compose --env-file .env.production -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy

# 5. Restart containers with updated images
echo "[5/5] Restarting Docker containers..."
docker compose --env-file .env.production -f docker-compose.prod.yml up -d

# 6. Cleanup dangling images
echo "🧹 Cleaning up unused Docker images..."
docker image prune -f

echo ""
echo "========================================================="
echo " ✅ Tormag updated successfully! (${COMMIT_HASH})"
echo "========================================================="

send_telegram "🚀 *[CD Pipeline] Tormag успешно обновлен!*%0A%0A📌 *Коммит:* \`${COMMIT_HASH}\`%0A💬 *Заголовок:* ${COMMIT_MSG}"

