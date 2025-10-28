import express from 'express';
import {
  createStory,
  getFollowingStories,
  getUserStories,
  viewStory,
  replyToStory,
  deleteStory,
} from '../controllers/storyController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

router.post('/', protect, upload.single('media'), createStory);
router.get('/following', protect, getFollowingStories);
router.get('/user/:userId', protect, getUserStories);
router.post('/:id/view', protect, viewStory);
router.post('/:id/reply', protect, replyToStory);
router.delete('/:id', protect, deleteStory);

export default router;
