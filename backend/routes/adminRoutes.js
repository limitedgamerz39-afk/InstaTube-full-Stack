import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  getAllPosts,
  deleteUser,
  deletePost,
  toggleBanUser,
  toggleVerifyUser,
  changeUserRole,
  getReports,
  adminSearch,
  getRoleRequests,
  approveRoleRequest,
  declineRoleRequest,
  getUserDetails,
  getPostDetails,
  getSystemLogs,
  getUserAnalytics,
  getContentAnalytics,
  getAdvancedUserAnalytics,
  getSystemHealth,
  getMonetizationAnalytics,
  resolveReport,
  dismissReport,
  getReportDetails,
  getRecentAdminActivities,
} from '../controllers/adminController.js';
import {
  getSecurityEvents,
  getLoginActivities,
  getSuspiciousActivities,
  getSecurityStats,
} from '../controllers/adminSecurityController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Apply auth and admin middleware to all routes
router.use(protect);
router.use(adminOnly);

// Dashboard
router.get('/stats', getDashboardStats);

// Users Management
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserDetails);
router.delete('/users/:userId', deleteUser);
router.put('/users/:userId/ban', toggleBanUser);
router.put('/users/:userId/verify', toggleVerifyUser);
router.put('/users/:userId/role', changeUserRole);

// Posts Management
router.get('/posts', getAllPosts);
router.get('/posts/:postId', getPostDetails);
router.delete('/posts/:postId', deletePost);

// Reports
router.get('/reports', getReports);
router.get('/reports/:reportId', getReportDetails);
router.put('/reports/:reportId/resolve', resolveReport);
router.put('/reports/:reportId/dismiss', dismissReport);

// Role upgrade requests
router.get('/role-requests', getRoleRequests);
router.post('/role-requests/:userId/approve', approveRoleRequest);
router.post('/role-requests/:userId/decline', declineRoleRequest);

// Search
router.get('/search', adminSearch);

// Analytics
router.get('/analytics/users', getUserAnalytics);
router.get('/analytics/users/advanced', getAdvancedUserAnalytics);
router.get('/analytics/content', getContentAnalytics);
router.get('/analytics/monetization', getMonetizationAnalytics);

// System
router.get('/system/health', getSystemHealth);
router.get('/logs', getSystemLogs);
router.get('/recent-activities', getRecentAdminActivities);

// Security monitoring routes
router.get('/security/events', getSecurityEvents);
router.get('/security/login-activities', getLoginActivities);
router.get('/security/suspicious', getSuspiciousActivities);
router.get('/security/stats', getSecurityStats);

export default router;