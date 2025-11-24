import OpenAI from 'openai';

// Initialize DeepSeek client only if API key is provided
let deepseekClient = null;
if (process.env.DEEPSEEK_API_KEY) {
  deepseekClient = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com'
  });
}

export class DeepSeekService {
  // AI-powered content suggestions
  static async generateCaptionSuggestions(imageDescription) {
    if (!deepseekClient) {
      return ['Share your moment!', 'Creating memories ✨', 'Life through my lens 📸'];
    }
    
    try {
      const response = await deepseekClient.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a social media expert. Generate 3 engaging Instagram-style captions based on the image description. Keep them short, trendy, and engaging.'
          },
          {
            role: 'user',
            content: `Image description: ${imageDescription}`
          }
        ],
        max_tokens: 150
      });
      
      return response.choices[0].message.content.split('\n').filter(caption => caption.trim());
    } catch (error) {
      console.error('DeepSeek Caption Error:', error);
      return ['Share your moment!', 'Creating memories ✨', 'Life through my lens 📸'];
    }
  }

  // AI-powered hashtag suggestions
  static async generateHashtags(content) {
    if (!deepseekClient) {
      return ['#d4dhub', '#social', '#share', '#moment'];
    }
    
    try {
      const response = await deepseekClient.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'Generate 10 relevant Instagram hashtags for the given content. Return only hashtags separated by spaces.'
          },
          {
            role: 'user',
            content: `Content: ${content}`
          }
        ],
        max_tokens: 100
      });
      
      return response.choices[0].message.content.split(' ').filter(tag => tag.startsWith('#'));
    } catch (error) {
      console.error('DeepSeek Hashtags Error:', error);
      return ['#d4dhub', '#social', '#share', '#moment'];
    }
  }

  // AI content moderation (for admin)
  static async moderateContent(text) {
    if (!deepseekClient) {
      return { appropriate: true, reason: 'AI moderation not available', confidence: 0 };
    }
    
    try {
      const response = await deepseekClient.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'Analyze this social media content for inappropriate content, hate speech, or spam. Return JSON: {appropriate: boolean, reason: string, confidence: number}'
          },
          {
            role: 'user',
            content: `Content to moderate: ${text}`
          }
        ],
        response_format: { type: 'json_object' }
      });
      
      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('DeepSeek Moderation Error:', error);
      return { appropriate: true, reason: 'Error analyzing content', confidence: 0 };
    }
  }

  // AI-powered user suggestions
  static async generateBioSuggestions(userInterests) {
    if (!deepseekClient) {
      return ['Digital creator ✨', 'Sharing my journey 📱', 'Creating content that inspires 🌟'];
    }
    
    try {
      const response = await deepseekClient.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'Generate 3 creative and engaging Instagram bio suggestions based on user interests. Keep them under 150 characters.'
          },
          {
            role: 'user',
            content: `User interests: ${userInterests}`
          }
        ],
        max_tokens: 200
      });
      
      return response.choices[0].message.content.split('\n').filter(bio => bio.trim());
    } catch (error) {
      console.error('DeepSeek Bio Error:', error);
      return ['Digital creator ✨', 'Sharing my journey 📱', 'Creating content that inspires 🌟'];
    }
  }
}