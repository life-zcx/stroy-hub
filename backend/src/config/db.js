import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      // Explicit pool size: optimal for a single Node.js process on a typical VPS.
      // Prisma default is num_cpus * 2 + 1, which can be miscalculated inside Docker.
      url: process.env.DATABASE_URL + (process.env.DATABASE_URL?.includes('?') ? '&' : '?') + 'connection_limit=10&pool_timeout=20',
    },
  },
});

export default prisma;
