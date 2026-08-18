const isProduction = () => process.env.NODE_ENV === 'production';

/**
 * Returns a safe error message for API responses.
 * In production, hides internal error details to prevent information leakage.
 * In development, returns the original error message for debugging convenience.
 *
 * @param {Error|string} error - The error object or message.
 * @param {string} publicMessage - A safe, user-facing message to show in production.
 * @returns {string} The error message to include in the API response.
 */
export function safeErrorMessage(error, publicMessage = 'Внутренняя ошибка сервера.') {
  if (isProduction()) {
    return publicMessage;
  }
  const msg = error instanceof Error ? error.message : String(error);
  return publicMessage + ' ' + msg;
}
