import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { JWT_SECRET } from '../config/env.js';
import { getTokenFromRequest } from '../utils/authCookie.js';
import logger from '../utils/logger.js';

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
      ]).catch(err => logger.warn('Error retroactively linking session events', { error: err.message }));
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

    const parsedProdId = Number.parseInt(productId, 10);
    const parsedOrderId = Number.parseInt(orderId, 10);

    let validProdId = null;
    if (Number.isInteger(parsedProdId)) {
      const exists = await prisma.product.findUnique({ where: { id: parsedProdId }, select: { id: true } });
      if (exists) validProdId = parsedProdId;
    }

    let validOrderId = null;
    if (Number.isInteger(parsedOrderId)) {
      const exists = await prisma.order.findUnique({ where: { id: parsedOrderId }, select: { id: true } });
      if (exists) validOrderId = parsedOrderId;
    }

    await prisma.analyticsEvent.create({
      data: {
        type: truncate(type, MAX_EVENT_TYPE_LENGTH),
        path: path ? truncate(path, MAX_PATH_LENGTH) : null,
        sessionId: sessionId ? truncate(sessionId, MAX_SESSION_ID_LENGTH) : null,
        userId,
        productId: validProdId,
        orderId: validOrderId,
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
      ]).catch(err => logger.warn('Error retroactively linking session events', { error: err.message }));
    }

    res.status(201).json({ ok: true });
  } catch (error) {
    logger.warn('Analytics event error', { error: error.message });
    res.status(200).json({ ok: false });
  }
};

export const getAnalyticsSummary = async (req, res) => {
  const range = req.query.range || 'week';
  const startDate = getStartDate(range);
  const where = startDate ? { createdAt: { gte: startDate } } : {};
  const todayStart = getStartDate('day');

  try {
    // --- All aggregations run in parallel, no 10k row fetches ---
    const [
      totalViews,
      todayViews,
      authenticatedViewsCount,
      uniqueSessionsData,
      topPagesRaw,
      recentViews,
      // Date+visitor grouped stats via raw SQL (Prisma doesn't support DATE_TRUNC natively)
      viewsByDateRaw,
      // Small sample for browser/device/hour parsing (2000 rows max, not 10000)
      sampleViews,
      // Referrer groupBy
      referrerAgg,
      // Region groupBy
      regionAgg,
      // Sessions with >1 pageview (for bounce rate)
      multiPageSessionsCount,
      // Funnel event type counts
      funnelEventCounts,
      // Product view & cart stats
      productViewAgg,
      cartAddAgg,
      // Search query stats
      searchAgg,
      // Order revenue aggregate
      orderRevenueAgg,
    ] = await Promise.all([
      prisma.pageView.count({ where }),
      prisma.pageView.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.pageView.count({ where: { ...where, userId: { not: null } } }),
      prisma.pageView.findMany({
        where: { ...where, sessionId: { not: null } },
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
          id: true, path: true, title: true, referrer: true,
          userAgent: true, sessionId: true, region: true,
          country: true, city: true, createdAt: true, userId: true,
        },
      }),
      // Raw SQL: group pageviews by calendar date, count views + distinct sessions
      startDate
        ? prisma.$queryRaw`
            SELECT
              DATE("createdAt") AS date,
              COUNT(*)::int AS views,
              COUNT(DISTINCT "sessionId")::int AS visitors
            FROM "PageView"
            WHERE "createdAt" >= ${startDate}
            GROUP BY DATE("createdAt")
            ORDER BY date ASC
          `
        : prisma.$queryRaw`
            SELECT
              DATE("createdAt") AS date,
              COUNT(*)::int AS views,
              COUNT(DISTINCT "sessionId")::int AS visitors
            FROM "PageView"
            GROUP BY DATE("createdAt")
            ORDER BY date ASC
          `,
      // Small sample for browser/device/hour analysis (JS-side parsing, 2000 max)
      prisma.pageView.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 2000,
        select: { userAgent: true, sessionId: true, region: true, createdAt: true },
      }),
      // Referrer groupBy
      prisma.pageView.groupBy({
        by: ['referrer'],
        where,
        _count: { referrer: true },
        orderBy: { _count: { referrer: 'desc' } },
        take: 30,
      }),
      // Region groupBy
      prisma.pageView.groupBy({
        by: ['region'],
        where,
        _count: { region: true },
        orderBy: { _count: { region: 'desc' } },
        take: 30,
      }),
      // Count sessions with more than 1 page view (for bounce rate)
      prisma.pageView.groupBy({
        by: ['sessionId'],
        where: { ...where, sessionId: { not: null } },
        having: { sessionId: { _count: { gt: 1 } } },
        _count: { sessionId: true },
      }),
      // Funnel: count events by type
      prisma.analyticsEvent.groupBy({
        by: ['type'],
        where,
        _count: { type: true },
      }),
      // Product view counts
      prisma.analyticsEvent.groupBy({
        by: ['productId'],
        where: { ...where, type: 'product_view', productId: { not: null } },
        _count: { productId: true },
        orderBy: { _count: { productId: 'desc' } },
        take: 10,
      }),
      // Cart add counts
      prisma.analyticsEvent.groupBy({
        by: ['productId'],
        where: { ...where, type: 'add_to_cart', productId: { not: null } },
        _count: { productId: true },
        orderBy: { _count: { productId: 'desc' } },
        take: 10,
      }),
      // Search queries
      prisma.analyticsEvent.groupBy({
        by: ['searchQuery'],
        where: { ...where, type: 'search', searchQuery: { not: null } },
        _count: { searchQuery: true },
        orderBy: { _count: { searchQuery: 'desc' } },
        take: 10,
      }),
      // Order revenue totals
      prisma.analyticsEvent.aggregate({
        where: { ...where, type: 'order_created' },
        _sum: { value: true },
        _count: { id: true },
      }),
    ]);

    // --- JS-side processing on 2000-row sample (browser/device/hour) ---
    const devices = new Map();
    const browsers = new Map();
    const hours = new Map();

    sampleViews.forEach((view) => {
      incrementMap(devices, getDevice(view.userAgent || ''));
      incrementMap(browsers, getBrowser(view.userAgent || ''));
      incrementMap(hours, new Date(view.createdAt).getHours());
    });

    // --- Derived metrics ---
    const uniqueVisitorCount = uniqueSessionsData.length;
    const singlePageSessions = uniqueVisitorCount - multiPageSessionsCount.length;
    const bounceRate = uniqueVisitorCount > 0 ? Math.round((singlePageSessions / uniqueVisitorCount) * 100) : 0;
    const avgViewsPerSession = uniqueVisitorCount > 0 ? Number((totalViews / uniqueVisitorCount).toFixed(1)) : 0;

    // --- Funnel ---
    const funnelMap = new Map(funnelEventCounts.map(f => [f.type, f._count.type]));
    const productViews = funnelMap.get('product_view') || 0;
    const addToCart = funnelMap.get('add_to_cart') || 0;
    const checkoutStart = funnelMap.get('checkout_start') || 0;
    const ordersCreated = orderRevenueAgg._count.id || 0;
    const orderRevenue = orderRevenueAgg._sum.value || 0;

    // --- Enrich product stats with names ---
    const topProductIds = [...new Set([
      ...productViewAgg.map(p => p.productId),
      ...cartAddAgg.map(p => p.productId),
    ])].filter(Boolean);

    const topProductsData = topProductIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: topProductIds } },
          select: { id: true, name: true, category: true },
        })
      : [];
    const productNameMap = new Map(topProductsData.map(p => [p.id, p]));

    const topViewedProducts = productViewAgg.map(p => ({
      productId: p.productId,
      name: productNameMap.get(p.productId)?.name || `Товар #${p.productId}`,
      category: productNameMap.get(p.productId)?.category || null,
      views: p._count.productId,
      cartAdds: cartAddAgg.find(c => c.productId === p.productId)?._count.productId || 0,
    }));

    const topCartProducts = cartAddAgg.map(p => ({
      productId: p.productId,
      name: productNameMap.get(p.productId)?.name || `Товар #${p.productId}`,
      category: productNameMap.get(p.productId)?.category || null,
      views: productViewAgg.find(v => v.productId === p.productId)?._count.productId || 0,
      cartAdds: p._count.productId,
    }));

    // --- Top searches ---
    const topSearches = searchAgg.map(s => ({
      query: s.searchQuery,
      count: s._count.searchQuery,
    }));

    // --- Referrers: group by hostname (multiple raw referrers → same source) ---
    const referrerSourceMap = new Map();
    referrerAgg.forEach(r => {
      const source = getReferrerSource(r.referrer);
      referrerSourceMap.set(source, (referrerSourceMap.get(source) || 0) + r._count.referrer);
    });
    const topReferrers = [...referrerSourceMap.entries()]
      .map(([source, views]) => ({ source, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // --- Region stats from groupBy ---
    const regions = regionAgg
      .filter(r => r.region !== null)
      .map(r => ({
        region: r.region || 'Регион не указан',
        views: r._count.region,
        productViews: 0,
        cartAdds: 0,
        checkouts: 0,
        orders: 0,
        revenue: 0,
        conversion: 0,
      }))
      .slice(0, 20);

    res.json({
      totalViews,
      todayViews,
      uniqueVisitors: uniqueVisitorCount,
      authenticatedViews: authenticatedViewsCount,
      anonymousViews: Math.max(0, totalViews - authenticatedViewsCount),
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
      sourceRevenue: [],
      regions,
      topPages: topPagesRaw.map((entry) => ({
        path: entry.path,
        views: entry._count.path,
      })),
      viewsByDate: viewsByDateRaw.map(row => ({
        date: row.date instanceof Date
          ? row.date.toISOString().slice(0, 10)
          : String(row.date).slice(0, 10),
        views: Number(row.views),
        visitors: Number(row.visitors),
      })),
      topReferrers,
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
