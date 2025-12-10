import express from 'express';
import {
  getUserProfile,
  updateProfile,
  followUser,
  searchUsers,
  getUserSuggestions,
  requestRoleUpgrade,
  getUserById,
  getUserSubscribers,
  getUserSubscriptions
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../config/minio.js';
import { suggestionsLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.get('/search', searchUsers);
router.get('/suggestions', protect, suggestionsLimiter, getUserSuggestions);
router.get('/id/:id', getUserById);
router.get('/:username', getUserProfile);
router.get('/:username/subscribers', protect, getUserSubscribers);
router.get('/:username/subscriptions', protect, getUserSubscriptions);
router.put('/profile', protect, upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), updateProfile);
router.post('/role/request', protect, requestRoleUpgrade);
router.post('/:id/subscribe', protect, followUser);

export default router;