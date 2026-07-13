export const formatPrice = (price) => {
  const num = typeof price === 'number' ? price : Number(price) || 0;
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(num) + ' ₸';
};
