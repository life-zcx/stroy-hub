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

- `http://your-domain/` -> customer storefront
- `http://your-domain/admin/` -> admin panel
- `http://your-domain/api/*` -> backend API
- `http://your-domain/uploads/*` -> uploaded files

Notes:

- This setup assumes one public domain and serves the admin panel from `/admin/`.
- Set `GATEWAY_PORT=8080` when you plan to terminate TLS on the host with nginx or another reverse proxy.
- Put TLS in front of the `gateway` container or terminate it on the host/reverse proxy.
- The backend now reads `CORS_ORIGINS` as a comma-separated allowlist in production.
- `JWT_SECRET` is now mandatory at runtime.
- `MAX_UPLOAD_SIZE_MB` controls image upload size limits for products and categories.

See `deploy/ubuntu-nginx.conf.example` for a host nginx reverse-proxy template with HTTPS.

Ubuntu host outline:

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
sudo cp deploy/ubuntu-nginx.conf.example /etc/nginx/sites-available/stroy-hub
sudo ln -s /etc/nginx/sites-available/stroy-hub /etc/nginx/sites-enabled/stroy-hub
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d example.com -d www.example.com
```
