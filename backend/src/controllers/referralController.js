import prisma from '../config/db.js';
import logger from '../utils/logger.js';
import { safeErrorMessage } from '../utils/apiError.js';
import { getReferralSummary } from '../services/referralService.js';

/**
 * GET /api/referral/summary
 * Returns referral code, share links, and statistics for the current user.
 */
export const getMyReferralSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    let host = req.headers['x-forwarded-host'] || req.headers.host || 'tormag.kz';
    if (host.includes('backend') || host.includes('localhost:5000')) {
      host = process.env.PUBLIC_APP_URL ? process.env.PUBLIC_APP_URL.replace(/^https?:\/\//, '') : 'tormag.kz';
    }
    const baseUrl = `${protocol}://${host}`;

    const summary = await getReferralSummary(userId, baseUrl);
    return res.json(summary);
  } catch (error) {
    logger.error('Error fetching referral summary:', error);
    return res.status(500).json({ error: safeErrorMessage(error, 'Ошибка получения данных реферальной программы') });
  }
};

/**
 * POST /api/referral/validate
 * Validates a referral code passed from frontend/url
 */
export const validateReferralCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ valid: false, error: 'Код не указан' });
    }

    const cleanCode = code.trim().toUpperCase();
    const referrer = await prisma.user.findUnique({
      where: { referralCode: cleanCode },
      select: {
        id: true,
        name: true,
        referralCode: true,
      },
    });

    if (!referrer) {
      return res.status(404).json({ valid: false, error: 'Реферальный код не найден' });
    }

    // Check if current user is trying to use their own referral code
    if (req.user && req.user.id === referrer.id) {
      return res.status(400).json({ valid: false, error: 'Нельзя использовать собственный реферальный код' });
    }

    return res.json({
      valid: true,
      referralCode: referrer.referralCode,
      referrerName: referrer.name || 'Пользователь TORMAG',
      discountAmount: 1000,
    });
  } catch (error) {
    logger.error('Error validating referral code:', error);
    return res.status(500).json({ valid: false, error: safeErrorMessage(error, 'Ошибка проверки кода') });
  }
};
