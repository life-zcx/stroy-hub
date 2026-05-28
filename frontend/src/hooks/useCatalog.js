import { useEffect, useState, useCallback } from 'react';
import { getProductsPage, getCategories } from '../services/api';

const PRODUCT_PAGE_SIZE = 24;

export default function useCatalog(showToast, initialCategory = 'all') {
  const [products, setProducts] = useState([]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 200000 });
  const [onlyHits, setOnlyHits] = useState(false);
  const [onlyBulk, setOnlyBulk] = useState(false);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const buildProductParams = (nextPage) => {
    const params = {
      page: nextPage,
      limit: PRODUCT_PAGE_SIZE,
      sort: sortBy,
    };

    if (selectedCategory !== 'all') params.category = selectedCategory;
    if (searchQuery) params.search = searchQuery;
    if (priceRange.min > 0) params.minPrice = priceRange.min;
    if (priceRange.max < 200000) params.maxPrice = priceRange.max;
    if (onlyHits) params.onlyHits = true;
    if (onlyBulk) params.onlyBulk = true;

    return params;
  };

  const loadProducts = useCallback(async ({ nextPage = 1, append = false } = {}) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const result = await getProductsPage(buildProductParams(nextPage));
      const loadedProducts = result.data || [];

      setProducts((prev) => {
        if (!append) return loadedProducts;
        const existingIds = new Set(prev.map((product) => product.id));
        return [...prev, ...loadedProducts.filter((product) => !existingIds.has(product.id))];
      });
      setPage(nextPage);
      setTotal(result.total || 0);
      setHasMore(Boolean(result.hasMore));
    } catch (error) {
      console.error(error);
      showToast?.('⚠️ Ошибка соединения с сервером');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedCategory, searchQuery, sortBy, priceRange, onlyHits, onlyBulk, showToast]);

  const loadMoreProducts = () => {
    if (!loadingMore && hasMore) {
      loadProducts({ nextPage: page + 1, append: true });
    }
  };

  const loadSearchSuggestions = useCallback(async (query) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchSuggestions([]);
      return;
    }

    try {
      const result = await getProductsPage({ search: trimmed, limit: 6, page: 1 });
      setSearchSuggestions(result.data || []);
    } catch (error) {
      console.error('Error loading product suggestions:', error);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return {
    products,
    searchSuggestions,
    categories,
    loading,
    loadingMore,
    total,
    hasMore,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    priceRange,
    setPriceRange,
    onlyHits,
    setOnlyHits,
    onlyBulk,
    setOnlyBulk,
    loadProducts,
    loadMoreProducts,
    loadSearchSuggestions,
  };
}
