import express from 'express';
import {
  initiateVideoCall,
  updateCallStatus,
  getCallHistory,
  getCallDetails
} from '../controllers/videoCallController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected routes
router.post('/initiate', protect, initiateVideoCall);
router.put('/:callId/status', protect, updateCallStatus);
router.get('/history', protect, getCallHistory);
router.get('/:callId', protect, getCallDetails);

export default router;