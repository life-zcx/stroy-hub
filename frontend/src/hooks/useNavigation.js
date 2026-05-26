import { useEffect, useState } from 'react';

const KNOWN_PAGES = [
  'catalog', 'advisor', 'delivery', 'about', 'legal', 'favorites',
  'services', 'payment-terms', 'delivery-terms', 'warranty', 'faq', 'requisites', 'partners', 'promotions'
];

const getInitialPage = () => {
  const path = window.location.pathname.replace(/^\/|\/$/g, '');
  
  // Product page check
  const productMatch = path.match(/^product\/(\d+)$/);
  if (productMatch) {
    return { page: 'product', productId: productMatch[1], categorySlug: null };
  }

  // Catalog with category check
  const catalogMatch = path.match(/^catalog\/(.+)$/);
  if (catalogMatch) {
    return { page: 'catalog', productId: null, categorySlug: catalogMatch[1] };
  }

  if (KNOWN_PAGES.includes(path)) {
    return { page: path, productId: null, categorySlug: null };
  }
  
  return { page: 'home', productId: null, categorySlug: null };
};

export default function useNavigation() {
  const [navigation, setNavigation] = useState(getInitialPage);

  const setCurrentPage = (page, productId = null, categorySlug = null) => {
    setNavigation({ page, productId, categorySlug });
    
    let path = '/';
    if (page === 'product') {
      path = `/product/${productId}`;
    } else if (page === 'catalog') {
      path = categorySlug && categorySlug !== 'all' ? `/catalog/${categorySlug}` : '/catalog';
    } else if (page !== 'home') {
      path = `/${page}`;
    }

    window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const openProductPage = (productId) => {
    setCurrentPage('product', productId);
  };

  useEffect(() => {
    const handlePopState = () => {
      setNavigation(getInitialPage());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return {
    currentPage: navigation.page,
    currentProductId: navigation.productId,
    currentCategorySlug: navigation.categorySlug,
    setCurrentPage,
    openProductPage,
  };
}
