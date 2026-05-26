export const FALLBACK_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';

export const getPremiumImage = (productName = '') => {
  const name = productName.toLowerCase();
  if (name.includes('цемент')) return 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80';
  if (name.includes('rotband') || name.includes('штукатурка')) return 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=800&q=80';
  if (name.includes('доска')) return 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80';
  if (name.includes('брус')) return 'https://images.unsplash.com/photo-1520156480391-11597d6db64d?auto=format&fit=crop&w=800&q=80';
  if (name.includes('перфоратор')) return 'https://images.unsplash.com/photo-1608613304899-ea8098577e38?auto=format&fit=crop&w=800&q=80';
  if (name.includes('шуруповерт')) return 'https://images.unsplash.com/photo-1534224039826-c7a0dea0e66a?auto=format&fit=crop&w=800&q=80';
  if (name.includes('tikkurila') || name.includes('краска интерьерная')) return 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80';
  if (name.includes('эмаль') || name.includes('пф-115')) return 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80';
  if (name.includes('саморез')) return 'https://images.unsplash.com/photo-1590236166418-498c199859f8?auto=format&fit=crop&w=800&q=80';
  if (name.includes('анкер') || name.includes('болт')) return 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=800&q=80';
  return null;
};

export const getProductImage = (product) => {
  if (product?.image && !product.image.includes('placehold.co')) {
    return product.image;
  }
  return getPremiumImage(product?.name) || product?.image || FALLBACK_PRODUCT_IMAGE;
};
