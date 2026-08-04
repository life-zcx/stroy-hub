import prisma from '../config/db.js';
import { attachActivePromotionsToProduct } from '../utils/promotionUtils.js';
import redisClient from '../config/redis.js';
import logger from '../utils/logger.js';
import {
  readPricingSettings,
  applyRetailPricingToProduct,
  getVersionedProductsCacheKey
} from '../services/pricingService.js';

let categoriesCache = null;
let categoriesCacheTime = 0;
const CATEGORY_CACHE_TTL = 5 * 60 * 1000;

export async function getAllCategoriesCached() {
  const now = Date.now();
  if (categoriesCache && (now - categoriesCacheTime < CATEGORY_CACHE_TTL)) {
    return categoriesCache;
  }
  const categories = await prisma.category.findMany();
  categoriesCache = categories;
  categoriesCacheTime = now;
  return categories;
}

export function clearCategoriesCache() {
  categoriesCache = null;
  categoriesCacheTime = 0;
}

export async function getDescendantCategorySlugsAndIds(categorySlugOrId) {
  const allCategories = await getAllCategoriesCached();

  const parsedId = !isNaN(categorySlugOrId) ? parseInt(categorySlugOrId, 10) : null;
  const rootCategory = allCategories.find(c => 
    parsedId !== null ? c.id === parsedId : c.slug === categorySlugOrId
  );

  if (!rootCategory) {
    return { slugs: [categorySlugOrId], ids: [] };
  }

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

  try {
    const cacheKey = await getVersionedProductsCacheKey('all', normalizedQuery);
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
    const allCats = await getAllCategoriesCached();
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

  try {
    const cacheKey = await getVersionedProductsCacheKey('id', id);
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

    const settings = readPricingSettings();
    const allCats = await getAllCategoriesCached();
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

export const getAiCatalogProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        price: true,
        article: true,
        slug: true,
        isHit: true,
        description: true,
      },
      take: 5000,
      orderBy: { id: 'desc' },
    });
    res.json(products);
  } catch (error) {
    logger.error('[AI CATALOG ENDPOINT ERROR]', error);
    res.status(500).json({ error: 'Ошибка получения каталога ИИ: ' + error.message });
  }
};

export const getProductStats = async (req, res) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id, 10);

    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Некорректный ID товара' });
    }

    const [viewsCount, cartAddsCount, orderItemsCount, totalRevenue] = await Promise.all([
      prisma.analyticsEvent.count({ where: { productId, type: 'product_view' } }),
      prisma.analyticsEvent.count({ where: { productId, type: 'add_to_cart' } }),
      prisma.orderItem.aggregate({
        where: { productId, order: { status: { not: 'cancelled' } } },
        _sum: { quantity: true }
      }),
      prisma.orderItem.aggregate({
        where: { productId, order: { status: { not: 'cancelled' } } },
        _sum: { price: true }
      })
    ]);

    res.json({
      productId,
      viewsCount,
      cartAddsCount,
      purchasedQuantity: orderItemsCount._sum.quantity || 0,
      totalRevenue: totalRevenue._sum.price || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения статистики товара: ' + error.message });
  }
};
