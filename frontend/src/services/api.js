import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Auth API
export const login = async (email, password, sessionId) => {
  const response = await api.post('/auth/login', { email, password, sessionId });
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const sendRegisterCode = async (userData) => {
  const response = await api.post('/auth/send-register-code', userData);
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await api.put('/auth/me', data);
  return response.data;
};

export const deleteAccount = async (reason) => {
  const response = await api.delete('/auth/me', { data: { reason } });
  return response.data;
};



// Products API
export const getProducts = async (params = {}) => {
  const response = await api.get('/products', { params });
  return Array.isArray(response.data) ? response.data : (response.data.data || []);
};

export const getProductsPage = async (params = {}) => {
  const response = await api.get('/products', { params });
  return Array.isArray(response.data)
    ? { data: response.data, total: response.data.length, page: 1, totalPages: 1, hasMore: false }
    : response.data;
};

export const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const getProductStats = async (id) => {
  const response = await api.get(`/products/${id}/stats`);
  return response.data;
};

// Suppliers API
export const getSuppliers = async () => {
  const response = await api.get('/suppliers');
  return response.data;
};

// Categories API
export const getCategories = async () => {
  const response = await api.get('/categories');
  return response.data;
};

export const getCategoryById = async (id) => {
  const response = await api.get(`/categories/${id}`);
  return response.data;
};

// Orders API (only returns customer's orders now thanks to backend logic!)
export const getOrders = async (params = {}) => {
  const response = await api.get('/orders', { params });
  return response.data;
};

export const getOrderById = async (id) => {
  const response = await api.get(`/orders/${id}`);
  return response.data;
};

export const createOrder = async (orderData) => {
  const response = await api.post('/orders', orderData);
  return response.data;
};

export const cancelOrderApi = async (orderId, payload = {}) => {
  const response = await api.post(`/orders/${orderId}/cancel`, payload);
  return response.data;
};

const recMemoryCache = new Map();

export const getCartRecommendationsApi = async (cartItems = []) => {
  const productIds = (cartItems || []).map(item => item.productId || item.id).filter(Boolean).sort().join(',');
  const categoryIds = (cartItems || []).map(item => item.product?.categoryId || item.categoryId).filter(Boolean).sort().join(',');
  const cacheKey = `${productIds}:${categoryIds}`;

  if (recMemoryCache.has(cacheKey)) {
    return recMemoryCache.get(cacheKey);
  }

  const response = await api.get('/products/recommendations', {
    params: { productIds, categoryIds },
  });

  if (response.data) {
    recMemoryCache.set(cacheKey, response.data);
  }
  return response.data;
};

export const getReferralSummaryApi = async () => {
  const response = await api.get('/referral/summary');
  return response.data;
};

export const validateReferralCodeApi = async (code) => {
  const response = await api.post('/referral/validate', { code });
  return response.data;
};

export const getUserBonuses = async () => {
  const response = await api.get('/bonuses/summary');
  return response.data;
};

export const getBonusSummary = async () => {
  const response = await api.get('/bonuses/summary');
  return response.data;
};

export const getBonusHistory = async (params = {}) => {
  const response = await api.get('/bonuses/history', { params });
  return response.data;
};

export const getPublicPromotions = async () => {
  const response = await api.get('/promotions/public');
  return response.data;
};

export const getHomePromotions = async () => {
  const response = await api.get('/promotions/home');
  return response.data;
};

export const getMyPromotions = async () => {
  const response = await api.get('/promotions/my');
  return response.data;
};

export const getPublicBanners = async () => {
  const response = await api.get('/banners/public');
  return response.data;
};

export const getBrands = async () => {
  const response = await api.get('/brands/public');
  return response.data;
};


export const validatePromotionCode = async (promoCode, items, subtotalAmount) => {
  const response = await api.post('/promotions/validate', { promoCode, items, subtotalAmount });
  return response.data;
};

// Callback API
export const createCallbackRequest = async (userName, userPhone) => {
  const response = await api.post('/callbacks', { userName, userPhone });
  return response.data;
};

export const createPartnerRequest = async (payload) => {
  const response = await api.post('/partner-requests', payload);
  return response.data;
};

export const recordPageView = async (payload) => {
  const response = await api.post('/analytics/page-view', payload);
  return response.data;
};

export const recordAnalyticsEvent = async (payload) => {
  const response = await api.post('/analytics/event', payload);
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const verifyResetCode = async (email, code) => {
  const response = await api.post('/auth/verify-reset-code', { email, code });
  return response.data;
};

export const resetPassword = async (email, code, password) => {
  const response = await api.post('/auth/reset-password', { email, code, password });
  return response.data;
};

export const matchEstimate = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/products/match-estimate', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

// Reviews API
export const getProductReviews = async (productId, params = {}) => {
  const response = await api.get(`/reviews/product/${productId}`, { params });
  return response.data;
};

export const createProductReview = async (productId, rating, comment) => {
  const response = await api.post(`/reviews/product/${productId}`, { rating, comment });
  return response.data;
};

// Returns API
export const createReturnRequest = async (formData) => {
  const response = await api.post('/returns', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const getMyReturnRequests = async () => {
  const response = await api.get('/returns/my');
  return response.data;
};

export const getWarrantyRules = async () => {
  const response = await api.get('/warranty-rules');
  return response.data;
};

// Cart API
export const getCartApi = async () => {
  const response = await api.get('/cart');
  return response.data;
};

export const addToCartApi = async (productId, quantity, selectedOption) => {
  const response = await api.post('/cart', { productId, quantity, selectedOption });
  return response.data;
};

export const updateCartItemApi = async (productId, quantity, selectedOption) => {
  const response = await api.put(`/cart/${productId}`, { quantity, selectedOption });
  return response.data;
};

export const removeFromCartApi = async (productId, selectedOption) => {
  const response = await api.delete(`/cart/${productId}`, {
    params: { selectedOption }
  });
  return response.data;
};

export const syncCartApi = async (items) => {
  const response = await api.post('/cart/sync', { items });
  return response.data;
};

export const clearCartApi = async () => {
  const response = await api.delete('/cart');
  return response.data;
};

let _settingsCache = null;
let _settingsCacheTime = 0;
const SETTINGS_CACHE_TTL = 60000; // 1 minute

export const getSystemSettings = async () => {
  const now = Date.now();
  if (_settingsCache && (now - _settingsCacheTime) < SETTINGS_CACHE_TTL) {
    return _settingsCache;
  }
  const response = await api.get('/settings');
  _settingsCache = response.data;
  _settingsCacheTime = now;
  return _settingsCache;
};

export const invalidateSettingsCache = () => {
  _settingsCache = null;
  _settingsCacheTime = 0;
};

export const updateSystemSettings = async (settingsData) => {
  const response = await api.post('/settings', settingsData);
  invalidateSettingsCache();
  return response.data;
};

// AI Chatbot Assistant API
export const sendAiChatMessage = async (message, history = []) => {
  const response = await api.post('/ai/chat', { message, history });
  return response.data;
};

export default api;
