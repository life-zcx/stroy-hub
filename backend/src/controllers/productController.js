import prisma from '../config/db.js';
import { Prisma } from '@prisma/client';
import { attachActivePromotionsToProduct } from '../utils/promotionUtils.js';
import XlsxPopulate from 'xlsx-populate';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import redisClient from '../config/redis.js';
import logger from '../utils/logger.js';
import { processAndUploadMedia } from '../utils/mediaOptimizer.js';
import { slugify } from '../utils/slugify.js';

export async function ensureProductSlug(product) {
  if (!product || product.slug) return product;
  const baseSlug = slugify(product.name) || 'product';
  let candidate = baseSlug;
  let suffix = 1;

  while (true) {
    const existing = await prisma.product.findFirst({
      where: { slug: candidate, id: { not: product.id } },
      select: { id: true }
    });
    if (!existing) break;
    candidate = `${baseSlug}-${suffix++}`;
  }

  try {
    const updated = await prisma.product.update({
      where: { id: product.id },
      data: { slug: candidate }
    });
    return { ...product, slug: updated.slug };
  } catch (err) {
    logger.warn(`Could not save slug for product ${product.id}: ${err.message}`);
    return { ...product, slug: candidate };
  }
}


// Helper to clear products cache
const clearProductsCache = async () => {
  try {
    const keys = await redisClient.keys('products:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info(`Cleared products cache: ${keys.length} keys`);
    }
  } catch (err) {
    logger.error('Error clearing products cache:', err);
  }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper path to store pricing settings (stored outside src/ so nodemon does not restart on save)
const pricingSettingsPath = path.join(process.cwd(), 'config', 'pricing_settings.json');
const legacyPricingSettingsPath = path.join(__dirname, '..', 'config', 'pricing_settings.json');

function normalizeSpreadsheetCell(value) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== 'object') return value;
  if ('result' in value) return normalizeSpreadsheetCell(value.result);
  if ('text' in value) return value.text;
  if ('richText' in value && Array.isArray(value.richText)) {
    return value.richText.map((part) => part.text || '').join('');
  }
  if ('hyperlink' in value && 'text' in value) return value.text;
  return String(value);
}

function detectCsvDelimiter(text) {
  const firstLine = text.split(/\r?\n/, 1)[0] || '';
  const candidates = [',', ';', '\t'];
  return candidates
    .map((delimiter) => ({ delimiter, count: firstLine.split(delimiter).length }))
    .sort((a, b) => b.count - a.count)[0].delimiter;
}

function parseCsvRows(buffer) {
  const text = buffer.toString('utf8').replace(/^\uFEFF/, '');
  const delimiter = detectCsvDelimiter(text);
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        value += '"';
        index++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === delimiter) {
      row.push(value.trim());
      value = '';
      continue;
    }

    if (!inQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && nextChar === '\n') index++;
      row.push(value.trim());
      if (row.some((cell) => cell !== '')) rows.push(row);
      row = [];
      value = '';
      continue;
    }

    value += char;
  }

  row.push(value.trim());
  if (row.some((cell) => cell !== '')) rows.push(row);

  return rows;
}

async function readSpreadsheetRows(file) {
  const extension = path.extname(file.originalname || '').toLowerCase();

  if (extension === '.csv') {
    return parseCsvRows(file.buffer);
  }

  const workbook = await XlsxPopulate.fromDataAsync(file.buffer);
  const sheet = workbook.sheets()[0];
  const range = sheet?.usedRange();
  const rows = range ? range.value() : [];
  return rows
    .map((row) => row.map(normalizeSpreadsheetCell))
    .filter((row) => row.some((value) => value !== null && String(value).trim() !== ''));
}

function rowsToObjects(rows) {
  if (rows.length < 2) return [];

  const headers = rows[0].map((value) => String(value || '').trim());
  return rows.slice(1).map((row) => headers.reduce((entry, header, index) => {
    if (header) entry[header] = row[index] ?? null;
    return entry;
  }, {}));
}

// Default pricing settings
const DEFAULT_PRICING_SETTINGS = {
  markups: {
    mixes: 15,
    lumber: 12,
    tools: 20,
    paints: 18,
    hardware: 25
  },
  overrides: {},
  logisticsPercent: 5,
  acquiringPercent: 2,
  cashbackPercent: 3,
  promoCoveragePercent: 30,
  promoDiscountPercent: 10,
  taxPercent: 0
};

export function readPricingSettings() {
  try {
    const targetPath = fs.existsSync(pricingSettingsPath) ? pricingSettingsPath : legacyPricingSettingsPath;
    if (fs.existsSync(targetPath)) {
      const data = fs.readFileSync(targetPath, 'utf8');
      const parsed = JSON.parse(data);
      return {
        ...DEFAULT_PRICING_SETTINGS,
        ...parsed,
        markups: { ...DEFAULT_PRICING_SETTINGS.markups, ...(parsed.markups || {}) },
        overrides: { ...DEFAULT_PRICING_SETTINGS.overrides, ...(parsed.overrides || {}) }
      };
    }
  } catch (error) {
    console.error('Error reading pricing settings:', error);
  }
  return DEFAULT_PRICING_SETTINGS;
}

function writePricingSettings(settings) {
  try {
    const dir = path.dirname(pricingSettingsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(pricingSettingsPath, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing pricing settings:', error);
    return false;
  }
}

export const getPricingSettings = async (req, res) => {
  try {
    const settings = readPricingSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения настроек ценообразования: ' + error.message });
  }
};

export const logPriceChange = async ({
  productId,
  productName,
  oldPrice,
  newPrice,
  oldMarkup,
  newMarkup,
  changeType,
  details,
  changedBy
}) => {
  try {
    await prisma.priceLog.create({
      data: {
        productId: productId ? parseInt(productId) : null,
        productName: productName || null,
        oldPrice: oldPrice !== undefined && oldPrice !== null ? parseFloat(oldPrice) : null,
        newPrice: newPrice !== undefined && newPrice !== null ? parseFloat(newPrice) : null,
        oldMarkup: oldMarkup !== undefined && oldMarkup !== null ? parseFloat(oldMarkup) : null,
        newMarkup: newMarkup !== undefined && newMarkup !== null ? parseFloat(newMarkup) : null,
        changeType: changeType || 'PRODUCT_UPDATE',
        details: details || null,
        changedBy: changedBy || 'Администратор',
      }
    });
  } catch (err) {
    console.error('Failed to log price change:', err.message);
  }
};

export const getPriceLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
    const skip = (page - 1) * limit;
    const productId = req.query.productId ? parseInt(req.query.productId, 10) : undefined;
    const changeType = req.query.changeType || undefined;

    const where = {};
    if (productId) where.productId = productId;
    if (changeType) where.changeType = changeType;

    const [logs, total] = await Promise.all([
      prisma.priceLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.priceLog.count({ where }),
    ]);

    res.json({
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения истории цен: ' + error.message });
  }
};

export const savePricingSettings = async (req, res) => {
  const {
    markups,
    overrides,
    logisticsPercent,
    acquiringPercent,
    cashbackPercent,
    promoCoveragePercent,
    promoDiscountPercent,
    taxPercent
  } = req.body;
  if (!markups || !overrides) {
    return res.status(400).json({ error: 'Необходимо передать markups и overrides' });
  }
  try {
    const oldSettings = readPricingSettings();

    const newSettings = {
      markups,
      overrides,
      logisticsPercent: logisticsPercent !== undefined ? parseFloat(logisticsPercent) : 5,
      acquiringPercent: acquiringPercent !== undefined ? parseFloat(acquiringPercent) : 2,
      cashbackPercent: cashbackPercent !== undefined ? parseFloat(cashbackPercent) : 3,
      promoCoveragePercent: promoCoveragePercent !== undefined ? parseFloat(promoCoveragePercent) : 30,
      promoDiscountPercent: promoDiscountPercent !== undefined ? parseFloat(promoDiscountPercent) : 10,
      taxPercent: taxPercent !== undefined ? parseFloat(taxPercent) : 3
    };

    const success = writePricingSettings(newSettings);

    if (success) {
      await clearProductsCache();
      const adminName = req.user?.name || req.user?.email || 'Администратор';

      if (oldSettings) {
        // 1. Log category markup changes
        if (oldSettings.markups) {
          Object.keys(markups).forEach(cat => {
            if (oldSettings.markups[cat] !== markups[cat]) {
              const catName = cat === 'mixes' ? 'Сухие смеси' : cat === 'lumber' ? 'Пиломатериалы' : cat === 'tools' ? 'Инструменты' : cat === 'paints' ? 'Краски' : cat === 'hardware' ? 'Крепеж' : cat;
              logPriceChange({
                changeType: 'MARKUP_CHANGE',
                productName: `Категория "${catName}"`,
                oldMarkup: oldSettings.markups[cat] ?? 0,
                newMarkup: markups[cat],
                details: `Изменена базовая наценка категории: ${oldSettings.markups[cat] ?? 0}% → ${markups[cat]}%`,
                changedBy: adminName
              });
            }
          });
        }

        // 2. Log individual product override changes with exact retail price calculations (Было ₸ / Стало ₸)
        const oldOverrides = oldSettings.overrides || {};
        const newOverrides = overrides || {};
        const allOverrideKeys = Array.from(new Set([...Object.keys(oldOverrides), ...Object.keys(newOverrides)]));
        const changedOverrideIds = [];

        allOverrideKeys.forEach(prodId => {
          if (oldOverrides[prodId] !== newOverrides[prodId]) {
            const idNum = parseInt(prodId, 10);
            if (!isNaN(idNum)) changedOverrideIds.push(idNum);
          }
        });

        if (changedOverrideIds.length > 0) {
          const changedProds = await prisma.product.findMany({
            where: { id: { in: changedOverrideIds } },
            select: { id: true, name: true, price: true, category: true, categoryId: true }
          });

          // Fetch categories to resolve default markup
          const allCats = await prisma.category.findMany();
          const categoryMap = new Map(allCats.map(c => [c.id, c]));
          const categorySlugMap = new Map(allCats.map(c => [c.slug, c]));

          for (const prod of changedProds) {
            const defaultMarkup = resolveCategoryMarkup(prod, oldSettings.markups || {}, categoryMap, categorySlugMap);
            const oldMarkupVal = oldOverrides[prod.id] !== undefined ? oldOverrides[prod.id] : defaultMarkup;
            const newMarkupVal = newOverrides[prod.id] !== undefined ? newOverrides[prod.id] : defaultMarkup;

            const oldRetail = calculatePriceBottomUp(prod.price, oldMarkupVal, oldSettings);
            const newRetail = calculatePriceBottomUp(prod.price, newMarkupVal, newSettings);

            const oldLabel = oldOverrides[prod.id] !== undefined ? `${oldOverrides[prod.id]}%` : `${defaultMarkup}% (категорийная)`;
            const newLabel = newOverrides[prod.id] !== undefined ? `${newOverrides[prod.id]}%` : `${defaultMarkup}% (категорийная)`;

            await logPriceChange({
              productId: prod.id,
              productName: prod.name,
              oldPrice: oldRetail,
              newPrice: newRetail,
              oldMarkup: oldMarkupVal,
              newMarkup: newMarkupVal,
              changeType: 'MARKUP_CHANGE',
              details: `Изменена наценка товара: ${oldLabel} → ${newLabel}`,
              changedBy: adminName
            });
          }
        }

        // 3. Log cost structure changes
        const structureChanges = [];
        if (oldSettings.logisticsPercent !== newSettings.logisticsPercent) {
          structureChanges.push(`Логистика: ${oldSettings.logisticsPercent}% → ${newSettings.logisticsPercent}%`);
        }
        if (oldSettings.acquiringPercent !== newSettings.acquiringPercent) {
          structureChanges.push(`Эквайринг: ${oldSettings.acquiringPercent}% → ${newSettings.acquiringPercent}%`);
        }
        if (oldSettings.taxPercent !== newSettings.taxPercent) {
          structureChanges.push(`Налоги: ${oldSettings.taxPercent}% → ${newSettings.taxPercent}%`);
        }

        if (structureChanges.length > 0) {
          await logPriceChange({
            changeType: 'MARKUP_CHANGE',
            productName: 'Структура расходов',
            details: structureChanges.join('; '),
            changedBy: adminName
          });
        }
      }
      res.json({ message: 'Настройки ценообразования успешно сохранены' });
    } else {
      res.status(500).json({ error: 'Не удалось записать файл настроек' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сохранения настроек ценообразования: ' + error.message });
  }
};

export function calculatePriceBottomUp(wholesalePrice, activeMarkup, settings) {
  const logisticsPercent = settings.logisticsPercent !== undefined ? settings.logisticsPercent : 5;
  const acquiringPercent = settings.acquiringPercent !== undefined ? settings.acquiringPercent : 2;
  const cashbackPercent = settings.cashbackPercent !== undefined ? settings.cashbackPercent : 3;
  const promoCoveragePercent = settings.promoCoveragePercent !== undefined ? settings.promoCoveragePercent : 30;
  const promoDiscountPercent = settings.promoDiscountPercent !== undefined ? settings.promoDiscountPercent : 10;
  const taxPercent = settings.taxPercent !== undefined ? settings.taxPercent : 3;

  const logisticsAmount = wholesalePrice * (logisticsPercent / 100);
  const acquiringAmount = wholesalePrice * (acquiringPercent / 100);
  const cashbackAmount = wholesalePrice * (cashbackPercent / 100);
  const promoAmount = wholesalePrice * (promoCoveragePercent / 100) * (promoDiscountPercent / 100);
  const taxAmount = wholesalePrice * (taxPercent / 100);

  const breakEven = wholesalePrice + logisticsAmount + acquiringAmount + cashbackAmount + promoAmount + taxAmount;
  const profitAmount = breakEven * (activeMarkup / 100);
  const retailPrice = breakEven + profitAmount;

  return Math.round(retailPrice);
}

function parseId(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function getRequesterSupplierId(req) {
  return parseId(req.user?.supplierId);
}

function isSupplierUser(req) {
  return req.user?.role === 'SUPPLIER';
}

async function getDescendantCategorySlugsAndIds(categorySlugOrId) {
  const allCategories = await prisma.category.findMany({
    select: { id: true, slug: true, parentId: true }
  });

  const parsedId = !isNaN(categorySlugOrId) ? parseInt(categorySlugOrId, 10) : null;
  const rootCategory = allCategories.find(c => 
    parsedId !== null ? c.id === parsedId : c.slug === categorySlugOrId
  );

  if (!rootCategory) {
    return { slugs: [categorySlugOrId], ids: [] };
  }

  // Build parentId -> children list map in memory
  const childrenMap = new Map();
  for (const cat of allCategories) {
    if (cat.parentId !== null) {
      if (!childrenMap.has(cat.parentId)) {
        childrenMap.set(cat.parentId, []);
      }
      childrenMap.get(cat.parentId).push(cat);
    }
  }

  const slugs = [rootCategory.slug];
  const ids = [rootCategory.id];
  const queue = childrenMap.get(rootCategory.id) || [];

  while (queue.length > 0) {
    const current = queue.shift();
    slugs.push(current.slug);
    ids.push(current.id);

    const children = childrenMap.get(current.id);
    if (children && children.length > 0) {
      queue.push(...children);
    }
  }

  return { slugs, ids };
}

export function resolveCategoryMarkup(product, markups, categoryMap, categorySlugMap) {
  let cat = null;
  if (product.categoryId) {
    cat = categoryMap.get(product.categoryId);
  } else if (product.category) {
    cat = categorySlugMap.get(product.category);
  }

  while (cat) {
    // Check by ID
    if (markups[cat.id] !== undefined) {
      return markups[cat.id];
    }
    // Check by Slug (backwards compatibility)
    if (markups[cat.slug] !== undefined) {
      return markups[cat.slug];
    }
    // Traverse up to parent
    cat = cat.parentId ? categoryMap.get(cat.parentId) : null;
  }
  return 15; // default markup
}

export function applyRetailPricingToProduct(product, settings, categoryMap, categorySlugMap) {
  const { markups, overrides } = settings;
  const wholesalePrice = product.price;
  const categoryMarkup = resolveCategoryMarkup(product, markups, categoryMap, categorySlugMap);
  const activeMarkup = overrides[product.id] !== undefined ? overrides[product.id] : categoryMarkup;
  const retailPrice = calculatePriceBottomUp(wholesalePrice, activeMarkup, settings);
  const effectiveCashback = product.cashbackPercent ?? product.categoryRelation?.cashbackPercent ?? 3;

  let mappedOptions = product.options;
  if (product.options && typeof product.options === 'object' && Array.isArray(product.options.items)) {
    const items = product.options.items.map(item => {
      if (item.price !== undefined && item.price !== null && item.price !== '' && !isNaN(parseFloat(item.price))) {
        const itemWholesale = parseFloat(item.price);
        const itemRetail = calculatePriceBottomUp(itemWholesale, activeMarkup, settings);
        return {
          ...item,
          wholesalePrice: itemWholesale,
          price: itemRetail
        };
      }
      return item;
    });
    mappedOptions = {
      ...product.options,
      items
    };
  }

  const wholesaleOldPrice = product.oldPrice;
  const retailOldPrice = product.oldPrice ? calculatePriceBottomUp(product.oldPrice, activeMarkup, settings) : null;

  return {
    ...product,
    wholesalePrice,
    wholesaleOldPrice,
    price: retailPrice,
    oldPrice: retailOldPrice,
    cashbackPercent: effectiveCashback,
    options: mappedOptions,
  };
}

export function computeRealReviewStats(product) {
  if (!product) return product;
  const approvedReviews = Array.isArray(product.reviewsList) ? product.reviewsList : [];
  if (approvedReviews.length === 0) {
    return {
      ...product,
      rating: 0,
      reviews: 0,
      reviewsList: undefined
    };
  }
  const sum = approvedReviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
  const avg = parseFloat((sum / approvedReviews.length).toFixed(1));
  return {
    ...product,
    rating: avg,
    reviews: approvedReviews.length,
    reviewsList: undefined
  };
}

export const getAllProducts = async (req, res) => {
  const {
    category,
    search,
    supplierId,
    page = 1,
    limit = 50,
    sort = 'popular',
    minPrice,
    maxPrice,
    onlyHits,
    onlyBulk,
  } = req.query;

  const pageNum  = Math.max(1, parseInt(page,  10) || 1);
  const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
  const skip     = (pageNum - 1) * limitNum;

  const where = {};

  if (search && search.trim() !== '') {
    const q = search.trim();
    const searchConditions = [
      { name: { contains: q, mode: 'insensitive' } },
      { article: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];

    const searchId = parseInt(q, 10);
    if (!isNaN(searchId) && String(searchId) === q) {
      searchConditions.push({ id: searchId });
    }

    where.OR = searchConditions;
  }

  if (supplierId) {
    const sid = parseInt(supplierId, 10);
    if (!isNaN(sid)) where.supplierId = sid;
  }

  if (onlyHits === 'true') {
    where.isHit = true;
  }

  if (onlyBulk === 'true') {
    where.bulkDiscount = { not: null };
  }

  const parsedMinPrice = Number.parseFloat(minPrice);
  const parsedMaxPrice = Number.parseFloat(maxPrice);
  if (Number.isFinite(parsedMinPrice) || Number.isFinite(parsedMaxPrice)) {
    where.price = {};
    if (Number.isFinite(parsedMinPrice)) where.price.gte = parsedMinPrice;
    if (Number.isFinite(parsedMaxPrice)) where.price.lte = parsedMaxPrice;
  }

  const orderBy = (() => {
    switch (sort) {
      case 'priceAsc':
        return { price: 'asc' };
      case 'priceDesc':
        return { price: 'desc' };
      case 'rating':
        return { rating: 'desc' };
      default:
        return { id: 'desc' };
    }
  })();

  const normalizedQuery = { ...req.query };
  if (normalizedQuery.category) {
    try {
      let cat = decodeURIComponent(normalizedQuery.category);
      if (cat.includes('%')) cat = decodeURIComponent(cat);
      normalizedQuery.category = cat;
    } catch {}
  }

  const cacheKey = `products:all:${JSON.stringify(normalizedQuery)}`;

  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.info(`Products cache hit: ${cacheKey}`);
      return res.json(JSON.parse(cached));
    }

    if (category && category !== 'all') {
      let rawCategory = category;
      try {
        rawCategory = decodeURIComponent(category);
        if (rawCategory.includes('%')) {
          rawCategory = decodeURIComponent(rawCategory);
        }
      } catch {}

      const { slugs, ids } = await getDescendantCategorySlugsAndIds(rawCategory);
      where.OR = [
        { category: { in: slugs } },
        { categoryId: { in: ids } },
      ];
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          supplier: true,
          categoryRelation: true,
          reviewsList: {
            where: { isApproved: true },
            select: { rating: true }
          }
        },
        orderBy,
        skip,
        take: limitNum,
      }),
    ]);

    const settings = readPricingSettings();
    // Fetch all categories to build fast in-memory maps for hierarchical inheritance resolution
    const allCats = await prisma.category.findMany();
    const categoryMap = new Map(allCats.map(c => [c.id, c]));
    const categorySlugMap = new Map(allCats.map(c => [c.slug, c]));

    const activePromos = await prisma.promotion.findMany({
      where: { isActive: true }
    });

    const mappedProducts = products.map((product) => {
      const realStats = computeRealReviewStats(product);
      const priced = applyRetailPricingToProduct(realStats, settings, categoryMap, categorySlugMap);
      return attachActivePromotionsToProduct(priced, activePromos);
    });

    const result = {
      data:       mappedProducts,
      total,
      page:       pageNum,
      limit:      limitNum,
      totalPages: Math.ceil(total / limitNum),
      hasMore:    pageNum * limitNum < total,
    };

    await redisClient.set(cacheKey, JSON.stringify(result), { EX: 1800 });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения товаров: ' + error.message });
  }
};

export const getProductById = async (req, res) => {
  const { id } = req.params;
  const cacheKey = `products:id:${id}`;

  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.info(`Product details cache hit: ${cacheKey}`);
      return res.json(JSON.parse(cached));
    }

    const parsedId = parseInt(id, 10);
    const isNumeric = !isNaN(parsedId) && String(parsedId) === String(id);

    let product = await prisma.product.findFirst({
      where: isNumeric ? { id: parsedId } : { slug: id },
      include: { 
        supplier: true,
        categoryRelation: true,
        reviewsList: {
          where: { isApproved: true },
          select: { rating: true }
        }
      }
    });

    if (!product && isNumeric) {
      product = await prisma.product.findFirst({
        where: { slug: id },
        include: {
          supplier: true,
          categoryRelation: true,
          reviewsList: {
            where: { isApproved: true },
            select: { rating: true }
          }
        }
      });
    }

    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    product = await ensureProductSlug(product);

    const settings = readPricingSettings();
    const allCats = await prisma.category.findMany();
    const categoryMap = new Map(allCats.map(c => [c.id, c]));
    const categorySlugMap = new Map(allCats.map(c => [c.slug, c]));

    const activePromos = await prisma.promotion.findMany({
      where: { isActive: true }
    });

    const realStats = computeRealReviewStats(product);
    let mappedProduct = applyRetailPricingToProduct(realStats, settings, categoryMap, categorySlugMap);
    mappedProduct = attachActivePromotionsToProduct(mappedProduct, activePromos);

    await redisClient.set(cacheKey, JSON.stringify(mappedProduct), { EX: 1800 });
    res.json(mappedProduct);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения товара: ' + error.message });
  }
};

export const createProduct = async (req, res) => {
  const {
    name, description, details, specifications, usage, category, price, oldPrice,
    rating, reviews, isHit, bulkDiscount, supplierId, imageUrl, images, categoryId, cashbackPercent, article, options, slug
  } = req.body;
  const requestedSupplierId = parseId(supplierId);
  const requesterSupplierId = getRequesterSupplierId(req);
  const effectiveSupplierId = isSupplierUser(req) ? requesterSupplierId : requestedSupplierId;
  
  if (!name || !category || price === undefined || price === '' || !effectiveSupplierId) {
    return res.status(400).json({ error: 'Обязательные поля: Название, Категория, Цена, Поставщик' });
  }

  if (isSupplierUser(req) && !requesterSupplierId) {
    return res.status(403).json({ error: 'Для вашей учетной записи не привязан поставщик.' });
  }

  if (isSupplierUser(req) && requestedSupplierId && requestedSupplierId !== requesterSupplierId) {
    return res.status(403).json({ error: 'Нельзя создавать товары от имени другого поставщика.' });
  }

  try {
    // Check if category exists if categoryId is provided
    if (categoryId) {
      const parsedCatId = parseInt(categoryId, 10);
      if (!isNaN(parsedCatId)) {
        const cat = await prisma.category.findUnique({
          where: { id: parsedCatId }
        });
        if (!cat) {
          return res.status(400).json({ error: 'Указанная категория не найдена в базе данных. Пожалуйста, обновите страницу.' });
        }
      }
    }

    // Check if supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: effectiveSupplierId }
    });
    
    if (!supplier) {
      return res.status(404).json({ error: 'Указанный дистрибьютор не найден' });
    }

    // Determine image path: uploaded file or external URL
    let finalImage = 'https://placehold.co/400x300/f8fafc/475569?text=Tormag';
    const mainFile = req.files && req.files['imageFile'] ? req.files['imageFile'][0] : (req.file || null);
    const productFolderId = article || 'catalog';

    if (mainFile) {
      const uploadRes = await processAndUploadMedia({
        buffer: mainFile.buffer,
        filePath: mainFile.path,
        originalname: mainFile.originalname,
        folder: 'products',
        entityId: productFolderId
      });
      finalImage = uploadRes.url;
    } else if (imageUrl) {
      finalImage = imageUrl;
    }

    let finalImages = [];
    if (Array.isArray(images)) {
      finalImages = images.filter(img => typeof img === 'string' && img.trim() !== '');
    } else if (typeof images === 'string' && images.trim() !== '') {
      try {
        const parsed = JSON.parse(images);
        if (Array.isArray(parsed)) {
          finalImages = parsed.filter(img => typeof img === 'string' && img.trim() !== '');
        } else {
          finalImages = [images];
        }
      } catch {
        finalImages = [images];
      }
    }

    const additionalFiles = req.files && req.files['additionalImageFiles'] ? req.files['additionalImageFiles'] : [];
    for (const file of additionalFiles) {
      const uploadRes = await processAndUploadMedia({
        buffer: file.buffer,
        filePath: file.path,
        originalname: file.originalname,
        folder: 'products',
        entityId: productFolderId
      });
      finalImages.push(uploadRes.url);
    }


    let parsedOptions = Prisma.DbNull;
    if (options) {
      if (typeof options === 'object') {
        parsedOptions = (options.label && options.items?.length > 0) ? options : Prisma.DbNull;
      } else if (typeof options === 'string' && options.trim() !== '' && options !== 'null') {
        try {
          const parsed = JSON.parse(options);
          parsedOptions = (parsed && parsed.label && parsed.items?.length > 0) ? parsed : Prisma.DbNull;
        } catch {
          parsedOptions = Prisma.DbNull;
        }
      }
    }

    let finalSlug = slugify(slug || name) || 'product';
    let candidateSlug = finalSlug;
    let slugSuffix = 1;
    while (true) {
      const existingSlug = await prisma.product.findFirst({ where: { slug: candidateSlug }, select: { id: true } });
      if (!existingSlug) break;
      candidateSlug = `${finalSlug}-${slugSuffix++}`;
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        slug: candidateSlug,
        description: description || null,
        details: details || null,
        specifications: specifications || null,
        usage: usage || null,
        category,
        categoryId: categoryId ? parseInt(categoryId) : null,
        price: parseFloat(price),
        oldPrice: oldPrice ? parseFloat(oldPrice) : null,
        image: finalImage,
        images: finalImages,
        rating: rating ? parseFloat(rating) : 4.5,
        reviews: reviews ? parseInt(reviews) : 0,
        isHit: isHit === 'true' || isHit === true,
        bulkDiscount: bulkDiscount || null,
        supplierId: effectiveSupplierId,
        cashbackPercent: cashbackPercent !== undefined && cashbackPercent !== '' ? parseInt(cashbackPercent) : null,
        article: article || null,
        options: parsedOptions
      },
      include: {
        supplier: true
      }
    });

    await clearProductsCache();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка создания товара: ' + error.message });
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
    const {
      name, description, details, specifications, usage, category, price, oldPrice,
      rating, reviews, isHit, bulkDiscount, supplierId, imageUrl, images, categoryId, cashbackPercent, article, options, slug
    } = req.body;
  const requesterSupplierId = getRequesterSupplierId(req);
  const requestedSupplierId = supplierId === undefined ? undefined : parseId(supplierId);

  try {
    const existing = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    // Check if category exists if categoryId is being changed
    if (categoryId !== undefined && categoryId !== null && categoryId !== '') {
      const parsedCatId = parseInt(categoryId, 10);
      if (!isNaN(parsedCatId)) {
        const cat = await prisma.category.findUnique({
          where: { id: parsedCatId }
        });
        if (!cat) {
          return res.status(400).json({ error: 'Указанная категория не найдена в базе данных. Пожалуйста, обновите страницу.' });
        }
      }
    }

    if (isSupplierUser(req)) {
      if (!requesterSupplierId) {
        return res.status(403).json({ error: 'Для вашей учетной записи не привязан поставщик.' });
      }

      if (existing.supplierId !== requesterSupplierId) {
        return res.status(403).json({ error: 'Недостаточно прав для изменения этого товара.' });
      }
    }

    let finalImage = existing.image;
    const mainFile = req.files && req.files['imageFile'] ? req.files['imageFile'][0] : (req.file || null);
    const productFolderId = article || existing.article || id;

    if (mainFile) {
      const uploadRes = await processAndUploadMedia({
        buffer: mainFile.buffer,
        filePath: mainFile.path,
        originalname: mainFile.originalname,
        folder: 'products',
        entityId: productFolderId
      });
      finalImage = uploadRes.url;
    } else if (imageUrl !== undefined) {
      finalImage = imageUrl;
    }

    const data = {};
    if (name) data.name = name;
    if (description !== undefined) data.description = description || null;
    if (details !== undefined) data.details = details || null;
    if (specifications !== undefined) data.specifications = specifications || null;
    if (usage !== undefined) data.usage = usage || null;
    if (category) data.category = category;
    if (categoryId !== undefined) data.categoryId = categoryId ? parseInt(categoryId) : null;
    if (price) data.price = parseFloat(price);
    if (oldPrice !== undefined) data.oldPrice = oldPrice ? parseFloat(oldPrice) : null;
    if (finalImage) data.image = finalImage;
    if (rating) data.rating = parseFloat(rating);
    if (reviews) data.reviews = parseInt(reviews);
    if (isHit !== undefined) data.isHit = isHit === 'true' || isHit === true;
    if (bulkDiscount !== undefined) data.bulkDiscount = bulkDiscount || null;
    if (cashbackPercent !== undefined) data.cashbackPercent = cashbackPercent !== '' ? parseInt(cashbackPercent) : null;
    if (slug || name || !existing.slug) {
      let desiredSlug = slugify(slug || name || existing.name) || 'product';
      if (desiredSlug !== existing.slug) {
        let candidateSlug = desiredSlug;
        let slugSuffix = 1;
        while (true) {
          const existingSlug = await prisma.product.findFirst({
            where: { slug: candidateSlug, id: { not: parseInt(id) } },
            select: { id: true }
          });
          if (!existingSlug) break;
          candidateSlug = `${desiredSlug}-${slugSuffix++}`;
        }
        data.slug = candidateSlug;
      }
    }

    if (options !== undefined) {
      if (options === null || options === '' || options === 'null') {
        data.options = Prisma.DbNull;
      } else if (typeof options === 'object') {
        data.options = options;
      } else if (typeof options === 'string') {
        try {
          const parsed = JSON.parse(options);
          data.options = (parsed && parsed.label && parsed.items?.length > 0) ? parsed : Prisma.DbNull;
        } catch {
          data.options = Prisma.DbNull;
        }
      }
    }

    let finalImages = [];
    if (images !== undefined) {
      if (Array.isArray(images)) {
        finalImages = images.filter(img => typeof img === 'string' && img.trim() !== '');
      } else if (typeof images === 'string') {
        try {
          const parsed = JSON.parse(images);
          if (Array.isArray(parsed)) {
            finalImages = parsed.filter(img => typeof img === 'string' && img.trim() !== '');
          } else if (images.trim() !== '') {
            finalImages = [images];
          }
        } catch {
          if (images.trim() !== '') {
            finalImages = [images];
          }
        }
      }
    } else if (existing.images) {
      finalImages = [...existing.images];
    }

    const additionalFiles = req.files && req.files['additionalImageFiles'] ? req.files['additionalImageFiles'] : [];
    for (const file of additionalFiles) {
      const uploadRes = await processAndUploadMedia({
        buffer: file.buffer,
        filePath: file.path,
        originalname: file.originalname,
        folder: 'products',
        entityId: productFolderId
      });
      finalImages.push(uploadRes.url);
    }

    data.images = { set: finalImages };


    if (requestedSupplierId !== undefined) {
      if (requestedSupplierId === null) {
        return res.status(400).json({ error: 'Указан некорректный поставщик.' });
      }

      if (isSupplierUser(req) && requestedSupplierId !== requesterSupplierId) {
        return res.status(403).json({ error: 'Нельзя передавать товар другому поставщику.' });
      }

      const supplier = await prisma.supplier.findUnique({
        where: { id: requestedSupplierId }
      });
      if (!supplier) {
        return res.status(404).json({ error: 'Указанный дистрибьютор не найден' });
      }
      data.supplierId = requestedSupplierId;
    }

    const updated = await prisma.product.update({
      where: { id: parseInt(id) },
      data,
      include: { supplier: true }
    });

    if (existing.price !== updated.price || existing.oldPrice !== updated.oldPrice) {
      const adminName = req.user?.name || req.user?.email || 'Администратор';
      await logPriceChange({
        productId: updated.id,
        productName: updated.name,
        oldPrice: existing.price,
        newPrice: updated.price,
        changeType: 'PRODUCT_UPDATE',
        details: `Обновлена цена товара "${updated.name}" (#${updated.id}): ${existing.price} ₸ → ${updated.price} ₸`,
        changedBy: adminName
      });
    }

    await clearProductsCache();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка обновления товара: ' + error.message });
  }
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  const requesterSupplierId = getRequesterSupplierId(req);

  try {
    const existing = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    if (isSupplierUser(req)) {
      if (!requesterSupplierId) {
        return res.status(403).json({ error: 'Для вашей учетной записи не привязан поставщик.' });
      }

      if (existing.supplierId !== requesterSupplierId) {
        return res.status(403).json({ error: 'Недостаточно прав для удаления этого товара.' });
      }
    }
    
    const targetId = parseInt(id, 10);

    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { productId: targetId } }),
      prisma.analyticsEvent.deleteMany({ where: { productId: targetId } }),
      prisma.review.deleteMany({ where: { productId: targetId } }),
      prisma.returnRequest.deleteMany({ where: { productId: targetId } }),
      prisma.orderItem.deleteMany({ where: { productId: targetId } }),
      prisma.product.delete({ where: { id: targetId } }),
    ]);
    
    await clearProductsCache();
    res.json({ message: 'Товар успешно удален' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка удаления товара: ' + error.message });
  }
};

export const importProductsXlsx = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Пожалуйста, загрузите файл Excel (.xlsx) или .csv' });
  }

  const requesterSupplierId = getRequesterSupplierId(req);
  const bodySupplierId = req.body.supplierId ? parseInt(req.body.supplierId) : null;
  const effectiveSupplierId = isSupplierUser(req) ? requesterSupplierId : (bodySupplierId || requesterSupplierId);

  if (!effectiveSupplierId) {
    return res.status(400).json({ error: 'Необходимо указать ID поставщика (supplierId).' });
  }

  try {
    const spreadsheetRows = await readSpreadsheetRows(req.file);
    const rows = rowsToObjects(spreadsheetRows);

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Файл пуст или содержит некорректные данные' });
    }

    const categories = await prisma.category.findMany();
    const brands = await prisma.brand.findMany();
    const supplier = await prisma.supplier.findUnique({
      where: { id: effectiveSupplierId }
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Указанный поставщик не найден' });
    }

    const categoryMap = {};
    categories.forEach(c => {
      categoryMap[c.name.toLowerCase().trim()] = c;
    });

    const brandNames = new Set(brands.map(b => b.name.toLowerCase().trim()));

    const errors = [];
    const validRows = [];

    const getVal = (row, possibleKeys) => {
      for (const key of Object.keys(row)) {
        const normalizedKey = key.toLowerCase().trim();
        if (possibleKeys.includes(normalizedKey)) {
          return row[key];
        }
      }
      return null;
    };

    rows.forEach((row, index) => {
      const rowNum = index + 2;
      
      const name = getVal(row, ['название', 'наименование', 'name', 'product name']);
      const priceVal = getVal(row, ['цена', 'цена (тенге)', 'цена(тенге)', 'стоимость', 'price']);
      const categoryName = getVal(row, ['категория', 'category']);
      const brandName = getVal(row, ['бренд', 'brand']);
      const articleVal = getVal(row, ['артикул', 'код', 'article', 'sku', 'code']);

      const description = getVal(row, ['краткое описание', 'описание', 'description']) || null;
      const details = getVal(row, ['подробное описание', 'детали', 'details']) || null;
      const specifications = getVal(row, ['характеристики', 'спецификация', 'specifications', 'specs']) || null;
      const usage = getVal(row, ['инструкция', 'применение', 'usage', 'instruction']) || null;
      const bulkDiscount = getVal(row, ['оптовая скидка', 'скидка', 'bulk discount', 'discount']) || null;
      const isHitVal = getVal(row, ['хит', 'популярный', 'is hit', 'hit']);
      const oldPriceVal = getVal(row, ['старая цена', 'old price', 'oldprice']);
      const slugVal = getVal(row, ['чпу slug', 'чпу', 'slug']);

      if (!name) {
        errors.push({ row: rowNum, error: 'Отсутствует название товара' });
        return;
      }

      const price = parseFloat(priceVal);
      if (isNaN(price) || price <= 0) {
        errors.push({ row: rowNum, error: `Недопустимая цена: "${priceVal}". Должно быть положительное число` });
        return;
      }

      if (!categoryName) {
        errors.push({ row: rowNum, error: 'Отсутствует категория' });
        return;
      }

      const normCategory = categoryName.toString().toLowerCase().trim();
      const matchedCategory = categoryMap[normCategory];
      if (!matchedCategory) {
        errors.push({ 
          row: rowNum, 
          error: `Категория "${categoryName}" не найдена в базе данных.` 
        });
        return;
      }

      if (!brandName) {
        errors.push({ row: rowNum, error: 'Отсутствует бренд' });
        return;
      }

      const normBrand = brandName.toString().toLowerCase().trim();
      if (!brandNames.has(normBrand)) {
        errors.push({ 
          row: rowNum, 
          error: `Бренд "${brandName}" не найден в базе данных.` 
        });
        return;
      }

      let isHit = false;
      if (isHitVal) {
        const normHit = isHitVal.toString().toLowerCase().trim();
        isHit = normHit === 'да' || normHit === 'yes' || normHit === 'true' || normHit === '1';
      }

      const oldPrice = oldPriceVal ? parseFloat(oldPriceVal) : null;

      validRows.push({
        name: name.toString().trim(),
        description: description ? description.toString().trim() : null,
        details: details ? details.toString().trim() : null,
        specifications: specifications ? specifications.toString().trim() : null,
        usage: usage ? usage.toString().trim() : null,
        category: matchedCategory.slug,
        categoryId: matchedCategory.id,
        price,
        oldPrice: (oldPrice && !isNaN(oldPrice)) ? oldPrice : null,
        isHit,
        bulkDiscount: bulkDiscount ? bulkDiscount.toString().trim() : null,
        supplierId: effectiveSupplierId,
        image: 'https://placehold.co/400x300/f8fafc/475569?text=Tormag',
        article: articleVal ? articleVal.toString().trim() : null,
        slug: slugVal ? slugVal.toString().trim() : null
      });
    });

    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Файл содержит ошибки валидации', 
        errors 
      });
    }

    const existingProducts = await prisma.product.findMany({
      where: { supplierId: effectiveSupplierId },
      select: { id: true, name: true }
    });

    const existingMap = new Map(
      existingProducts.map(p => [p.name.toLowerCase().trim(), p.id])
    );

    const toCreate = [];
    const toUpdate = [];

    for (const data of validRows) {
      const nameKey = data.name.toLowerCase().trim();
      const existingId = existingMap.get(nameKey);
      if (existingId) {
        toUpdate.push({ id: existingId, data });
      } else {
        toCreate.push(data);
      }
    }

    let createdCount = toCreate.length;
    let updatedCount = toUpdate.length;

    await prisma.$transaction([
      ...(toCreate.length > 0 ? [prisma.product.createMany({ data: toCreate })] : []),
      ...toUpdate.map(item => prisma.product.update({
        where: { id: item.id },
        data: {
          description: item.data.description,
          details: item.data.details,
          specifications: item.data.specifications,
          usage: item.data.usage,
          category: item.data.category,
          categoryId: item.data.categoryId,
          price: item.data.price,
          oldPrice: item.data.oldPrice,
          isHit: item.data.isHit,
          bulkDiscount: item.data.bulkDiscount,
          article: item.data.article
        }
      }))
    ]);

    await clearProductsCache();
    res.json({
      success: true,
      message: 'Импорт успешно завершен',
      createdCount,
      updatedCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка импорта товаров: ' + error.message });
  }
};

export const matchEstimateXlsx = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    const rows = await readSpreadsheetRows(req.file);

    if (!rows || rows.length === 0) {
      return res.status(400).json({ error: 'Файл пустой' });
    }

    // Try to find the headers row or assume columns
    let nameColIdx = 0;
    let qtyColIdx = 1;
    let headerRowIdx = -1;

    // Scan the first 15 rows to detect headers
    for (let r = 0; r < Math.min(15, rows.length); r++) {
      const row = rows[r];
      if (!row || !Array.isArray(row)) continue;
      
      const hasName = row.some((cell, idx) => {
        if (typeof cell !== 'string') return false;
        const val = cell.toLowerCase();
        return val.includes('наименование') || val.includes('товар') || val.includes('номенклатура') || val.includes('имя') || val.includes('product') || val.includes('name');
      });

      const hasQty = row.some((cell, idx) => {
        if (typeof cell !== 'string') return false;
        const val = cell.toLowerCase();
        return val.includes('количество') || val.includes('кол-во') || val.includes('кол') || val.includes('qty') || val.includes('count') || val.includes('объем');
      });

      if (hasName && hasQty) {
        headerRowIdx = r;
        // Find exact indices
        row.forEach((cell, idx) => {
          if (typeof cell !== 'string') return;
          const val = cell.toLowerCase();
          if (val.includes('наименование') || val.includes('товар') || val.includes('номенклатура') || val.includes('имя') || val.includes('product') || val.includes('name')) {
            nameColIdx = idx;
          } else if (val.includes('количество') || val.includes('кол-во') || val.includes('кол') || val.includes('qty') || val.includes('count') || val.includes('объем')) {
            qtyColIdx = idx;
          }
        });
        break;
      }
    }

    const startRowIdx = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;
    const parsedItems = [];

    // Fetch all active products
    const allProducts = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        oldPrice: true,
        image: true,
        category: true,
        categoryId: true,
        cashbackPercent: true,
        isHit: true,
        rating: true
      }
    });

    const settings = readPricingSettings();
    const allCats = await prisma.category.findMany();
    const categoryMap = new Map(allCats.map(c => [c.id, c]));
    const categorySlugMap = new Map(allCats.map(c => [c.slug, c]));
    const pricedProducts = allProducts.map((product) => applyRetailPricingToProduct(product, settings, categoryMap, categorySlugMap));

    const cleanName = (str) => {
      if (!str) return '';
      return String(str)
        .toLowerCase()
        .replace(/[^a-zа-яё0-9\s.-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const tokenize = (str) => {
      return cleanName(str)
        .split(' ')
        .filter(t => t.length >= 2);
    };

    let totalRows = 0;
    let matchedCount = 0;
    let alternativeCount = 0;
    let notFoundCount = 0;

    for (let r = startRowIdx; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      const rawName = row[nameColIdx];
      const rawQty = row[qtyColIdx];

      if (!rawName || typeof rawName === 'object') continue;

      const nameStr = String(rawName).trim();
      if (!nameStr || nameStr.toLowerCase().includes('итого') || nameStr.toLowerCase().includes('всего') || nameStr.toLowerCase().includes('наименование') || nameStr.length < 3) {
        continue;
      }

      totalRows++;
      let qty = parseInt(rawQty, 10);
      if (isNaN(qty) || qty <= 0) qty = 1;

      const queryTokens = tokenize(nameStr);
      if (queryTokens.length === 0) {
        parsedItems.push({
          originalName: nameStr,
          requestedQuantity: qty,
          status: 'not_found',
          matchedProduct: null,
          alternatives: []
        });
        notFoundCount++;
        continue;
      }

      // Score all products
      const scoredProducts = pricedProducts.map(p => {
        const productTokens = tokenize(p.name);
        
        let matchedTokensCount = 0;
        queryTokens.forEach(qt => {
          if (productTokens.includes(qt)) {
            matchedTokensCount++;
          } else {
            const hasSub = productTokens.some(pt => pt.includes(qt) || qt.includes(pt));
            if (hasSub) matchedTokensCount += 0.5;
          }
        });

        const tokenMatchRatio = matchedTokensCount / queryTokens.length;
        const exactBonus = cleanName(p.name) === cleanName(nameStr) ? 2.0 : 0;
        const isSubstring = cleanName(p.name).includes(cleanName(nameStr)) || cleanName(nameStr).includes(cleanName(p.name));
        const substringBonus = isSubstring ? 0.4 : 0;

        const lenDiff = Math.abs(p.name.length - nameStr.length);
        const lenPenalty = Math.min(0.3, lenDiff * 0.003);

        const totalScore = tokenMatchRatio * 1.5 + exactBonus + substringBonus - lenPenalty;

        return { product: p, score: totalScore, tokenMatchRatio };
      });

      const matches = scoredProducts
        .filter(m => m.score > 0.3)
        .sort((a, b) => b.score - a.score);

      if (matches.length === 0) {
        parsedItems.push({
          originalName: nameStr,
          requestedQuantity: qty,
          status: 'not_found',
          matchedProduct: null,
          alternatives: []
        });
        notFoundCount++;
      } else {
        const topMatch = matches[0];
        const alternatives = matches.slice(1, 4).map(m => m.product);
        const status = topMatch.score >= 1.2 || topMatch.tokenMatchRatio >= 0.75 ? 'exact' : 'alternative';

        if (status === 'exact') matchedCount++;
        else alternativeCount++;

        parsedItems.push({
          originalName: nameStr,
          requestedQuantity: qty,
          status,
          matchedProduct: topMatch.product,
          alternatives
        });
      }
    }

    res.json({
      success: true,
      summary: {
        totalRows,
        matched: matchedCount,
        alternatives: alternativeCount,
        notFound: notFoundCount
      },
      items: parsedItems
    });

  } catch (error) {
    logger.error('Estimate matching failed', {
      error: error.message,
      stack: error.stack,
      fileName: req.file?.originalname || null,
      fileMimeType: req.file?.mimetype || null,
      userId: req.user?.id || null,
    });
    res.status(500).json({ error: 'Ошибка сопоставления сметы: ' + error.message });
  }
};

export const getProductStats = async (req, res) => {
  const { id } = req.params;

  try {
    let parsedProductId = parseInt(id, 10);
    let targetSlug = id;

    if (isNaN(parsedProductId)) {
      const p = await prisma.product.findFirst({ where: { slug: id }, select: { id: true, slug: true } });
      if (p) {
        parsedProductId = p.id;
        targetSlug = p.slug;
      } else {
        return res.status(404).json({ error: 'Товар не найден' });
      }
    } else {
      const p = await prisma.product.findUnique({ where: { id: parsedProductId }, select: { slug: true } });
      if (p && p.slug) {
        targetSlug = p.slug;
      }
    }

    const possiblePaths = [`/product/${parsedProductId}`, `/product/${targetSlug}`];
    
    const pageViewsCount = await prisma.pageView.count({
      where: { path: { in: possiblePaths } }
    });

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const activeSessions = await prisma.pageView.findMany({
      where: {
        path: { in: possiblePaths },
        createdAt: { gte: fifteenMinutesAgo }
      },
      distinct: ['sessionId'],
      select: { sessionId: true }
    });
    
    // Exact database tracking counts (with a minimum of 1 since the user is on the page)
    const views = Math.max(1, pageViewsCount);
    const watching = Math.max(1, activeSessions.length);

    res.json({
      views,
      watching
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения статистики товара: ' + error.message });
  }
};
