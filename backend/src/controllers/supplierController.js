import prisma from '../config/db.js';

export const getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения дистрибьюторов: ' + error.message });
  }
};

export const createSupplier = async (req, res) => {
  const { name, delivery, rating, reviews } = req.body;
  if (!name || !delivery) {
    return res.status(400).json({ error: 'Имя и срок доставки обязательны' });
  }
  try {
    const newSupplier = await prisma.supplier.create({
      data: {
        name,
        delivery,
        rating: rating ? parseFloat(rating) : 5.0,
        reviews: reviews ? parseInt(reviews) : 0
      }
    });
    res.status(201).json(newSupplier);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка создания дистрибьютора: ' + error.message });
  }
};

// Update an existing supplier
export const updateSupplier = async (req, res) => {
  const { id } = req.params;
  const { name, delivery, rating, reviews } = req.body;

  try {
    const existing = await prisma.supplier.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Дистрибьютор не найден' });
    }

    const data = {};
    if (name) data.name = name;
    if (delivery) data.delivery = delivery;
    if (rating !== undefined) data.rating = parseFloat(rating);
    if (reviews !== undefined) data.reviews = parseInt(reviews);

    const updated = await prisma.supplier.update({
      where: { id: parseInt(id) },
      data
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка обновления дистрибьютора: ' + error.message });
  }
};

// Delete a supplier
export const deleteSupplier = async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await prisma.supplier.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Дистрибьютор не найден' });
    }

    await prisma.supplier.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Дистрибьютор успешно удален' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка удаления дистрибьютора: ' + error.message });
  }
};
