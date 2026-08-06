import logger from '../utils/logger.js';

/**
 * Validates critical environment variables required for running the application securely.
 * Throws error or exits process in production if insecure defaults or missing keys are found.
 */
export function validateEnvironment() {
  const isProduction = process.env.NODE_ENV === 'production';
  const missing = [];

  // Required keys for basic server functionality
  if (!process.env.DATABASE_URL) {
    missing.push('DATABASE_URL');
  }

  // Security checks for JWT
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    if (isProduction) {
      missing.push('JWT_SECRET');
    } else {
      logger.warn('[SECURITY WARNING] JWT_SECRET is not set. Using default insecure development secret.');
    }
  } else if (isProduction && (jwtSecret.includes('tormag_dev') || jwtSecret.length < 16)) {
    logger.error('[FATAL SECURITY RISK] JWT_SECRET is set to a default/weak development value in production!');
    if (!process.env.ALLOW_INSECURE_DEV_JWT) {
      process.exit(1);
    }
  }

  if (missing.length > 0) {
    const errorMsg = `[FATAL] Missing required environment variables: ${missing.join(', ')}`;
    logger.error(errorMsg);
    if (isProduction) {
      process.exit(1);
    }
  }

  logger.info('[ENV CHECK] Environment configuration validated successfully.');
}
