import prisma from '../config/db.js';

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
  console.log('[CLEANUP] Starting token cleanup scheduler (Runs every 24 hours)...');
  
  // Run once immediately on startup
  cleanExpiredTokens();

  // Run every 24 hours (24 * 60 * 60 * 1000 ms)
  const INTERVAL_24H = 86400000;
  setInterval(cleanExpiredTokens, INTERVAL_24H);
};
