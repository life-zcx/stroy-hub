import 'dotenv/config';

function requireEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }

  return value;
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value || fallback, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error('MAX_UPLOAD_SIZE_MB must be a positive integer');
  }

  return parsed;
}

export const JWT_SECRET = requireEnv('JWT_SECRET');
export const MAX_UPLOAD_SIZE_MB = parsePositiveInteger(process.env.MAX_UPLOAD_SIZE_MB, '5');
export const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim() || '';
export const SMTP_HOST = process.env.SMTP_HOST?.trim() || 'smtp.mail.ru';
export const SMTP_PORT = Number(process.env.SMTP_PORT?.trim()) || 465;
export const SMTP_USER = process.env.SMTP_USER?.trim() || '';
export const SMTP_PASS = process.env.SMTP_PASS?.trim() || '';

