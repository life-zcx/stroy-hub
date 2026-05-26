FROM node:20-alpine

WORKDIR /app

# Install system dependencies (needed for Prisma on alpine sometimes)
RUN apk add --no-cache openssl

COPY package*.json ./

RUN npm install

COPY . .

# Expose port
EXPOSE 5000

# Dev container: regenerate client, sync schema, then start watcher
CMD ["sh", "-c", "npx prisma generate && npx prisma db push && npm run dev"]
