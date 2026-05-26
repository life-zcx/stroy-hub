import { useEffect, useState } from 'react';

const KNOWN_PAGES = [
  'catalog', 'advisor', 'delivery', 'about', 'legal',
  'services', 'payment-terms', 'delivery-terms', 'warranty', 'faq', 'requisites', 'partners', 'promotions'
];

const getInitialPage = () => {
  const path = window.location.pathname.replace(/^\/|\/$/g, '');
  const productMatch = path.match(/^product\/(\d+)$/);
  if (productMatch) {
    return { page: 'product', productId: productMatch[1] };
  }

  if (KNOWN_PAGES.includes(path)) {
    return { page: path, productId: null };
  }
  return { page: 'home', productId: null };
};

export default function useNavigation() {
  const [navigation, setNavigation] = useState(getInitialPage);

  const setCurrentPage = (page, productId = null) => {
    setNavigation({ page, productId });
    const path = page === 'home' ? '/' : page === 'product' ? `/product/${productId}` : `/${page}`;
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
    setCurrentPage,
    openProductPage,
  };
}
