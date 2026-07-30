const cyrillicToLatinMap = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
  'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
  'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
  'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
  'я': 'ya',
  // Kazakh specific letters
  'ә': 'a', 'ғ': 'g', 'қ': 'q', 'ң': 'n', 'ө': 'o', 'ұ': 'u', 'ү': 'u', 'h': 'h', 'і': 'i'
};

/**
 * Converts any Russian/Kazakh/English string to a clean URL-friendly slug
 * @param {string} text
 * @returns {string}
 */
export function slugify(text) {
  if (!text || typeof text !== 'string') return '';

  const str = text.toLowerCase().trim();
  let result = '';

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (cyrillicToLatinMap[char] !== undefined) {
      result += cyrillicToLatinMap[char];
    } else if (/[a-z0-9]/.test(char)) {
      result += char;
    } else if (/[ \-_/\\]/.test(char)) {
      result += '-';
    }
  }

  // Remove multiple consecutive hyphens & trim trailing hyphens
  result = result.replace(/-+/g, '-').replace(/^-+|-+$/g, '');

  return result || 'product';
}
