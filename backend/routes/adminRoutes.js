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
} from '../controllers/adminController.js';
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
router.delete('/users/:userId', deleteUser);
router.put('/users/:userId/ban', toggleBanUser);
router.put('/users/:userId/verify', toggleVerifyUser);
router.put('/users/:userId/role', changeUserRole);

// Posts Management
router.get('/posts', getAllPosts);
router.delete('/posts/:postId', deletePost);

// Reports
router.get('/reports', getReports);

// Role upgrade requests
router.get('/role-requests', getRoleRequests);
router.post('/role-requests/:userId/approve', approveRoleRequest);
router.post('/role-requests/:userId/decline', declineRoleRequest);

// Search
router.get('/search', adminSearch);

export default router;
