import express from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  setup2FA,
  verify2FA,
  disable2FA
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  getUserLoginActivities,
  getRecentLoginActivities,
  getSuspiciousLoginActivities,
} from '../controllers/loginActivityController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/2fa/enable', protect, setup2FA);
router.post('/2fa/verify-setup', protect, verify2FA);
router.post('/2fa/disable', protect, disable2FA);
router.get('/me', protect, (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user
    }
  });
});
router.post('/logout', protect, logout);

// Login activity routes
router.get('/login-activities', protect, getUserLoginActivities);
router.get('/login-activities/recent', protect, getRecentLoginActivities);
router.get('/login-activities/suspicious', protect, getSuspiciousLoginActivities);

export default router;