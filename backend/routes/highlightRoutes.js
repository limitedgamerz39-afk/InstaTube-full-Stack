import express from 'express';
import {
  createHighlight,
  getUserHighlights,
  getHighlight,
  updateHighlight,
  deleteHighlight,
} from '../controllers/highlightController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createHighlight);
router.get('/user/:userId', getUserHighlights);
router.get('/:id', getHighlight);
router.put('/:id', protect, updateHighlight);
router.delete('/:id', protect, deleteHighlight);

export default router;