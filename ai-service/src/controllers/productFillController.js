import { fillProductCard } from '../services/productFillService.js';

export const handleFillProductCard = async (req, res) => {
  try {
    const productName = req.body.productName || req.body.title || req.body.name;

    if (!productName || typeof productName !== 'string' || !productName.trim()) {
      return res.status(400).json({ error: 'Укажите название товара (productName или title)' });
    }

    const cardData = await fillProductCard({ productName: productName.trim() });

    return res.json(cardData);
  } catch (error) {
    console.error('[PRODUCT FILL CONTROLLER ERROR]', error);
    return res.status(500).json({
      error: 'Ошибка при автоматическом заполнении карточки товара через ИИ'
    });
  }
};
