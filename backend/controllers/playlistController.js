import Playlist from '../models/Playlist.js';
import Post from '../models/Post.js';
import User from '../models/User.js';

// @desc    Create new playlist
// @route   POST /api/playlists
// @access  Private
export const createPlaylist = async (req, res) => {
  try {
    const { title, description, visibility } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Playlist title is required' });
    }

    const playlist = await Playlist.create({
      title,
      description: description || '',
      creator: req.user._id,
      visibility: visibility || 'public',
      videos: [],
    });

    res.status(201).json({ success: true, playlist });
  } catch (error) {
    console.error('Error creating playlist:', error);
    res.status(500).json({ success: false, message: 'Failed to create playlist' });
  }
};

// @desc    Get user's playlists
// @route   GET /api/playlists/user/:userId
// @access  Public
export const getUserPlaylists = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId
    if (!userId || userId === 'undefined') {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const query = { creator: userId };
    if (!req.user || req.user._id.toString() !== userId) {
      query.visibility = 'public';
    }

    const playlists = await Playlist.find(query)
      .populate('creator', 'username profilePicture fullName')
      .sort({ lastUpdated: -1 });

    res.json({ success: true, playlists });
  } catch (error) {
    console.error('Error fetching playlists:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch playlists' });
  }
};

// @desc    Get public playlists
// @route   GET /api/playlists/public
// @access  Public
export const getPublicPlaylists = async (req, res) => {
  try {
    const playlists = await Playlist.find({ visibility: 'public', videoCount: { $gt: 0 } })
      .populate('creator', 'username profilePicture fullName verified')
      .sort({ views: -1, lastUpdated: -1 })
      .limit(50);

    res.json({ success: true, playlists });
  } catch (error) {
    console.error('Error fetching public playlists:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch playlists' });
  }
};

// @desc    Get playlist by ID
// @route   GET /api/playlists/:id
// @access  Public
export const getPlaylist = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate('creator', 'username profilePicture fullName verified')
      .populate({
        path: 'videos.post',
        populate: { path: 'author', select: 'username profilePicture verified' },
      });

    if (!playlist) {
      return res.status(404).json({ success: false, message: 'Playlist not found' });
    }

    if (playlist.visibility === 'private' && (!req.user || req.user._id.toString() !== playlist.creator._id.toString())) {
      return res.status(403).json({ success: false, message: 'This playlist is private' });
    }

    playlist.views += 1;
    await playlist.save();

    res.json({ success: true, playlist });
  } catch (error) {
    console.error('Error fetching playlist:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch playlist' });
  }
};

// @desc    Update playlist
// @route   PUT /api/playlists/:id
// @access  Private
export const updatePlaylist = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ success: false, message: 'Playlist not found' });
    }

    if (playlist.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { title, description, visibility } = req.body;

    if (title) playlist.title = title;
    if (description !== undefined) playlist.description = description;
    if (visibility) playlist.visibility = visibility;

    await playlist.save();

    res.json({ success: true, playlist });
  } catch (error) {
    console.error('Error updating playlist:', error);
    res.status(500).json({ success: false, message: 'Failed to update playlist' });
  }
};

// @desc    Delete playlist
// @route   DELETE /api/playlists/:id
// @access  Private
export const deletePlaylist = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ success: false, message: 'Playlist not found' });
    }

    if (playlist.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await playlist.deleteOne();

    res.json({ success: true, message: 'Playlist deleted' });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    res.status(500).json({ success: false, message: 'Failed to delete playlist' });
  }
};

// @desc    Add video to playlist
// @route   POST /api/playlists/:id/videos/:postId
// @access  Private
export const addVideoToPlaylist = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ success: false, message: 'Playlist not found' });
    }

    if (playlist.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    const alreadyExists = playlist.videos.some(
      (v) => v.post.toString() === req.params.postId
    );

    if (alreadyExists) {
      return res.status(400).json({ success: false, message: 'Video already in playlist' });
    }

    playlist.videos.push({ post: req.params.postId });
    await playlist.save();

    res.json({ success: true, playlist });
  } catch (error) {
    console.error('Error adding video to playlist:', error);
    res.status(500).json({ success: false, message: 'Failed to add video' });
  }
};

// @desc    Remove video from playlist
// @route   DELETE /api/playlists/:id/videos/:postId
// @access  Private
export const removeVideoFromPlaylist = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ success: false, message: 'Playlist not found' });
    }

    if (playlist.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    playlist.videos = playlist.videos.filter(
      (v) => v.post.toString() !== req.params.postId
    );

    await playlist.save();

    res.json({ success: true, playlist });
  } catch (error) {
    console.error('Error removing video from playlist:', error);
    res.status(500).json({ success: false, message: 'Failed to remove video' });
  }
};
