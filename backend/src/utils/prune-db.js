import prisma from '../config/db.js';

async function pruneDb() {
  console.log('[PRUNE-DB] Starting database maintenance and space reclamation...');

  try {
    // 1. Truncate PageView and AnalyticsEvent tables
    console.log('[PRUNE-DB] Truncating PageView and AnalyticsEvent tables...');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "PageView", "AnalyticsEvent" RESTART IDENTITY CASCADE;');
    console.log('[PRUNE-DB] Successfully truncated PageView and AnalyticsEvent tables.');

    // 2. Clean up expired PasswordResetToken rows
    console.log('[PRUNE-DB] Cleaning up expired PasswordResetToken rows...');
    const result = await prisma.passwordResetToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
    console.log(`[PRUNE-DB] Deleted ${result.count} expired password reset tokens.`);
    
    console.log('[PRUNE-DB] Database maintenance complete.');
  } catch (error) {
    console.error('[PRUNE-DB ERROR] Database maintenance failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

pruneDb();
