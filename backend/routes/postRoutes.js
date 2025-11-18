import express from 'express';
import {
  createPost,
  getFeedPosts,
  getPost,
  deletePost,
  likePost,
  addComment,
  getPostComments,
  deleteComment,
  savePost,
  getSavedPosts,
  archivePost,
  replyToComment,
  pinComment,
  unpinComment,
} from '../controllers/postController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload, uploadMultiple } from '../config/minio.js';
import { uploadLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.post('/', protect, uploadLimiter, upload.fields([{ name: 'media', maxCount: 10 }, { name: 'thumbnail', maxCount: 1 }]), createPost);
router.get('/feed', protect, getFeedPosts);
router.get('/saved', protect, getSavedPosts);
router.get('/:id', getPost);
router.delete('/:id', protect, deletePost);
router.post('/:id/like', protect, likePost);
router.post('/:id/save', protect, savePost);
router.post('/:id/archive', protect, archivePost);
router.post('/:id/comment', protect, addComment);
router.get('/:id/comments', getPostComments);
router.delete('/:postId/comments/:commentId', protect, deleteComment);
router.post('/:postId/comments/:commentId/reply', protect, replyToComment);
router.post('/:postId/pin/:commentId', protect, pinComment);
router.post('/:postId/unpin', protect, unpinComment);

export default router;
