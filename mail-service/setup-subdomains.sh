#!/bin/bash
set -e

echo "========================================================="
echo " Configuring Nginx & SSL Certs for Mail Subdomains "
echo "========================================================="

CONF_SRC="$(pwd)/nginx/mail-subdomains.conf"
CONF_DEST="/etc/nginx/sites-available/mail-subdomains.conf"
CONF_LINK="/etc/nginx/sites-enabled/mail-subdomains.conf"

if [ ! -f "$CONF_SRC" ]; then
    echo "❌ Error: $CONF_SRC not found!"
    exit 1
fi

echo "[1/4] Copying Nginx configuration..."
sudo cp "$CONF_SRC" "$CONF_DEST"
sudo ln -sf "$CONF_DEST" "$CONF_LINK"

echo "[2/4] Testing Nginx configuration..."
sudo nginx -t

echo "[3/4] Reloading Nginx..."
sudo systemctl reload nginx

echo "[4/4] Requesting SSL Let's Encrypt certificates via Certbot..."
if command -v certbot &> /dev/null; then
    sudo certbot --nginx -d mail.tormag.kz -d mailpanel.tormag.kz --non-interactive --agree-tos --register-unsafely-without-email || {
        echo "⚠️ Certbot auto-issue failed or DNS not propagate yet."
        echo "   Run manually later: sudo certbot --nginx -d mail.tormag.kz -d mailpanel.tormag.kz"
    }
else
    echo "⚠️ Certbot is not installed. Install it with: sudo apt install certbot python3-certbot-nginx"
fi

echo ""
echo "========================================================="
echo " ✅ Setup finished!"
echo " Webmail: https://mail.tormag.kz"
echo " Admin Panel: https://mailpanel.tormag.kz"
echo "========================================================="
