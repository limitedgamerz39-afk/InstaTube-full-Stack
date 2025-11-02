import express from 'express';
import {
  createNote,
  getUserNotes,
  getFollowingNotes,
  deleteNote,
  likeNote,
  replyToNote,
} from '../controllers/noteController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createNote);
router.get('/user/:userId', getUserNotes);
router.get('/following', protect, getFollowingNotes);
router.delete('/:id', protect, deleteNote);
router.post('/:id/like', protect, likeNote);
router.post('/:id/reply', protect, replyToNote);

export default router;
