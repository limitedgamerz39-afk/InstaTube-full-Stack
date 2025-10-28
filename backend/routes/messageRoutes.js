import express from 'express';
import {
  sendMessage,
  getConversation,
  getConversations,
  deleteMessage,
  getUnreadCount,
  addReaction,
  removeReaction,
  toggleStarConversation,
  toggleArchiveConversation,
  markConversationAsRead,
  markAllConversationsAsRead,
  getConversationMetadata,
  sendVoiceMessage,
  sendAttachment,
  updateConversationSettings,
  updateConversationExpiry,
  searchMessages,
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

router.get('/conversations', protect, getConversations);
router.get('/unread/count', protect, getUnreadCount);
router.get('/conversations/:userId/metadata', protect, getConversationMetadata);
router.post('/conversations/:userId/expiry', protect, updateConversationExpiry);
router.get('/search', protect, searchMessages);

// Place specific routes before parameterized ones to avoid conflicts
router.post('/mark-all-read', protect, markAllConversationsAsRead);
router.post('/conversations/:userId/star', protect, toggleStarConversation);
router.post('/conversations/:userId/archive', protect, toggleArchiveConversation);
router.post('/conversations/:userId/read', protect, markConversationAsRead);

router.post('/:receiverId/attachments', protect, upload.single('attachment'), sendAttachment);
router.post('/:receiverId/voice', protect, upload.single('voice'), sendVoiceMessage);
router.post('/:receiverId', protect, sendMessage);
router.post('/:messageId/reaction', protect, addReaction);
router.delete('/:messageId/reaction', protect, removeReaction);
router.get('/:userId', protect, getConversation);
router.delete('/:messageId', protect, deleteMessage);

export default router;
