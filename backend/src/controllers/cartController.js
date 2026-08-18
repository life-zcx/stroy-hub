import prisma from '../config/db.js';
import { applyRetailPricingToProduct, readPricingSettings } from './productController.js';
import { safeErrorMessage } from '../utils/apiError.js';
import logger from '../utils/logger.js';

// Format the cart items to include variant options and custom variant prices with retail markups
const formatCartItems = async (cartItems) => {
  const settings = readPricingSettings();
  const allCats = await prisma.category.findMany();
  const categoryMap = new Map(allCats.map(c => [c.id, c]));
  const categorySlugMap = new Map(allCats.map(c => [c.slug, c]));

  return cartItems.map(item => {
    const pricedProduct = applyRetailPricingToProduct(item.product, settings, categoryMap, categorySlugMap);
    let effectivePrice = pricedProduct.price;

    if (item.selectedOption && pricedProduct.options && typeof pricedProduct.options === 'object') {
      const opts = pricedProduct.options;
      if (Array.isArray(opts.items)) {
        const targetOpt = String(item.selectedOption).trim().toLowerCase();
        const matchedOpt = opts.items.find(o => {
          const valStr = String(o.value || o.name || '').trim().toLowerCase();
          return valStr === targetOpt;
        });
        if (matchedOpt && matchedOpt.price !== undefined && matchedOpt.price !== null) {
          const parsedOptPrice = parseFloat(matchedOpt.price);
          if (!isNaN(parsedOptPrice) && parsedOptPrice > 0) {
            effectivePrice = parsedOptPrice;
          }
        }
      }
    }
    return {
      ...pricedProduct,
      price: effectivePrice,
      quantity: item.quantity,
      selectedOption: item.selectedOption || undefined
    };
  });
};

// Get user's cart items
export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            supplier: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.status(200).json(await formatCartItems(cartItems));
  } catch (error) {
    logger.error('[GET CART ERROR]', { error: error.message });
    res.status(500).json({ error: safeErrorMessage(error, 'Не удалось загрузить корзину.') });
  }
};

// Add item to cart (or increment if already exists)
export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity, selectedOption } = req.body;

    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const prodId = parseInt(productId, 10);
    const selOpt = selectedOption ? String(selectedOption).trim() : null;

    if (isNaN(prodId)) {
      return res.status(400).json({ error: 'Некорректный ID товара.' });
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: prodId }
    });

    if (!product) {
      return res.status(404).json({ error: 'Товар не найден.' });
    }

    // Add or increment cart item safely
    const existingCartItem = await prisma.cartItem.findFirst({
      where: {
        userId,
        productId: prodId,
        selectedOption: selOpt
      }
    });

    if (existingCartItem) {
      await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: existingCartItem.quantity + qty
        }
      });
    } else {
      await prisma.cartItem.create({
        data: {
          userId,
          productId: prodId,
          quantity: qty,
          selectedOption: selOpt
        }
      });
    }

    // Retrieve full updated cart
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            supplier: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.status(200).json(await formatCartItems(cartItems));
  } catch (error) {
    logger.error('[ADD TO CART ERROR]', { error: error.message });
    res.status(500).json({ error: safeErrorMessage(error, 'Не удалось добавить товар в корзину.') });
  }
};

// Update item quantity
export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = parseInt(req.params.productId, 10);
    const { quantity, selectedOption } = req.body;

    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Некорректный ID товара.' });
    }

    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const selOpt = selectedOption !== undefined ? (selectedOption ? String(selectedOption).trim() : null) : undefined;

    if (selOpt !== undefined) {
      await prisma.cartItem.updateMany({
        where: {
          userId,
          productId,
          selectedOption: selOpt
        },
        data: {
          quantity: qty
        }
      });
    } else {
      await prisma.cartItem.updateMany({
        where: {
          userId,
          productId
        },
        data: {
          quantity: qty
        }
      });
    }

    // Retrieve full updated cart
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            supplier: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.status(200).json(await formatCartItems(cartItems));
  } catch (error) {
    logger.error('[UPDATE CART ERROR]', { error: error.message });
    res.status(500).json({ error: safeErrorMessage(error, 'Не удалось обновить корзину.') });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = parseInt(req.params.productId, 10);
    const selectedOption = req.query.selectedOption || req.body?.selectedOption;

    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Некорректный ID товара.' });
    }

    const selOpt = selectedOption !== undefined && selectedOption !== null ? (String(selectedOption).trim() || null) : undefined;

    if (selOpt !== undefined) {
      await prisma.cartItem.deleteMany({
        where: {
          userId,
          productId,
          selectedOption: selOpt
        }
      });
    } else {
      await prisma.cartItem.deleteMany({
        where: {
          userId,
          productId
        }
      });
    }

    // Retrieve full updated cart
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            supplier: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.status(200).json(await formatCartItems(cartItems));
  } catch (error) {
    logger.error('[REMOVE FROM CART ERROR]', { error: error.message });
    res.status(500).json({ error: safeErrorMessage(error, 'Не удалось удалить товар из корзины.') });
  }
};

// Sync guest cart with database (merge)
export const syncCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items } = req.body; // Array of { productId/id, quantity, selectedOption }

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Некорректный формат данных.' });
    }

    // Merge each valid item in transaction, filtering out invalid NaN IDs
    const validItems = items.filter(item => {
      const targetId = item.productId !== undefined ? item.productId : item.id;
      const prodId = parseInt(targetId, 10);
      return !isNaN(prodId);
    });

    for (const item of validItems) {
      const targetId = item.productId !== undefined ? item.productId : item.id;
      const prodId = parseInt(targetId, 10);
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const selOpt = item.selectedOption ? String(item.selectedOption).trim() : null;

      const existing = await prisma.cartItem.findFirst({
        where: { userId, productId: prodId, selectedOption: selOpt }
      });

      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + qty }
        });
      } else {
        await prisma.cartItem.create({
          data: { userId, productId: prodId, quantity: qty, selectedOption: selOpt }
        });
      }
    }

    // Retrieve full updated cart
    const updatedCartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            supplier: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.status(200).json(await formatCartItems(updatedCartItems));
  } catch (error) {
    logger.error('[SYNC CART ERROR]', { error: error.message });
    res.status(500).json({ error: safeErrorMessage(error, 'Не удалось синхронизировать корзину.') });
  }
};

// Clear entire cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.cartItem.deleteMany({
      where: { userId }
    });

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('[CLEAR CART ERROR]', { error: error.message });
    res.status(500).json({ error: safeErrorMessage(error, 'Не удалось очистить корзину.') });
  }
};
