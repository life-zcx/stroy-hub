import prisma from '../config/db.js';
import {
  buildPromotionSnapshot,
  evaluatePromotion,
  getPromotionTypeFromCode,
  isPromotionCurrentlyActive,
  normalizePromoCode,
  parsePromotionTiers,
  PROMOTION_DISCOUNT_TYPES,
  PROMOTION_SCOPES,
  PROMOTION_THEMES,
} from '../utils/promotionUtils.js';
import { applyRetailPricingToProduct, readPricingSettings } from './productController.js';

function parseFloatOrNull(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseIntOrNull(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDateOrNull(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  return String(value).toLowerCase() === 'true';
}

function parseIdArray(value) {
  if (!value) {
    return [];
  }

  const list = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];

  return [...new Set(
    list
      .map((item) => Number.parseInt(item, 10))
      .filter((item) => Number.isFinite(item) && item > 0)
  )];
}

function serializePromotion(promotion, relations = {}) {
  return {
    ...promotion,
    quantityTiers: parsePromotionTiers(promotion.quantityTiers),
    targetProducts: relations.products || [],
    targetCategories: relations.categories || [],
    isCurrentlyActive: isPromotionCurrentlyActive(promotion),
  };
}

async function enrichPromotions(promotions) {
  if (!promotions.length) {
    return [];
  }

  const productIds = [...new Set(promotions.flatMap((promotion) => promotion.targetProductIds || []))];
  const categoryIds = [...new Set(promotions.flatMap((promotion) => promotion.targetCategoryIds || []))];

  const [products, categories] = await Promise.all([
    productIds.length
      ? prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, categoryId: true },
        })
      : Promise.resolve([]),
    categoryIds.length
      ? prisma.category.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true, slug: true },
        })
      : Promise.resolve([]),
  ]);

  const productsMap = new Map(products.map((product) => [product.id, product]));
  const categoriesMap = new Map(categories.map((category) => [category.id, category]));

  return promotions.map((promotion) => serializePromotion(promotion, {
    products: (promotion.targetProductIds || []).map((id) => productsMap.get(id)).filter(Boolean),
    categories: (promotion.targetCategoryIds || []).map((id) => categoriesMap.get(id)).filter(Boolean),
  }));
}

async function buildEvaluationContext(items, subtotalAmount) {
  const normalizedSubtotal = parseFloatOrNull(subtotalAmount) || 0;
  const normalizedItems = Array.isArray(items) ? items : [];

  if (!normalizedItems.length) {
    return {
      subtotalAmount: normalizedSubtotal,
      items: [],
    };
  }

  const productIds = normalizedItems
    .map((item) => Number.parseInt(item.productId, 10))
    .filter((id) => Number.isFinite(id));

  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
    },
    select: {
      id: true,
      name: true,
      price: true,
      categoryId: true,
      category: true,
      cashbackPercent: true,
    },
  });

  const settings = readPricingSettings();
  const categories = await prisma.category.findMany();
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const categorySlugMap = new Map(categories.map((category) => [category.slug, category]));
  const pricedProducts = products.map((product) => applyRetailPricingToProduct(product, settings, categoryMap, categorySlugMap));
  const productsMap = new Map(pricedProducts.map((product) => [product.id, product]));
  const evaluationItems = [];
  let computedSubtotalAmount = 0;

  for (const item of normalizedItems) {
    const productId = Number.parseInt(item.productId, 10);
    const quantity = Number.parseInt(item.quantity, 10);

    if (!Number.isFinite(productId) || !Number.isFinite(quantity) || quantity <= 0) {
      continue;
    }

    const product = productsMap.get(productId);
    if (!product) {
      continue;
    }

    const lineTotal = product.price * quantity;
    computedSubtotalAmount += lineTotal;

    evaluationItems.push({
      productId,
      quantity,
      price: product.price,
      lineTotal,
      categoryId: product.categoryId,
      category: product.category,
      name: product.name,
    });
  }

  return {
    subtotalAmount: computedSubtotalAmount || normalizedSubtotal,
    items: evaluationItems,
  };
}

function buildPromotionData(body) {
  const title = String(body.title || '').trim();
  const description = String(body.description || '').trim();
  const badge = String(body.badge || '').trim() || null;
  const promoCode = normalizePromoCode(body.promoCode);
  const scope = String(body.scope || 'ORDER').trim().toUpperCase();
  const discountType = String(body.discountType || '').trim().toUpperCase();
  const discountValue = parseFloatOrNull(body.discountValue);
  const minOrderAmount = parseFloatOrNull(body.minOrderAmount);
  const minQuantity = parseIntOrNull(body.minQuantity);
  const usageLimit = parseIntOrNull(body.usageLimit);
  const theme = String(body.theme || 'emerald').trim();
  const startsAt = body.startsAt ? parseDateOrNull(body.startsAt) : null;
  const endsAt = body.endsAt ? parseDateOrNull(body.endsAt) : null;
  const isActive = parseBoolean(body.isActive, true);
  const showOnSite = parseBoolean(body.showOnSite, true);
  const targetProductIds = parseIdArray(body.targetProductIds);
  const targetCategoryIds = parseIdArray(body.targetCategoryIds);
  const quantityTiers = parsePromotionTiers(body.quantityTiers);

  if (!title) {
    return { error: 'Название акции обязательно.' };
  }

  if (!description) {
    return { error: 'Описание акции обязательно.' };
  }

  if (!PROMOTION_SCOPES.includes(scope)) {
    return { error: 'Укажите корректную область применения акции.' };
  }

  if (!PROMOTION_DISCOUNT_TYPES.includes(discountType)) {
    return { error: 'Укажите корректный тип скидки.' };
  }

  if (!discountValue || discountValue <= 0) {
    return { error: 'Размер скидки должен быть больше нуля.' };
  }

  if (discountType === 'PERCENT' && discountValue > 100) {
    return { error: 'Процентная скидка не может быть больше 100%.' };
  }

  if (minOrderAmount !== null && minOrderAmount < 0) {
    return { error: 'Минимальная сумма заказа не может быть отрицательной.' };
  }

  if (minQuantity !== null && minQuantity <= 0) {
    return { error: 'Минимальное количество должно быть больше нуля.' };
  }

  if (usageLimit !== null && usageLimit <= 0) {
    return { error: 'Лимит использований должен быть больше нуля.' };
  }

  if (!PROMOTION_THEMES.includes(theme)) {
    return { error: 'Указана неподдерживаемая тема оформления.' };
  }

  if (body.startsAt && !startsAt) {
    return { error: 'Дата начала акции указана некорректно.' };
  }

  if (body.endsAt && !endsAt) {
    return { error: 'Дата окончания акции указана некорректно.' };
  }

  if (startsAt && endsAt && startsAt > endsAt) {
    return { error: 'Дата окончания не может быть раньше даты начала.' };
  }

  if (scope === 'PRODUCT' && targetProductIds.length === 0) {
    return { error: 'Для товарной акции выберите хотя бы один товар.' };
  }

  if (scope === 'CATEGORY' && targetCategoryIds.length === 0) {
    return { error: 'Для категорийной акции выберите хотя бы одну категорию.' };
  }

  for (const tier of quantityTiers) {
    if (discountType === 'PERCENT' && tier.discountValue > 100) {
      return { error: 'Процент в каскадных скидках не может быть больше 100%.' };
    }
  }

  return {
    data: {
      title,
      description,
      badge,
      promoCode,
      type: getPromotionTypeFromCode(promoCode),
      scope,
      discountType,
      discountValue,
      minOrderAmount,
      minQuantity,
      usageLimit,
      theme,
      startsAt,
      endsAt,
      isActive,
      showOnSite,
      showOnHome: parseBoolean(body.showOnHome, false),
      targetProductIds,
      targetCategoryIds,
      quantityTiers: quantityTiers.length ? quantityTiers : null,
    },
  };
}

export const getPublicPromotions = async (req, res) => {
  try {
    const promotions = await prisma.promotion.findMany({
      where: {
        showOnSite: true,
        isActive: true,
      },
      orderBy: [
        { startsAt: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    const activePromotions = promotions.filter((promotion) => isPromotionCurrentlyActive(promotion));
    res.json(await enrichPromotions(activePromotions));
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения акций: ' + error.message });
  }
};

export const getHomePromotions = async (req, res) => {
  try {
    const promotions = await prisma.promotion.findMany({
      where: {
        showOnSite: true,
        showOnHome: true,
        isActive: true,
      },
      orderBy: [
        { startsAt: 'asc' },
        { createdAt: 'desc' },
      ],
      take: 3,
    });

    const activePromotions = promotions.filter((promotion) => isPromotionCurrentlyActive(promotion));
    res.json(await enrichPromotions(activePromotions));
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения акций для главной: ' + error.message });
  }
};

export const validatePromotionCode = async (req, res) => {
  const promoCode = normalizePromoCode(req.body?.promoCode);

  if (!promoCode) {
    return res.status(400).json({ error: 'Введите промокод.' });
  }

  try {
    const promotion = await prisma.promotion.findUnique({
      where: { promoCode },
    });

    const evaluationContext = await buildEvaluationContext(req.body?.items, req.body?.subtotalAmount);
    const evaluation = evaluatePromotion(promotion, evaluationContext);
    if (!evaluation.valid) {
      return res.status(400).json({ error: evaluation.error });
    }

    const [serializedPromotion] = await enrichPromotions([promotion]);

    res.json({
      promotion: serializedPromotion,
      preview: {
        subtotalAmount: evaluation.subtotalAmount,
        eligibleSubtotalAmount: evaluation.eligibleSubtotalAmount,
        eligibleQuantity: evaluation.eligibleQuantity,
        discountAmount: evaluation.discountAmount,
        totalAmount: evaluation.totalAmount,
        matchedProductIds: evaluation.eligibleItems.map((item) => item.productId),
        appliedTier: evaluation.appliedTier,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка проверки промокода: ' + error.message });
  }
};

export const getAllPromotions = async (req, res) => {
  try {
    const promotions = await prisma.promotion.findMany({
      orderBy: [{ createdAt: 'desc' }],
    });

    res.json(await enrichPromotions(promotions));
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения списка акций: ' + error.message });
  }
};

export const createPromotion = async (req, res) => {
  const { data, error } = buildPromotionData(req.body);

  if (error) {
    return res.status(400).json({ error });
  }

  try {
    const createdPromotion = await prisma.promotion.create({ data });
    const [serializedPromotion] = await enrichPromotions([createdPromotion]);
    res.status(201).json(serializedPromotion);
  } catch (error) {
    const statusCode = error.code === 'P2002' ? 400 : 500;
    const message = error.code === 'P2002'
      ? 'Промокод с таким значением уже существует.'
      : 'Ошибка создания акции: ' + error.message;

    res.status(statusCode).json({ error: message });
  }
};

export const updatePromotion = async (req, res) => {
  const promotionId = Number.parseInt(req.params.id, 10);
  const { data, error } = buildPromotionData(req.body);

  if (!Number.isFinite(promotionId)) {
    return res.status(400).json({ error: 'Некорректный идентификатор акции.' });
  }

  if (error) {
    return res.status(400).json({ error });
  }

  try {
    const existingPromotion = await prisma.promotion.findUnique({
      where: { id: promotionId },
    });

    if (!existingPromotion) {
      return res.status(404).json({ error: 'Акция не найдена.' });
    }

    const updatedPromotion = await prisma.promotion.update({
      where: { id: promotionId },
      data,
    });

    const [serializedPromotion] = await enrichPromotions([updatedPromotion]);
    res.json(serializedPromotion);
  } catch (error) {
    const statusCode = error.code === 'P2002' ? 400 : 500;
    const message = error.code === 'P2002'
      ? 'Промокод с таким значением уже существует.'
      : 'Ошибка обновления акции: ' + error.message;

    res.status(statusCode).json({ error: message });
  }
};

export const deletePromotion = async (req, res) => {
  const promotionId = Number.parseInt(req.params.id, 10);

  if (!Number.isFinite(promotionId)) {
    return res.status(400).json({ error: 'Некорректный идентификатор акции.' });
  }

  try {
    const existingPromotion = await prisma.promotion.findUnique({
      where: { id: promotionId },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!existingPromotion) {
      return res.status(404).json({ error: 'Акция не найдена.' });
    }

    if (existingPromotion._count.orders > 0) {
      return res.status(400).json({ error: 'Эта акция уже использовалась в заказах. Снимите ее с публикации вместо удаления.' });
    }

    await prisma.promotion.delete({ where: { id: promotionId } });
    res.json({ message: 'Акция удалена.' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка удаления акции: ' + error.message });
  }
};

export const getMyPromotions = async (req, res) => {
  try {
    const promotions = await prisma.promotion.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(await enrichPromotions(promotions));
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения личных промокодов: ' + error.message });
  }
};

export { buildEvaluationContext, enrichPromotions, serializePromotion, buildPromotionSnapshot };
