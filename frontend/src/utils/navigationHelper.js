export const getPageHref = (pageId, productId = null, categorySlug = null) => {
  if (pageId === 'product') return `/product/${productId}`;
  if (pageId === 'order-detail') return `/orders/${productId}`;
  if (pageId === 'promotions' && productId) return `/promotions/${productId}`;
  if (pageId === 'catalog') return categorySlug && categorySlug !== 'all' ? `/catalog/${categorySlug}` : '/catalog';
  if (pageId === 'home') return '/';
  return `/${pageId}`;
};
