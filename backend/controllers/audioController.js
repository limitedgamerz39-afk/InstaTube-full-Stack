import Audio from '../models/Audio.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { extractAudio, getAudioMetadata } from '../utils/audioExtractor.js';
import { uploadToStorage } from '../config/minio.js';
import path from 'path';
import fs from 'fs';

// @desc    Extract audio from a video post
// @route   POST /api/audio/extract/:postId
// @access  Private
export const extractAudioFromPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    // Find the post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check if post is a video
    if (post.category !== 'short' && post.category !== 'long') {
      return res.status(400).json({
        success: false,
        message: 'Post is not a video',
      });
    }

    // Check if user is the author or has permission to extract audio
    if (post.author.toString() !== userId.toString() && post.visibility !== 'public') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to extract audio from this post',
      });
    }

    // Check if audio has already been extracted
    const existingAudio = await Audio.findOne({ originalPost: postId });
    if (existingAudio) {
      return res.status(200).json({
        success: true,
        message: 'Audio already extracted',
        data: existingAudio,
      });
    }

    // Get the video URL
    const videoUrl = post.mediaUrl || (post.media && post.media[0] && post.media[0].url);
    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        message: 'No video found in post',
      });
    }

    // For now, we'll return a placeholder response since we don't have ffmpeg configured
    // In a real implementation, we would:
    // 1. Download the video file
    // 2. Extract the audio using ffmpeg
    // 3. Upload the audio to storage
    // 4. Save the audio metadata to the database

    // Create a placeholder audio entry
    const audio = await Audio.create({
      originalPost: postId,
      extractedBy: userId,
      audioUrl: videoUrl.replace(/\.(mp4|mov|avi|mkv|webm)$/i, '.mp3'), // Placeholder URL
      title: post.title || post.caption || 'Extracted Audio',
      durationSec: post.durationSec || 30,
      fileSize: 1024 * 1024, // Placeholder size
      format: 'mp3',
      visibility: post.visibility,
      tags: post.tags || [],
      allowRemix: true,
      license: post.license || 'standard',
    });

    res.status(201).json({
      success: true,
      message: 'Audio extraction initiated',
      data: audio,
    });
  } catch (error) {
    console.error('Audio extraction error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get extracted audio by post ID
// @route   GET /api/audio/post/:postId
// @access  Public
export const getAudioByPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const audio = await Audio.findOne({ originalPost: postId })
      .populate('extractedBy', 'username fullName avatar')
      .populate('originalPost', 'title caption author');

    if (!audio) {
      return res.status(404).json({
        success: false,
        message: 'Audio not found for this post',
      });
    }

    // Check visibility permissions
    if (audio.visibility === 'private') {
      if (!req.user || req.user._id.toString() !== audio.extractedBy.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this audio',
        });
      }
    }

    res.status(200).json({
      success: true,
      data: audio,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user's extracted audio
// @route   GET /api/audio/user/:userId
// @access  Public
export const getUserAudio = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const audios = await Audio.find({ extractedBy: userId, visibility: 'public' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('originalPost', 'title caption');

    const total = await Audio.countDocuments({ extractedBy: userId, visibility: 'public' });

    res.status(200).json({
      success: true,
      data: audios,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Search audio by tags
// @route   GET /api/audio/search
// @access  Public
export const searchAudio = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const skip = (page - 1) * limit;
    
    const audios = await Audio.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
      ],
      visibility: 'public',
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('extractedBy', 'username fullName avatar');

    const total = await Audio.countDocuments({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
      ],
      visibility: 'public',
    });

    res.status(200).json({
      success: true,
      data: audios,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update audio metadata
// @route   PUT /api/audio/:audioId
// @access  Private
export const updateAudio = async (req, res) => {
  try {
    const { audioId } = req.params;
    const userId = req.user._id;
    const { title, visibility, tags, allowRemix } = req.body;

    const audio = await Audio.findById(audioId);
    if (!audio) {
      return res.status(404).json({
        success: false,
        message: 'Audio not found',
      });
    }

    // Check if user is the owner
    if (audio.extractedBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this audio',
      });
    }

    // Update fields
    if (title !== undefined) audio.title = title;
    if (visibility !== undefined) audio.visibility = visibility;
    if (tags !== undefined) audio.tags = tags;
    if (allowRemix !== undefined) audio.allowRemix = allowRemix;

    await audio.save();

    res.status(200).json({
      success: true,
      message: 'Audio updated successfully',
      data: audio,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete extracted audio
// @route   DELETE /api/audio/:audioId
// @access  Private
export const deleteAudio = async (req, res) => {
  try {
    const { audioId } = req.params;
    const userId = req.user._id;

    const audio = await Audio.findById(audioId);
    if (!audio) {
      return res.status(404).json({
        success: false,
        message: 'Audio not found',
      });
    }

    // Check if user is the owner
    if (audio.extractedBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this audio',
      });
    }

    await audio.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Audio deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Increment audio view count
// @route   POST /api/audio/:audioId/view
// @access  Public
export const incrementViewCount = async (req, res) => {
  try {
    const { audioId } = req.params;

    const audio = await Audio.findByIdAndUpdate(
      audioId,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!audio) {
      return res.status(404).json({
        success: false,
        message: 'Audio not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'View count incremented',
      data: {
        views: audio.views,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Increment audio download count
// @route   POST /api/audio/:audioId/download
// @access  Public
export const incrementDownloadCount = async (req, res) => {
  try {
    const { audioId } = req.params;

    const audio = await Audio.findByIdAndUpdate(
      audioId,
      { $inc: { downloads: 1 } },
      { new: true }
    );

    if (!audio) {
      return res.status(404).json({
        success: false,
        message: 'Audio not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Download count incremented',
      data: {
        downloads: audio.downloads,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export default {
  extractAudioFromPost,
  getAudioByPost,
  getUserAudio,
  searchAudio,
  updateAudio,
  deleteAudio,
  incrementViewCount,
  incrementDownloadCount,
};