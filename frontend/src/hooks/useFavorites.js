import { useState, useEffect } from 'react';

export default function useFavorites(showToast) {
  // Initialize state directly from localStorage to prevent "empty overwrite" bug
  const [favorites, setFavorites] = useState(() => {
    try {
      const savedFavorites = localStorage.getItem('stroyhub_favorites');
      return savedFavorites ? JSON.parse(savedFavorites) : [];
    } catch (e) {
      console.error('Error loading favorites from storage:', e);
      return [];
    }
  });

  // Save favorites to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('stroyhub_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (product) => {
    const isExist = favorites.find(f => f.id === product.id);
    if (isExist) {
      setFavorites(favorites.filter(f => f.id !== product.id));
      showToast?.('💔 Удалено из избранного');
    } else {
      setFavorites([...favorites, product]);
      showToast?.('❤️ Добавлено в избранное');
    }
  };

  const isFavorite = (productId) => {
    return favorites.some(f => f.id === productId);
  };

  const clearFavorites = () => {
    setFavorites([]);
    showToast?.('🧹 Избранное очищено');
  };

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    favoritesCount: favorites.length
  };
}
