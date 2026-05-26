const PHONE_DIGITS_LENGTH = 11;

const suspiciousPattern = /(<\s*script|javascript:|--|\/\*|\*\/|('|\")\s*or\s+\d+\s*=\s*\d+|union\s+select|drop\s+table|insert\s+into|delete\s+from|update\s+.+\s+set)/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const personNamePattern = /^[a-zA-Zа-яА-ЯёЁ0-9 .,'"()\-]{2,80}$/;
const companyNamePattern = /^[a-zA-Zа-яА-ЯёЁ0-9 .,'"()\-/&]{2,120}$/;

function normalizeWhitespace(value) {
  return String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function ensureSafeText(value, fieldLabel) {
  if (!value) {
    return value;
  }

  if (suspiciousPattern.test(value)) {
    throw new Error(`Поле "${fieldLabel}" содержит недопустимые конструкции.`);
  }

  return value;
}

function validateLength(value, min, max, fieldLabel) {
  if (value.length < min || value.length > max) {
    throw new Error(`Поле "${fieldLabel}" должно содержать от ${min} до ${max} символов.`);
  }
}

export function sanitizePersonName(value, fieldLabel = 'Имя') {
  const normalized = ensureSafeText(normalizeWhitespace(value), fieldLabel);
  validateLength(normalized, 2, 80, fieldLabel);

  if (!personNamePattern.test(normalized)) {
    throw new Error(`Поле "${fieldLabel}" содержит недопустимые символы.`);
  }

  return normalized;
}

export function sanitizeCompanyName(value, fieldLabel = 'Компания') {
  const normalized = ensureSafeText(normalizeWhitespace(value), fieldLabel);
  validateLength(normalized, 2, 120, fieldLabel);

  if (!companyNamePattern.test(normalized)) {
    throw new Error(`Поле "${fieldLabel}" содержит недопустимые символы.`);
  }

  return normalized;
}

export function sanitizeOptionalText(value, fieldLabel = 'Комментарий', maxLength = 1000) {
  const normalized = ensureSafeText(normalizeWhitespace(value), fieldLabel);

  if (!normalized) {
    return null;
  }

  validateLength(normalized, 1, maxLength, fieldLabel);
  return normalized;
}

export function sanitizeEmail(value, fieldLabel = 'Email') {
  const normalized = ensureSafeText(normalizeWhitespace(value).toLowerCase(), fieldLabel);
  validateLength(normalized, 5, 120, fieldLabel);

  if (!emailPattern.test(normalized)) {
    throw new Error(`Поле "${fieldLabel}" должно содержать корректный email.`);
  }

  return normalized;
}

export function sanitizePhone(value, fieldLabel = 'Телефон') {
  const digits = String(value || '').replace(/\D/g, '');

  if (!digits) {
    throw new Error(`Поле "${fieldLabel}" обязательно.`);
  }

  let normalizedDigits = digits;
  if (normalizedDigits.length === 10) {
    normalizedDigits = `7${normalizedDigits}`;
  }
  if (normalizedDigits.length === PHONE_DIGITS_LENGTH && normalizedDigits.startsWith('8')) {
    normalizedDigits = `7${normalizedDigits.slice(1)}`;
  }

  if (normalizedDigits.length !== PHONE_DIGITS_LENGTH || !normalizedDigits.startsWith('7')) {
    throw new Error(`Поле "${fieldLabel}" должно содержать номер в формате +7 (777) 123-45-67.`);
  }

  return `+7 (${normalizedDigits.slice(1, 4)}) ${normalizedDigits.slice(4, 7)}-${normalizedDigits.slice(7, 9)}-${normalizedDigits.slice(9, 11)}`;
}
