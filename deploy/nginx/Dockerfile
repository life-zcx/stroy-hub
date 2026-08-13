FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
ARG VITE_YANDEX_MAPS_KEY=67c5ee3b-693a-4ecb-88ce-e39e821954a4
ENV VITE_YANDEX_MAPS_KEY=$VITE_YANDEX_MAPS_KEY
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine AS admin-builder

WORKDIR /app/admin
COPY admin/package*.json ./
RUN npm install
COPY admin/ ./
RUN npm run build

FROM nginx:1.27-alpine

COPY deploy/nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html
COPY --from=admin-builder /app/admin/dist /usr/share/nginx/html_admin

EXPOSE 80

