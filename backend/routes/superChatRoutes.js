import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import LiveStream from '../models/LiveStream.js';
import Revenue from '../models/Revenue.js';
import User from '../models/User.js';

const router = express.Router();

// @route   POST /api/superchat/send
// @desc    Send Super Chat during live stream
// @access  Private
router.post('/send', protect, async (req, res) => {
  try {
    const { streamId, amount, message } = req.body;

    if (!streamId || !amount || amount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Super Chat data. Minimum amount is $1.',
      });
    }

    const stream = await LiveStream.findById(streamId).populate('host');

    if (!stream) {
      return res.status(404).json({ success: false, message: 'Stream not found' });
    }

    if (stream.status !== 'live') {
      return res.status(400).json({ success: false, message: 'Stream is not live' });
    }

    // Add Super Chat to stream
    const superChat = {
      user: req.user._id,
      amount,
      message: message || '',
      timestamp: new Date(),
      highlighted: amount >= 5, // Highlight if $5 or more
    };

    stream.superChats.push(superChat);
    stream.totalEarnings += amount;
    await stream.save();

    // Create revenue record
    const revenue = 0.7 * amount; // Creator gets 70%, platform takes 30%
    
    await Revenue.create({
      creator: stream.host._id,
      source: 'super_chat',
      amount: revenue,
      liveStream: stream._id,
      description: `Super Chat: $${amount} from ${req.user.username}`,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    });

    // Update creator earnings
    await User.findByIdAndUpdate(stream.host._id, {
      $inc: {
        totalEarnings: revenue,
        pendingPayout: revenue,
      },
    });

    // Emit socket event for real-time display
    const io = req.app.get('io');
    io.to(`stream_${streamId}`).emit('newSuperChat', {
      ...superChat,
      user: {
        _id: req.user._id,
        username: req.user.username,
        avatar: req.user.avatar,
      },
    });

    res.json({
      success: true,
      message: 'Super Chat sent successfully!',
      data: superChat,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/superchat/:streamId
// @desc    Get all Super Chats for a stream
// @access  Public
router.get('/:streamId', async (req, res) => {
  try {
    const stream = await LiveStream.findById(req.params.streamId)
      .populate('superChats.user', 'username avatar');

    if (!stream) {
      return res.status(404).json({ success: false, message: 'Stream not found' });
    }

    res.json({
      success: true,
      data: stream.superChats,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
