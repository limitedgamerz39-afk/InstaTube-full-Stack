import express from 'express';
import {
  createGroup,
  getUserGroups,
  getGroupById,
  sendGroupMessage,
  getGroupMessages,
  addGroupMember,
  leaveGroup,
} from '../controllers/groupController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Group routes
router.post('/', protect, createGroup);
router.get('/', protect, getUserGroups);
router.get('/:groupId', protect, getGroupById);

// Message routes
router.post('/:groupId/messages', protect, sendGroupMessage);
router.get('/:groupId/messages', protect, getGroupMessages);

// Member management
router.post('/:groupId/members', protect, addGroupMember);
router.delete('/:groupId/leave', protect, leaveGroup);

export default router;
