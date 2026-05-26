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
