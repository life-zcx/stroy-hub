#!/bin/bash
set -e

# ==============================================================================
# 🚀 Tormag (tormag.kz) - VPS Initial Setup Script for Ubuntu 20.04 / 22.04 / 24.04
# ==============================================================================

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}=========================================================${NC}"
echo -e "${CYAN} 🛠️ Tormag Production Server Setup Script ${NC}"
echo -e "${CYAN}=========================================================${NC}"

if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Please run this script as root or with sudo:${NC}"
  echo "   sudo bash deploy/setup_vps.sh"
  exit 1
fi

# 1. Update OS packages
echo -e "\n${GREEN}[1/7] Updating system packages...${NC}"
apt-get update -qq
apt-get install -y -qq curl wget git ufw htop jq openssl ca-certificates gnupg lsb-release

# 2. Install Docker & Docker Compose
echo -e "\n${GREEN}[2/7] Installing Docker and Docker Compose Plugin...${NC}"
if ! command -v docker &> /dev/null; then
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable --now docker
    echo -e "${GREEN}✅ Docker successfully installed!${NC}"
else
    echo -e "${YELLOW}ℹ️ Docker is already installed.${NC}"
fi

# Configure Docker Log Rotation to save disk space
echo "Configuring Docker log rotation (/etc/docker/daemon.json)..."
mkdir -p /etc/docker
cat <<EOF > /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
systemctl restart docker || true

# 3. Install Caddy Web Server
echo -e "\n${GREEN}[3/7] Installing Caddy Web Server...${NC}"
if ! command -v caddy &> /dev/null; then
    apt-get install -y -qq debian-keyring debian-archive-keyring apt-transport-https
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg --yes
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
    apt-get update -qq
    apt-get install -y -qq caddy
    systemctl enable --now caddy
    echo -e "${GREEN}✅ Caddy successfully installed!${NC}"
else
    echo -e "${YELLOW}ℹ️ Caddy is already installed.${NC}"
fi

# 4. Configure UFW Firewall
echo -e "\n${GREEN}[4/7] Configuring UFW Firewall...${NC}"
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw allow 25/tcp comment 'SMTP'
ufw allow 465/tcp comment 'SMTPS'
ufw allow 587/tcp comment 'SMTP Submission'
ufw allow 993/tcp comment 'IMAPS'
ufw --force enable
echo -e "${GREEN}✅ UFW Firewall enabled with safe rules!${NC}"

# 5. Environment configuration (.env.production)
echo -e "\n${GREEN}[5/7] Setting up .env.production environment...${NC}"
if [ ! -f ".env.production" ]; then
    if [ -f ".env.production.example" ]; then
        cp .env.production.example .env.production
    else
        touch .env.production
    fi

    # Generate strong random secrets
    RAND_JWT=$(openssl rand -hex 32)
    RAND_DB_PASS=$(openssl rand -hex 16)

    sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=${RAND_DB_PASS}/g" .env.production
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=${RAND_JWT}/g" .env.production

    echo -e "${GREEN}✅ Created .env.production with auto-generated secure JWT_SECRET and POSTGRES_PASSWORD!${NC}"
else
    echo -e "${YELLOW}ℹ️ .env.production already exists.${NC}"
fi

# 6. Deploy Caddyfile configuration
echo -e "\n${GREEN}[6/7] Deploying Caddy configuration...${NC}"
if [ -f "deploy/Caddyfile" ]; then
    cp deploy/Caddyfile /etc/caddy/Caddyfile
    systemctl reload caddy || echo -e "${YELLOW}⚠️ Warning: Caddy reload failed. Check /etc/caddy/Caddyfile${NC}"
    echo -e "${GREEN}✅ Caddyfile deployed and reloaded!${NC}"
fi

# 7. SSH Key setup for GitHub Actions CD
echo -e "\n${GREEN}[7/7] Generating SSH Key for GitHub Actions Auto-CD...${NC}"
SSH_DIR="$HOME/.ssh"
mkdir -p "$SSH_DIR"
chmod 700 "$SSH_DIR"
AUTHORIZED_KEYS="$SSH_DIR/authorized_keys"
touch "$AUTHORIZED_KEYS"
chmod 600 "$AUTHORIZED_KEYS"

KEY_PATH="$SSH_DIR/github_actions_tormag"
if [ ! -f "$KEY_PATH" ]; then
    ssh-keygen -t ed25519 -C "github-actions-cd@tormag.kz" -f "$KEY_PATH" -N ""
    cat "${KEY_PATH}.pub" >> "$AUTHORIZED_KEYS"
    echo -e "${GREEN}✅ Generated new SSH key pair for GitHub Actions!${NC}"
else
    echo -e "${YELLOW}ℹ️ GitHub Actions SSH key already exists.${NC}"
fi

echo -e "\n${CYAN}=========================================================${NC}"
echo -e "${GREEN} 🎉 VPS Setup Completed Successfully! ${NC}"
echo -e "${CYAN}=========================================================${NC}"

echo -e "\n${YELLOW}🔑 NEXT STEPS FOR AUTOMATED DEPLOYMENT (GitHub Secrets):${NC}"
echo "1. Go to your GitHub repository -> Settings -> Secrets and variables -> Actions"
echo "2. Add the following repository secrets:"
echo "   - SSH_HOST: $(curl -s https://api.ipify.org || echo "YOUR_SERVER_IP")"
echo "   - SSH_USERNAME: root"
echo "   - SSH_PORT: 22"
echo "   - TELEGRAM_BOT_TOKEN: (Your Telegram Bot Token)"
echo "   - TELEGRAM_ADMIN_CHAT_ID: (Your Telegram Chat ID)"
echo -e "   - ${GREEN}SSH_KEY${NC} (Copy the private key printed below):"
echo "---------------------------------------------------------"
cat "$KEY_PATH"
echo "---------------------------------------------------------"
