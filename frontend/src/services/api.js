import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach JWT access token
api.interceptors.request.use(
  (config) => {
    const access = localStorage.getItem('cc_access_token');
    if (access) {
      config.headers.Authorization = `Bearer ${access}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Automatic token refresh on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login/') &&
      !originalRequest.url?.includes('/auth/token/refresh/')
    ) {
      const refresh = localStorage.getItem('cc_refresh_token');
      if (!refresh) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, { refresh });
        const newAccess = res.data.access;
        localStorage.setItem('cc_access_token', newAccess);
        if (res.data.refresh) {
          localStorage.setItem('cc_refresh_token', res.data.refresh);
        }
        api.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
        processQueue(null, newAccess);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('cc_access_token');
        localStorage.removeItem('cc_refresh_token');
        localStorage.removeItem('cc_user');
        window.dispatchEvent(new Event('cc-auth-logout'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data;
  if (!data) return error?.message || fallback;
  if (typeof data === 'string') return data;
  if (data.detail) return Array.isArray(data.detail) ? data.detail.join(' ') : String(data.detail);
  if (data.non_field_errors) return data.non_field_errors.join(' ');
  const firstKey = Object.keys(data)[0];
  if (firstKey) {
    const val = data[firstKey];
    if (Array.isArray(val)) return `${firstKey}: ${val.join(' ')}`;
    if (typeof val === 'string') return `${firstKey}: ${val}`;
  }
  return fallback;
}

export function formatINR(amount) {
  const num = Number(amount || 0);
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatTime12(timeStr) {
  if (!timeStr) return 'Not set';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

export const authAPI = {
  register: (payload) => api.post('/auth/register/', payload),
  registerShopkeeper: (payload) => api.post('/auth/register-shopkeeper/', payload),
  login: (payload) => api.post('/auth/login/', payload),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (payload) => api.patch('/auth/profile/', payload),
  changePassword: (payload) => api.post('/auth/change-password/', payload),
  forgotPassword: (payload) => api.post('/auth/forgot-password/', payload),
  resetPassword: (payload) => api.post('/auth/reset-password/', payload),
};

export const marketplaceAPI = {
  getSummary: () => api.get('/summary/'),
  getCategories: () => api.get('/categories/'),
  getShops: (params) => api.get('/shops/', { params }),
  getShopCategories: () => api.get('/shops/categories/'),
  getShopDetail: (id) => api.get(`/shops/${id}/`),
  registerShop: (formData) => api.post('/shops/register/', formData),
  getProducts: (params) => api.get('/products/', { params }),
  getProductDetail: (id) => api.get(`/products/${id}/`),
  reportProduct: (id, reason) => api.post(`/products/${id}/report/`, { reason }),
  getProductReviews: (productId) => api.get(`/products/${productId}/reviews/`),
  addProductReview: (productId, payload) => api.post(`/products/${productId}/reviews/`, payload),
  reportReview: (reviewId, reason) => api.post(`/reviews/${reviewId}/report/`, { reason }),
  deleteReview: (reviewId) => api.delete(`/reviews/${reviewId}/`),
};

export const shopCategoryAPI = {
  list: (params) => api.get('/shop-categories/', { params }),
  get: (id) => api.get(`/shop-categories/${id}/`),
  create: (formDataOrJson) => {
    const isForm = formDataOrJson instanceof FormData;
    return api.post('/shop-categories/', formDataOrJson, {
      headers: isForm ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
  },
  update: (id, formDataOrJson) => {
    const isForm = formDataOrJson instanceof FormData;
    return api.patch(`/shop-categories/${id}/`, formDataOrJson, {
      headers: isForm ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
  },
  delete: (id) => api.delete(`/shop-categories/${id}/`),
};

export const shopTypeAPI = {
  list: (params) => api.get('/shop-types/', { params }),
  get: (id) => api.get(`/shop-types/${id}/`),
  create: (payload) => api.post('/shop-types/', payload),
  update: (id, payload) => api.patch(`/shop-types/${id}/`, payload),
  delete: (id) => api.delete(`/shop-types/${id}/`),
};

export const cartAPI = {
  getCart: () => api.get('/cart/'),
  addItem: (product_id, quantity = 1) => api.post('/cart/items/', { product_id, quantity }),
  updateItem: (itemId, quantity) => api.patch(`/cart/items/${itemId}/`, { quantity }),
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}/`),
  clearCart: () => api.delete('/cart/clear/'),
};

export const orderAPI = {
  getPickupSlots: () => api.get('/orders/pickup-slots/'),
  checkout: (payload) => api.post('/orders/checkout/', payload),
  getMyOrders: (params) => api.get('/orders/my-orders/', { params }),
  getMyOrderGroups: () => api.get('/orders/my-groups/'),
  getOrderDetail: (id) => api.get(`/orders/${id}/`),
  cancelOrder: (id, reason) => api.post(`/orders/${id}/cancel/`, { reason }),
};

export const notificationAPI = {
  list: () => api.get('/notifications/'),
  markRead: (id) => api.patch(`/notifications/${id}/read/`),
  markAllRead: () => api.post('/notifications/mark-all-read/'),
};

export const shopOwnerAPI = {
  getDashboard: () => api.get('/shop/dashboard/'),
  getMyShop: () => api.get('/shop/my-shop/'),
  updateMyShop: (data) => api.patch('/shop/my-shop/', data),
  getProducts: (params) => api.get('/shop/products/', { params }),
  createProduct: (formData) => api.post('/shop/products/', formData),
  updateProduct: (id, formData) => api.patch(`/shop/products/${id}/`, formData),
  deleteProduct: (id) => api.delete(`/shop/products/${id}/`),
  getOrders: (params) => api.get('/shop/orders/', { params }),
  updateOrderStatus: (id, payload) => api.patch(`/shop/orders/${id}/status/`, payload),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard/'),
  getUsers: (params) => api.get('/admin/users/', { params }),
  createUser: (payload) => api.post('/admin/users/', payload),
  updateUser: (id, payload) => api.patch(`/admin/users/${id}/`, payload),
  deleteUser: (id) => api.delete(`/admin/users/${id}/`),
  getShops: (params) => api.get('/admin/shops/', { params }),
  createShop: (data) => api.post('/admin/shops/', data),
  updateShop: (id, data) => api.patch(`/admin/shops/${id}/`, data),
  deleteShop: (id) => api.delete(`/admin/shops/${id}/`),
  updateShopStatus: (id, approval_status) => api.post(`/admin/shops/${id}/status/`, { approval_status }),
  getCategories: () => api.get('/admin/categories/'),
  createCategory: (payload) => api.post('/admin/categories/', payload),
  updateCategory: (id, payload) => api.patch(`/admin/categories/${id}/`, payload),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}/`),
  getProducts: (params) => api.get('/admin/products/', { params }),
  updateProduct: (id, payload) => api.patch(`/admin/products/${id}/`, payload),
  deleteProduct: (id) => api.delete(`/admin/products/${id}/`),
  getOrders: (params) => api.get('/admin/orders/', { params }),
  updateOrderStatus: (id, payload) => api.patch(`/admin/orders/${id}/status/`, payload),
  getReviews: (params) => api.get('/admin/reviews/', { params }),
  updateReview: (id, payload) => api.patch(`/admin/reviews/${id}/`, payload),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}/`),
};

export default api;
