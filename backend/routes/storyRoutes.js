import express from 'express';
import {
  createStory,
  getsubscribedStories,
  getUserStories,
  viewStory,
  replyToStory,
  deleteStory,
} from '../controllers/storyController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../config/minio.js';

const router = express.Router();

router.post('/', protect, upload.single('media'), createStory);
router.get('/subscribed', protect, getsubscribedStories);
router.get('/user/:userId', protect, getUserStories);
router.post('/:id/view', protect, viewStory);
router.post('/:id/reply', protect, replyToStory);
router.delete('/:id', protect, deleteStory);

export default router;