import prisma from '../config/db.js';

// Get all categories (flat list with children)
export const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        children: true
      },
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения категорий: ' + error.message });
  }
};

// Get a category by ID (or slug) with children and breadcrumbs path
export const getCategoryById = async (req, res) => {
  const { id } = req.params;
  try {
    let category;
    
    if (isNaN(id)) {
      // Fetch by slug
      category = await prisma.category.findUnique({
        where: { slug: id },
        include: {
          children: true,
          parent: true
        }
      });
    } else {
      // Fetch by ID
      category = await prisma.category.findUnique({
        where: { id: parseInt(id) },
        include: {
          children: true,
          parent: true
        }
      });
    }

    if (!category) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    // Build breadcrumbs path from current leaf to root
    const breadcrumbs = [];
    let current = category;
    while (current) {
      breadcrumbs.unshift({
        id: current.id,
        name: current.name,
        slug: current.slug
      });
      
      if (current.parentId) {
        current = await prisma.category.findUnique({
          where: { id: current.parentId }
        });
      } else {
        current = null;
      }
    }

    res.json({
      ...category,
      breadcrumbs
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения категории: ' + error.message });
  }
};

// Create a new category
export const createCategory = async (req, res) => {
  const { name, slug, image, parentId } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Название категории обязательно' });
  }

  // Determine image path: uploaded file or external URL
  let finalImage = null;
  if (req.file) {
    finalImage = `/uploads/${req.file.filename}`;
  } else if (image) {
    finalImage = image;
  }

  // Simple cyrillic-to-latin/safe characters slugifier
  const categorySlug = slug || name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9а-яё-]/g, '');

  try {
    const newCategory = await prisma.category.create({
      data: {
        name,
        slug: categorySlug,
        image: finalImage,
        parentId: parentId ? parseInt(parentId) : null
      }
    });
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка создания категории: ' + error.message });
  }
};

// Update an existing category
export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, slug, image, parentId } = req.body;

  try {
    const existing = await prisma.category.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    let finalImage = existing.image;
    if (req.file) {
      finalImage = `/uploads/${req.file.filename}`;
    } else if (image !== undefined) {
      finalImage = image || null;
    }

    const data = {};
    if (name) data.name = name;
    if (slug) data.slug = slug;
    if (finalImage !== undefined) data.image = finalImage;
    
    if (parentId !== undefined) {
      // Prevent circular referencing
      if (parentId && parseInt(parentId) === parseInt(id)) {
        return res.status(400).json({ error: 'Категория не может быть своим собственным родителем' });
      }
      data.parentId = parentId ? parseInt(parentId) : null;
    }

    const updated = await prisma.category.update({
      where: { id: parseInt(id) },
      data
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка обновления категории: ' + error.message });
  }
};

// Delete a category
export const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const categoryId = parseInt(id);
    const existing = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    await prisma.category.delete({
      where: { id: categoryId }
    });

    res.json({ message: 'Категория успешно удалена' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка удаления категории: ' + error.message });
  }
};
