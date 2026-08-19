import prisma from '../config/db.js';
import redisClient from '../config/redis.js';
import logger from '../utils/logger.js';
import { safeErrorMessage } from '../utils/apiError.js';
import { applyRetailPricingToProduct, readPricingSettings } from './productController.js';

/**
 * GET /api/products/recommendations?productIds=1,2&categoryIds=3,4
 * Returns ultra-fast, dynamic cross-sell recommendations for cart items.
 * Cached in Redis for 10 minutes per unique item set.
 */
export const getCartRecommendations = async (req, res) => {
  try {
    const rawProductIds = req.query.productIds;
    const rawCategoryIds = req.query.categoryIds;

    const productIds = (Array.isArray(rawProductIds)
      ? rawProductIds
      : typeof rawProductIds === 'string'
        ? rawProductIds.split(',')
        : []
    )
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id) && id > 0);

    const categoryIds = (Array.isArray(rawCategoryIds)
      ? rawCategoryIds
      : typeof rawCategoryIds === 'string'
        ? rawCategoryIds.split(',')
        : []
    )
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id) && id > 0);

    // If no input parameters provided, return top 8 active products
    const sortedProductIds = [...productIds].sort((a, b) => a - b);
    const sortedCategoryIds = [...categoryIds].sort((a, b) => a - b);
    const cacheKey = `recommendations:cart:${sortedProductIds.join('_')}:${sortedCategoryIds.join('_')}`;

    // 1. Try Redis cache
    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }
    } catch (err) {
      logger.warn('Redis read failed for cart recommendations:', err.message);
    }

    const excludedProductIds = new Set(productIds);
    const recommendedMap = new Map();

    // 2. Co-purchased items from completed orders in DB
    if (productIds.length > 0) {
      const pastOrders = await prisma.order.findMany({
        where: {
          status: 'completed',
          items: {
            some: {
              productId: { in: productIds },
            },
          },
        },
        take: 30,
        select: {
          items: {
            select: {
              productId: true,
            },
          },
        },
      });

      const coPurchaseCounts = new Map();
      for (const order of pastOrders) {
        for (const item of order.items) {
          if (!excludedProductIds.has(item.productId)) {
            coPurchaseCounts.set(item.productId, (coPurchaseCounts.get(item.productId) || 0) + 1);
          }
        }
      }

      const sortedCoPurchaseIds = [...coPurchaseCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([pid]) => pid);

      if (sortedCoPurchaseIds.length > 0) {
        const coPurchasedProducts = await prisma.product.findMany({
          where: {
            id: { in: sortedCoPurchaseIds },
            isDeleted: false,
          },
          include: {
            supplier: true,
            categoryRelation: true,
          },
        });
        for (const prod of coPurchasedProducts) {
          recommendedMap.set(prod.id, prod);
        }
      }
    }

    // 3. Sibling & Companion Categories
    if (recommendedMap.size < 8 && categoryIds.length > 0) {
      const categoryProducts = await prisma.product.findMany({
        where: {
          categoryId: { in: categoryIds },
          id: { notIn: [...excludedProductIds, ...recommendedMap.keys()] },
          isDeleted: false,
        },
        take: 8 - recommendedMap.size,
        orderBy: [{ isHit: 'desc' }, { rating: 'desc' }],
        include: {
          supplier: true,
          categoryRelation: true,
        },
      });

      for (const prod of categoryProducts) {
        recommendedMap.set(prod.id, prod);
      }
    }

    // 4. Best-seller Fallback across catalog
    if (recommendedMap.size < 8) {
      const fallbackProducts = await prisma.product.findMany({
        where: {
          id: { notIn: [...excludedProductIds, ...recommendedMap.keys()] },
          isDeleted: false,
        },
        take: 8 - recommendedMap.size,
        orderBy: [{ isHit: 'desc' }, { rating: 'desc' }],
        include: {
          supplier: true,
          categoryRelation: true,
        },
      });

      for (const prod of fallbackProducts) {
        recommendedMap.set(prod.id, prod);
      }
    }

    // Apply retail pricing settings
    const settings = readPricingSettings();
    const categories = await prisma.category.findMany();
    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    const categorySlugMap = new Map(categories.map((c) => [c.slug, c]));

    const finalProducts = [...recommendedMap.values()].map((prod) =>
      applyRetailPricingToProduct(prod, settings, categoryMap, categorySlugMap)
    );

    // Save to Redis cache (10 minutes TTL)
    try {
      await redisClient.set(cacheKey, JSON.stringify(finalProducts), { EX: 600 });
    } catch (err) {
      logger.warn('Redis write failed for cart recommendations:', err.message);
    }

    return res.json(finalProducts);
  } catch (error) {
    logger.error('Error fetching cart recommendations:', error);
    return res.status(500).json({ error: safeErrorMessage(error, 'Ошибка получения рекомендаций для корзины') });
  }
};
