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
  sharePost,
  replyToComment,
  pinComment,
  unpinComment,
  incrementViewCount,
  searchPosts,
  addChapters,
  updateChapters,
  deleteChapters,
  updateVideoEditing,
  resetVideoEditing,
  updatePostRestrictions
} from '../controllers/postController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadMultiple } from '../middleware/uploadMiddleware.js';
import { uploadLimiter } from '../middleware/rateLimitMiddleware.js';
import { cacheWithParams } from '../middleware/cacheMiddleware.js';

const router = express.Router();

// For posts with multiple media files, we'll need to handle this differently
router.post('/', protect, uploadLimiter, ...uploadMultiple('media', 'image', 10), createPost);
router.get('/feed', protect, cacheWithParams((req) => `feed:${req.user._id}:${req.query.page || 1}:${req.query.limit || 10}`, 300), getFeedPosts);
router.get('/saved', protect, getSavedPosts);
router.get('/search', searchPosts);
router.get('/:id', getPost);
router.post('/:id/view', incrementViewCount);
router.delete('/:id', protect, deletePost);
router.post('/:id/like', protect, likePost);
router.post('/:id/save', protect, savePost);
router.post('/:id/archive', protect, archivePost);
router.post('/:id/share', protect, sharePost);
router.post('/:id/comment', protect, addComment);
router.get('/:id/comments', getPostComments);
router.delete('/:postId/comments/:commentId', protect, deleteComment);
router.post('/:postId/comments/:commentId/reply', protect, replyToComment);
router.post('/:postId/pin/:commentId', protect, pinComment);
router.post('/:postId/unpin', protect, unpinComment);
// Video chapters routes
router.post('/:id/chapters', protect, addChapters);
router.put('/:id/chapters', protect, updateChapters);
router.delete('/:id/chapters', protect, deleteChapters);
// Video editing routes
router.put('/:id/video-editing', protect, updateVideoEditing);
router.delete('/:id/video-editing', protect, resetVideoEditing);
// Age restrictions and content warnings
router.put('/:id/restrictions', protect, updatePostRestrictions);

export default router;