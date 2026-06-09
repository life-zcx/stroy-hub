export function getFriendlyErrorMessage(err) {
  if (!err) return 'Неизвестная ошибка. Пожалуйста, попробуйте позже.';

  // Extract the raw error message string
  let rawMsg = '';
  if (typeof err === 'string') {
    rawMsg = err;
  } else if (err.response?.data?.error) {
    rawMsg = err.response.data.error;
  } else if (err.response?.data?.message) {
    rawMsg = err.response.data.message;
  } else if (err.message) {
    rawMsg = err.message;
  } else {
    rawMsg = String(err);
  }

  if (!rawMsg) {
    return 'Произошла непредвиденная ошибка. Пожалуйста, попробуйте позже.';
  }

  // Pre-mapping of common technical status/messages
  const lowerMsg = rawMsg.toLowerCase();

  // Network / Connection issues
  if (lowerMsg.includes('network error') || lowerMsg.includes('failed to fetch') || lowerMsg.includes('connect') || lowerMsg.includes('econnrefused')) {
    return 'Не удалось подключиться к серверу. Проверьте подключение к интернету или попробуйте позже.';
  }
  if (lowerMsg.includes('timeout') || lowerMsg.includes('exceeded')) {
    return 'Время ожидания ответа от сервера истекло. Пожалуйста, попробуйте еще раз.';
  }

  // HTTP status codes
  if (lowerMsg.includes('500') || lowerMsg.includes('internal server error')) {
    return 'Внутренняя ошибка сервера. Наши специалисты уже работают над её устранением.';
  }
  if (lowerMsg.includes('401') || lowerMsg.includes('unauthorized') || lowerMsg.includes('unauthenticated')) {
    return 'Неверный адрес электронной почты или пароль, либо сессия авторизации истекла.';
  }
  if (lowerMsg.includes('403') || lowerMsg.includes('forbidden') || lowerMsg.includes('access denied')) {
    return 'Доступ ограничен. Недостаточно прав для выполнения этого действия.';
  }
  if (lowerMsg.includes('404') || lowerMsg.includes('not found')) {
    return 'Запрашиваемый ресурс или страница не найдены.';
  }
  if (lowerMsg.includes('429') || lowerMsg.includes('too many requests')) {
    return 'Слишком много запросов. Пожалуйста, подождите немного.';
  }

  // Database / Postgres / Technical details
  if (
    lowerMsg.includes('sql') ||
    lowerMsg.includes('postgres') ||
    lowerMsg.includes('database') ||
    lowerMsg.includes('constraint') ||
    lowerMsg.includes('foreign key') ||
    lowerMsg.includes('syntax error') ||
    lowerMsg.includes('db error') ||
    lowerMsg.includes('prisma') ||
    lowerMsg.includes('sequelize') ||
    lowerMsg.includes('mongodb')
  ) {
    return 'Ошибка базы данных при обработке запроса. Пожалуйста, обратитесь в службу поддержки.';
  }

  // Code level exceptions
  if (
    lowerMsg.includes('undefined') ||
    lowerMsg.includes('null') ||
    lowerMsg.includes('is not a function') ||
    lowerMsg.includes('cannot read property') ||
    lowerMsg.includes('object') ||
    lowerMsg.includes('unexpected token')
  ) {
    return 'Произошла системная ошибка приложения. Попробуйте обновить страницу.';
  }

  // Try translating common API errors
  if (lowerMsg.includes('user already exists') || lowerMsg.includes('email already exists') || lowerMsg.includes('unique constraint')) {
    return 'Пользователь с таким адресом электронной почты уже зарегистрирован.';
  }
  if (lowerMsg.includes('invalid credentials') || lowerMsg.includes('wrong password') || lowerMsg.includes('incorrect password')) {
    return 'Неверный пароль. Пожалуйста, попробуйте еще раз.';
  }
  if (lowerMsg.includes('password is too short') || lowerMsg.includes('password must contain')) {
    return 'Пароль слишком короткий или не соответствует требованиям безопасности.';
  }
  if (lowerMsg.includes('invalid verification code') || lowerMsg.includes('code is incorrect') || lowerMsg.includes('invalid code')) {
    return 'Неверный код подтверждения. Пожалуйста, проверьте и введите его снова.';
  }

  // Check if it's already a friendly Russian message.
  // We check if it has Cyrillic letters AND does not contain obvious English technical words
  const hasCyrillic = /[а-яА-ЯёЁ]/.test(rawMsg);
  const hasTechnicalWords = /error|exception|failed|status|code|invalid|request|response|jwt/i.test(rawMsg);

  if (hasCyrillic && !hasTechnicalWords) {
    return rawMsg;
  }

  // Fallback if we have Cyrillic but it has some technical words
  if (hasCyrillic) {
    return rawMsg;
  }

  return 'Произошла ошибка при выполнении операции. Пожалуйста, попробуйте позже.';
}

