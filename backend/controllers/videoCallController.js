import VideoCall from '../models/VideoCall.js';
import User from '../models/User.js';
import crypto from 'crypto';

// @desc    Initiate a video call
// @route   POST /api/videocall/initiate
// @access  Private
export const initiateVideoCall = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const callerId = req.user._id;

    // Validate receiver
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if caller and receiver are the same
    if (callerId.toString() === receiverId) {
      return res.status(400).json({ success: false, message: 'Cannot call yourself' });
    }

    // Generate unique room ID
    const roomId = crypto.randomBytes(16).toString('hex');

    // Create video call record
    const videoCall = await VideoCall.create({
      caller: callerId,
      receiver: receiverId,
      roomId,
      status: 'calling'
    });

    // Populate the call with user details
    const populatedCall = await VideoCall.findById(videoCall._id)
      .populate('caller', 'username fullName avatar')
      .populate('receiver', 'username fullName avatar');

    res.status(201).json({
      success: true,
      message: 'Video call initiated',
      data: populatedCall
    });
  } catch (error) {
    console.error('❌ Initiate video call error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update call status
// @route   PUT /api/videocall/:callId/status
// @access  Private
export const updateCallStatus = async (req, res) => {
  try {
    const { callId } = req.params;
    const { status, startedAt, endedAt, duration } = req.body;
    const userId = req.user._id;

    // Find the call
    const videoCall = await VideoCall.findById(callId);
    if (!videoCall) {
      return res.status(404).json({ success: false, message: 'Call not found' });
    }

    // Check if user is part of the call
    if (videoCall.caller.toString() !== userId.toString() && 
        videoCall.receiver.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this call' });
    }

    // Update call status
    videoCall.status = status;
    
    if (startedAt) videoCall.startedAt = startedAt;
    if (endedAt) videoCall.endedAt = endedAt;
    if (duration !== undefined) videoCall.duration = duration;

    await videoCall.save();

    // Populate the call with user details
    const populatedCall = await VideoCall.findById(videoCall._id)
      .populate('caller', 'username fullName avatar')
      .populate('receiver', 'username fullName avatar');

    res.status(200).json({
      success: true,
      message: 'Call status updated',
      data: populatedCall
    });
  } catch (error) {
    console.error('❌ Update call status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get call history for a user
// @route   GET /api/videocall/history
// @access  Private
export const getCallHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find calls where user is either caller or receiver
    const calls = await VideoCall.find({
      $or: [
        { caller: userId },
        { receiver: userId }
      ]
    })
    .populate('caller', 'username fullName avatar')
    .populate('receiver', 'username fullName avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await VideoCall.countDocuments({
      $or: [
        { caller: userId },
        { receiver: userId }
      ]
    });

    res.status(200).json({
      success: true,
      data: calls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Get call history error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get call details
// @route   GET /api/videocall/:callId
// @access  Private
export const getCallDetails = async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user._id;

    // Find the call and populate user details
    const videoCall = await VideoCall.findById(callId)
      .populate('caller', 'username fullName avatar')
      .populate('receiver', 'username fullName avatar');

    if (!videoCall) {
      return res.status(404).json({ success: false, message: 'Call not found' });
    }

    // Check if user is part of the call
    if (videoCall.caller.toString() !== userId.toString() && 
        videoCall.receiver.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this call' });
    }

    res.status(200).json({
      success: true,
      data: videoCall
    });
  } catch (error) {
    console.error('❌ Get call details error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};