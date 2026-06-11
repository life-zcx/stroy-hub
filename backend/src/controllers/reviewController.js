import prisma from '../config/db.js';
import redisClient from '../config/redis.js';
import logger from '../utils/logger.js';
import { sendReviewModerationAlert } from '../utils/telegramBot.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper path to review settings
const reviewSettingsPath = path.join(__dirname, '..', 'config', 'review_settings.json');

const DEFAULT_REVIEW_SETTINGS = {
  discountValue: 10.0,
  discountType: 'PERCENT',
  validDays: 30,
  minOrderAmount: 0.0
};

// Helper to read review settings dynamically
const readReviewSettings = () => {
  try {
    if (fs.existsSync(reviewSettingsPath)) {
      const data = fs.readFileSync(reviewSettingsPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    logger.error('Error reading review settings:', error);
  }
  return DEFAULT_REVIEW_SETTINGS;
};

// Helper to clear products cache
const clearProductsCache = async () => {
  try {
    const keys = await redisClient.keys('products:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info(`[REDIS] Cleared products cache due to review update: ${keys.length} keys`);
    }
  } catch (err) {
    logger.error('[REDIS ERROR] Error clearing products cache:', err);
  }
};

// Helper to recalculate average product rating from approved reviews only
export const recalculateProductRating = async (productId) => {
  try {
    const aggregation = await prisma.review.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: { id: true }
    });

    const avgRating = aggregation._avg.rating !== null
      ? parseFloat(aggregation._avg.rating.toFixed(1))
      : 5.0; // Default fallback to 5.0
    const reviewsCount = aggregation._count.id || 0;

    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: avgRating,
        reviews: reviewsCount,
      },
    });

    // Clear Redis cache for products
    await clearProductsCache();
    logger.info(`[REVIEWS] Recalculated rating for product ${productId}: avg=${avgRating}, total=${reviewsCount}`);
  } catch (error) {
    logger.error(`[REVIEWS ERROR] Failed to recalculate rating for product ${productId}:`, error);
  }
};

// GET /api/reviews/product/:productId
export const getProductReviews = async (req, res) => {
  const { productId } = req.params;

  try {
    const parsedProductId = parseInt(productId, 10);
    if (isNaN(parsedProductId)) {
      return res.status(400).json({ error: 'Неверный идентификатор товара.' });
    }

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(Math.max(1, Number.parseInt(req.query.limit, 10) || 10), 50);

    const [reviews, total] = await prisma.$transaction([
      prisma.review.findMany({
        where: { productId: parsedProductId, isApproved: true },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({
        where: { productId: parsedProductId, isApproved: true }
      })
    ]);

    // Mask emails for privacy, e.g., u***r@example.com
    const formattedReviews = reviews.map((r) => {
      const name = r.user.name || 'Покупатель';
      let maskedEmail = '';
      if (r.user.email) {
        const parts = r.user.email.split('@');
        if (parts.length === 2) {
          const local = parts[0];
          const domain = parts[1];
          maskedEmail = local.length > 2 
            ? `${local[0]}***${local[local.length - 1]}@${domain}`
            : `***@${domain}`;
        }
      }
      return {
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        user: {
          name,
          email: maskedEmail,
        },
      };
    });

    res.json({
      data: formattedReviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    });
  } catch (error) {
    logger.error('Error fetching product reviews:', error);
    res.status(500).json({ error: 'Ошибка при получении отзывов: ' + error.message });
  }
};

// POST /api/reviews/product/:productId
export const createProductReview = async (req, res) => {
  const { productId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user.id;

  try {
    const parsedProductId = parseInt(productId, 10);
    if (isNaN(parsedProductId)) {
      return res.status(400).json({ error: 'Неверный идентификатор товара.' });
    }

    const parsedRating = parseInt(rating, 10);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ error: 'Оценка должна быть целым числом от 1 до 5 звезд.' });
    }

    // 1. Проверяем, существует ли продукт
    const product = await prisma.product.findUnique({
      where: { id: parsedProductId },
    });
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден.' });
    }

    // 2. Проверяем, не оставлял ли пользователь отзыв ранее
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId: parsedProductId,
        },
      },
    });
    if (existingReview) {
      return res.status(400).json({ error: 'Вы уже оставили отзыв на этот товар.' });
    }

    // 3. Проверяем, есть ли у пользователя завершенный заказ, содержащий этот товар
    const completedOrderWithProduct = await prisma.order.findFirst({
      where: {
        userId,
        status: 'completed',
        items: {
          some: {
            productId: parsedProductId,
          },
        },
      },
    });

    if (!completedOrderWithProduct) {
      return res.status(403).json({
        error: 'Отзыв можно оставить только после успешной покупки и доставки этого товара.',
      });
    }

    // 4. Создаем отзыв (по умолчанию isApproved: false)
    const newReview = await prisma.review.create({
      data: {
        rating: parsedRating,
        comment: comment || '',
        productId: parsedProductId,
        userId,
        isApproved: false,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Send Telegram Notification asynchronously for moderation
    sendReviewModerationAlert(newReview, product).catch(err => console.error('[TELEGRAM ALERT ERROR] Review Moderation:', err));

    // 5. Генерируем уникальный промокод в подарок по настройкам сразу при отправке отзыва
    const settings = readReviewSettings();
    const promoSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const promoCode = `REV-${promoSuffix}`;

    const badgeText = settings.discountType === 'PERCENT'
      ? `Скидка ${settings.discountValue}%`
      : `Скидка ${settings.discountValue} ₸`;

    const descriptionText = settings.discountType === 'PERCENT'
      ? `Скидка ${settings.discountValue}% на заказ за отзыв к товару.`
      : `Скидка ${settings.discountValue} ₸ на заказ за отзыв к товару.`;

    const promotion = await prisma.promotion.create({
      data: {
        title: `Бонус за отзыв: ${product.name}`,
        description: descriptionText,
        badge: badgeText,
        promoCode: promoCode,
        type: 'PROMOCODE',
        scope: 'ORDER',
        discountType: settings.discountType,
        discountValue: settings.discountValue,
        minOrderAmount: settings.minOrderAmount,
        isActive: true,
        showOnSite: false,
        usageLimit: 1,
        userId: userId, // Привязываем промокод к пользователю
        startsAt: new Date(),
        endsAt: new Date(Date.now() + settings.validDays * 24 * 60 * 60 * 1000),
      },
    });

    res.status(201).json({
      message: 'Отзыв успешно отправлен и ожидает модерации! Промокод начислен.',
      review: {
        id: newReview.id,
        rating: newReview.rating,
        comment: newReview.comment,
        createdAt: newReview.createdAt,
        isApproved: false,
        user: {
          name: newReview.user.name || 'Покупатель',
        },
      },
      promoCode: promotion.promoCode,
      discountValue: promotion.discountValue,
    });
  } catch (error) {
    logger.error('Error creating product review:', error);
    res.status(500).json({ error: 'Ошибка при отправке отзыва: ' + error.message });
  }
};

// GET /api/reviews (Admin only: get all reviews)
export const adminGetReviews = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(Math.max(1, Number.parseInt(req.query.limit, 10) || 20), 100);

    const [reviews, total] = await prisma.$transaction([
      prisma.review.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count()
    ]);

    res.json({
      data: reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (error) {
    logger.error('Error fetching admin reviews:', error);
    res.status(500).json({ error: 'Ошибка при получении списка отзывов.' });
  }
};

// PATCH /api/reviews/:reviewId/approve (Admin only)
export const adminApproveReview = async (req, res) => {
  const { reviewId } = req.params;

  try {
    const parsedReviewId = parseInt(reviewId, 10);
    if (isNaN(parsedReviewId)) {
      return res.status(400).json({ error: 'Неверный ID отзыва.' });
    }

    const review = await prisma.review.findUnique({
      where: { id: parsedReviewId },
    });

    if (!review) {
      return res.status(404).json({ error: 'Отзыв не найден.' });
    }

    const updatedReview = await prisma.review.update({
      where: { id: parsedReviewId },
      data: { isApproved: true },
    });

    // Recalculate average product rating and update
    await recalculateProductRating(review.productId);

    res.json({ message: 'Отзыв успешно одобрен!', review: updatedReview });
  } catch (error) {
    logger.error('Error approving review:', error);
    res.status(500).json({ error: 'Ошибка при одобрении отзыва.' });
  }
};

// DELETE /api/reviews/:reviewId (Admin only)
export const adminDeleteReview = async (req, res) => {
  const { reviewId } = req.params;

  try {
    const parsedReviewId = parseInt(reviewId, 10);
    if (isNaN(parsedReviewId)) {
      return res.status(400).json({ error: 'Неверный ID отзыва.' });
    }

    const review = await prisma.review.findUnique({
      where: { id: parsedReviewId },
    });

    if (!review) {
      return res.status(404).json({ error: 'Отзыв не найден.' });
    }

    await prisma.review.delete({
      where: { id: parsedReviewId },
    });

    // Recalculate product rating since the review is deleted (if it was approved)
    if (review.isApproved) {
      await recalculateProductRating(review.productId);
    }

    res.json({ message: 'Отзыв успешно удален.' });
  } catch (error) {
    logger.error('Error deleting review:', error);
    res.status(500).json({ error: 'Ошибка при удалении отзыва.' });
  }
};
