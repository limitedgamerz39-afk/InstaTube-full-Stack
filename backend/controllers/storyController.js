import Story from '../models/Story.js';
import User from '../models/User.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

// @desc    Create story
// @route   POST /api/stories
// @access  Private
export const createStory = async (req, res) => {
  try {
    const { caption } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image or video',
      });
    }

    console.log('📤 Uploading story to Cloudinary...');
    const result = await uploadToCloudinary(req.file.buffer, 'instatube/stories');
    console.log('✅ Story upload successful');

    const mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';

    const story = await Story.create({
      author: req.user._id,
      mediaUrl: result.secure_url,
      mediaType,
      caption: caption || '',
    });

    const populatedStory = await Story.findById(story._id).populate(
      'author',
      'username fullName avatar'
    );

    res.status(201).json({
      success: true,
      message: 'Story created successfully',
      data: populatedStory,
    });
  } catch (error) {
    console.error('❌ Story creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get stories from following users
// @route   GET /api/stories/following
// @access  Private
export const getFollowingStories = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);

    // Get stories from followed users + own stories
    const stories = await Story.find({
      author: { $in: [...currentUser.following, currentUser._id] },
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .populate('author', 'username fullName avatar')
      .populate('views.user', 'username avatar')
      .populate('replies.user', 'username avatar');

    // Group stories by author
    const groupedStories = {};
    stories.forEach((story) => {
      const authorId = story.author._id.toString();
      if (!groupedStories[authorId]) {
        groupedStories[authorId] = {
          author: story.author,
          stories: [],
          hasViewed: false,
        };
      }
      groupedStories[authorId].stories.push(story);
      
      // Check if current user has viewed any story from this author
      const hasViewed = story.views.some(
        (view) => view.user._id.toString() === req.user._id.toString()
      );
      if (!hasViewed) {
        groupedStories[authorId].hasViewed = false;
      }
    });

    res.status(200).json({
      success: true,
      data: Object.values(groupedStories),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user's stories
// @route   GET /api/stories/user/:userId
// @access  Private
export const getUserStories = async (req, res) => {
  try {
    const stories = await Story.find({
      author: req.params.userId,
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .populate('author', 'username fullName avatar')
      .populate('views.user', 'username avatar')
      .populate('replies.user', 'username avatar');

    res.status(200).json({
      success: true,
      data: stories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    View story
// @route   POST /api/stories/:id/view
// @access  Private
export const viewStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found',
      });
    }

    // Check if user already viewed
    const alreadyViewed = story.views.some(
      (view) => view.user.toString() === req.user._id.toString()
    );

    if (!alreadyViewed) {
      story.views.push({ user: req.user._id });
      await story.save();
    }

    res.status(200).json({
      success: true,
      message: 'Story viewed',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Reply to story
// @route   POST /api/stories/:id/reply
// @access  Private
export const replyToStory = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Reply text is required',
      });
    }

    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found',
      });
    }

    story.replies.push({
      user: req.user._id,
      text,
    });

    await story.save();

    const populatedStory = await Story.findById(story._id)
      .populate('author', 'username fullName avatar')
      .populate('replies.user', 'username avatar');

    // Send as message to story author
    const io = req.app.get('io');
    io.to(story.author.toString()).emit('storyReply', {
      storyId: story._id,
      from: req.user,
      text,
    });

    res.status(200).json({
      success: true,
      message: 'Reply sent',
      data: populatedStory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete story
// @route   DELETE /api/stories/:id
// @access  Private
export const deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found',
      });
    }

    if (story.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    await story.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Story deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
