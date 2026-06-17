import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { JWT_SECRET } from '../config/env.js';
import { getTokenFromRequest } from '../utils/authCookie.js';

const MAX_PATH_LENGTH = 500;
const MAX_TITLE_LENGTH = 200;
const MAX_REFERRER_LENGTH = 500;
const MAX_USER_AGENT_LENGTH = 500;
const MAX_SESSION_ID_LENGTH = 120;
const MAX_EVENT_TYPE_LENGTH = 80;
const MAX_SEARCH_QUERY_LENGTH = 200;
const MAX_LOCATION_LENGTH = 120;

function truncate(value, maxLength) {
  if (!value || typeof value !== 'string') return null;
  return value.slice(0, maxLength);
}

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || null;
}

function getUserIdFromToken(req) {
  const token = getTokenFromRequest(req);
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return Number.isInteger(decoded.id) ? decoded.id : null;
  } catch (error) {
    return null;
  }
}

function getStartDate(range) {
  const now = new Date();
  if (range === 'day') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (range === 'week') {
    const date = new Date(now);
    date.setDate(now.getDate() - 7);
    return date;
  }
  if (range === 'month') {
    const date = new Date(now);
    date.setMonth(now.getMonth() - 1);
    return date;
  }
  return null;
}

function getDateKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function getBrowser(userAgent = '') {
  const ua = userAgent.toLowerCase();
  if (ua.includes('edg/')) return 'Edge';
  if (ua.includes('opr/') || ua.includes('opera')) return 'Opera';
  if (ua.includes('chrome') && !ua.includes('chromium')) return 'Chrome';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('firefox')) return 'Firefox';
  return 'Другое';
}

function getDevice(userAgent = '') {
  const ua = userAgent.toLowerCase();
  if (ua.includes('tablet') || ua.includes('ipad')) return 'Планшеты';
  if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) return 'Мобильные';
  return 'Десктоп';
}

function getReferrerSource(referrer) {
  if (!referrer) return 'Прямой заход';
  try {
    return new URL(referrer).hostname.replace(/^www\./, '');
  } catch (error) {
    return 'Другой источник';
  }
}

function incrementMap(map, key, amount = 1) {
  map.set(key, (map.get(key) || 0) + amount);
}

function mapToSortedList(map, labelKey = 'name', valueKey = 'views', limit = 10) {
  return [...map.entries()]
    .map(([key, value]) => ({ [labelKey]: key, [valueKey]: value }))
    .sort((a, b) => b[valueKey] - a[valueKey])
    .slice(0, limit);
}

function getEventCount(events, type) {
  return events.filter((event) => event.type === type).length;
}

function getConversionPercent(nextValue, prevValue) {
  if (!prevValue) return 0;
  return Number(((nextValue / prevValue) * 100).toFixed(1));
}

export const createPageView = async (req, res) => {
  const { path, title, referrer, sessionId } = req.body;

  if (!path || typeof path !== 'string') {
    return res.status(400).json({ error: 'path обязателен' });
  }

  try {
    const ip = getClientIp(req);
    const userAgent = truncate(req.headers['user-agent'], MAX_USER_AGENT_LENGTH);
    const userId = getUserIdFromToken(req);
    const region = truncate(req.headers['cf-ipcity'] || 'Almaty', MAX_LOCATION_LENGTH);

    await prisma.pageView.create({
      data: {
        path: truncate(path, MAX_PATH_LENGTH),
        title: title ? truncate(title, MAX_TITLE_LENGTH) : null,
        referrer: referrer ? truncate(referrer, MAX_REFERRER_LENGTH) : null,
        userAgent,
        ip,
        sessionId: sessionId ? truncate(sessionId, MAX_SESSION_ID_LENGTH) : null,
        region,
        userId,
      },
    });

    if (userId && sessionId) {
      Promise.all([
        prisma.analyticsEvent.updateMany({
          where: { sessionId, userId: null },
          data: { userId }
        }),
        prisma.pageView.updateMany({
          where: { sessionId, userId: null },
          data: { userId }
        })
      ]).catch(err => console.error('Error retroactively linking session events:', err));
    }

    res.status(201).json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка записи просмотра страницы: ' + error.message });
  }
};

export const createAnalyticsEvent = async (req, res) => {
  const { type, path, sessionId, productId, orderId, searchQuery, value, metadata } = req.body;

  if (!type || typeof type !== 'string') {
    return res.status(400).json({ error: 'type обязателен' });
  }

  try {
    const ip = getClientIp(req);
    const userAgent = truncate(req.headers['user-agent'], MAX_USER_AGENT_LENGTH);
    const userId = getUserIdFromToken(req);
    const region = truncate(req.headers['cf-ipcity'] || 'Almaty', MAX_LOCATION_LENGTH);

    await prisma.analyticsEvent.create({
      data: {
        type: truncate(type, MAX_EVENT_TYPE_LENGTH),
        path: path ? truncate(path, MAX_PATH_LENGTH) : null,
        sessionId: sessionId ? truncate(sessionId, MAX_SESSION_ID_LENGTH) : null,
        userId,
        productId: productId ? parseInt(productId, 10) : null,
        orderId: orderId ? parseInt(orderId, 10) : null,
        searchQuery: searchQuery ? truncate(searchQuery, MAX_SEARCH_QUERY_LENGTH) : null,
        value: value ? parseFloat(value) : null,
        metadata: metadata || null,
        userAgent,
        ip,
        region,
      },
    });

    if (userId && sessionId) {
      Promise.all([
        prisma.analyticsEvent.updateMany({
          where: { sessionId, userId: null },
          data: { userId }
        }),
        prisma.pageView.updateMany({
          where: { sessionId, userId: null },
          data: { userId }
        })
      ]).catch(err => console.error('Error retroactively linking session events:', err));
    }

    res.status(201).json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка записи аналитического события: ' + error.message });
  }
};

export const getAnalyticsSummary = async (req, res) => {
  const range = req.query.range || 'week';
  const startDate = getStartDate(range);
  const where = startDate ? { createdAt: { gte: startDate } } : {};
  const todayStart = getStartDate('day');

  try {
    const [totalViews, todayViews, uniqueSessions, topPagesRaw, recentViews, periodViews, periodEvents] = await Promise.all([
      prisma.pageView.count({ where }),
      prisma.pageView.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.pageView.findMany({
        where: {
          ...where,
          sessionId: { not: null },
        },
        distinct: ['sessionId'],
        select: { sessionId: true },
      }),
      prisma.pageView.groupBy({
        by: ['path'],
        where,
        _count: { path: true },
        orderBy: { _count: { path: 'desc' } },
        take: 10,
      }),
      prisma.pageView.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          path: true,
          title: true,
          referrer: true,
          userAgent: true,
          sessionId: true,
          region: true,
          country: true,
          city: true,
          createdAt: true,
          userId: true,
        },
      }),
      prisma.pageView.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        take: 10000,
        select: {
          path: true,
          referrer: true,
          userAgent: true,
          sessionId: true,
          region: true,
          country: true,
          city: true,
          createdAt: true,
          userId: true,
        },
      }),
      prisma.analyticsEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 10000,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      }),
    ]);

    const viewsByDate = new Map();
    const sessionsByDate = new Map();
    const referrers = new Map();
    const devices = new Map();
    const browsers = new Map();
    const hours = new Map();
    const regions = new Map();
    const sessionPageCounts = new Map();
    let authenticatedViews = 0;

    periodViews.forEach((view) => {
      const dateKey = getDateKey(view.createdAt);
      incrementMap(viewsByDate, dateKey);

      if (!sessionsByDate.has(dateKey)) sessionsByDate.set(dateKey, new Set());
      if (view.sessionId) sessionsByDate.get(dateKey).add(view.sessionId);

      incrementMap(referrers, getReferrerSource(view.referrer));
      incrementMap(devices, getDevice(view.userAgent || ''));
      incrementMap(browsers, getBrowser(view.userAgent || ''));
      incrementMap(hours, new Date(view.createdAt).getHours());
      incrementMap(regions, view.region || view.city || 'Регион не указан');

      if (view.sessionId) incrementMap(sessionPageCounts, view.sessionId);
      if (view.userId) authenticatedViews += 1;
    });

    const uniqueVisitorCount = uniqueSessions.length;
    const singlePageSessions = [...sessionPageCounts.values()].filter((count) => count === 1).length;
    const bounceRate = uniqueVisitorCount > 0 ? Math.round((singlePageSessions / uniqueVisitorCount) * 100) : 0;
    const avgViewsPerSession = uniqueVisitorCount > 0 ? Number((totalViews / uniqueVisitorCount).toFixed(1)) : 0;
    const productViews = getEventCount(periodEvents, 'product_view');
    const addToCart = getEventCount(periodEvents, 'add_to_cart');
    const checkoutStart = getEventCount(periodEvents, 'checkout_start');
    const ordersCreated = getEventCount(periodEvents, 'order_created');
    const orderRevenue = periodEvents
      .filter((event) => event.type === 'order_created')
      .reduce((sum, event) => sum + (event.value || 0), 0);

    const productStats = new Map();
    const searchStats = new Map();
    const sourceRevenue = new Map();
    const regionStats = new Map();
    const sessionSources = new Map();
    const sessionRegions = new Map();

    periodViews.forEach((view) => {
      if (view.sessionId && !sessionSources.has(view.sessionId)) {
        sessionSources.set(view.sessionId, getReferrerSource(view.referrer));
      }
      if (view.sessionId && !sessionRegions.has(view.sessionId)) {
        sessionRegions.set(view.sessionId, view.region || view.city || 'Регион не указан');
      }
    });

    periodEvents.forEach((event) => {
      if (event.productId && ['product_view', 'add_to_cart'].includes(event.type)) {
        const current = productStats.get(event.productId) || {
          productId: event.productId,
          name: event.product?.name || `Товар #${event.productId}`,
          category: event.product?.category || null,
          views: 0,
          cartAdds: 0,
        };

        if (event.type === 'product_view') current.views += 1;
        if (event.type === 'add_to_cart') current.cartAdds += 1;
        productStats.set(event.productId, current);
      }

      if (event.type === 'search' && event.searchQuery) {
        const key = event.searchQuery.trim().toLowerCase();
        const current = searchStats.get(key) || { query: event.searchQuery.trim(), count: 0 };
        current.count += 1;
        searchStats.set(key, current);
      }

      if (event.type === 'order_created') {
        incrementMap(sourceRevenue, sessionSources.get(event.sessionId) || 'Неизвестно', event.value || 0);
      }

      const regionName = event.region || sessionRegions.get(event.sessionId) || 'Регион не указан';
      const currentRegion = regionStats.get(regionName) || {
        region: regionName,
        views: regions.get(regionName) || 0,
        productViews: 0,
        cartAdds: 0,
        checkouts: 0,
        orders: 0,
        revenue: 0,
      };

      if (event.type === 'product_view') currentRegion.productViews += 1;
      if (event.type === 'add_to_cart') currentRegion.cartAdds += 1;
      if (event.type === 'checkout_start') currentRegion.checkouts += 1;
      if (event.type === 'order_created') {
        currentRegion.orders += 1;
        currentRegion.revenue += event.value || 0;
      }
      regionStats.set(regionName, currentRegion);
    });

    regions.forEach((views, regionName) => {
      const currentRegion = regionStats.get(regionName) || {
        region: regionName,
        views: 0,
        productViews: 0,
        cartAdds: 0,
        checkouts: 0,
        orders: 0,
        revenue: 0,
      };
      currentRegion.views = views;
      regionStats.set(regionName, currentRegion);
    });

    const topViewedProducts = [...productStats.values()]
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
    const topCartProducts = [...productStats.values()]
      .sort((a, b) => b.cartAdds - a.cartAdds)
      .slice(0, 10);
    const topSearches = [...searchStats.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.json({
      totalViews,
      todayViews,
      uniqueVisitors: uniqueVisitorCount,
      authenticatedViews,
      anonymousViews: Math.max(0, totalViews - authenticatedViews),
      avgViewsPerSession,
      bounceRate,
      orderRevenue,
      funnel: [
        { key: 'page_view', label: 'Посещения', count: totalViews, conversion: 100 },
        { key: 'product_view', label: 'Просмотры товаров', count: productViews, conversion: getConversionPercent(productViews, totalViews) },
        { key: 'add_to_cart', label: 'Добавления в корзину', count: addToCart, conversion: getConversionPercent(addToCart, productViews) },
        { key: 'checkout_start', label: 'Начали оформление', count: checkoutStart, conversion: getConversionPercent(checkoutStart, addToCart) },
        { key: 'order_created', label: 'Заказы', count: ordersCreated, conversion: getConversionPercent(ordersCreated, checkoutStart) },
      ],
      topViewedProducts,
      topCartProducts,
      topSearches,
      sourceRevenue: mapToSortedList(sourceRevenue, 'source', 'revenue', 10),
      regions: [...regionStats.values()]
        .map((entry) => ({
          ...entry,
          conversion: getConversionPercent(entry.orders, entry.views),
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 20),
      topPages: topPagesRaw.map((entry) => ({
        path: entry.path,
        views: entry._count.path,
      })),
      viewsByDate: [...viewsByDate.entries()].map(([date, views]) => ({
        date,
        views,
        visitors: sessionsByDate.get(date)?.size || 0,
      })),
      topReferrers: mapToSortedList(referrers, 'source', 'views', 10),
      devices: mapToSortedList(devices, 'device', 'views', 10),
      browsers: mapToSortedList(browsers, 'browser', 'views', 10),
      peakHours: [...Array(24)].map((_, hour) => ({
        hour,
        views: hours.get(hour) || 0,
      })),
      recentViews,
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения аналитики: ' + error.message });
  }
};
