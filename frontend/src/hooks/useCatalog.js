import { useEffect, useState, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProductsPage, getCategories } from '../services/api';

const PRODUCT_PAGE_SIZE = 24;

export default function useCatalog(showToast, initialCategory = 'all', currentPage = 'home') {
  const [products, setProducts] = useState([]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
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

  // TanStack Query for categories (30 min cache)
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 30 * 60 * 1000,
  });

  const catalogPages = ['home', 'catalog', 'advisor', 'promotions'];
  const isCatalogPage = !currentPage || catalogPages.includes(currentPage);

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
      showToastRef.current?.('⚠️ Ошибка соединения с сервером');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedCategory, searchQuery, sortBy, priceRange.min, priceRange.max, onlyHits, onlyBulk]);

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
    if (isCatalogPage) {
      loadProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCatalogPage, selectedCategory, searchQuery, sortBy, priceRange.min, priceRange.max, onlyHits, onlyBulk]);

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
