import prisma from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper path to store pricing settings
const pricingSettingsPath = path.join(__dirname, '..', 'config', 'pricing_settings.json');

// Default pricing settings
const DEFAULT_PRICING_SETTINGS = {
  markups: {
    mixes: 15,
    lumber: 12,
    tools: 20,
    paints: 18,
    hardware: 25
  },
  overrides: {}
};

function readPricingSettings() {
  try {
    if (fs.existsSync(pricingSettingsPath)) {
      const data = fs.readFileSync(pricingSettingsPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading pricing settings:', error);
  }
  return DEFAULT_PRICING_SETTINGS;
}

function writePricingSettings(settings) {
  try {
    const dir = path.dirname(pricingSettingsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(pricingSettingsPath, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing pricing settings:', error);
    return false;
  }
}

export const getPricingSettings = async (req, res) => {
  try {
    const settings = readPricingSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения настроек ценообразования: ' + error.message });
  }
};

export const savePricingSettings = async (req, res) => {
  const { markups, overrides } = req.body;
  if (!markups || !overrides) {
    return res.status(400).json({ error: 'Необходимо передать markups и overrides' });
  }
  try {
    const success = writePricingSettings({ markups, overrides });
    if (success) {
      res.json({ message: 'Настройки ценообразования успешно сохранены' });
    } else {
      res.status(500).json({ error: 'Не удалось записать файл настроек' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сохранения настроек ценообразования: ' + error.message });
  }
};

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

// Helper to recursively fetch all descendant category IDs and slugs
async function getDescendantCategorySlugsAndIds(categorySlugOrId) {
  let rootCategory;
  
  if (isNaN(categorySlugOrId)) {
    rootCategory = await prisma.category.findUnique({
      where: { slug: categorySlugOrId },
      include: { children: true }
    });
  } else {
    rootCategory = await prisma.category.findUnique({
      where: { id: parseInt(categorySlugOrId) },
      include: { children: true }
    });
  }

  if (!rootCategory) {
    return { slugs: [categorySlugOrId], ids: [] };
  }

  const slugs = [rootCategory.slug];
  const ids = [rootCategory.id];
  const queue = [...rootCategory.children];

  while (queue.length > 0) {
    const current = queue.shift();
    slugs.push(current.slug);
    ids.push(current.id);

    const withChildren = await prisma.category.findUnique({
      where: { id: current.id },
      include: { children: true }
    });

    if (withChildren && withChildren.children.length > 0) {
      queue.push(...withChildren.children);
    }
  }

  return { slugs, ids };
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

  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
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

  try {
    if (category && category !== 'all') {
      const { slugs, ids } = await getDescendantCategorySlugsAndIds(category);
      where.OR = [
        { category: { in: slugs } },
        { categoryId: { in: ids } },
      ];
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: { supplier: true, categoryRelation: true },
        orderBy,
        skip,
        take: limitNum,
      }),
    ]);

    const settings = readPricingSettings();
    const { markups, overrides } = settings;

    const mappedProducts = products.map(p => {
      const wholesalePrice  = p.price;
      const categoryMarkup  = markups[p.category] !== undefined ? markups[p.category] : 15;
      const activeMarkup    = overrides[p.id]     !== undefined ? overrides[p.id]     : categoryMarkup;
      const markupValue     = wholesalePrice * (activeMarkup / 100);
      const retailPrice     = wholesalePrice + markupValue;

      return {
        ...p,
        wholesalePrice,
        price:    retailPrice,
        oldPrice: p.oldPrice ? p.oldPrice + p.oldPrice * (activeMarkup / 100) : null,
      };
    });

    res.json({
      data:       mappedProducts,
      total,
      page:       pageNum,
      limit:      limitNum,
      totalPages: Math.ceil(total / limitNum),
      hasMore:    pageNum * limitNum < total,
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения товаров: ' + error.message });
  }
};

export const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: { 
        supplier: true,
        categoryRelation: true
      }
    });
    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    const settings = readPricingSettings();
    const { markups, overrides } = settings;

    const wholesalePrice = product.price;
    const categoryMarkup = markups[product.category] !== undefined ? markups[product.category] : 15;
    const activeMarkup = overrides[product.id] !== undefined ? overrides[product.id] : categoryMarkup;
    const markupValue = wholesalePrice * (activeMarkup / 100);
    const retailPrice = wholesalePrice + markupValue;

    const mappedProduct = {
      ...product,
      wholesalePrice,
      price: retailPrice,
      oldPrice: product.oldPrice ? product.oldPrice + product.oldPrice * (activeMarkup / 100) : null
    };

    res.json(mappedProduct);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения товара: ' + error.message });
  }
};

export const createProduct = async (req, res) => {
  const {
    name, description, details, specifications, usage, category, price, oldPrice,
    rating, reviews, isHit, bulkDiscount, supplierId, imageUrl, categoryId
  } = req.body;
  const requestedSupplierId = parseId(supplierId);
  const requesterSupplierId = getRequesterSupplierId(req);
  const effectiveSupplierId = isSupplierUser(req) ? requesterSupplierId : requestedSupplierId;
  
  if (!name || !category || price === undefined || price === '' || !effectiveSupplierId) {
    return res.status(400).json({ error: 'Обязательные поля: Название, Категория, Цена, Поставщик' });
  }

  if (isSupplierUser(req) && !requesterSupplierId) {
    return res.status(403).json({ error: 'Для вашей учетной записи не привязан поставщик.' });
  }

  if (isSupplierUser(req) && requestedSupplierId && requestedSupplierId !== requesterSupplierId) {
    return res.status(403).json({ error: 'Нельзя создавать товары от имени другого поставщика.' });
  }

  try {
    // Check if supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: effectiveSupplierId }
    });
    
    if (!supplier) {
      return res.status(404).json({ error: 'Указанный дистрибьютор не найден' });
    }

    // Determine image path: uploaded file or external URL
    let finalImage = 'https://placehold.co/400x300/f8fafc/475569?text=Tormag';
    if (req.file) {
      finalImage = `/uploads/${req.file.filename}`;
    } else if (imageUrl) {
      finalImage = imageUrl;
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        description: description || null,
        details: details || null,
        specifications: specifications || null,
        usage: usage || null,
        category,
        categoryId: categoryId ? parseInt(categoryId) : null,
        price: parseFloat(price),
        oldPrice: oldPrice ? parseFloat(oldPrice) : null,
        image: finalImage,
        rating: rating ? parseFloat(rating) : 4.5,
        reviews: reviews ? parseInt(reviews) : 0,
        isHit: isHit === 'true' || isHit === true,
        bulkDiscount: bulkDiscount || null,
        supplierId: effectiveSupplierId
      },
      include: {
        supplier: true
      }
    });

    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка создания товара: ' + error.message });
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const {
    name, description, details, specifications, usage, category, price, oldPrice,
    rating, reviews, isHit, bulkDiscount, supplierId, imageUrl, categoryId
  } = req.body;
  const requesterSupplierId = getRequesterSupplierId(req);
  const requestedSupplierId = supplierId === undefined ? undefined : parseId(supplierId);

  try {
    const existing = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    if (isSupplierUser(req)) {
      if (!requesterSupplierId) {
        return res.status(403).json({ error: 'Для вашей учетной записи не привязан поставщик.' });
      }

      if (existing.supplierId !== requesterSupplierId) {
        return res.status(403).json({ error: 'Недостаточно прав для изменения этого товара.' });
      }
    }

    let finalImage = existing.image;
    if (req.file) {
      finalImage = `/uploads/${req.file.filename}`;
    } else if (imageUrl !== undefined) {
      finalImage = imageUrl;
    }

    const data = {};
    if (name) data.name = name;
    if (description !== undefined) data.description = description || null;
    if (details !== undefined) data.details = details || null;
    if (specifications !== undefined) data.specifications = specifications || null;
    if (usage !== undefined) data.usage = usage || null;
    if (category) data.category = category;
    if (categoryId !== undefined) data.categoryId = categoryId ? parseInt(categoryId) : null;
    if (price) data.price = parseFloat(price);
    if (oldPrice !== undefined) data.oldPrice = oldPrice ? parseFloat(oldPrice) : null;
    if (finalImage) data.image = finalImage;
    if (rating) data.rating = parseFloat(rating);
    if (reviews) data.reviews = parseInt(reviews);
    if (isHit !== undefined) data.isHit = isHit === 'true' || isHit === true;
    if (bulkDiscount !== undefined) data.bulkDiscount = bulkDiscount || null;

    if (requestedSupplierId !== undefined) {
      if (requestedSupplierId === null) {
        return res.status(400).json({ error: 'Указан некорректный поставщик.' });
      }

      if (isSupplierUser(req) && requestedSupplierId !== requesterSupplierId) {
        return res.status(403).json({ error: 'Нельзя передавать товар другому поставщику.' });
      }

      const supplier = await prisma.supplier.findUnique({
        where: { id: requestedSupplierId }
      });
      if (!supplier) {
        return res.status(404).json({ error: 'Указанный дистрибьютор не найден' });
      }
      data.supplierId = requestedSupplierId;
    }

    const updated = await prisma.product.update({
      where: { id: parseInt(id) },
      data,
      include: { supplier: true }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка обновления товара: ' + error.message });
  }
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  const requesterSupplierId = getRequesterSupplierId(req);

  try {
    const existing = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Товар не найден' });
    }

    if (isSupplierUser(req)) {
      if (!requesterSupplierId) {
        return res.status(403).json({ error: 'Для вашей учетной записи не привязан поставщик.' });
      }

      if (existing.supplierId !== requesterSupplierId) {
        return res.status(403).json({ error: 'Недостаточно прав для удаления этого товара.' });
      }
    }
    
    await prisma.product.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: 'Товар успешно удален' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка удаления товара: ' + error.message });
  }
};
