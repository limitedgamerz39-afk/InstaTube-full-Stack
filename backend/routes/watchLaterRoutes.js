import express from 'express';
import {
  addToWatchLater,
  removeFromWatchLater,
  getWatchLater,
  clearWatchLater,
} from '../controllers/watchLaterController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getWatchLater);
router.post('/:postId', protect, addToWatchLater);
router.delete('/:postId', protect, removeFromWatchLater);
router.delete('/', protect, clearWatchLater);

export default router;
