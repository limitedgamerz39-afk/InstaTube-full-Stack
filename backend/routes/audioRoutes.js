import express from 'express';
import {
  extractAudioFromPost,
  getAudioByPost,
  getUserAudio,
  searchAudio,
  updateAudio,
  deleteAudio,
  incrementViewCount,
  incrementDownloadCount,
} from '../controllers/audioController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/post/:postId', getAudioByPost);
router.get('/user/:userId', getUserAudio);
router.get('/search', searchAudio);
router.post('/:audioId/view', incrementViewCount);
router.post('/:audioId/download', incrementDownloadCount);

// Protected routes
router.post('/extract/:postId', protect, extractAudioFromPost);
router.put('/:audioId', protect, updateAudio);
router.delete('/:audioId', protect, deleteAudio);

export default router;