import express from 'express';
import {
  getUserAchievements,
  getUserAchievementStats,
  awardAchievement,
  getAllAchievements,
  revokeAchievement
} from '../controllers/achievementController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Public routes
router.get('/user/:userId', getUserAchievements);
router.get('/user/:userId/stats', getUserAchievementStats);

// Admin routes
router.post('/award', protect, adminOnly, awardAchievement);
router.get('/admin/all', protect, adminOnly, getAllAchievements);
router.delete('/:id', protect, adminOnly, revokeAchievement);

export default router;