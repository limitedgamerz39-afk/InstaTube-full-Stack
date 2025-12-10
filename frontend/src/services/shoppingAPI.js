import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance for shopping
const shoppingApi = axios.create({
  baseURL: `${API_URL}/shopping`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
shoppingApi.interceptors.request.use(
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
shoppingApi.interceptors.response.use(
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

// Shopping Cart APIs
export const shoppingAPI = {
  // Cart operations
  getCart: () => shoppingApi.get('/cart'),
  addToCart: (productId, quantity = 1) => shoppingApi.post('/cart', { productId, quantity }),
  updateCartItem: (itemId, quantity) => shoppingApi.put(`/cart/${itemId}`, { quantity }),
  removeFromCart: (itemId) => shoppingApi.delete(`/cart/${itemId}`),
  clearCart: () => shoppingApi.delete('/cart'),
  
  // Product operations
  getProducts: (category, page = 1, limit = 20) => shoppingApi.get(`/products?category=${category}&page=${page}&limit=${limit}`),
  getProduct: (productId) => shoppingApi.get(`/products/${productId}`),
  searchProducts: (query, page = 1, limit = 20) => shoppingApi.get(`/products/search?q=${query}&page=${page}&limit=${limit}`),
  
  // Order operations
  createOrder: (orderData) => shoppingApi.post('/orders', orderData),
  getOrders: () => shoppingApi.get('/orders'),
  getOrder: (orderId) => shoppingApi.get(`/orders/${orderId}`),
  
  // Payment operations
  processPayment: (paymentData) => shoppingApi.post('/payment', paymentData),
  verifyPayment: (paymentId) => shoppingApi.get(`/payment/${paymentId}/verify`),
  
  // Wishlist operations
  getWishlist: () => shoppingApi.get('/wishlist'),
  addToWishlist: (productId) => shoppingApi.post('/wishlist', { productId }),
  removeFromWishlist: (productId) => shoppingApi.delete(`/wishlist/${productId}`),
};

export default shoppingApi;