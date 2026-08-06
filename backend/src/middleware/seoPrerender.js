import { getProductOg, getCatalogOg, getStaticPageOg } from '../controllers/ogController.js';

const BOT_USER_AGENTS = /googlebot|yandexbot|bingbot|slurp|duckduckbot|baiduspider|yandexmobilebot|facebookexternalhit|twitterbot|rogerbot|linkedinbot|embedly|quora link preview|showyouhaveseen|outbrain|pinterest\/0\.|pinterestbot|slackbot|vkShare|W3C_Validator|whatsapp/i;

export const botPrerenderMiddleware = (handler) => (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const isBot = BOT_USER_AGENTS.test(userAgent) || req.query._prerender === '1';
  if (isBot) {
    return handler(req, res, next);
  }
  next();
};

export const handleProductOgPrerender = botPrerenderMiddleware(getProductOg);
export const handleCatalogOgPrerender = botPrerenderMiddleware(getCatalogOg);
export const handleStaticOgPrerender = botPrerenderMiddleware(getStaticPageOg);
