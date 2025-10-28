import Message from '../models/Message.js';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

// @desc    Send voice message
// @route   POST /api/messages/:receiverId/voice
// @access  Private
export const sendVoiceMessage = async (req, res) => {
  try {
    const receiverId = req.params.receiverId;

    // Validate receiver
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Voice clip is required' });
    }

    const mime = req.file.mimetype || '';
    if (!(mime.startsWith('audio/') || mime.startsWith('video/'))) {
      return res.status(400).json({ success: false, message: 'Invalid voice file type' });
    }

    // Upload to Cloudinary (auto resource type handles audio/video containers like webm/ogg)
    const upload = await uploadToCloudinary(req.file.buffer, 'instatube/messages');

    const durationSec = Math.round(upload?.duration || 0);

    const convo = await Conversation.findOrCreate(req.user._id, receiverId);
    const expiresAt = typeof convo.messageExpiryHours === 'number' && convo.messageExpiryHours > 0
      ? new Date(Date.now() + convo.messageExpiryHours * 60 * 60 * 1000)
      : undefined;

    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      audio: upload.secure_url,
      audioDurationSec: durationSec || undefined,
      expiresAt,
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username fullName avatar')
      .populate('receiver', 'username fullName avatar');

    // Emit only to receiver; sender handles optimistic UI
    const io = req.app.get('io');
    io.to(receiverId).emit('newMessage', populatedMessage);

    res.status(201).json({ success: true, data: populatedMessage });
  } catch (error) {
    console.error('❌ Send voice message error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send attachment (image/video/file)
// @route   POST /api/messages/:receiverId/attachments
// @access  Private
export const sendAttachment = async (req, res) => {
  try {
    const receiverId = req.params.receiverId;
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Attachment is required' });
    }

    const upload = await uploadToCloudinary(req.file.buffer, 'instatube/messages');
    const mime = req.file.mimetype || '';

    let messagePayload = {
      sender: req.user._id,
      receiver: receiverId,
    };

    const convo = await Conversation.findOrCreate(req.user._id, receiverId);
    const expiresAt = typeof convo.messageExpiryHours === 'number' && convo.messageExpiryHours > 0
      ? new Date(Date.now() + convo.messageExpiryHours * 60 * 60 * 1000)
      : undefined;

    if (mime.startsWith('image/')) {
      messagePayload.image = upload.secure_url;
    } else if (mime.startsWith('video/')) {
      messagePayload.video = upload.secure_url;
    } else {
      messagePayload.fileUrl = upload.secure_url;
      messagePayload.fileName = req.file.originalname || 'file';
    }

    if (expiresAt) messagePayload.expiresAt = expiresAt;

    const message = await Message.create(messagePayload);

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username fullName avatar')
      .populate('receiver', 'username fullName avatar');

    const io = req.app.get('io');
    io.to(receiverId).emit('newMessage', populatedMessage);

    res.status(201).json({ success: true, data: populatedMessage });
  } catch (error) {
    console.error('❌ Send attachment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send message
// @route   POST /api/messages/:receiverId
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const receiverId = req.params.receiverId;

    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message text is required',
      });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Create message
    const convo = await Conversation.findOrCreate(req.user._id, receiverId);
    const expiresAt = typeof convo.messageExpiryHours === 'number' && convo.messageExpiryHours > 0
      ? new Date(Date.now() + convo.messageExpiryHours * 60 * 60 * 1000)
      : undefined;

    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      text,
      expiresAt,
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username fullName avatar')
      .populate('receiver', 'username fullName avatar');

    // Emit socket event ONLY to receiver (sender already has optimistic update)
    const io = req.app.get('io');
    io.to(receiverId).emit('newMessage', populatedMessage);

    console.log(`📨 Message sent from ${req.user._id} to ${receiverId}`);
    console.log(`📤 Socket emitted to receiver: ${receiverId}`);

    res.status(201).json({
      success: true,
      data: populatedMessage,
    });
  } catch (error) {
    console.error('❌ Send message error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get conversation with a user
// @route   GET /api/messages/:userId
// @access  Private
export const getConversation = async (req, res) => {
  try {
    const userId = req.params.userId;

    const messages = await Message.find({
      $and: [
        {
          $or: [
            { sender: req.user._id, receiver: userId },
            { sender: userId, receiver: req.user._id },
          ],
        },
        {
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: { $gt: new Date() } },
          ],
        },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'username fullName avatar')
      .populate('receiver', 'username fullName avatar');

    // Mark messages as read
    await Message.updateMany(
      { sender: userId, receiver: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all conversations
// @route   GET /api/messages/conversations
// @access  Private
export const getConversations = async (req, res) => {
  try {
    // Get all users who have messages with current user
    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'username fullName avatar')
      .populate('receiver', 'username fullName avatar');

    // Group messages by conversation partner
    const conversationsMap = new Map();

    messages.forEach((message) => {
      const partnerId =
        message.sender._id.toString() === req.user._id.toString()
          ? message.receiver._id.toString()
          : message.sender._id.toString();

      if (!conversationsMap.has(partnerId)) {
        const partner =
          message.sender._id.toString() === req.user._id.toString()
            ? message.receiver
            : message.sender;

        conversationsMap.set(partnerId, {
          user: partner,
          lastMessage: message,
          unreadCount: 0,
        });
      }
    });

    // Count unread messages for each conversation
    for (const [partnerId, conversation] of conversationsMap) {
      const unreadCount = await Message.countDocuments({
        sender: partnerId,
        receiver: req.user._id,
        read: false,
      });
      conversation.unreadCount = unreadCount;
    }

    const conversations = Array.from(conversationsMap.values());

    // Enrich with starred/archived flags
    for (const convo of conversations) {
      const cdoc = await Conversation.findOne({ participants: { $all: [req.user._id, convo.user._id] } });
      convo.isStarred = cdoc ? cdoc.starredBy.some(id => id.toString() === req.user._id.toString()) : false;
      convo.isArchived = cdoc ? cdoc.archivedBy.some(id => id.toString() === req.user._id.toString()) : false;
    }

    res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete message
// @route   DELETE /api/messages/:messageId
// @access  Private
export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message',
      });
    }

    await message.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread/count
// @access  Private
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user._id,
      read: false,
    });

    res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Add reaction to message
// @route   POST /api/messages/:messageId/reaction
// @access  Private
export const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // Check if user already reacted
    const existingReaction = message.reactions.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (existingReaction) {
      // Update existing reaction
      existingReaction.emoji = emoji;
      existingReaction.createdAt = new Date();
    } else {
      // Add new reaction
      message.reactions.push({
        user: req.user._id,
        emoji,
      });
    }

    await message.save();

    const populatedMessage = await Message.findById(messageId)
      .populate('sender', 'username fullName avatar')
      .populate('receiver', 'username fullName avatar')
      .populate('reactions.user', 'username avatar');

    // Emit socket event to both users
    const io = req.app.get('io');
    const receiverId = message.sender._id.toString() === req.user._id.toString() 
      ? message.receiver._id.toString() 
      : message.sender._id.toString();
    
    io.to(receiverId).emit('messageReaction', populatedMessage);
    io.to(req.user._id.toString()).emit('messageReaction', populatedMessage);

    res.status(200).json({
      success: true,
      data: populatedMessage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Remove reaction from message
// @route   DELETE /api/messages/:messageId/reaction
// @access  Private
export const removeReaction = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // Remove user's reaction
    message.reactions = message.reactions.filter(
      (r) => r.user.toString() !== req.user._id.toString()
    );

    await message.save();

    const populatedMessage = await Message.findById(messageId)
      .populate('sender', 'username fullName avatar')
      .populate('receiver', 'username fullName avatar')
      .populate('reactions.user', 'username avatar');

    // Emit socket event to both users
    const io = req.app.get('io');
    const receiverId = message.sender._id.toString() === req.user._id.toString() 
      ? message.receiver._id.toString() 
      : message.sender._id.toString();
    
    io.to(receiverId).emit('messageReaction', populatedMessage);
    io.to(req.user._id.toString()).emit('messageReaction', populatedMessage);

    res.status(200).json({
      success: true,
      data: populatedMessage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// @desc    Star/Unstar conversation
// @route   POST /api/messages/conversations/:userId/star
// @access  Private
export const toggleStarConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find or create conversation
    const conversation = await Conversation.findOrCreate(req.user._id, userId);
    
    const isStarred = conversation.starredBy.includes(req.user._id);
    
    if (isStarred) {
      // Remove from starred
      conversation.starredBy = conversation.starredBy.filter(
        id => id.toString() !== req.user._id.toString()
      );
    } else {
      // Add to starred
      conversation.starredBy.push(req.user._id);
    }
    
    await conversation.save();
    
    res.status(200).json({
      success: true,
      data: {
        isStarred: !isStarred,
        message: isStarred ? 'Conversation unstarred' : 'Conversation starred',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Archive/Unarchive conversation
// @route   POST /api/messages/conversations/:userId/archive
// @access  Private
export const toggleArchiveConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find or create conversation
    const conversation = await Conversation.findOrCreate(req.user._id, userId);
    
    const isArchived = conversation.archivedBy.includes(req.user._id);
    
    if (isArchived) {
      // Remove from archived
      conversation.archivedBy = conversation.archivedBy.filter(
        id => id.toString() !== req.user._id.toString()
      );
    } else {
      // Add to archived
      conversation.archivedBy.push(req.user._id);
    }
    
    await conversation.save();
    
    res.status(200).json({
      success: true,
      data: {
        isArchived: !isArchived,
        message: isArchived ? 'Conversation unarchived' : 'Conversation archived',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Mark conversation as read
// @route   POST /api/messages/conversations/:userId/read
// @access  Private
export const markConversationAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Mark all messages from this user as read
    await Message.updateMany(
      { sender: userId, receiver: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );
    
    res.status(200).json({
      success: true,
      message: 'Conversation marked as read',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Mark all conversations as read
// @route   POST /api/messages/mark-all-read
// @access  Private
export const markAllConversationsAsRead = async (req, res) => {
  try {
    // Mark all unread messages as read
    await Message.updateMany(
      { receiver: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );
    
    res.status(200).json({
      success: true,
      message: 'All conversations marked as read',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get conversation metadata
// @route   GET /api/messages/conversations/:userId/metadata
// @access  Private
// @desc    Search messages by text
// @route   GET /api/messages/search?q=...&userId=optional
// @access  Private
export const searchMessages = async (req, res) => {
  try {
    const { q, userId } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }
    const regex = new RegExp(q.trim(), 'i');
    const baseFilter = {
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id },
      ],
    };
    const partnerFilter = userId ? {
      $or: [
        { sender: userId },
        { receiver: userId },
      ],
    } : {};

    const messages = await Message.find({
      $and: [ baseFilter, partnerFilter, { $or: [ { text: regex }, { fileName: regex } ] } ],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('sender', 'username fullName avatar')
      .populate('receiver', 'username fullName avatar');

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update conversation settings (read receipts, typing indicator)
// @route   POST /api/messages/conversations/:userId/settings
// @access  Private
// @desc    Update conversation expiry (hours or null to disable)
// @route   POST /api/messages/conversations/:userId/expiry
// @access  Private
export const updateConversationExpiry = async (req, res) => {
  try {
    const { userId } = req.params;
    const { hours } = req.body; // number or null

    const conversation = await Conversation.findOrCreate(req.user._id, userId);
    conversation.messageExpiryHours = typeof hours === 'number' && hours > 0 ? hours : null;
    await conversation.save();

    res.status(200).json({ success: true, message: 'Expiry updated', data: { messageExpiryHours: conversation.messageExpiryHours } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getConversationMetadata = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, userId] },
    });
    
    const metadata = {
      isStarred: conversation?.starredBy.includes(req.user._id) || false,
      isArchived: conversation?.archivedBy.includes(req.user._id) || false,
      readReceiptsEnabled: !(conversation?.readReceiptsDisabledBy || []).some(id => id.toString() === req.user._id.toString()),
      typingIndicatorEnabled: !(conversation?.typingIndicatorDisabledBy || []).some(id => id.toString() === req.user._id.toString()),
      messageExpiryHours: conversation?.messageExpiryHours ?? null,
    };
    
    res.status(200).json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateConversationSettings = async (req, res) => {
  try {
    const { userId } = req.params;
    const { readReceiptsEnabled, typingIndicatorEnabled } = req.body;

    const conversation = await Conversation.findOrCreate(req.user._id, userId);

    // Update read receipts
    if (typeof readReceiptsEnabled === 'boolean') {
      const idx = conversation.readReceiptsDisabledBy.findIndex(
        (id) => id.toString() === req.user._id.toString()
      );
      const shouldDisable = !readReceiptsEnabled;
      if (shouldDisable && idx === -1) {
        conversation.readReceiptsDisabledBy.push(req.user._id);
      } else if (!shouldDisable && idx !== -1) {
        conversation.readReceiptsDisabledBy.splice(idx, 1);
      }
    }

    // Update typing indicator
    if (typeof typingIndicatorEnabled === 'boolean') {
      const idx = conversation.typingIndicatorDisabledBy.findIndex(
        (id) => id.toString() === req.user._id.toString()
      );
      const shouldDisable = !typingIndicatorEnabled;
      if (shouldDisable && idx === -1) {
        conversation.typingIndicatorDisabledBy.push(req.user._id);
      } else if (!shouldDisable && idx !== -1) {
        conversation.typingIndicatorDisabledBy.splice(idx, 1);
      }
    }

    await conversation.save();

    res.status(200).json({
      success: true,
      message: 'Settings updated',
      data: {
        readReceiptsEnabled: !(conversation.readReceiptsDisabledBy || []).some(id => id.toString() === req.user._id.toString()),
        typingIndicatorEnabled: !(conversation.typingIndicatorDisabledBy || []).some(id => id.toString() === req.user._id.toString()),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

