import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Auto-inject JWT Customer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tormag_customer_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Auth API
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get('/auth/me');
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

export const getUserBonuses = async () => {
  const response = await api.get('/orders/bonuses');
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
export const getProductReviews = async (productId) => {
  const response = await api.get(`/reviews/product/${productId}`);
  return response.data;
};

export const createProductReview = async (productId, rating, comment) => {
  const response = await api.post(`/reviews/product/${productId}`, { rating, comment });
  return response.data;
};

export default api;
