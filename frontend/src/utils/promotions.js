import { formatPrice } from './formatPrice';

const THEME_MAP = {
  emerald: {
    gradient: 'from-emerald-500 to-teal-600',
    accent: 'text-emerald-600',
    soft: 'bg-emerald-50 border-emerald-100',
  },
  ocean: {
    gradient: 'from-sky-500 to-blue-600',
    accent: 'text-sky-600',
    soft: 'bg-sky-50 border-sky-100',
  },
  sunset: {
    gradient: 'from-amber-500 to-orange-600',
    accent: 'text-amber-600',
    soft: 'bg-amber-50 border-amber-100',
  },
  royal: {
    gradient: 'from-indigo-500 to-violet-600',
    accent: 'text-indigo-600',
    soft: 'bg-indigo-50 border-indigo-100',
  },
  graphite: {
    gradient: 'from-slate-700 to-slate-900',
    accent: 'text-slate-700',
    soft: 'bg-slate-100 border-slate-200',
  },
  rose: {
    gradient: 'from-rose-500 to-pink-600',
    accent: 'text-rose-600',
    soft: 'bg-rose-50 border-rose-100',
  },
};

export function getPromotionTheme(theme) {
  return THEME_MAP[theme] || THEME_MAP.emerald;
}

export function getPromotionScopeLabel(scope) {
  switch (scope) {
    case 'PRODUCT':
      return 'На выбранные товары';
    case 'CATEGORY':
      return 'На выбранные категории';
    default:
      return 'На весь заказ';
  }
}

export function formatPromotionBenefit(promotion) {
  if (!promotion) {
    return '';
  }

  const mainBenefit = promotion.discountType === 'PERCENT'
    ? `Скидка ${promotion.discountValue}%`
    : `Скидка ${formatPrice(promotion.discountValue)}`;

  const quantityText = promotion.minQuantity ? ` от ${promotion.minQuantity} шт` : '';

  if (promotion.minOrderAmount) {
    return `${mainBenefit}${quantityText} при заказе от ${formatPrice(promotion.minOrderAmount)}`;
  }

  return `${mainBenefit}${quantityText}`;
}

export function formatPromotionTargets(promotion) {
  if (!promotion) {
    return '';
  }

  if (promotion.scope === 'PRODUCT') {
    return promotion.targetProducts?.map((product) => product.name).join(', ') || 'Выбранные товары';
  }

  if (promotion.scope === 'CATEGORY') {
    return promotion.targetCategories?.map((category) => category.name).join(', ') || 'Выбранные категории';
  }

  return 'Все товары в корзине';
}

export function formatPromotionTiers(promotion) {
  if (!promotion?.quantityTiers?.length) {
    return '';
  }

  return promotion.quantityTiers
    .map((tier) => `от ${tier.minQuantity} шт - ${promotion.discountType === 'PERCENT' ? `${tier.discountValue}%` : formatPrice(tier.discountValue)}`)
    .join(', ');
}
