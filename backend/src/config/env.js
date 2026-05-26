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
