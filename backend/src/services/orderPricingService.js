import prisma from '../config/db.js';
import { applyRetailPricingToProduct, readPricingSettings } from '../controllers/productController.js';
import { buildEvaluationContext } from '../controllers/promotionController.js';
import { evaluatePromotion, normalizePromoCode } from '../utils/promotionUtils.js';

export const prepareOrderItemsAndPricing = async (items, promoCode) => {
  const uniqueProductIds = [...new Set(items.map((item) => parseInt(item.productId, 10)).filter(Boolean))];
  const rawProducts = await prisma.product.findMany({
    where: { id: { in: uniqueProductIds } },
  });

  if (rawProducts.length !== uniqueProductIds.length) {
    throw new Error('Некоторые товары из вашей корзины устарели или больше не существуют (база данных была обновлена). Пожалуйста, очистите корзину и добавьте актуальные товары.');
  }

  const settings = readPricingSettings();
  const allCats = await prisma.category.findMany();
  const categoryMap = new Map(allCats.map((c) => [c.id, c]));
  const categorySlugMap = new Map(allCats.map((c) => [c.slug, c]));
  const existingProducts = rawProducts.map((p) => applyRetailPricingToProduct(p, settings, categoryMap, categorySlugMap));

  let normalizedItems = [];

  for (const item of items) {
    const productId = Number.parseInt(item.productId, 10);
    const quantity = Number.parseInt(item.quantity, 10);

    if (!Number.isFinite(productId) || !Number.isFinite(quantity) || quantity <= 0) {
      throw new Error('В заказе обнаружены некорректные позиции.');
    }

    const product = existingProducts.find((entry) => entry.id === productId);
    if (!product) {
      throw new Error('Один из товаров не найден в базе данных.');
    }

    let itemPrice = product.price;
    const selectedOption = item.selectedOption ? String(item.selectedOption).trim() : null;
    if (selectedOption && product.options && typeof product.options === 'object') {
      const opts = product.options;
      if (Array.isArray(opts.items)) {
        const matchedOpt = opts.items.find((o) => String(o.value || '').trim() === selectedOption);
        if (matchedOpt && matchedOpt.price !== undefined && matchedOpt.price !== null && !isNaN(parseFloat(matchedOpt.price))) {
          itemPrice = parseFloat(matchedOpt.price);
        }
      }
    }

    normalizedItems.push({
      productId,
      quantity,
      price: itemPrice,
      selectedOption,
    });
  }

  const evaluationContext = await buildEvaluationContext(normalizedItems);
  normalizedItems = evaluationContext.items.map((item, idx) => ({
    productId: item.productId,
    quantity: item.quantity,
    price: item.price,
    selectedOption: normalizedItems[idx]?.selectedOption || null,
  }));
  const subtotalAmount = evaluationContext.subtotalAmount;

  const normalizedPromoCode = normalizePromoCode(promoCode);
  let appliedPromotion = null;

  if (normalizedPromoCode) {
    appliedPromotion = await prisma.promotion.findUnique({
      where: { promoCode: normalizedPromoCode },
    });
    if (!appliedPromotion || !appliedPromotion.isActive) {
      throw new Error('Указанный промокод неактивен или не существует.');
    }

    const evaluation = evaluatePromotion(appliedPromotion, evaluationContext);
    if (!evaluation.valid) {
      throw new Error(evaluation.error);
    }
  }

  return {
    normalizedItems,
    subtotalAmount,
    evaluationContext,
    appliedPromotion,
  };
};
