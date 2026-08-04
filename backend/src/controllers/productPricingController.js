import prisma from '../config/db.js';
import {
  readPricingSettings,
  writePricingSettings,
  clearProductsCache,
  calculatePriceBottomUp,
  resolveCategoryMarkup
} from '../services/pricingService.js';

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

export const getPricingSettings = async (req, res) => {
  try {
    const settings = readPricingSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения настроек ценообразования: ' + error.message });
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

    const success = await writePricingSettings(newSettings);

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

        // 2. Log individual product override changes with exact retail price calculations
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
