import api from './api';

// Admin API Service
export const adminAPI = {
  // Dashboard Stats
  getDashboardStats: () => api.get('/admin/stats'),

  // Users Management
  getAllUsers: (page = 1, limit = 20) => api.get(`/admin/users?page=${page}&limit=${limit}`),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  toggleBanUser: (userId) => api.put(`/admin/users/${userId}/ban`),
  toggleVerifyUser: (userId) => api.put(`/admin/users/${userId}/verify`),
  changeUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),

  // Posts Management
  getAllPosts: (page = 1, limit = 20) => api.get(`/admin/posts?page=${page}&limit=${limit}`),
  deletePost: (postId) => api.delete(`/admin/posts/${postId}`),

  // Role Requests
  getRoleRequests: (page = 1, limit = 20) => api.get(`/admin/role-requests?page=${page}&limit=${limit}`),
  approveRoleRequest: (userId) => api.post(`/admin/role-requests/${userId}/approve`),
  declineRoleRequest: (userId) => api.post(`/admin/role-requests/${userId}/decline`),
};

export default adminAPI;
