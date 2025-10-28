import express from 'express';
import {
  getExplorePosts,
  getTrendingHashtags,
  getPostsByHashtag,
  getSuggestedUsers,
  getTrendingPosts,
} from '../controllers/exploreController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/posts', getExplorePosts);
router.get('/trending', getTrendingPosts);
router.get('/hashtags', getTrendingHashtags);
router.get('/tags/:tag', getPostsByHashtag);
router.get('/users', protect, getSuggestedUsers);

export default router;
