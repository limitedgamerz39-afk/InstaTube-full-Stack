import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance for business
const businessApi = axios.create({
  baseURL: `${API_URL}/business`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
businessApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
businessApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

// Business APIs
export const businessAPI = {
  // Business Profile
  getBusinessProfile: () => businessApi.get('/profile'),
  updateBusinessProfile: (profileData) => businessApi.put('/profile', profileData),
  
  // Business Analytics
  getBusinessAnalytics: () => businessApi.get('/analytics'),
  
  // Business Products
  getBusinessProducts: () => businessApi.get('/products'),
  createBusinessProduct: (productData) => businessApi.post('/products', productData),
  updateBusinessProduct: (productId, productData) => businessApi.put(`/products/${productId}`, productData),
  deleteBusinessProduct: (productId) => businessApi.delete(`/products/${productId}`),
};

export default businessApi;