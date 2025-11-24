import api from './api';

// Admin API Service
export const adminAPI = {
  // Dashboard Stats
  getDashboardStats: () => api.get('/admin/stats'),

  // Users Management
  getAllUsers: (page = 1, limit = 20, filters = {}) => {
    const params = new URLSearchParams({ page, limit, ...filters });
    return api.get(`/admin/users?${params}`);
  },
  getUserDetails: (userId) => api.get(`/admin/users/${userId}`),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  toggleBanUser: (userId) => api.put(`/admin/users/${userId}/ban`),
  toggleVerifyUser: (userId) => api.put(`/admin/users/${userId}/verify`),
  changeUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),

  // Posts Management
  getAllPosts: (page = 1, limit = 20, filters = {}) => {
    const params = new URLSearchParams({ page, limit, ...filters });
    return api.get(`/admin/posts?${params}`);
  },
  getPostDetails: (postId) => api.get(`/admin/posts/${postId}`),
  deletePost: (postId) => api.delete(`/admin/posts/${postId}`),

  // Reports Management
  getReports: (page = 1, limit = 20, filters = {}) => {
    const params = new URLSearchParams({ page, limit, ...filters });
    return api.get(`/admin/reports?${params}`);
  },
  getReportDetails: (reportId) => api.get(`/admin/reports/${reportId}`),
  resolveReport: (reportId, data) => api.put(`/admin/reports/${reportId}/resolve`, data),
  dismissReport: (reportId, data) => api.put(`/admin/reports/${reportId}/dismiss`, data),

  // Role Requests
  getRoleRequests: (page = 1, limit = 20) => api.get(`/admin/role-requests?page=${page}&limit=${limit}`),
  approveRoleRequest: (userId) => api.post(`/admin/role-requests/${userId}/approve`),
  declineRoleRequest: (userId) => api.post(`/admin/role-requests/${userId}/decline`),

  // Analytics
  getUserAnalytics: (days = 30) => api.get(`/admin/analytics/users?days=${days}`),
  getAdvancedUserAnalytics: (days = 30) => api.get(`/admin/analytics/users/advanced?days=${days}`),
  getContentAnalytics: (days = 30) => api.get(`/admin/analytics/content?days=${days}`),
  getMonetizationAnalytics: () => api.get(`/admin/analytics/monetization`),

  // System
  getSystemHealth: () => api.get(`/admin/system/health`),
  getLogs: () => api.get(`/admin/logs`),
  
  // Security
  getSecurityEvents: (page = 1, limit = 20, filters = {}) => {
    const params = new URLSearchParams({ page, limit, ...filters });
    return api.get(`/admin/security/events?${params}`);
  },
  getLoginActivities: (page = 1, limit = 20, filters = {}) => {
    const params = new URLSearchParams({ page, limit, ...filters });
    return api.get(`/admin/security/login-activities?${params}`);
  },
  getSuspiciousActivities: () => api.get('/admin/security/suspicious'),
  getSecurityStats: () => api.get('/admin/security/stats'),
};

export default adminAPI;