import prisma from '../config/db.js';

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

    // Format the items to match the structure expected by the frontend cart hook
    const formattedCart = cartItems.map(item => ({
      ...item.product,
      quantity: item.quantity
    }));

    res.status(200).json(formattedCart);
  } catch (error) {
    console.error('[GET CART ERROR]', error);
    res.status(500).json({ error: 'Не удалось загрузить корзину.' });
  }
};

// Add item to cart (or increment if already exists)
export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const prodId = parseInt(productId, 10);

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

    // Upsert cart item with race condition resilience
    try {
      await prisma.cartItem.upsert({
        where: {
          userId_productId: {
            userId,
            productId: prodId
          }
        },
        update: {
          quantity: {
            increment: qty
          }
        },
        create: {
          userId,
          productId: prodId,
          quantity: qty
        }
      });
    } catch (upsertError) {
      if (upsertError.code === 'P2002') {
        // Fallback update in case concurrent requests triggered the race condition
        await prisma.cartItem.update({
          where: {
            userId_productId: {
              userId,
              productId: prodId
            }
          },
          data: {
            quantity: {
              increment: qty
            }
          }
        });
      } else {
        throw upsertError;
      }
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

    const formattedCart = cartItems.map(item => ({
      ...item.product,
      quantity: item.quantity
    }));

    res.status(200).json(formattedCart);
  } catch (error) {
    console.error('[ADD TO CART ERROR]', error);
    res.status(500).json({ error: 'Не удалось добавить товар в корзину.' });
  }
};

// Update item quantity
export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = parseInt(req.params.productId, 10);
    const { quantity } = req.body;

    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Некорректный ID товара.' });
    }

    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    await prisma.cartItem.update({
      where: {
        userId_productId: {
          userId,
          productId
        }
      },
      data: {
        quantity: qty
      }
    });

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

    const formattedCart = cartItems.map(item => ({
      ...item.product,
      quantity: item.quantity
    }));

    res.status(200).json(formattedCart);
  } catch (error) {
    console.error('[UPDATE CART ERROR]', error);
    res.status(500).json({ error: 'Не удалось обновить корзину.' });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = parseInt(req.params.productId, 10);

    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Некорректный ID товара.' });
    }

    await prisma.cartItem.delete({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

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

    const formattedCart = cartItems.map(item => ({
      ...item.product,
      quantity: item.quantity
    }));

    res.status(200).json(formattedCart);
  } catch (error) {
    console.error('[REMOVE FROM CART ERROR]', error);
    res.status(500).json({ error: 'Не удалось удалить товар из корзины.' });
  }
};

// Sync guest cart with database (merge)
export const syncCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items } = req.body; // Array of { id, quantity }

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Некорректный формат данных.' });
    }

    // Merge each valid item in transaction, filtering out invalid NaN IDs
    const validItems = items.filter(item => {
      const targetId = item.productId !== undefined ? item.productId : item.id;
      const prodId = parseInt(targetId, 10);
      return !isNaN(prodId);
    });

    if (validItems.length > 0) {
      await prisma.$transaction(
        validItems.map(item => {
          const targetId = item.productId !== undefined ? item.productId : item.id;
          const prodId = parseInt(targetId, 10);
          const qty = Math.max(1, parseInt(item.quantity, 10) || 1);

          return prisma.cartItem.upsert({
            where: {
              userId_productId: {
                userId,
                productId: prodId
              }
            },
            update: {
              quantity: {
                increment: qty
              }
            },
            create: {
              userId,
              productId: prodId,
              quantity: qty
            }
          });
        })
      );
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

    const formattedCart = updatedCartItems.map(item => ({
      ...item.product,
      quantity: item.quantity
    }));

    res.status(200).json(formattedCart);
  } catch (error) {
    console.error('[SYNC CART ERROR]', error);
    res.status(500).json({ error: 'Не удалось синхронизировать корзину.' });
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
    console.error('[CLEAR CART ERROR]', error);
    res.status(500).json({ error: 'Не удалось очистить корзину.' });
  }
};
