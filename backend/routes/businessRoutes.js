import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';
import { 
  getBusinessProfile, 
  updateBusinessProfile,
  getBusinessAnalytics,
  createBusinessProduct,
  getBusinessProducts,
  updateBusinessProduct,
  deleteBusinessProduct
} from '../controllers/businessController.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Business Profile Routes
router.route('/profile')
  .get(getBusinessProfile)
  .put(updateBusinessProfile);

// Business Analytics
router.get('/analytics', getBusinessAnalytics);

// Business Products Routes
router.route('/products')
  .post(createBusinessProduct)
  .get(getBusinessProducts);

router.route('/products/:productId')
  .put(updateBusinessProduct)
  .delete(deleteBusinessProduct);

export default router;