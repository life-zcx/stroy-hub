#!/bin/bash
set -e

echo "========================================================="
echo " 🚀 Stroy-Hub Production Deployment & Update Script"
echo "========================================================="

# 1. Pull latest code from main branch
echo "[1/5] Pulling latest code from git..."
git pull origin main

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
echo " ✅ Stroy-Hub updated successfully!"
echo "========================================================="
