export const PROMOTION_THEME_OPTIONS = [
  { value: 'emerald', label: 'Emerald' },
  { value: 'ocean', label: 'Ocean' },
  { value: 'sunset', label: 'Sunset' },
  { value: 'royal', label: 'Royal' },
  { value: 'graphite', label: 'Graphite' },
  { value: 'rose', label: 'Rose' },
];

export const PROMOTION_SCOPE_OPTIONS = [
  { value: 'ORDER', label: 'Весь заказ' },
  { value: 'PRODUCT', label: 'Конкретные товары' },
  { value: 'CATEGORY', label: 'Категории товаров' },
];

export const PROMOTION_THEME_STYLES = {
  emerald: 'from-emerald-500 to-teal-600',
  ocean: 'from-sky-500 to-blue-600',
  sunset: 'from-amber-500 to-orange-600',
  royal: 'from-indigo-500 to-violet-600',
  graphite: 'from-slate-700 to-slate-900',
  rose: 'from-rose-500 to-pink-600',
};

export function getPromotionThemeGradient(theme) {
  return PROMOTION_THEME_STYLES[theme] || PROMOTION_THEME_STYLES.emerald;
}

export function getPromotionTypeLabel(promotion) {
  return promotion.promoCode ? 'Промокод' : 'Акция';
}

export function formatPromotionBenefit(promotion, formatPrice) {
  const mainBenefit = promotion.discountType === 'PERCENT'
    ? `${promotion.discountValue}%`
    : formatPrice(promotion.discountValue);

  if (promotion.minOrderAmount) {
    return `${mainBenefit} от ${formatPrice(promotion.minOrderAmount)}`;
  }

  return mainBenefit;
}

export function getPromotionScopeLabel(scope) {
  switch (scope) {
    case 'PRODUCT':
      return 'По товарам';
    case 'CATEGORY':
      return 'По категориям';
    default:
      return 'На весь заказ';
  }
}

export function formatPromotionTargets(promotion) {
  if (promotion.scope === 'PRODUCT') {
    return promotion.targetProducts?.map((product) => product.name).join(', ') || 'Товары не выбраны';
  }

  if (promotion.scope === 'CATEGORY') {
    return promotion.targetCategories?.map((category) => category.name).join(', ') || 'Категории не выбраны';
  }

  return 'Все товары в корзине';
}

export function formatPromotionTiers(promotion, formatPrice) {
  if (!promotion.quantityTiers?.length) {
    return promotion.minQuantity ? `От ${promotion.minQuantity} шт` : 'Без каскадных уровней';
  }

  return promotion.quantityTiers
    .map((tier) => `от ${tier.minQuantity} шт - ${promotion.discountType === 'PERCENT' ? `${tier.discountValue}%` : formatPrice(tier.discountValue)}`)
    .join(', ');
}
