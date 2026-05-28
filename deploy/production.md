# Production deployment

1. Create a production env file from `.env.production.example`.
2. Fill in real values for `POSTGRES_PASSWORD`, `JWT_SECRET`, and `CORS_ORIGINS`.
3. Build and start the stack:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

4. Run Prisma migrations after the containers are up:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

5. If you need seed data in a non-production environment, run it manually. Do not run the current seed on live data because it clears existing records.

Routing defaults:

- `http://tormag.kz/` or `http://90.156.222.131/` -> customer storefront
- `http://tormag.kz/admin/` -> admin panel
- `http://tormag.kz/api/*` -> backend API
- `http://tormag.kz/uploads/*` -> uploaded files

Notes:

- This setup assumes one public domain and serves the admin panel from `/admin/`.
- Set `GATEWAY_PORT=80` or customize it when you plan to terminate TLS on the host with nginx or another reverse proxy.
- Put TLS in front of the `gateway` container or terminate it on the host/reverse proxy.
- The backend now reads `CORS_ORIGINS` as a comma-separated allowlist in production.
- `JWT_SECRET` is now mandatory at runtime.
- `MAX_UPLOAD_SIZE_MB` controls image upload size limits for products and categories.

See `deploy/ubuntu-nginx.conf.example` for a host nginx reverse-proxy template with HTTPS, or use the pre-configured Caddyfile at `deploy/Caddyfile` for zero-config automatic SSL certificates.

### Option A: Using Caddy (Recommended & Automatic SSL)

Caddy automatically requests, installs, and renews SSL certificates for `tormag.kz` and `www.tormag.kz` without needing Certbot or cron jobs.

1. In `.env.production`, set `GATEWAY_PORT=8080`.
2. Install Caddy on your Ubuntu host:
   ```bash
   sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
   curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
   curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/nginx/sites-available/caddy-stable.list > /dev/null # Note: repository list
   # (Or use standard official script: https://caddyserver.com/docs/install#debian-ubuntu-raspbian)
   sudo apt update
   sudo apt install caddy
   ```
3. Copy our configured `deploy/Caddyfile` to `/etc/caddy/Caddyfile`:
   ```bash
   sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
   sudo systemctl reload caddy
   ```

### Option B: Ubuntu Nginx Host Outline (Alternative)

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
sudo cp deploy/ubuntu-nginx.conf.example /etc/nginx/sites-available/stroy-hub
sudo ln -s /etc/nginx/sites-available/stroy-hub /etc/nginx/sites-enabled/stroy-hub
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d tormag.kz -d www.tormag.kz
```
