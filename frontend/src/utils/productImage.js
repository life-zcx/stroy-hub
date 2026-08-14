import fallbackLogo from '../tormag.png';

export const FALLBACK_PRODUCT_IMAGE = fallbackLogo;

const failedUrls = new Set();

export const markImageFailed = (rawUrl) => {
  if (rawUrl && typeof rawUrl === 'string') {
    failedUrls.add(rawUrl);
  }
};

export const isImageFailed = (rawUrl) => {
  return rawUrl ? failedUrls.has(rawUrl) : false;
};

export const getIpxImageUrl = (rawUrl, size = '800x800', format = 'webp') => {
  if (!rawUrl || typeof rawUrl !== 'string') return FALLBACK_PRODUCT_IMAGE;
  if (failedUrls.has(rawUrl)) return FALLBACK_PRODUCT_IMAGE;
  if (rawUrl.startsWith('data:') || rawUrl.endsWith('.svg')) return rawUrl;

  // Serve http/https URLs directly to prevent proxy fetch failures
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    return rawUrl;
  }

  const cleanUrl = rawUrl.startsWith('/') ? rawUrl.slice(1) : rawUrl;
  return `/_ipx/f_${format}&s_${size}/${encodeURIComponent(cleanUrl)}`;
};

export const getProductImage = (product, size = '800x800') => {
  if (!product || !product.image) return FALLBACK_PRODUCT_IMAGE;
  if (failedUrls.has(product.image)) return FALLBACK_PRODUCT_IMAGE;
  return getIpxImageUrl(product.image, size);
};


