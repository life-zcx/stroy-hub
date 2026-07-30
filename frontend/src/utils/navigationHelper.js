export const getPageHref = (pageId, productId = null, categorySlug = null) => {
  if (pageId === 'product') {
    if (productId && typeof productId === 'object') {
      return `/product/${productId.slug || productId.id}`;
    }
    return `/product/${productId}`;
  }
  if (pageId === 'order-detail') return `/orders/${productId}`;
  if (pageId === 'promotions' && productId) return `/promotions/${productId}`;
  if (pageId === 'catalog') return categorySlug && categorySlug !== 'all' ? `/catalog/${categorySlug}` : '/catalog';
  if (pageId === 'home') return '/';
  return `/${pageId}`;
};
