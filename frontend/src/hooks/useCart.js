import { useEffect, useState, useRef } from 'react';
import { trackEvent } from '../utils/analytics';
import {
  getCartApi,
  addToCartApi,
  updateCartItemApi,
  removeFromCartApi,
  syncCartApi,
  clearCartApi
} from '../services/api';

export default function useCart(showToast, customer) {
  // Lazy initializer: immediately reads localStorage so cart is never empty on first render
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('tormag_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  // Track previous customer state to detect login/logout transitions
  const prevCustomerRef = useRef(customer);

  // (removed: localStorage read is now done in useState lazy initializer above)

  // Sync state & handle login/logout transitions
  useEffect(() => {
    const prevCustomer = prevCustomerRef.current;
    prevCustomerRef.current = customer;

    const syncUserCart = async () => {
      setLoading(true);
      try {
        if (customer && !prevCustomer) {
          // User just logged in! Merge local/guest cart with DB cart.
          const savedLocal = localStorage.getItem('tormag_cart');
          const localItems = savedLocal ? JSON.parse(savedLocal) : [];
          
          if (localItems.length > 0) {
            // Prepare items for DB merge, skipping temporary items
            const itemsToSync = localItems
              .filter(item => !(typeof item.id === 'string' && item.id.startsWith('temp_')))
              .map(item => ({
                productId: item.id,
                quantity: item.quantity
              }));
            
            // Sync with backend — returns flat [{...product, quantity}]
            const dbCart = await syncCartApi(itemsToSync);
            setCart(dbCart);
            
            // Clear local storage cart since it's merged
            localStorage.removeItem('tormag_cart');
          } else {
            // Fetch DB cart — returns flat [{...product, quantity}]
            const dbCart = await getCartApi();
            setCart(dbCart);
          }
        } else if (customer) {
          // Already logged in, just fetch current DB cart
          const dbCart = await getCartApi();
          setCart(dbCart);
        } else if (!customer && prevCustomer) {
          // User just logged out! Reset cart to empty
          setCart([]);
          localStorage.removeItem('tormag_cart');
        }
      } catch (err) {
        console.error('Error syncing cart:', err);
      } finally {
        setLoading(false);
      }
    };

    syncUserCart();
  }, [customer]);

  // Mark as initialized after first customer resolution
  useEffect(() => {
    if (!initialized) setInitialized(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer]);

  // Sync guest cart to local storage when it changes (only after initialization)
  useEffect(() => {
    if (!customer && initialized) {
      localStorage.setItem('tormag_cart', JSON.stringify(cart));
    }
  }, [cart, customer, initialized]);

  const handleAddToCart = async (product, quantity = 1) => {
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

    const isTempProduct = typeof product.id === 'string' && product.id.startsWith('temp_');

    if (customer && !isTempProduct) {
      try {
        // Backend returns flat [{...product, quantity}]
        const dbCart = await addToCartApi(product.id, quantityToAdd);
        setCart(dbCart);
      } catch (err) {
        console.error('Error adding to DB cart:', err);
        showToast?.('Не удалось добавить товар в корзину');
      }
    } else {
      setCart(prev => {
        const exists = prev.find(item => item.id === product.id);
        if (exists) {
          return prev.map(item =>
            item.id === product.id ? { ...item, quantity: item.quantity + quantityToAdd } : item
          );
        }
        return [...prev, { ...product, quantity: quantityToAdd }];
      });
    }
    showToast?.(`«${product.name}» добавлен в корзину (${quantityToAdd} шт)`);
  };

  const handleUpdateQuantity = async (id, val, isAbsolute = false) => {
    const existingItem = cart.find(item => item.id === id);
    if (!existingItem) return;
    
    const newQty = isAbsolute ? Math.max(1, val) : Math.max(1, existingItem.quantity + val);

    if (customer) {
      try {
        // Backend returns flat [{...product, quantity}]
        const dbCart = await updateCartItemApi(id, newQty);
        setCart(dbCart);
      } catch (err) {
        console.error('Error updating DB cart quantity:', err);
      }
    } else {
      setCart(prev => prev.map(item => {
        if (item.id === id) {
          return { ...item, quantity: newQty };
        }
        return item;
      }));
    }
  };

  const handleRemoveFromCart = async (id) => {
    if (customer) {
      try {
        // Backend returns flat [{...product, quantity}]
        const dbCart = await removeFromCartApi(id);
        setCart(dbCart);
      } catch (err) {
        console.error('Error removing from DB cart:', err);
      }
    } else {
      setCart(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleClearCart = async () => {
    if (customer) {
      try {
        await clearCartApi();
        setCart([]);
      } catch (err) {
        console.error('Error clearing DB cart:', err);
      }
    } else {
      setCart([]);
    }
  };

  // Set exact quantity; if qty=0 — remove from cart
  const handleSetCartQuantity = async (id, qty) => {
    if (qty <= 0) {
      await handleRemoveFromCart(id);
    } else {
      await handleUpdateQuantity(id, qty, true);
    }
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
    handleSetCartQuantity,
    handleRemoveFromCart,
    handleClearCart,
    loading
  };
}
