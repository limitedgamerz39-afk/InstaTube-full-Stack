import axios from 'axios';

// Force proxy in development to avoid rate limiting issues
const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = isDevelopment ? '/api' : (import.meta.env.VITE_API_URL || '/api');

// Log the actual base URL being used
console.log('API Base URL:', API_BASE_URL);

// console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies in requests
  timeout: 300000, // Increase timeout to 5 minutes for large file uploads
});

// Store refresh promise to prevent multiple concurrent refresh requests
let refreshingPromise = null;

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration and refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Prevent multiple concurrent refresh requests
      if (!refreshingPromise) {
        refreshingPromise = refreshAccessToken();
      }
      
      try {
        // Wait for token refresh
        const newToken = await refreshingPromise;
        
        // Clear the refresh promise
        refreshingPromise = null;
        
        // Retry the original request with new token
        originalRequest._retry = true;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Clear the refresh promise
        refreshingPromise = null;
        
        // Token refresh failed, clear storage and redirect to login
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Redirect to login page
          if (window.location.pathname !== '/auth') {
            window.location.href = '/auth';
          }
        } catch (storageError) {
          console.error('Error clearing storage:', storageError);
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Function to refresh access token
const refreshAccessToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    // Force proxy in development to avoid rate limiting issues
    const isDevelopment = import.meta.env.DEV;
    const baseUrl = isDevelopment ? '/api' : API_BASE_URL;
    const response = await axios.post(`${baseUrl}/auth/refresh`, { refreshToken }, {
      withCredentials: true, // Include cookies
    });
    
    const { token } = response.data.data;
    localStorage.setItem('token', token);
    return token;
  } catch (error) {
    throw error;
  }
};

// Auth API endpoints
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  verifyTwoFactorLogin: (data) => api.post('/auth/2fa/verify-login', data), // New endpoint for 2FA verification during login
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  verifyEmail: (token) => api.get(`/auth/verify-email?token=${token}`),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  enableTwoFactor: () => api.post('/auth/2fa/enable'),
  verifyTwoFactorSetup: (token) => api.post('/auth/2fa/verify-setup', { token }),
  disableTwoFactor: () => api.post('/auth/2fa/disable'),
  generateBackupCodes: () => api.post('/auth/2fa/backup-codes'),
  // Login activity endpoints
  getLoginActivities: (page = 1, limit = 10) => api.get(`/auth/login-activities?page=${page}&limit=${limit}`),
  getRecentLoginActivities: () => api.get('/auth/login-activities/recent'),
  getSuspiciousLoginActivities: () => api.get('/auth/login-activities/suspicious'),
};

// Live Stream API endpoints
export const liveStreamAPI = {
  createStream: (data) => api.post('/livestream/create', data),
  endStream: (streamId) => api.post(`/livestream/end/${streamId}`),
  getStream: (streamId) => api.get(`/livestream/${streamId}`),
  getActiveStreams: () => api.get('/livestream/active'),
  addComment: (streamId, text) => api.post(`/livestream/${streamId}/comment`, { text }),
  addLike: (streamId) => api.post(`/livestream/${streamId}/like`),
};

// Video Call API endpoints
export const videoCallAPI = {
  initiateCall: (receiverId) => api.post('/videocall/initiate', { receiverId }),
  updateCallStatus: (callId, statusData) => api.put(`/videocall/${callId}/status`, statusData),
  getCallHistory: (page = 1, limit = 10) => api.get(`/videocall/history?page=${page}&limit=${limit}`),
  getCallDetails: (callId) => api.get(`/videocall/${callId}`),
};

// Audio Call API endpoints
export const audioCallAPI = {
  initiateCall: (receiverId) => api.post('/audiocall/initiate', { receiverId }),
  updateCallStatus: (callId, statusData) => api.put(`/audiocall/${callId}/status`, statusData),
  getCallHistory: (page = 1, limit = 10) => api.get(`/audiocall/history?page=${page}&limit=${limit}`),
  getCallDetails: (callId) => api.get(`/audiocall/${callId}`),
};

// User API endpoints
export const userAPI = {
  getProfile: (username) => {
    // Validate username before making API call
    if (!username) {
      return Promise.reject(new Error('Username is required'));
    }
    return api.get(`/users/${username}`);
  },
  updateProfile: (formData) =>
    api.put('/users/Profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  followUser: (userId) => api.post(`/users/${userId}/subscribe`),
  searchUsers: (query, page = 1, limit = 20) => api.get(`/users/search?q=${query}&page=${page}&limit=${limit}`),
  searchPosts: (query, page = 1, limit = 20) => api.get(`/posts/search?q=${query}&page=${page}&limit=${limit}`),
  getSuggestions: () => api.get('/users/suggestions'),
  // Add missing user API functions that might be needed
  getUserById: (userId) => api.get(`/users/id/${userId}`),
  getUserSubscribers: (username) => api.get(`/users/${username}/subscribers`),
  getUserSubscriptions: (username) => api.get(`/users/${username}/subscriptions`),
  requestRoleUpgrade: (message) => api.post('/users/role/request', { message }),
};

// Post API endpoints
export const postAPI = {
  createPost: (formData, onUploadProgress) =>
    api.post('/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onUploadProgress,
      timeout: 1800000 // Increase timeout to 30 minutes for file uploads
    }),
  getFeed: (page = 1, limit = 10, filter = 'popular') => api.get(`/posts/feed?page=${page}&limit=${limit}&filter=${filter}`),
  getRandomPosts: (limit = 20) => api.get(`/posts/random?limit=${limit}`),
  getPost: (postId) => api.get(`/posts/${postId}`),
  deletePost: (postId) => api.delete(`/posts/${postId}`),
  likePost: (postId) => api.post(`/posts/${postId}/like`),
  unlikePost: (postId) => api.post(`/posts/${postId}/unlike`),
  savePost: (postId) => api.post(`/posts/${postId}/save`),
  archivePost: (postId) => api.post(`/posts/${postId}/archive`),
  getSavedPosts: () => api.get('/posts/saved'),
  addComment: (postId, text) => api.post(`/posts/${postId}/comment`, { text }),
  getComments: (postId) => api.get(`/posts/${postId}/comments`),
  incrementViewCount: (postId) => api.post(`/posts/${postId}/view`),
  sharePost: (postId) => api.post(`/posts/${postId}/share`),
  // Video chapters endpoints
  addChapters: (postId, chapters) => api.post(`/posts/${postId}/chapters`, { chapters }),
  updateChapters: (postId, chapters) => api.put(`/posts/${postId}/chapters`, { chapters }),
  deleteChapters: (postId) => api.delete(`/posts/${postId}/chapters`),
  // Video editing endpoints
  updateVideoEditing: (postId, editingData) => api.put(`/posts/${postId}/video-editing`, editingData),
  resetVideoEditing: (postId) => api.delete(`/posts/${postId}/video-editing`),
  // Age restrictions and content warnings
  updatePostRestrictions: (postId, restrictionsData) => api.put(`/posts/${postId}/restrictions`, restrictionsData),
  // Watch later
  watchLater: (postId) => api.post(`/watchlater/${postId}`),
  // Report post
  reportPost: (postId, data) => api.post(`/posts/${postId}/report`, data),
  // Shorts and Long Videos endpoints
  getShorts: (page = 1, limit = 10) => api.get(`/posts/videos/short?page=${page}&limit=${limit}`),
  getLongVideos: (page = 1, limit = 10) => api.get(`/posts/videos/long?page=${page}&limit=${limit}`),
  // Get posts by user ID
  getPostsByUserId: (userId, params = {}) => {
    const { page = 1, limit = 12, category = 'all' } = params;
    let url = `/posts/user/${userId}?page=${page}&limit=${limit}`;
    if (category !== 'all') {
      url += `&category=${category}`;
    }
    return api.get(url);
  },
};

// Add a helper function to validate file types before upload
export const validateFileType = (file) => {
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/ogg'];
  
  if (file.type.startsWith('image/')) {
    return allowedImageTypes.includes(file.type);
  }
  
  if (file.type.startsWith('video/')) {
    return allowedVideoTypes.includes(file.type);
  }
  
  return false;
};

// Notification API endpoints
export const notificationAPI = {
  getNotifications: (page = 1) => api.get(`/notifications?page=${page}`),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread/count'),
};

// Message API endpoints
export const messageAPI = {
  sendMessage: (receiverId, text) => api.post(`/messages/${receiverId}`, { text }),
  getConversation: (userId) => api.get(`/messages/${userId}`),
  getConversations: () => api.get('/messages/conversations'),
  getUnreadCount: () => api.get('/messages/unread/count'),
  // Add missing functions
  sendAttachment: (receiverId, file) => {
    const formData = new FormData();
    formData.append('attachment', file);
    return api.post(`/messages/${receiverId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  sendVoiceMessage: (receiverId, audioBlob) => {
    const formData = new FormData();
    formData.append('voice', audioBlob);
    return api.post(`/messages/${receiverId}/voice`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  addReaction: (messageId, emoji) => api.post(`/messages/${messageId}/reaction`, { emoji }),
  removeReaction: (messageId) => api.delete(`/messages/${messageId}/reaction`),
  toggleStarConversation: (userId) => api.post(`/messages/conversations/${userId}/star`),
  toggleArchiveConversation: (userId) => api.post(`/messages/conversations/${userId}/archive`),
  markConversationAsRead: (userId) => api.post(`/messages/conversations/${userId}/read`),
  markAllConversationsAsRead: () => api.post('/messages/mark-all-read'),
  getConversationMetadata: (userId) => api.get(`/messages/conversations/${userId}/metadata`),
  updateConversationSettings: (userId, settings) => api.post(`/messages/conversations/${userId}/settings`, settings),
  updateConversationExpiry: (userId, hours) => api.post(`/messages/conversations/${userId}/expiry`, { hours }),
  searchMessages: (query) => api.get(`/messages/search?q=${query}`),
};

// Story API endpoints
export const storyAPI = {
  createStory: (formData) =>
    api.post('/stories', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  getsubscribedStories: () => api.get('/stories/subscribed'),
  getUserStories: (userId) => api.get(`/stories/user/${userId}`),
  viewStory: (storyId) => api.post(`/stories/${storyId}/view`),
  replyToStory: (storyId, text) => api.post(`/stories/${storyId}/reply`, { text }),
  deleteStory: (storyId) => api.delete(`/stories/${storyId}`),
};

// Reels API endpoints
export const reelsAPI = {
  getReels: () => api.get('/trending/reels'),
};

// Video API endpoints
export const videoAPI = {
  getVideos: () => api.get('/trending/videos'),
  getVideo: (videoId) => api.get(`/posts/${videoId}`),
};

// Explore API endpoints
export const exploreAPI = {
  getExplorePosts: (params = {}) => {
    const { page = 1, limit = 20, category = 'all', time = 'today' } = params;
    let url = `/explore/posts?page=${page}&limit=${limit}`;
    
    if (category && category !== 'all') {
      url += `&category=${category}`;
    }
    
    if (time) {
      url += `&time=${time}`;
    }
    
    return api.get(url);
  },
  getTrendingHashtags: () => api.get('/trending/hashtags'),
  getPostsByHashtag: (tag) => api.get(`/explore/tags/${tag}`),
  getSuggestedCreators: () => api.get('/explore/creators'),
};

// Community API endpoints
export const communityAPI = {
  getUserCommunityPosts: (userId) => api.get(`/community/user/${userId}`),
  createCommunityPost: (formData) =>
    api.post('/community', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  likeCommunityPost: (postId) => api.post(`/community/${postId}/like`),
  deleteCommunityPost: (postId) => api.delete(`/community/${postId}`),
};

// Group API endpoints
export const groupAPI = {
  getUserGroups: () => api.get('/groups'),
  getGroupById: (groupId) => api.get(`/groups/${groupId}`),
  getGroupMessages: (groupId) => api.get(`/groups/${groupId}/messages`),
  createGroup: (data) => api.post('/groups', data),
};

// Playlist API endpoints
export const playlistAPI = {
  getUserPlaylists: (userId) => api.get(`/playlists/user/${userId}`),
  createPlaylist: (data) => api.post('/playlists', data),
  deletePlaylist: (playlistId) => api.delete(`/playlists/${playlistId}`),
};

// Highlight API endpoints
export const highlightAPI = {
  getHighlight: (highlightId) => api.get(`/highlights/${highlightId}`),
};

// Trending API endpoints
export const trendingAPI = {
  getTrendingVideos: (timeframe) => api.get(`/trending/videos?timeframe=${timeframe}`),
  getTrendingHashtags: () => api.get('/trending/hashtags'),
  getTrendingCreators: () => api.get('/trending/creators'),
};

// Watch Later API endpoints
export const watchLaterAPI = {
  getWatchLater: () => api.get('/watchlater'),
  removeFromWatchLater: (postId) => api.delete(`/watchlater/${postId}`),
  clearWatchLater: () => api.delete('/watchlater'),
};

// Audio API endpoints
export const audioAPI = {
  extractAudio: (postId) => api.post(`/audio/extract/${postId}`),
  getAudioByPost: (postId) => api.get(`/audio/post/${postId}`),
  getUserAudio: (userId, page = 1, limit = 20) => api.get(`/audio/user/${userId}?page=${page}&limit=${limit}`),
  searchAudio: (query, page = 1, limit = 20) => api.get(`/audio/search?q=${query}&page=${page}&limit=${limit}`),
  updateAudio: (audioId, data) => api.put(`/audio/${audioId}`, data),
  deleteAudio: (audioId) => api.delete(`/audio/${audioId}`),
  incrementViewCount: (audioId) => api.post(`/audio/${audioId}/view`),
  incrementDownloadCount: (audioId) => api.post(`/audio/${audioId}/download`),
};

// Monetization API endpoints
export const monetizationAPI = {
  getAnalytics: () => api.get('/monetization/analytics'),
  getPayoutHistory: (page = 1, limit = 20) => api.get(`/monetization/payouts?page=${page}&limit=${limit}`),
  requestPayout: (data) => api.post('/monetization/payout-request', data),
  getSettings: () => api.get('/monetization/settings'),
  updateSettings: (data) => api.put('/monetization/settings', data),
};

// Achievement API endpoints
export const achievementAPI = {
  getUserAchievements: (userId) => api.get(`/achievements/user/${userId}`),
  getUserAchievementStats: (userId) => api.get(`/achievements/user/${userId}/stats`),
  // Admin endpoints
  awardAchievement: (data) => api.post('/achievements/award', data),
  getAllAchievements: (params) => api.get('/achievements/admin/all', { params }),
  revokeAchievement: (id) => api.delete(`/achievements/${id}`),
};

// Recommendation API endpoints
export const recommendationAPI = {
  getPersonalized: (params = {}) => {
    const { limit = 20 } = params;
    return api.get(`/recommendations/personalized?limit=${limit}`);
  },
  getTrending: (params = {}) => {
    const { limit = 20 } = params;
    return api.get(`/recommendations/trending?limit=${limit}`);
  },
  getSubscriptions: (params = {}) => {
    const { limit = 20 } = params;
    return api.get(`/recommendations/subscriptions?limit=${limit}`);
  },
  getUpNext: (postId, params = {}) => {
    const { limit = 10 } = params;
    return api.get(`/recommendations/upnext/${postId}?limit=${limit}`);
  }
};


export default api;