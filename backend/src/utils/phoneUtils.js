/**
 * Normalizes any Kazakhstani or international phone string into pure digits starting with 7
 * Example: "+7 (707) 123-45-67" -> "77071234567"
 * Example: "87071234567" -> "77071234567"
 */
export function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  let digits = phone.replace(/[^\d]/g, '');

  if (digits.length === 11 && digits.startsWith('8')) {
    digits = '7' + digits.slice(1);
  }

  if (digits.length === 10) {
    digits = '7' + digits;
  }

  return digits;
}

/**
 * Returns formatted phone string "+7 (XXX) XXX-XX-XX" from clean 11-digit normalized string
 */
export function formatPhoneDisplay(normalizedDigits) {
  if (!normalizedDigits || normalizedDigits.length < 10) return normalizedDigits || '';
  const digits = normalizedDigits.slice(-10);
  return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
}
