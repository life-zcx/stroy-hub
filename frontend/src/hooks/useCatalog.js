import { useEffect, useState, useCallback } from 'react';
import { getProducts, getCategories } from '../services/api';

export default function useCatalog(showToast, initialCategory = 'all') {
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // Added for global search autocomplete
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Load all products once for global search suggests
  const loadAllProducts = async () => {
    try {
      const data = await getProducts();
      setAllProducts(data);
    } catch (error) {
      console.error('Error loading all products:', error);
    }
  };

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;
      const data = await getProducts(params);
      setProducts(data);
    } catch (error) {
      console.error(error);
      showToast?.('⚠️ Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, showToast]);

  useEffect(() => {
    loadCategories();
    loadAllProducts();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return {
    products,
    allProducts, // Expose full list for header autocomplete
    categories,
    loading,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    loadProducts,
  };
}
