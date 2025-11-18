import express from 'express';
import {
  createCommunityPost,
  getUserCommunityPosts,
  getCommunityPost,
  updateCommunityPost,
  deleteCommunityPost,
  likeCommunityPost,
  addCommunityComment,
  votePoll,
  pinCommunityPost,
} from '../controllers/communityController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../config/minio.js';

const router = express.Router();

router.post('/', protect, upload.single('media'), createCommunityPost);
router.get('/user/:userId', getUserCommunityPosts);
router.get('/:id', getCommunityPost);
router.put('/:id', protect, updateCommunityPost);
router.delete('/:id', protect, deleteCommunityPost);
router.post('/:id/like', protect, likeCommunityPost);
router.post('/:id/comment', protect, addCommunityComment);
router.post('/:id/vote', protect, votePoll);
router.post('/:id/pin', protect, pinCommunityPost);

export default router;
