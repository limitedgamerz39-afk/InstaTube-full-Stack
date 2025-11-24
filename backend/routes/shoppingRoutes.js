import express from 'express';
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from '../controllers/shoppingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Product routes
router.route('/products')
  .post(protect, createProduct)
  .get(getAllProducts);

router.route('/products/:id')
  .get(getProductById)
  .put(protect, updateProduct)
  .delete(protect, deleteProduct);

// Cart routes
router.route('/cart')
  .post(protect, addToCart)
  .get(protect, getCart)
  .delete(protect, clearCart);

router.route('/cart/:itemId')
  .put(protect, updateCartItem)
  .delete(protect, removeFromCart);

export default router;