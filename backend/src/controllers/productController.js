import prisma from '../config/db.js';

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
  const { category, search } = req.query;
  
  const where = {};
  
  if (search) {
    where.name = {
      contains: search,
      mode: 'insensitive'
    };
  }

  try {
    if (category && category !== 'all') {
      const { slugs, ids } = await getDescendantCategorySlugsAndIds(category);
      where.OR = [
        { category: { in: slugs } },
        { categoryId: { in: ids } }
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        supplier: true,
        categoryRelation: true
      },
      orderBy: { id: 'desc' }
    });
    res.json(products);
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
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения товара: ' + error.message });
  }
};

export const createProduct = async (req, res) => {
  const {
    name, description, details, specifications, usage, category, price, oldPrice,
    rating, reviews, isHit, bulkDiscount, supplierId, imageUrl, categoryId
  } = req.body;
  
  if (!name || !category || !price || !supplierId) {
    return res.status(400).json({ error: 'Обязательные поля: Название, Категория, Цена, Поставщик' });
  }

  try {
    // Check if supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: parseInt(supplierId) }
    });
    
    if (!supplier) {
      return res.status(404).json({ error: 'Указанный дистрибьютор не найден' });
    }

    // Determine image path: uploaded file or external URL
    let finalImage = 'https://placehold.co/400x300/f8fafc/475569?text=StroyHub';
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
        supplierId: parseInt(supplierId)
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

  try {
    const existing = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Товар не найден' });
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
    if (supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: parseInt(supplierId) }
      });
      if (!supplier) {
        return res.status(404).json({ error: 'Указанный дистрибьютор не найден' });
      }
      data.supplierId = parseInt(supplierId);
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
  try {
    const existing = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Товар не найден' });
    }
    
    await prisma.product.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: 'Товар успешно удален' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка удаления товара: ' + error.message });
  }
};
