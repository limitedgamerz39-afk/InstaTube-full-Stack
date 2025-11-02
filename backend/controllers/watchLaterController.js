import WatchLater from '../models/WatchLater.js';
import Post from '../models/Post.js';

// @desc    Add video to Watch Later
// @route   POST /api/watchlater/:postId
// @access  Private
export const addToWatchLater = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    let watchLater = await WatchLater.findOne({ user: req.user._id });

    if (!watchLater) {
      watchLater = await WatchLater.create({
        user: req.user._id,
        videos: [{ post: req.params.postId }],
      });
    } else {
      const alreadyExists = watchLater.videos.some(
        (v) => v.post.toString() === req.params.postId
      );

      if (alreadyExists) {
        return res.status(400).json({ success: false, message: 'Video already in Watch Later' });
      }

      watchLater.videos.unshift({ post: req.params.postId });
      await watchLater.save();
    }

    res.json({ success: true, watchLater });
  } catch (error) {
    console.error('Error adding to Watch Later:', error);
    res.status(500).json({ success: false, message: 'Failed to add video' });
  }
};

// @desc    Remove video from Watch Later
// @route   DELETE /api/watchlater/:postId
// @access  Private
export const removeFromWatchLater = async (req, res) => {
  try {
    const watchLater = await WatchLater.findOne({ user: req.user._id });

    if (!watchLater) {
      return res.status(404).json({ success: false, message: 'Watch Later list not found' });
    }

    watchLater.videos = watchLater.videos.filter(
      (v) => v.post.toString() !== req.params.postId
    );

    await watchLater.save();

    res.json({ success: true, watchLater });
  } catch (error) {
    console.error('Error removing from Watch Later:', error);
    res.status(500).json({ success: false, message: 'Failed to remove video' });
  }
};

// @desc    Get Watch Later videos
// @route   GET /api/watchlater
// @access  Private
export const getWatchLater = async (req, res) => {
  try {
    const watchLater = await WatchLater.findOne({ user: req.user._id })
      .populate({
        path: 'videos.post',
        populate: { path: 'author', select: 'username profilePicture verified' },
      });

    if (!watchLater) {
      return res.json({ success: true, videos: [] });
    }

    res.json({ success: true, videos: watchLater.videos });
  } catch (error) {
    console.error('Error fetching Watch Later:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch Watch Later' });
  }
};

// @desc    Clear Watch Later
// @route   DELETE /api/watchlater
// @access  Private
export const clearWatchLater = async (req, res) => {
  try {
    const watchLater = await WatchLater.findOne({ user: req.user._id });

    if (!watchLater) {
      return res.status(404).json({ success: false, message: 'Watch Later list not found' });
    }

    watchLater.videos = [];
    await watchLater.save();

    res.json({ success: true, message: 'Watch Later cleared' });
  } catch (error) {
    console.error('Error clearing Watch Later:', error);
    res.status(500).json({ success: false, message: 'Failed to clear Watch Later' });
  }
};
