FROM node:20-alpine

WORKDIR /app

# Install system dependencies (needed for Prisma on alpine sometimes)
RUN apk add --no-cache openssl

COPY package*.json ./

RUN npm install

COPY . .

# Expose port
EXPOSE 5000

# We will run prisma generate and then start dev server
CMD ["sh", "-c", "npx prisma generate && npm run dev"]
