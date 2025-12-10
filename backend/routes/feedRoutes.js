import express from 'express';
import { getFeed } from '../controllers/feedController.js';
import { protect } from '../middleware/authMiddleware.js';
import { cacheWithParams } from '../middleware/cacheMiddleware.js';

const router = express.Router();

router.get('/', protect, cacheWithParams((req) => `feed:${req.user._id}:${req.query.page || 1}:${req.query.limit || 10}`, 300), getFeed);

export default router;