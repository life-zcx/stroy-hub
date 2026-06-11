import prisma from '../config/db.js';
import { uploadLatestBackupToYandex } from './yandexBackup.js';

export const cleanExpiredTokens = async () => {
  try {
    const deleted = await prisma.passwordResetToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    });
    if (deleted.count > 0) {
      console.log(`[CLEANUP] Automatically deleted ${deleted.count} expired password reset tokens.`);
    }
  } catch (error) {
    console.error('[CLEANUP ERROR] Failed to clean expired tokens:', error);
  }
};

export const startCleanupScheduler = () => {
  console.log('[CLEANUP] Starting cleanup & backup scheduler (Runs every 24 hours)...');
  
  // 1. Run expired tokens cleanup immediately
  cleanExpiredTokens();

  // 2. Run Yandex.Disk backup upload after a short delay on startup (e.g., 30s)
  // to avoid overlapping with container initialization/db boot.
  setTimeout(() => {
    uploadLatestBackupToYandex();
  }, 30000);

  // 3. Schedule both tasks every 24 hours
  const INTERVAL_24H = 86400000;
  setInterval(() => {
    cleanExpiredTokens();
    uploadLatestBackupToYandex();
  }, INTERVAL_24H);
};
