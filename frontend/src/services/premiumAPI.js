import axios from 'axios';

const API_URL = '/api';

const premiumAPI = {
  // Subscription APIs
  getPlans: () => axios.get(`${API_URL}/subscription/plans`),
  subscribe: (plan) => axios.post(`${API_URL}/subscription/subscribe`, { plan }),
  cancelSubscription: () => axios.post(`${API_URL}/subscription/cancel`),
  getSubscriptionStatus: () => axios.get(`${API_URL}/subscription/status`),

  // Creator APIs
  enableMonetization: () => axios.post(`${API_URL}/creator/enable-monetization`),
  getAnalytics: () => axios.get(`${API_URL}/creator/analytics`),
  trackView: (postId, watchTime) => axios.post(`${API_URL}/creator/track-view`, { postId, watchTime }),
  getEarnings: () => axios.get(`${API_URL}/creator/earnings`),

  // Super Chat APIs
  sendSuperChat: (streamId, amount, message) => 
    axios.post(`${API_URL}/superchat/send`, { streamId, amount, message }),
  getSuperChats: (streamId) => axios.get(`${API_URL}/superchat/${streamId}`),
};

export default premiumAPI;
