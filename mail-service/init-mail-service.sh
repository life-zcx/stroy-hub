#!/bin/bash
set -e

echo "=========================================="
echo " Starting Stroy-Hub Independent Mail Service "
echo "=========================================="

# Create data directory
mkdir -p data

# Copy .env if not exists
if [ ! -f .env ]; then
    echo "[+] Creating .env file from .env.example..."
    cp .env.example .env
fi

# Load env variables
export $(grep -v '^#' .env | xargs)

# Helper function to check if port is in use
check_port() {
    local port=$1
    local name=$2
    if netstat -tuln 2>/dev/null | grep -q ":${port} "; then
        echo "⚠️ WARNING: Port ${port} (${name}) appears to be in use!"
        echo "   If startup fails, change ${name} in mail-service/.env to a free port."
    fi
}

echo "[1/4] Checking for port conflicts..."
check_port ${STALWART_ADMIN_PORT:-8880} "STALWART_ADMIN_PORT"
check_port ${ROUNDCUBE_PORT:-8890} "ROUNDCUBE_PORT"

# Check docker compose
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    DOCKER_COMPOSE_CMD="docker compose"
fi

echo "[2/4] Pulling latest containers (Stalwart + Roundcube)..."
$DOCKER_COMPOSE_CMD pull

echo "[3/4] Starting mail server containers..."
$DOCKER_COMPOSE_CMD up -d

echo "[4/4] Checking container status..."
$DOCKER_COMPOSE_CMD ps

echo ""
echo "=========================================="
echo " Mail Service successfully started!"
echo "------------------------------------------"
echo " Stalwart Admin UI: http://YOUR_SERVER_IP:${STALWART_ADMIN_PORT:-8880}"
echo " Roundcube Webmail:  http://YOUR_SERVER_IP:${ROUNDCUBE_PORT:-8890}"
echo "=========================================="
