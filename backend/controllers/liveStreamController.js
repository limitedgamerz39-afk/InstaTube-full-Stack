import LiveStream from '../models/LiveStream.js';
import User from '../models/User.js';
import crypto from 'crypto';

// @desc    Create a new live stream
// @route   POST /api/livestream/create
// @access  Private/Creator
export const createLiveStream = async (req, res) => {
  try {
    const { title, description, category, visibility, tags } = req.body;
    
    // Check if user already has an active stream
    const existingStream = await LiveStream.findOne({
      host: req.user._id,
      status: 'live'
    });
    
    if (existingStream) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active live stream'
      });
    }
    
    // Generate unique stream key
    const streamKey = crypto.randomBytes(32).toString('hex');
    
    const stream = await LiveStream.create({
      host: req.user._id,
      title,
      description,
      streamKey,
      category,
      visibility,
      tags,
      status: 'live',
      startedAt: new Date()
    });
    
    // Update user's creator features
    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        'creatorFeatures.canUploadLongVideos': true,
        'creatorFeatures.canSchedulePosts': true,
        'creatorFeatures.canCreatePlaylists': true,
        'creatorFeatures.canCreateCommunityPosts': true
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Live stream created successfully',
      data: {
        streamId: stream._id,
        streamKey: stream.streamKey
      }
    });
  } catch (error) {
    console.error('Create live stream error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during live stream creation'
    });
  }
};

// @desc    End a live stream
// @route   POST /api/livestream/end/:streamId
// @access  Private/Creator
export const endLiveStream = async (req, res) => {
  try {
    const stream = await LiveStream.findById(req.params.streamId);
    
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Stream not found'
      });
    }
    
    // Check if user is the host
    if (stream.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to end this stream'
      });
    }
    
    // Update stream status
    stream.status = 'ended';
    stream.endedAt = new Date();
    stream.duration = Math.floor((stream.endedAt - stream.startedAt) / 1000); // in seconds
    await stream.save();
    
    // Notify viewers that stream has ended
    const io = req.app.get('io');
    io.to(`stream_${stream._id}`).emit('streamEnded');
    
    res.status(200).json({
      success: true,
      message: 'Live stream ended successfully'
    });
  } catch (error) {
    console.error('End live stream error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during live stream ending'
    });
  }
};

// @desc    Get live stream details
// @route   GET /api/livestream/:streamId
// @access  Public
export const getLiveStream = async (req, res) => {
  try {
    const stream = await LiveStream.findById(req.params.streamId)
      .populate('host', 'username fullName avatar isVerified')
      .populate('comments.user', 'username avatar');
    
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Stream not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: stream
    });
  } catch (error) {
    console.error('Get live stream error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during live stream retrieval'
    });
  }
};

// @desc    Get active live streams
// @route   GET /api/livestream/active
// @access  Public
export const getActiveStreams = async (req, res) => {
  try {
    const streams = await LiveStream.find({ status: 'live' })
      .populate('host', 'username fullName avatar isVerified')
      .sort({ currentViewers: -1, createdAt: -1 })
      .limit(50);
    
    res.status(200).json({
      success: true,
      data: streams
    });
  } catch (error) {
    console.error('Get active streams error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during active streams retrieval'
    });
  }
};

// @desc    Add comment to live stream
// @route   POST /api/livestream/:streamId/comment
// @access  Private
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const streamId = req.params.streamId;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }
    
    const stream = await LiveStream.findById(streamId);
    
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Stream not found'
      });
    }
    
    if (stream.status !== 'live') {
      return res.status(400).json({
        success: false,
        message: 'Stream is not live'
      });
    }
    
    const comment = {
      user: req.user._id,
      text: text.trim(),
      timestamp: new Date()
    };
    
    stream.comments.push(comment);
    await stream.save();
    
    // Populate user info for the comment
    const populatedComment = {
      ...comment,
      user: {
        _id: req.user._id,
        username: req.user.username,
        avatar: req.user.avatar
      }
    };
    
    // Emit socket event for real-time comment
    const io = req.app.get('io');
    io.to(`stream_${streamId}`).emit('streamComment', populatedComment);
    
    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: populatedComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during comment addition'
    });
  }
};

// @desc    Add like to live stream
// @route   POST /api/livestream/:streamId/like
// @access  Private
export const addLike = async (req, res) => {
  try {
    const streamId = req.params.streamId;
    const stream = await LiveStream.findById(streamId);
    
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Stream not found'
      });
    }
    
    if (stream.status !== 'live') {
      return res.status(400).json({
        success: false,
        message: 'Stream is not live'
      });
    }
    
    // Check if user already liked
    const alreadyLiked = stream.likes.includes(req.user._id);
    
    if (alreadyLiked) {
      // Remove like
      stream.likes = stream.likes.filter(id => id.toString() !== req.user._id.toString());
    } else {
      // Add like
      stream.likes.push(req.user._id);
    }
    
    await stream.save();
    
    // Emit socket event for real-time like update
    const io = req.app.get('io');
    io.to(`stream_${streamId}`).emit('streamLike', {
      userId: req.user._id,
      username: req.user.username,
      action: alreadyLiked ? 'unlike' : 'like',
      totalLikes: stream.likes.length
    });
    
    res.status(200).json({
      success: true,
      message: alreadyLiked ? 'Like removed' : 'Like added',
      data: {
        totalLikes: stream.likes.length
      }
    });
  } catch (error) {
    console.error('Add like error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during like operation'
    });
  }
};