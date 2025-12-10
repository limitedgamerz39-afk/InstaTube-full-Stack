import express from 'express';
import { 
  getPersonalizedRecommendations,
  getTrendingRecommendations,
  getUpNextRecommendations,
  getSubscriptionRecommendations
} from '../controllers/recommendationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/trending', getTrendingRecommendations);

// Protected routes
router.get('/personalized', protect, getPersonalizedRecommendations);
router.get('/subscriptions', protect, getSubscriptionRecommendations);
router.get('/upnext/:postId', getUpNextRecommendations);

export default router;