import { useEffect, useState } from 'react';

const KNOWN_PAGES = [
  'catalog', 'advisor', 'estimate', 'delivery', 'about', 'legal', 'favorites',
  'orders', 'services', 'payment-terms', 'delivery-terms', 'warranty', 'faq', 'requisites', 'partners', 'promotions', 'my-promotions', 'cart', 'cashback'
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
    return { page: 'catalog', productId: null, categorySlug: catalogMatch[1], orderId: null };
  }

  const orderMatch = path.match(/^orders\/(\d+)$/);
  if (orderMatch) {
    return { page: 'order-detail', productId: null, categorySlug: null, orderId: orderMatch[1] };
  }

  if (KNOWN_PAGES.includes(path)) {
    return { page: path, productId: null, categorySlug: null, orderId: null };
  }
  
  return { page: 'home', productId: null, categorySlug: null, orderId: null };
};

export default function useNavigation() {
  const [navigation, setNavigation] = useState(getInitialPage);

  const setCurrentPage = (page, productId = null, categorySlug = null) => {
    const orderId = page === 'order-detail' ? productId : null;
    setNavigation({ page, productId: page === 'product' ? productId : null, categorySlug, orderId });
    
    let path = '/';
    if (page === 'product') {
      path = `/product/${productId}`;
    } else if (page === 'order-detail') {
      path = `/orders/${productId}`;
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
    currentOrderId: navigation.orderId,
    setCurrentPage,
    openProductPage,
  };
}
