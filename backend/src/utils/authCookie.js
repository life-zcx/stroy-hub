export const AUTH_COOKIE_NAME = 'tormag_auth_token';
// SEC-004: ADMIN_AUTH_COOKIE_NAME оставлен как псевдоним для обратной совместимости.
// Новый код должен использовать AUTH_COOKIE_NAME для обоих интерфейсов.
// Разграничение прав — через role в JWT-payload, не через отдельный cookie.
export const ADMIN_AUTH_COOKIE_NAME = 'tormag_auth_token';
export const REFRESH_COOKIE_NAME = 'tormag_refresh_token';

export const AUTH_TOKEN_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes for access token
export const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days for refresh token

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

/**
 * SEC-004: Всегда возвращает единый AUTH_COOKIE_NAME.
 * Разграничение admin/customer — по role в JWT, не по Referer-заголовку.
 * Ранее функция читала Referer/Origin (управляемые клиентом) — это убрано.
 */
export function getCookieName(_req) {
  return AUTH_COOKIE_NAME;
}

function parseCookieHeader(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const separatorIndex = part.indexOf('=');
      if (separatorIndex === -1) return cookies;

      const key = part.slice(0, separatorIndex);
      const value = part.slice(separatorIndex + 1);
      try {
        cookies[key] = decodeURIComponent(value);
      } catch (error) {
        cookies[key] = value;
      }
      return cookies;
    }, {});
}

export function getTokenFromRequest(req) {
  const authHeader = req.headers?.authorization || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (bearerToken) return bearerToken;

  const cookies = req.cookies || parseCookieHeader(req.headers?.cookie || '');

  // Проверяем оба имени для совместимости с клиентами, хранящими старый admin cookie
  return cookies[AUTH_COOKIE_NAME] || cookies['tormag_admin_auth_token'] || null;
}

export function getRefreshTokenFromRequest(req) {
  const headerRefreshToken = req.headers['x-refresh-token'];
  if (headerRefreshToken && typeof headerRefreshToken === 'string') {
    return headerRefreshToken.trim();
  }

  const cookies = req.cookies || parseCookieHeader(req.headers?.cookie || '');
  return cookies[REFRESH_COOKIE_NAME] || null;
}

function getCookieOptions(req, maxAge = AUTH_TOKEN_MAX_AGE_MS) {
  const options = {
    httpOnly: true,
    secure: isProduction(),
    sameSite: isProduction() ? 'none' : 'lax',
    maxAge,
    path: '/',
  };

  const domain = process.env.COOKIE_DOMAIN;
  if (isProduction() && domain) {
    options.domain = domain;
  }

  return options;
}

export function setAuthCookie(req, res, token) {
  res.cookie(AUTH_COOKIE_NAME, token, getCookieOptions(req, AUTH_TOKEN_MAX_AGE_MS));
}

export function setRefreshTokenCookie(req, res, refreshToken) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getCookieOptions(req, REFRESH_TOKEN_MAX_AGE_MS));
}

export function clearAuthCookie(req, res) {
  const options = getCookieOptions(req, 0);

  // Чистим оба имени (старый admin и новый единый) для плавной миграции клиентов
  const names = [AUTH_COOKIE_NAME, 'tormag_admin_auth_token', REFRESH_COOKIE_NAME];
  names.forEach((name) => {
    res.cookie(name, '', { ...options, maxAge: 0, expires: new Date(0) });
    const noDomainOptions = { ...options };
    delete noDomainOptions.domain;
    res.cookie(name, '', { ...noDomainOptions, maxAge: 0, expires: new Date(0) });
  });
}
