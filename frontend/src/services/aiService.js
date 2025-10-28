import api from './api';

export const aiService = {
  // Get caption suggestions
  getCaptionSuggestions: async (imageDescription) => {
    const response = await api.post('/ai/captions', { imageDescription });
    return response.data;
  },

  // Get hashtag suggestions
  getHashtagSuggestions: async (content) => {
    const response = await api.post('/ai/hashtags', { content });
    return response.data;
  },

  // Get bio suggestions
  getBioSuggestions: async (interests) => {
    const response = await api.post('/ai/bio-suggestions', { interests });
    return response.data;
  },

  // Moderate content (admin)
  moderateContent: async (text) => {
    const response = await api.post('/ai/moderate', { text });
    return response.data;
  }
};