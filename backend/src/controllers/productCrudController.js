import prisma from '../config/db.js';
import { Prisma } from '@prisma/client';
import logger from '../utils/logger.js';
import { processAndUploadMedia } from '../utils/mediaOptimizer.js';
import { slugify } from '../utils/slugify.js';
import { clearProductsCache } from '../services/pricingService.js';
import { logPriceChange } from './productPricingController.js';

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

export async function ensureProductSlug(product) {
  if (!product || product.slug) return product;
  const baseSlug = slugify(product.name) || 'product';

  const existingProducts = await prisma.product.findMany({
    where: { slug: { startsWith: baseSlug }, id: { not: product.id } },
    select: { slug: true }
  });

  const existingSlugs = new Set(existingProducts.map(p => p.slug));
  let candidate = baseSlug;
  let suffix = 1;

  while (existingSlugs.has(candidate)) {
    candidate = `${baseSlug}-${suffix++}`;
  }

  try {
    const updated = await prisma.product.update({
      where: { id: product.id },
      data: { slug: candidate }
    });
    return { ...product, slug: updated.slug };
  } catch (err) {
    logger.warn(`Could not save slug for product ${product.id}: ${err.message}`);
    return { ...product, slug: candidate };
  }
}

export const createProduct = async (req, res) => {
  const {
    name, description, details, specifications, usage, category, price, oldPrice,
    rating, reviews, isHit, bulkDiscount, supplierId, imageUrl, images, categoryId, cashbackPercent, article, options, slug
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
    if (categoryId) {
      const parsedCatId = parseInt(categoryId, 10);
      if (!isNaN(parsedCatId)) {
        const cat = await prisma.category.findUnique({
          where: { id: parsedCatId }
        });
        if (!cat) {
          return res.status(400).json({ error: 'Указанная категория не найдена в базе данных. Пожалуйста, обновите страницу.' });
        }
      }
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: effectiveSupplierId }
    });
    
    if (!supplier) {
      return res.status(404).json({ error: 'Указанный дистрибьютор не найден' });
    }

    let finalImage = 'https://placehold.co/400x300/f8fafc/475569?text=Tormag';
    const mainFile = req.files && req.files['imageFile'] ? req.files['imageFile'][0] : (req.file || null);
    const productFolderId = article || 'catalog';

    if (mainFile) {
      const uploadRes = await processAndUploadMedia({
        buffer: mainFile.buffer,
        filePath: mainFile.path,
        originalname: mainFile.originalname,
        folder: 'products',
        entityId: productFolderId
      });
      finalImage = uploadRes.url;
    } else if (imageUrl) {
      finalImage = imageUrl;
    }

    let finalImages = [];
    if (Array.isArray(images)) {
      finalImages = images.filter(img => typeof img === 'string' && img.trim() !== '');
    } else if (typeof images === 'string' && images.trim() !== '') {
      try {
        const parsed = JSON.parse(images);
        if (Array.isArray(parsed)) {
          finalImages = parsed.filter(img => typeof img === 'string' && img.trim() !== '');
        } else {
          finalImages = [images];
        }
      } catch {
        finalImages = [images];
      }
    }

    const additionalFiles = req.files && req.files['additionalImageFiles'] ? req.files['additionalImageFiles'] : [];
    for (const file of additionalFiles) {
      const uploadRes = await processAndUploadMedia({
        buffer: file.buffer,
        filePath: file.path,
        originalname: file.originalname,
        folder: 'products',
        entityId: productFolderId
      });
      finalImages.push(uploadRes.url);
    }

    let parsedOptions = Prisma.DbNull;
    if (options) {
      if (typeof options === 'object') {
        parsedOptions = (options.label && options.items?.length > 0) ? options : Prisma.DbNull;
      } else if (typeof options === 'string' && options.trim() !== '' && options !== 'null') {
        try {
          const parsed = JSON.parse(options);
          parsedOptions = (parsed && parsed.label && parsed.items?.length > 0) ? parsed : Prisma.DbNull;
        } catch {
          parsedOptions = Prisma.DbNull;
        }
      }
    }

    let finalSlug = slugify(slug || name) || 'product';
    let candidateSlug = finalSlug;
    let slugSuffix = 1;
    while (true) {
      const existingSlug = await prisma.product.findFirst({ where: { slug: candidateSlug }, select: { id: true } });
      if (!existingSlug) break;
      candidateSlug = `${finalSlug}-${slugSuffix++}`;
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        slug: candidateSlug,
        description: description || null,
        details: details || null,
        specifications: specifications || null,
        usage: usage || null,
        category,
        categoryId: categoryId ? parseInt(categoryId) : null,
        price: parseFloat(price),
        oldPrice: oldPrice ? parseFloat(oldPrice) : null,
        image: finalImage,
        images: finalImages,
        rating: rating ? parseFloat(rating) : 4.5,
        reviews: reviews ? parseInt(reviews) : 0,
        isHit: isHit === 'true' || isHit === true,
        bulkDiscount: bulkDiscount || null,
        supplierId: effectiveSupplierId,
        cashbackPercent: cashbackPercent !== undefined && cashbackPercent !== '' ? parseInt(cashbackPercent) : null,
        article: article || null,
        options: parsedOptions
      },
      include: {
        supplier: true
      }
    });

    await clearProductsCache();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка создания товара: ' + error.message });
  }
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const {
    name, description, details, specifications, usage, category, price, oldPrice,
    rating, reviews, isHit, bulkDiscount, supplierId, imageUrl, images, categoryId, cashbackPercent, article, options, slug
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

    if (categoryId !== undefined && categoryId !== null && categoryId !== '') {
      const parsedCatId = parseInt(categoryId, 10);
      if (!isNaN(parsedCatId)) {
        const cat = await prisma.category.findUnique({
          where: { id: parsedCatId }
        });
        if (!cat) {
          return res.status(400).json({ error: 'Указанная категория не найдена в базе данных. Пожалуйста, обновите страницу.' });
        }
      }
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
    const mainFile = req.files && req.files['imageFile'] ? req.files['imageFile'][0] : (req.file || null);
    const productFolderId = article || existing.article || id;

    if (mainFile) {
      const uploadRes = await processAndUploadMedia({
        buffer: mainFile.buffer,
        filePath: mainFile.path,
        originalname: mainFile.originalname,
        folder: 'products',
        entityId: productFolderId
      });
      finalImage = uploadRes.url;
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
    if (cashbackPercent !== undefined) data.cashbackPercent = cashbackPercent !== '' ? parseInt(cashbackPercent) : null;
    if (slug || name || !existing.slug) {
      let desiredSlug = slugify(slug || name || existing.name) || 'product';
      if (desiredSlug !== existing.slug) {
        let candidateSlug = desiredSlug;
        let slugSuffix = 1;
        while (true) {
          const existingSlug = await prisma.product.findFirst({
            where: { slug: candidateSlug, id: { not: parseInt(id) } },
            select: { id: true }
          });
          if (!existingSlug) break;
          candidateSlug = `${desiredSlug}-${slugSuffix++}`;
        }
        data.slug = candidateSlug;
      }
    }

    if (options !== undefined) {
      if (options === null || options === '' || options === 'null') {
        data.options = Prisma.DbNull;
      } else if (typeof options === 'object') {
        data.options = options;
      } else if (typeof options === 'string') {
        try {
          const parsed = JSON.parse(options);
          data.options = (parsed && parsed.label && parsed.items?.length > 0) ? parsed : Prisma.DbNull;
        } catch {
          data.options = Prisma.DbNull;
        }
      }
    }

    let finalImages = [];
    if (images !== undefined) {
      if (Array.isArray(images)) {
        finalImages = images.filter(img => typeof img === 'string' && img.trim() !== '');
      } else if (typeof images === 'string') {
        try {
          const parsed = JSON.parse(images);
          if (Array.isArray(parsed)) {
            finalImages = parsed.filter(img => typeof img === 'string' && img.trim() !== '');
          } else if (images.trim() !== '') {
            finalImages = [images];
          }
        } catch {
          if (images.trim() !== '') {
            finalImages = [images];
          }
        }
      }
    } else if (existing.images) {
      finalImages = [...existing.images];
    }

    const additionalFiles = req.files && req.files['additionalImageFiles'] ? req.files['additionalImageFiles'] : [];
    for (const file of additionalFiles) {
      const uploadRes = await processAndUploadMedia({
        buffer: file.buffer,
        filePath: file.path,
        originalname: file.originalname,
        folder: 'products',
        entityId: productFolderId
      });
      finalImages.push(uploadRes.url);
    }

    data.images = { set: finalImages };

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

    if (existing.price !== updated.price || existing.oldPrice !== updated.oldPrice) {
      const adminName = req.user?.name || req.user?.email || 'Администратор';
      await logPriceChange({
        productId: updated.id,
        productName: updated.name,
        oldPrice: existing.price,
        newPrice: updated.price,
        changeType: 'PRODUCT_UPDATE',
        details: `Обновлена цена товара "${updated.name}" (#${updated.id}): ${existing.price} ₸ → ${updated.price} ₸`,
        changedBy: adminName
      });
    }

    await clearProductsCache();
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
    
    const targetId = parseInt(id, 10);

    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { productId: targetId } }),
      prisma.analyticsEvent.deleteMany({ where: { productId: targetId } }),
      prisma.review.deleteMany({ where: { productId: targetId } }),
      prisma.returnRequest.deleteMany({ where: { productId: targetId } }),
      prisma.orderItem.deleteMany({ where: { productId: targetId } }),
      prisma.product.delete({ where: { id: targetId } }),
    ]);
    
    await clearProductsCache();
    res.json({ message: 'Товар успешно удален' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка удаления товара: ' + error.message });
  }
};
