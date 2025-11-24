import express from 'express';
import {
  createLiveStream,
  endLiveStream,
  getLiveStream,
  getActiveStreams,
  addComment,
  addLike
} from '../controllers/liveStreamController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/active', getActiveStreams);
router.get('/:streamId', getLiveStream);

// Protected routes
router.post('/create', protect, createLiveStream);
router.post('/end/:streamId', protect, endLiveStream);
router.post('/:streamId/comment', protect, addComment);
router.post('/:streamId/like', protect, addLike);

export default router;