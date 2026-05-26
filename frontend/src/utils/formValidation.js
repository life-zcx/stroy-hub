const suspiciousPattern = /(<\s*script|javascript:|--|\/\*|\*\/|('|\")\s*or\s+\d+\s*=\s*\d+|union\s+select|drop\s+table|insert\s+into|delete\s+from|update\s+.+\s+set)/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const personNamePattern = /^[a-zA-Zа-яА-ЯёЁ0-9 .,'"()\-]{2,80}$/;
const companyNamePattern = /^[a-zA-Zа-яА-ЯёЁ0-9 .,'"()\-/&]{2,120}$/;

export function normalizeInput(value) {
  return String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function hasSuspiciousContent(value) {
  return suspiciousPattern.test(String(value || ''));
}

export function formatKazakhPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  let normalizedDigits = digits;
  if (normalizedDigits[0] !== '7' && normalizedDigits[0] !== '8') {
    normalizedDigits = `7${normalizedDigits}`;
  }
  if (normalizedDigits.length > 11) {
    normalizedDigits = normalizedDigits.slice(0, 11);
  }
  if (normalizedDigits[0] === '8') {
    normalizedDigits = `7${normalizedDigits.slice(1)}`;
  }

  const part1 = normalizedDigits.slice(1, 4);
  const part2 = normalizedDigits.slice(4, 7);
  const part3 = normalizedDigits.slice(7, 9);
  const part4 = normalizedDigits.slice(9, 11);

  let result = '+7';
  if (part1) result += ` (${part1}`;
  if (part1.length === 3) result += ')';
  if (part2) result += ` ${part2}`;
  if (part3) result += `-${part3}`;
  if (part4) result += `-${part4}`;

  return result;
}

export function validateName(value, fieldLabel = 'Имя') {
  const normalized = normalizeInput(value);

  if (!normalized) {
    return `${fieldLabel} обязательно.`;
  }
  if (hasSuspiciousContent(normalized)) {
    return `${fieldLabel} содержит недопустимые конструкции.`;
  }
  if (!personNamePattern.test(normalized)) {
    return `${fieldLabel} содержит недопустимые символы.`;
  }

  return '';
}

export function validateCompanyName(value) {
  const normalized = normalizeInput(value);

  if (!normalized) {
    return 'Название компании обязательно.';
  }
  if (hasSuspiciousContent(normalized)) {
    return 'Название компании содержит недопустимые конструкции.';
  }
  if (!companyNamePattern.test(normalized)) {
    return 'Название компании содержит недопустимые символы.';
  }

  return '';
}

export function validatePhone(value, fieldLabel = 'Телефон') {
  const digits = String(value || '').replace(/\D/g, '');
  let normalizedDigits = digits;

  if (normalizedDigits.length === 10) {
    normalizedDigits = `7${normalizedDigits}`;
  }
  if (normalizedDigits.length === 11 && normalizedDigits.startsWith('8')) {
    normalizedDigits = `7${normalizedDigits.slice(1)}`;
  }

  if (normalizedDigits.length !== 11 || !normalizedDigits.startsWith('7')) {
    return `${fieldLabel} должен быть в формате +7 (777) 123-45-67.`;
  }

  return '';
}

export function validateEmail(value) {
  const normalized = normalizeInput(value).toLowerCase();

  if (!normalized) {
    return 'Email обязателен.';
  }
  if (hasSuspiciousContent(normalized)) {
    return 'Email содержит недопустимые конструкции.';
  }
  if (!emailPattern.test(normalized)) {
    return 'Укажите корректный email.';
  }

  return '';
}

export function validateComment(value, fieldLabel = 'Комментарий', maxLength = 1200) {
  const normalized = normalizeInput(value);

  if (!normalized) {
    return '';
  }
  if (hasSuspiciousContent(normalized)) {
    return `${fieldLabel} содержит недопустимые конструкции.`;
  }
  if (normalized.length > maxLength) {
    return `${fieldLabel} слишком длинный.`;
  }

  return '';
}
