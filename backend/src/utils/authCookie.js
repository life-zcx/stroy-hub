export const AUTH_COOKIE_NAME = 'tormag_auth_token';
export const ADMIN_AUTH_COOKIE_NAME = 'tormag_admin_auth_token';
export const AUTH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

export function getCookieName(req) {
  const referer = req.headers?.referer || '';
  const origin = req.headers?.origin || '';
  const isAdminRequest = 
    referer.includes(':3001') || 
    referer.includes('cabinet.tormag.kz') ||
    origin.includes(':3001') ||
    origin.includes('cabinet.tormag.kz');
    
  return isAdminRequest ? ADMIN_AUTH_COOKIE_NAME : AUTH_COOKIE_NAME;
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

  const cookies = parseCookieHeader(req.headers?.cookie || '');
  return cookies[getCookieName(req)] || null;
}

export function setAuthCookie(req, res, token) {
  res.cookie(getCookieName(req), token, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax',
    maxAge: AUTH_TOKEN_MAX_AGE_MS,
    path: '/',
  });
}

export function clearAuthCookie(req, res) {
  res.clearCookie(getCookieName(req), {
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax',
    path: '/',
  });
}
