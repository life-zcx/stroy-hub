export const FALLBACK_PRODUCT_IMAGE = '/tormag.png';

export const getProductImage = (product) => {
  return product?.image || FALLBACK_PRODUCT_IMAGE;
};
