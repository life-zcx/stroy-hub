import { useEffect, useState } from 'react';
import { trackEvent } from '../utils/analytics';

export default function useCart(showToast) {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('tormag_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('tormag_cart', JSON.stringify(cart));
  }, [cart]);

  const handleAddToCart = (product, quantity = 1) => {
    const quantityToAdd = Math.max(1, Number.parseInt(quantity, 10) || 1);

    trackEvent('add_to_cart', {
      productId: product.id,
      value: product.price * quantityToAdd,
      metadata: {
        name: product.name,
        category: product.category,
        quantity: quantityToAdd,
      },
    });

    setCart(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantityToAdd } : item
        );
      }
      return [...prev, { ...product, quantity: quantityToAdd }];
    });
    showToast?.(`🛒 «${product.name}» добавлен в корзину (${quantityToAdd} шт)`);
  };

  const handleUpdateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const handleRemoveFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartItemsCount = cart.reduce((count, item) => count + item.quantity, 0);

  return {
    cart,
    isCartOpen,
    setIsCartOpen,
    cartTotal,
    cartItemsCount,
    handleAddToCart,
    handleUpdateQuantity,
    handleRemoveFromCart,
    handleClearCart,
  };
}
