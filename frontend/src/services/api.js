import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Auto-inject JWT Customer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('stroyhub_customer_token');
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
  return response.data;
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
export const getOrders = async () => {
  const response = await api.get('/orders');
  return response.data;
};

export const createOrder = async (orderData) => {
  const response = await api.post('/orders', orderData);
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

export default api;
