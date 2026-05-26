import prisma from '../config/db.js';

export const getAllProducts = async (req, res) => {
  const { category, search } = req.query;
  
  const where = {};
  
  if (category && category !== 'all') {
    where.category = category;
  }
  
  if (search) {
    where.name = {
      contains: search,
      mode: 'insensitive'
    };
  }

  try {
    const products = await prisma.product.findMany({
      where,
      include: {
        supplier: true
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
      include: { supplier: true }
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
  const { name, description, category, price, oldPrice, rating, reviews, isHit, bulkDiscount, supplierId, imageUrl } = req.body;
  
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
        category,
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
  const { name, description, category, price, oldPrice, rating, reviews, isHit, bulkDiscount, supplierId, imageUrl } = req.body;

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
    if (category) data.category = category;
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
