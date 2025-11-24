import AudioCall from '../models/AudioCall.js';
import User from '../models/User.js';
import crypto from 'crypto';

// @desc    Initiate an audio call
// @route   POST /api/audiocall/initiate
// @access  Private
export const initiateAudioCall = async (req, res) => {
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

    // Create audio call record
    const audioCall = await AudioCall.create({
      caller: callerId,
      receiver: receiverId,
      roomId,
      status: 'calling'
    });

    // Populate the call with user details
    const populatedCall = await AudioCall.findById(audioCall._id)
      .populate('caller', 'username fullName avatar')
      .populate('receiver', 'username fullName avatar');

    res.status(201).json({
      success: true,
      message: 'Audio call initiated',
      data: populatedCall
    });
  } catch (error) {
    console.error('❌ Initiate audio call error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update call status
// @route   PUT /api/audiocall/:callId/status
// @access  Private
export const updateCallStatus = async (req, res) => {
  try {
    const { callId } = req.params;
    const { status, startedAt, endedAt, duration } = req.body;
    const userId = req.user._id;

    // Find the call
    const audioCall = await AudioCall.findById(callId);
    if (!audioCall) {
      return res.status(404).json({ success: false, message: 'Call not found' });
    }

    // Check if user is part of the call
    if (audioCall.caller.toString() !== userId.toString() && 
        audioCall.receiver.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this call' });
    }

    // Update call status
    audioCall.status = status;
    
    if (startedAt) audioCall.startedAt = startedAt;
    if (endedAt) audioCall.endedAt = endedAt;
    if (duration !== undefined) audioCall.duration = duration;

    await audioCall.save();

    // Populate the call with user details
    const populatedCall = await AudioCall.findById(audioCall._id)
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
// @route   GET /api/audiocall/history
// @access  Private
export const getCallHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find calls where user is either caller or receiver
    const calls = await AudioCall.find({
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

    const total = await AudioCall.countDocuments({
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
// @route   GET /api/audiocall/:callId
// @access  Private
export const getCallDetails = async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user._id;

    // Find the call and populate user details
    const audioCall = await AudioCall.findById(callId)
      .populate('caller', 'username fullName avatar')
      .populate('receiver', 'username fullName avatar');

    if (!audioCall) {
      return res.status(404).json({ success: false, message: 'Call not found' });
    }

    // Check if user is part of the call
    if (audioCall.caller.toString() !== userId.toString() && 
        audioCall.receiver.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this call' });
    }

    res.status(200).json({
      success: true,
      data: audioCall
    });
  } catch (error) {
    console.error('❌ Get call details error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};