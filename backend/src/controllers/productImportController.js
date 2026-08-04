import prisma from '../config/db.js';
import XlsxPopulate from 'xlsx-populate';
import path from 'path';
import logger from '../utils/logger.js';
import {
  readPricingSettings,
  applyRetailPricingToProduct,
  clearProductsCache
} from '../services/pricingService.js';

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

    const ext = path.extname(req.file.originalname || '').toLowerCase();
    const isImageOrPdf = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'].includes(ext) ||
      ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(req.file.mimetype);

    let extractedItems = [];

    if (isImageOrPdf) {
      try {
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://ai-service:5005';
        console.log(`[MATCH ESTIMATE] Sending file "${req.file.originalname}" to AI OCR service at ${aiServiceUrl}...`);

        const payload = {
          fileBufferBase64: req.file.buffer.toString('base64'),
          mimeType: req.file.mimetype || 'application/pdf',
          fileName: req.file.originalname || 'estimate'
        };

        let ocrRes;
        try {
          ocrRes = await fetch(`${aiServiceUrl}/api/ai/ocr-estimate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } catch (fetchErr) {
          if (aiServiceUrl !== 'http://localhost:5005') {
            console.log('[MATCH ESTIMATE] Trying localhost fallback http://localhost:5005...');
            ocrRes = await fetch('http://localhost:5005/api/ai/ocr-estimate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
          } else {
            throw fetchErr;
          }
        }

        if (ocrRes && ocrRes.ok) {
          const ocrData = await ocrRes.json();
          if (ocrData.success && Array.isArray(ocrData.items)) {
            extractedItems = ocrData.items.map(i => ({
              nameStr: String(i.name || '').trim(),
              qty: Math.max(1, parseInt(i.quantity, 10) || 1)
            })).filter(i => i.nameStr.length >= 2);
          }
        } else {
          const errText = ocrRes ? await ocrRes.text() : 'No response';
          console.warn(`[MATCH ESTIMATE OCR FAIL] Status ${ocrRes?.status}: ${errText}`);
        }
      } catch (ocrErr) {
        console.error('[MATCH ESTIMATE OCR ERROR]', ocrErr);
      }

      if (extractedItems.length === 0) {
        return res.status(400).json({
          error: 'Не удалось извлечь список стройматериалов из файла. Пожалуйста, убедитесь, что фото сметы или PDF четкий и содержит список товаров.'
        });
      }
    } else {
      const rows = await readSpreadsheetRows(req.file);

      if (!rows || rows.length === 0) {
        return res.status(400).json({ error: 'Файл пустой' });
      }

      let nameColIdx = 0;
      let qtyColIdx = 1;
      let headerRowIdx = -1;

      for (let r = 0; r < Math.min(15, rows.length); r++) {
        const row = rows[r];
        if (!row || !Array.isArray(row)) continue;

        const hasName = row.some((cell) => {
          if (typeof cell !== 'string') return false;
          const val = cell.toLowerCase();
          return val.includes('наименование') || val.includes('товар') || val.includes('номенклатура') || val.includes('имя') || val.includes('product') || val.includes('name');
        });

        const hasQty = row.some((cell) => {
          if (typeof cell !== 'string') return false;
          const val = cell.toLowerCase();
          return val.includes('количество') || val.includes('кол-во') || val.includes('кол') || val.includes('qty') || val.includes('count') || val.includes('объем');
        });

        if (hasName && hasQty) {
          headerRowIdx = r;
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

        let qty = parseInt(rawQty, 10);
        if (isNaN(qty) || qty <= 0) qty = 1;

        extractedItems.push({ nameStr, qty });
      }
    }

    const parsedItems = [];

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

    for (const item of extractedItems) {
      const { nameStr, qty } = item;
      totalRows++;

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
