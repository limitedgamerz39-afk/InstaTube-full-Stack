import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
  getUserData, 
  deleteAccount, 
  updateConsent, 
  getConsentStatus 
} from '../controllers/gdprController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// GDPR data access routes
router.route('/data')
  .get(getUserData);

// GDPR account deletion route
router.route('/account')
  .delete(deleteAccount);

// GDPR consent management routes
router.route('/consent')
  .get(getConsentStatus)
  .put(updateConsent);

export default router;