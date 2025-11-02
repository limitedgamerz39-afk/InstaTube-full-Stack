import express from 'express';
import {
  createPlaylist,
  getUserPlaylists,
  getPlaylist,
  updatePlaylist,
  deletePlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  getPublicPlaylists,
} from '../controllers/playlistController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createPlaylist);
router.get('/user/:userId', getUserPlaylists);
router.get('/public', getPublicPlaylists);
router.get('/:id', getPlaylist);
router.put('/:id', protect, updatePlaylist);
router.delete('/:id', protect, deletePlaylist);
router.post('/:id/videos/:postId', protect, addVideoToPlaylist);
router.delete('/:id/videos/:postId', protect, removeVideoFromPlaylist);

export default router;
