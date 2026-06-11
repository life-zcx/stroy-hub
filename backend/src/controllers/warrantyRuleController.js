import prisma from '../config/db.js';

// Get all warranty rules with populated target names
export const getAllWarrantyRules = async (req, res) => {
  try {
    const rules = await prisma.warrantyRule.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Extract product and category IDs to fetch details in bulk
    const productIds = rules
      .filter((r) => r.scope === 'product' && r.targetId)
      .map((r) => r.targetId);
    
    const categoryIds = rules
      .filter((r) => r.scope === 'category' && r.targetId)
      .map((r) => r.targetId);

    const products = productIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true },
        })
      : [];

    const categories = categoryIds.length > 0
      ? await prisma.category.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true },
        })
      : [];

    const productMap = new Map(products.map((p) => [p.id, p.name]));
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    const populatedRules = rules.map((rule) => {
      let targetName = null;
      if (rule.scope === 'product' && rule.targetId) {
        targetName = productMap.get(rule.targetId) || `Товар #${rule.targetId}`;
      } else if (rule.scope === 'category' && rule.targetId) {
        targetName = categoryMap.get(rule.targetId) || `Категория #${rule.targetId}`;
      }
      return { ...rule, targetName };
    });

    res.json(populatedRules);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении правил гарантии: ' + error.message });
  }
};

// Create a new warranty rule
export const createWarrantyRule = async (req, res) => {
  try {
    const { scope, targetId, days } = req.body;

    if (!scope || !['global', 'category', 'product'].includes(scope)) {
      return res.status(400).json({ error: 'Недопустимая область применения правила (scope).' });
    }

    const daysInt = parseInt(days, 10);
    if (isNaN(daysInt) || daysInt < 0) {
      return res.status(400).json({ error: 'Срок гарантии (дней) должен быть числом >= 0.' });
    }

    let parsedTargetId = null;
    if (scope !== 'global') {
      parsedTargetId = parseInt(targetId, 10);
      if (isNaN(parsedTargetId)) {
        return res.status(400).json({ error: 'Не указан ID цели (категории или товара).' });
      }

      // Check if target exists
      if (scope === 'category') {
        const cat = await prisma.category.findUnique({ where: { id: parsedTargetId } });
        if (!cat) return res.status(400).json({ error: 'Категория не найдена.' });
      } else if (scope === 'product') {
        const prod = await prisma.product.findUnique({ where: { id: parsedTargetId } });
        if (!prod) return res.status(400).json({ error: 'Товар не найден.' });
      }
    }

    // Check if rule already exists for this scope + target
    const existing = await prisma.warrantyRule.findFirst({
      where: { scope, targetId: parsedTargetId },
    });

    if (existing) {
      return res.status(400).json({ error: 'Правило для данной области и цели уже существует. Пожалуйста, обновите или удалите его.' });
    }

    const rule = await prisma.warrantyRule.create({
      data: {
        scope,
        targetId: parsedTargetId,
        days: daysInt,
      },
    });

    res.status(201).json(rule);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при создании правила: ' + error.message });
  }
};

// Update an existing warranty rule
export const updateWarrantyRule = async (req, res) => {
  try {
    const { id } = req.params;
    const { days } = req.body;

    const daysInt = parseInt(days, 10);
    if (isNaN(daysInt) || daysInt < 0) {
      return res.status(400).json({ error: 'Срок гарантии должен быть числом >= 0.' });
    }

    const rule = await prisma.warrantyRule.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!rule) {
      return res.status(404).json({ error: 'Правило не найдено.' });
    }

    const updated = await prisma.warrantyRule.update({
      where: { id: parseInt(id, 10) },
      data: { days: daysInt },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при обновлении правила: ' + error.message });
  }
};

// Delete a warranty rule
export const deleteWarrantyRule = async (req, res) => {
  try {
    const { id } = req.params;

    const rule = await prisma.warrantyRule.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!rule) {
      return res.status(404).json({ error: 'Правило не найдено.' });
    }

    await prisma.warrantyRule.delete({
      where: { id: parseInt(id, 10) },
    });

    res.json({ success: true, message: 'Правило удалено.' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при удалении правила: ' + error.message });
  }
};
