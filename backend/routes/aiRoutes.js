import express from 'express';
import { DeepSeekService } from '../services/deepseekService.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get AI caption suggestions
router.post('/captions', protect, async (req, res) => {
  try {
    const { imageDescription } = req.body;
    const captions = await DeepSeekService.generateCaptionSuggestions(imageDescription);
    res.json({ success: true, captions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get AI hashtag suggestions
router.post('/hashtags', protect, async (req, res) => {
  try {
    const { content } = req.body;
    const hashtags = await DeepSeekService.generateHashtags(content);
    res.json({ success: true, hashtags });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI content moderation (admin only)
router.post('/moderate', protect, async (req, res) => {
  try {
    const { text } = req.body;
    const moderation = await DeepSeekService.moderateContent(text);
    res.json({ success: true, moderation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bio suggestions
router.post('/bio-suggestions', protect, async (req, res) => {
  try {
    const { interests } = req.body;
    const bios = await DeepSeekService.generateBioSuggestions(interests);
    res.json({ success: true, bios });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;