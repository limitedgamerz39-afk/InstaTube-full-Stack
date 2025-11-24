import express from 'express';
import {
  getMonetizationAnalytics,
  getPayoutHistory,
  requestPayout,
  getMonetizationSettings,
  updateMonetizationSettings
} from '../controllers/monetizationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication and monetization to be enabled
router.use(protect);

// Monetization analytics
router.get('/analytics', getMonetizationAnalytics);

// Payout management
router.get('/payouts', getPayoutHistory);
router.post('/payout-request', requestPayout);

// Monetization settings
router.get('/settings', getMonetizationSettings);
router.put('/settings', updateMonetizationSettings);

export default router;