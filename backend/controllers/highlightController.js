import Highlight from '../models/Highlight.js';
import Story from '../models/Story.js';
import User from '../models/User.js';

// @desc    Create highlight
// @route   POST /api/highlights
// @access  Private
export const createHighlight = async (req, res) => {
  try {
    const { title, stories } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Highlight title is required',
      });
    }

    if (!stories || !Array.isArray(stories) || stories.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one story is required',
      });
    }

    // Validate stories belong to user
    const storyIds = stories.map(story => story._id || story);
    const validStories = await Story.find({
      _id: { $in: storyIds },
      author: req.user._id
    });

    if (validStories.length !== storyIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid stories selected',
      });
    }

    // Use the first story's media as cover image
    const coverImage = validStories[0].mediaUrl;

    const highlight = await Highlight.create({
      user: req.user._id,
      title: title.trim(),
      stories: storyIds,
      coverImage,
    });

    const populatedHighlight = await Highlight.findById(highlight._id)
      .populate('user', 'username fullName avatar')
      .populate('stories', 'mediaUrl mediaType caption createdAt');

    res.status(201).json({
      success: true,
      message: 'Highlight created successfully',
      highlight: populatedHighlight,
    });
  } catch (error) {
    console.error('Error creating highlight:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create highlight',
      error: error.message,
    });
  }
};

// @desc    Get user's highlights
// @route   GET /api/highlights/user/:userId
// @access  Public
export const getUserHighlights = async (req, res) => {
  try {
    const highlights = await Highlight.find({ user: req.params.userId })
      .populate('user', 'username fullName avatar')
      .populate('stories', 'mediaUrl mediaType caption createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      highlights,
    });
  } catch (error) {
    console.error('Error fetching highlights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch highlights',
      error: error.message,
    });
  }
};

// @desc    Get single highlight
// @route   GET /api/highlights/:id
// @access  Public
export const getHighlight = async (req, res) => {
  try {
    const highlight = await Highlight.findById(req.params.id)
      .populate('user', 'username fullName avatar')
      .populate({
        path: 'stories',
        populate: {
          path: 'author',
          select: 'username fullName avatar'
        }
      });

    if (!highlight) {
      return res.status(404).json({
        success: false,
        message: 'Highlight not found',
      });
    }

    res.status(200).json({
      success: true,
      highlight,
    });
  } catch (error) {
    console.error('Error fetching highlight:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch highlight',
      error: error.message,
    });
  }
};

// @desc    Update highlight
// @route   PUT /api/highlights/:id
// @access  Private
export const updateHighlight = async (req, res) => {
  try {
    const { title, stories } = req.body;
    const highlight = await Highlight.findById(req.params.id);

    if (!highlight) {
      return res.status(404).json({
        success: false,
        message: 'Highlight not found',
      });
    }

    // Check if user owns the highlight
    if (highlight.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this highlight',
      });
    }

    // Update fields
    if (title) highlight.title = title.trim();
    if (stories && Array.isArray(stories)) {
      // Validate stories belong to user
      const storyIds = stories.map(story => story._id || story);
      const validStories = await Story.find({
        _id: { $in: storyIds },
        author: req.user._id
      });

      if (validStories.length === storyIds.length) {
        highlight.stories = storyIds;
        
        // Update cover image if needed
        if (validStories.length > 0) {
          highlight.coverImage = validStories[0].mediaUrl;
        }
      }
    }

    await highlight.save();

    const populatedHighlight = await Highlight.findById(highlight._id)
      .populate('user', 'username fullName avatar')
      .populate('stories', 'mediaUrl mediaType caption createdAt');

    res.status(200).json({
      success: true,
      message: 'Highlight updated successfully',
      highlight: populatedHighlight,
    });
  } catch (error) {
    console.error('Error updating highlight:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update highlight',
      error: error.message,
    });
  }
};

// @desc    Delete highlight
// @route   DELETE /api/highlights/:id
// @access  Private
export const deleteHighlight = async (req, res) => {
  try {
    const highlight = await Highlight.findById(req.params.id);

    if (!highlight) {
      return res.status(404).json({
        success: false,
        message: 'Highlight not found',
      });
    }

    // Check if user owns the highlight
    if (highlight.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this highlight',
      });
    }

    await highlight.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Highlight deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting highlight:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete highlight',
      error: error.message,
    });
  }
};