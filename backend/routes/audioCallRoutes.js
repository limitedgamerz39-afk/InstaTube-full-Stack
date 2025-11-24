import express from 'express';
import {
  initiateAudioCall,
  updateCallStatus,
  getCallHistory,
  getCallDetails
} from '../controllers/audioCallController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected routes
router.post('/initiate', protect, initiateAudioCall);
router.put('/:callId/status', protect, updateCallStatus);
router.get('/history', protect, getCallHistory);
router.get('/:callId', protect, getCallDetails);

export default router;