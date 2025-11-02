import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// User APIs
export const userAPI = {
  getProfile: (username) => api.get(`/users/${username}`),
  updateProfile: (formData) => {
    return api.put('/users/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  followUser: (userId) => api.post(`/users/${userId}/follow`),
  searchUsers: (query) => api.get(`/users/search?q=${query}`),
  getSuggestions: () => api.get('/users/suggestions'),
  requestRoleUpgrade: (reason) => api.post('/users/role/request', { reason }),
};

// Post APIs
export const postAPI = {
  createPost: (formData) => {
    return api.post('/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getFeed: (page = 1, limit = 10) => api.get(`/posts/feed?page=${page}&limit=${limit}`),
  getPost: (postId) => api.get(`/posts/${postId}`),
  deletePost: (postId) => api.delete(`/posts/${postId}`),
  likePost: (postId) => api.post(`/posts/${postId}/like`),
  savePost: (postId) => api.post(`/posts/${postId}/save`),
  archivePost: (postId) => api.post(`/posts/${postId}/archive`),
  getSavedPosts: () => api.get('/posts/saved'),
  addComment: (postId, text) => api.post(`/posts/${postId}/comment`, { text }),
  getComments: (postId) => api.get(`/posts/${postId}/comments`),
  deleteComment: (postId, commentId) => api.delete(`/posts/${postId}/comments/${commentId}`),
  replyToComment: (postId, commentId, text) => api.post(`/posts/${postId}/comments/${commentId}/reply`, { text }),
  pinComment: (postId, commentId) => api.post(`/posts/${postId}/pin/${commentId}`),
  unpinComment: (postId) => api.post(`/posts/${postId}/unpin`),
};

// Notification APIs
export const notificationAPI = {
  getNotifications: (page = 1) => api.get(`/notifications?page=${page}`),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (notificationId) => api.delete(`/notifications/${notificationId}`),
};

// Message APIs
export const messageAPI = {
  sendMessage: (receiverId, text) => api.post(`/messages/${receiverId}`, { text }),
  getConversation: (userId) => api.get(`/messages/${userId}`),
  getConversations: () => api.get('/messages/conversations'),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
  getUnreadCount: () => api.get('/messages/unread/count'),
  addReaction: (messageId, emoji) => api.post(`/messages/${messageId}/reaction`, { emoji }),
  removeReaction: (messageId) => api.delete(`/messages/${messageId}/reaction`),
  // New conversation management APIs
  toggleStarConversation: (userId) => api.post(`/messages/conversations/${userId}/star`),
  toggleArchiveConversation: (userId) => api.post(`/messages/conversations/${userId}/archive`),
  markConversationAsRead: (userId) => api.post(`/messages/conversations/${userId}/read`),
  markAllConversationsAsRead: () => api.post('/messages/mark-all-read'),
  getConversationMetadata: (userId) => api.get(`/messages/conversations/${userId}/metadata`),
  updateConversationSettings: (userId, { readReceiptsEnabled, typingIndicatorEnabled }) => api.post(`/messages/conversations/${userId}/settings`, { readReceiptsEnabled, typingIndicatorEnabled }),
  updateConversationExpiry: (userId, hours) => api.post(`/messages/conversations/${userId}/expiry`, { hours }),
  searchMessages: (q, userId) => api.get(`/messages/search?q=${encodeURIComponent(q)}${userId ? `&userId=${userId}` : ''}`),
  sendVoiceMessage: (receiverId, file) => {
    const form = new FormData();
    form.append('voice', file);
    return api.post(`/messages/${receiverId}/voice`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  sendAttachment: (receiverId, file) => {
    const form = new FormData();
    form.append('attachment', file);
    return api.post(`/messages/${receiverId}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Explore APIs
export const exploreAPI = {
  getExplorePosts: () => api.get('/explore/posts'),
  getTrendingHashtags: () => api.get('/explore/hashtags'),
  getPostsByHashtag: (tag) => api.get(`/explore/tags/${tag}`),
  getSuggestedUsers: () => api.get('/explore/users'),
};

// Story APIs
export const storyAPI = {
  createStory: (formData) => {
    return api.post('/stories', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getFollowingStories: () => api.get('/stories/following'),
  getUserStories: (userId) => api.get(`/stories/user/${userId}`),
  viewStory: (storyId) => api.post(`/stories/${storyId}/view`),
  replyToStory: (storyId, text) => api.post(`/stories/${storyId}/reply`, { text }),
  deleteStory: (storyId) => api.delete(`/stories/${storyId}`),
};

// Group APIs
export const groupAPI = {
  createGroup: (data) => api.post('/groups', data),
  getUserGroups: () => api.get('/groups'),
  getGroupById: (groupId) => api.get(`/groups/${groupId}`),
  sendGroupMessage: (groupId, text) => api.post(`/groups/${groupId}/messages`, { text }),
  getGroupMessages: (groupId) => api.get(`/groups/${groupId}/messages`),
  addMember: (groupId, userId) => api.post(`/groups/${groupId}/members`, { userId }),
  leaveGroup: (groupId) => api.delete(`/groups/${groupId}/leave`),
};

// Playlist APIs
export const playlistAPI = {
  createPlaylist: (data) => api.post('/playlists', data),
  getUserPlaylists: (userId) => api.get(`/playlists/user/${userId}`),
  getPublicPlaylists: () => api.get('/playlists/public'),
  getPlaylist: (playlistId) => api.get(`/playlists/${playlistId}`),
  updatePlaylist: (playlistId, data) => api.put(`/playlists/${playlistId}`, data),
  deletePlaylist: (playlistId) => api.delete(`/playlists/${playlistId}`),
  addVideoToPlaylist: (playlistId, postId) => api.post(`/playlists/${playlistId}/videos/${postId}`),
  removeVideoFromPlaylist: (playlistId, postId) => api.delete(`/playlists/${playlistId}/videos/${postId}`),
};

// Watch Later APIs
export const watchLaterAPI = {
  getWatchLater: () => api.get('/watchlater'),
  addToWatchLater: (postId) => api.post(`/watchlater/${postId}`),
  removeFromWatchLater: (postId) => api.delete(`/watchlater/${postId}`),
  clearWatchLater: () => api.delete('/watchlater'),
};

// Community APIs
export const communityAPI = {
  createCommunityPost: (formData) => {
    return api.post('/community', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getUserCommunityPosts: (userId) => api.get(`/community/user/${userId}`),
  getCommunityPost: (postId) => api.get(`/community/${postId}`),
  updateCommunityPost: (postId, data) => api.put(`/community/${postId}`, data),
  deleteCommunityPost: (postId) => api.delete(`/community/${postId}`),
  likeCommunityPost: (postId) => api.post(`/community/${postId}/like`),
  addCommunityComment: (postId, text) => api.post(`/community/${postId}/comment`, { text }),
  votePoll: (postId, optionIndex) => api.post(`/community/${postId}/vote`, { optionIndex }),
  pinCommunityPost: (postId) => api.post(`/community/${postId}/pin`),
};

// Note APIs
export const noteAPI = {
  createNote: (data) => api.post('/notes', data),
  getUserNote: (userId) => api.get(`/notes/user/${userId}`),
  getFollowingNotes: () => api.get('/notes/following'),
  deleteNote: (noteId) => api.delete(`/notes/${noteId}`),
  likeNote: (noteId) => api.post(`/notes/${noteId}/like`),
  replyToNote: (noteId, content) => api.post(`/notes/${noteId}/reply`, { content }),
};

// Trending APIs
export const trendingAPI = {
  getTrendingVideos: (timeframe = '7d', limit = 50) => api.get(`/trending/videos?timeframe=${timeframe}&limit=${limit}`),
  getTrendingReels: (limit = 50) => api.get(`/trending/reels?limit=${limit}`),
  getTrendingHashtags: (limit = 20) => api.get(`/trending/hashtags?limit=${limit}`),
  getTrendingCreators: (limit = 20) => api.get(`/trending/creators?limit=${limit}`),
};

export default api;
