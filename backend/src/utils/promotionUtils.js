export const PROMOTION_THEMES = ['emerald', 'ocean', 'sunset', 'royal', 'graphite', 'rose'];
export const PROMOTION_SCOPES = ['ORDER', 'PRODUCT', 'CATEGORY'];
export const PROMOTION_DISCOUNT_TYPES = ['PERCENT', 'FIXED'];

export function normalizePromoCode(value) {
  const normalized = String(value || '').trim().toUpperCase();
  return normalized || null;
}

export function getPromotionTypeFromCode(promoCode) {
  return promoCode ? 'PROMOCODE' : 'CAMPAIGN';
}

export function parsePromotionTiers(rawValue) {
  if (!rawValue) {
    return [];
  }

  const parsed = Array.isArray(rawValue)
    ? rawValue
    : typeof rawValue === 'string'
      ? (() => {
          try {
            return JSON.parse(rawValue);
          } catch {
            return [];
          }
        })()
      : rawValue;
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((tier) => ({
      minQuantity: Number.parseInt(tier?.minQuantity, 10),
      discountValue: Number.parseFloat(tier?.discountValue),
    }))
    .filter((tier) => Number.isFinite(tier.minQuantity) && tier.minQuantity > 0 && Number.isFinite(tier.discountValue) && tier.discountValue > 0)
    .sort((left, right) => left.minQuantity - right.minQuantity);
}

export function isPromotionCurrentlyActive(promotion, now = new Date()) {
  if (!promotion?.isActive) {
    return false;
  }

  if (promotion.startsAt && new Date(promotion.startsAt) > now) {
    return false;
  }

  if (promotion.endsAt && new Date(promotion.endsAt) < now) {
    return false;
  }

  if (promotion.usageLimit !== null && promotion.usageLimit !== undefined && promotion.usageCount >= promotion.usageLimit) {
    return false;
  }

  return true;
}

function getEligibleItems(promotion, items) {
  const normalizedItems = Array.isArray(items) ? items : [];

  if (promotion.scope === 'PRODUCT') {
    const targetIds = new Set((promotion.targetProductIds || []).map((id) => Number(id)));
    return normalizedItems.filter((item) => targetIds.has(Number(item.productId)));
  }

  if (promotion.scope === 'CATEGORY') {
    const targetIds = new Set((promotion.targetCategoryIds || []).map((id) => Number(id)));
    return normalizedItems.filter((item) => targetIds.has(Number(item.categoryId)));
  }

  return normalizedItems;
}

function resolveAppliedTier(promotion, eligibleQuantity) {
  const tiers = parsePromotionTiers(promotion.quantityTiers);
  const matchedTier = tiers.reduce((bestMatch, tier) => (
    eligibleQuantity >= tier.minQuantity ? tier : bestMatch
  ), null);

  if (!matchedTier) {
    return {
      discountType: promotion.discountType,
      discountValue: promotion.discountValue,
      matchedTier: null,
      tiers,
    };
  }

  return {
    discountType: promotion.discountType,
    discountValue: matchedTier.discountValue,
    matchedTier,
    tiers,
  };
}

function calculateDiscountAmount(baseAmount, discountType, discountValue) {
  const amount = Number(baseAmount || 0);

  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  const rawDiscount = discountType === 'PERCENT'
    ? amount * (discountValue / 100)
    : discountValue;

  return Math.max(0, Math.min(amount, Math.round(rawDiscount)));
}

function getScopeErrorMessage(scope) {
  if (scope === 'PRODUCT') {
    return 'Промокод не подходит к выбранным товарам.';
  }

  if (scope === 'CATEGORY') {
    return 'Промокод не подходит к товарам из выбранных категорий.';
  }

  return 'Промокод не подходит к текущему заказу.';
}

function getQuantityErrorMessage(minQuantity) {
  return `Для применения акции нужно минимум ${minQuantity} шт подходящего товара.`;
}

export function buildPromotionSnapshot(promotion, evaluation) {
  if (!promotion || !evaluation?.valid) {
    return null;
  }

  return {
    promotionId: promotion.id,
    title: promotion.title,
    promoCode: promotion.promoCode,
    scope: promotion.scope,
    discountType: evaluation.discountType,
    discountValue: evaluation.discountValue,
    discountAmount: evaluation.discountAmount,
    eligibleSubtotalAmount: evaluation.eligibleSubtotalAmount,
    eligibleQuantity: evaluation.eligibleQuantity,
    matchedItemIds: evaluation.eligibleItems.map((item) => item.productId),
    appliedTier: evaluation.appliedTier,
  };
}

export function evaluatePromotion(promotion, context, now = new Date()) {
  if (!promotion) {
    return {
      valid: false,
      error: 'Промокод не найден.',
    };
  }

  if (!isPromotionCurrentlyActive(promotion, now)) {
    return {
      valid: false,
      error: 'Акция или промокод сейчас недоступны.',
    };
  }

  const subtotalAmount = Number(context?.subtotalAmount || 0);
  if (!Number.isFinite(subtotalAmount) || subtotalAmount <= 0) {
    return {
      valid: false,
      error: 'Сумма заказа должна быть больше нуля.',
    };
  }

  if (promotion.minOrderAmount && subtotalAmount < promotion.minOrderAmount) {
    return {
      valid: false,
      error: `Промокод действует при заказе от ${promotion.minOrderAmount} ₸.`,
    };
  }

  const items = Array.isArray(context?.items) ? context.items : [];
  const eligibleItems = getEligibleItems(promotion, items);

  if ((promotion.scope === 'PRODUCT' || promotion.scope === 'CATEGORY') && eligibleItems.length === 0) {
    return {
      valid: false,
      error: getScopeErrorMessage(promotion.scope),
    };
  }

  const eligibleQuantity = eligibleItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const eligibleSubtotalAmount = eligibleItems.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0);

  if (promotion.minQuantity && eligibleQuantity < promotion.minQuantity) {
    return {
      valid: false,
      error: getQuantityErrorMessage(promotion.minQuantity),
      eligibleQuantity,
    };
  }

  const { discountType, discountValue, matchedTier, tiers } = resolveAppliedTier(promotion, eligibleQuantity);
  const discountBaseAmount = promotion.scope === 'ORDER' ? subtotalAmount : eligibleSubtotalAmount;
  const discountAmount = calculateDiscountAmount(discountBaseAmount, discountType, discountValue);

  if (discountAmount <= 0) {
    return {
      valid: false,
      error: 'Скидка по промокоду не может быть рассчитана.',
    };
  }

  return {
    valid: true,
    subtotalAmount,
    eligibleSubtotalAmount,
    eligibleQuantity,
    eligibleItems,
    discountType,
    discountValue,
    discountAmount,
    totalAmount: Math.max(0, subtotalAmount - discountAmount),
    appliedTier: matchedTier,
    tiers,
  };
}
