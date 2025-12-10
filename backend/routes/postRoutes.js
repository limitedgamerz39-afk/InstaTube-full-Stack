import express from 'express';
import {
  createPost,
  getFeedPosts,
  getRandomPosts,
  getPost,
  deletePost,
  likePost,
  unlikePost,
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
  updatePostRestrictions,
  getShortVideos,
  getLongVideos,
  getPostsByUserId,
  reportPost
} from '../controllers/postController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadMultiple, debugUpload } from '../middleware/uploadMiddleware.js';
import { uploadLimiter } from '../middleware/rateLimitMiddleware.js';
import { cacheWithParams } from '../middleware/cacheMiddleware.js';

const router = express.Router();

// Use a two-step approach for handling uploads
// First, use a generic upload middleware that accepts any file type
// Then, validate the category and file types in the controller

// Generic upload middleware that doesn't filter by category yet
const genericUpload = (req, res, next) => {
  // Use 'long' as default since it has the most permissive file types
  const middlewareArray = uploadMultiple('media', 'long', 10);
  
  // Execute each middleware in sequence
  let index = 0;
  const executeNext = (err) => {
    if (err) return next(err);
    if (index >= middlewareArray.length) return next();
    const middleware = middlewareArray[index++];
    middleware(req, res, executeNext);
  };
  executeNext();
};

// For posts with multiple media files, we'll need to handle this differently
router.post('/', protect, debugUpload, uploadLimiter, genericUpload, createPost);
router.get('/feed', protect, cacheWithParams((req) => `feed:${req.user._id}:${req.query.page || 1}:${req.query.limit || 10}`, 300), getFeedPosts);
router.get('/random', protect, getRandomPosts);
router.get('/saved', protect, getSavedPosts);
router.get('/search', searchPosts);
router.get('/videos/short', getShortVideos);
router.get('/videos/long', getLongVideos);
router.get('/:id', getPost);
router.post('/:id/view', incrementViewCount);
router.delete('/:id', protect, deletePost);
router.post('/:id/like', protect, likePost);
router.post('/:id/unlike', protect, unlikePost);
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

// Add the new route for getting posts by user ID
router.get('/user/:userId', getPostsByUserId);

// Report a post
router.post('/:id/report', protect, reportPost);

export default router;