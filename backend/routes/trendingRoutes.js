import express from 'express';
import {
  getTrendingVideos,
  getTrendingReels,
  getTrendingHashtags,
  getTrendingCreators,
} from '../controllers/trendingController.js';

const router = express.Router();

router.get('/videos', getTrendingVideos);
router.get('/reels', getTrendingReels);
router.get('/hashtags', getTrendingHashtags);
router.get('/creators', getTrendingCreators);

export default router;
