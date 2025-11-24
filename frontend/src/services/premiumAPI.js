import api from './api';

const premiumAPI = {
  // Subscription APIs
  getPlans: () => api.get('/subscription/plans'),
  subscribe: (plan) => api.post('/subscription/subscribe', { plan }),
  cancelSubscription: () => api.post('/subscription/cancel'),
  getSubscriptionStatus: () => api.get('/subscription/status'),

  // Creator APIs
  enableMonetization: () => api.post('/creator/enable-monetization'),
  getAnalytics: () => api.get('/creator/analytics'),
  trackView: (postId, watchTime) => api.post('/creator/track-view', { postId, watchTime }),
  getEarnings: () => api.get('/creator/earnings'),

  // Super Chat APIs
  sendSuperChat: (streamId, amount, message) => 
    api.post('/superchat/send', { streamId, amount, message }),
  getSuperChats: (streamId) => api.get(`/superchat/${streamId}`),
};

export default premiumAPI;