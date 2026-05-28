import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Auto-inject JWT Admin token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tormag_admin_token');
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

export const getProfile = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Users API
export const getUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

export const createUser = async (userData) => {
  const response = await api.post('/users', userData);
  return response.data;
};

export const updateUser = async (id, userData) => {
  const response = await api.put(`/users/${id}`, userData);
  return response.data;
};

export const updateUserPassword = async (id, password) => {
  const response = await api.put(`/users/${id}/password`, { password });
  return response.data;
};

export const updateUserBlockStatus = async (id, isBlocked) => {
  const response = await api.put(`/users/${id}/block`, { isBlocked });
  return response.data;
};

// Products API
// Returns paginated { data, total, page, totalPages }
export const getProductsPaged = async ({ page = 1, limit = 50, search = '', category = '', supplierId = '' } = {}) => {
  const response = await api.get('/products', {
    params: { page, limit, search: search || undefined, category: category || undefined, supplierId: supplierId || undefined },
  });
  return response.data; // { data, total, page, totalPages }
};

// Legacy helper: returns only the data array from page 1 (used in useDashboardData for counts)
export const getProducts = async (params = {}) => {
  const response = await api.get('/products', { params: { limit: 50, ...params } });
  // Handle both old (array) and new (paginated) response shapes
  return Array.isArray(response.data) ? response.data : (response.data.data || []);
};

export const getPricingSettings = async () => {
  const response = await api.get('/products/pricing/settings');
  return response.data;
};

export const savePricingSettings = async (settings) => {
  const response = await api.post('/products/pricing/settings', settings);
  return response.data;
};

export const createProduct = async (formData) => {
  const response = await api.post('/products', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  });
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};

export const updateProduct = async (id, formData) => {
  const response = await api.put(`/products/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  });
  return response.data;
};

// Categories API
export const getCategories = async () => {
  const response = await api.get('/categories');
  return response.data;
};

export const createCategory = async (formData) => {
  const response = await api.post('/categories', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  });
  return response.data;
};

export const updateCategory = async (id, formData) => {
  const response = await api.put(`/categories/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  });
  return response.data;
};

export const deleteCategory = async (id) => {
  const response = await api.delete(`/categories/${id}`);
  return response.data;
};

// Suppliers API
export const getSuppliers = async () => {
  const response = await api.get('/suppliers');
  return response.data;
};

export const createSupplier = async (supplierData) => {
  const response = await api.post('/suppliers', supplierData);
  return response.data;
};

export const updateSupplier = async (id, supplierData) => {
  const response = await api.put(`/suppliers/${id}`, supplierData);
  return response.data;
};

export const deleteSupplier = async (id) => {
  const response = await api.delete(`/suppliers/${id}`);
  return response.data;
};

// Orders API
export const getOrders = async () => {
  const response = await api.get('/orders');
  return response.data;
};

export const updateOrderStatus = async (id, status) => {
  const response = await api.put(`/orders/${id}/status`, { status });
  return response.data;
};

export const updateOrder = async (id, orderData) => {
  const response = await api.put(`/orders/${id}`, orderData);
  return response.data;
};

// Promotions API
export const getPromotions = async () => {
  const response = await api.get('/promotions');
  return response.data;
};

export const createPromotion = async (payload) => {
  const response = await api.post('/promotions', payload);
  return response.data;
};

export const updatePromotion = async (id, payload) => {
  const response = await api.put(`/promotions/${id}`, payload);
  return response.data;
};

export const deletePromotion = async (id) => {
  const response = await api.delete(`/promotions/${id}`);
  return response.data;
};

// Brands API
export const getBrands = async () => {
  const response = await api.get('/brands');
  return response.data;
};

export const createBrand = async (formData) => {
  const response = await api.post('/brands', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  });
  return response.data;
};

export const updateBrand = async (id, formData) => {
  const response = await api.put(`/brands/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  });
  return response.data;
};

export const deleteBrand = async (id) => {
  const response = await api.delete(`/brands/${id}`);
  return response.data;
};

// Callbacks API
export const getCallbacks = async () => {
  const response = await api.get('/callbacks');
  return response.data;
};

export const updateCallback = async (id, status, comment) => {
  const response = await api.put(`/callbacks/${id}`, { status, comment });
  return response.data;
};

// Partner requests API
export const getPartnerRequests = async () => {
  const response = await api.get('/partner-requests');
  return response.data;
};

export const updatePartnerRequest = async (id, status, adminComment) => {
  const response = await api.put(`/partner-requests/${id}`, { status, adminComment });
  return response.data;
};

export const getSiteAnalytics = async (range = 'week') => {
  const response = await api.get('/analytics/summary', { params: { range } });
  return response.data;
};

export default api;
