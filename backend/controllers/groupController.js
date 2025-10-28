import Group from '../models/Group.js';
import GroupMessage from '../models/GroupMessage.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private
export const createGroup = async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Group name is required',
      });
    }

    if (!memberIds || memberIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one member is required',
      });
    }

    // Create members array with admin
    const members = [
      {
        user: req.user._id,
        role: 'admin',
      },
    ];

    // Add other members
    memberIds.forEach((userId) => {
      if (userId !== req.user._id.toString()) {
        members.push({
          user: userId,
          role: 'member',
        });
      }
    });

    const group = await Group.create({
      name,
      description,
      admin: req.user._id,
      members,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8B5CF6&color=fff`,
    });

    const populatedGroup = await Group.findById(group._id)
      .populate('members.user', 'username fullName avatar')
      .populate('admin', 'username fullName avatar');

    // Emit socket event to all members
    const io = req.app.get('io');
    members.forEach((member) => {
      io.to(member.user.toString()).emit('newGroup', populatedGroup);
    });

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: populatedGroup,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all user's groups
// @route   GET /api/groups
// @access  Private
export const getUserGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      'members.user': req.user._id,
    })
      .populate('members.user', 'username fullName avatar')
      .populate('admin', 'username fullName avatar')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 });

    res.json({
      success: true,
      data: groups,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get group by ID
// @route   GET /api/groups/:groupId
// @access  Private
export const getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('members.user', 'username fullName avatar')
      .populate('admin', 'username fullName avatar');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    // Check if user is a member
    const isMember = group.members.some(
      (member) => member.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group',
      });
    }

    res.json({
      success: true,
      data: group,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Send message to group
// @route   POST /api/groups/:groupId/messages
// @access  Private
export const sendGroupMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const { groupId } = req.params;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required',
      });
    }

    // Check if group exists and user is a member
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    const isMember = group.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group',
      });
    }

    // Create message
    const message = await GroupMessage.create({
      group: groupId,
      sender: req.user._id,
      text,
    });

    const populatedMessage = await GroupMessage.findById(message._id)
      .populate('sender', 'username fullName avatar');

    // Update group's last message
    group.lastMessage = message._id;
    group.lastMessageAt = new Date();
    await group.save();

    // Emit socket event to all group members and create notifications
    const io = req.app.get('io');
    group.members.forEach(async (member) => {
      io.to(member.user.toString()).emit('newGroupMessage', {
        groupId,
        message: populatedMessage,
      });
      // Skip notifying the sender
      if (member.user.toString() !== req.user._id.toString()) {
        try {
          const notif = await Notification.create({
            recipient: member.user,
            sender: req.user._id,
            type: 'group_message',
            group: group._id,
            message: `${populatedMessage.sender.username} in ${group.name}: ${text.substring(0, 120)}`,
          });
          io.to(member.user.toString()).emit('notification', notif);
        } catch (e) {
          console.error('Failed to create group message notification:', e?.message);
        }
      }
    });

    res.status(201).json({
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

// @desc    Get group messages
// @route   GET /api/groups/:groupId/messages
// @access  Private
export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Check if group exists and user is a member
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    const isMember = group.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this group',
      });
    }

    const messages = await GroupMessage.find({ group: groupId })
      .populate('sender', 'username fullName avatar')
      .sort({ createdAt: 1 })
      .limit(100);

    res.json({
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

// @desc    Add member to group
// @route   POST /api/groups/:groupId/members
// @access  Private (Admin only)
export const addGroupMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    // Check if user is admin
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only admin can add members',
      });
    }

    // Check if user is already a member
    const isMember = group.members.some(
      (member) => member.user.toString() === userId
    );

    if (isMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member',
      });
    }

    group.members.push({
      user: userId,
      role: 'member',
    });

    await group.save();

    const populatedGroup = await Group.findById(groupId)
      .populate('members.user', 'username fullName avatar')
      .populate('admin', 'username fullName avatar');

    // Emit socket event
    const io = req.app.get('io');
    io.to(userId).emit('addedToGroup', populatedGroup);
    
    group.members.forEach((member) => {
      io.to(member.user.toString()).emit('groupMemberAdded', {
        groupId,
        newMember: userId,
      });
    });

    res.json({
      success: true,
      message: 'Member added successfully',
      data: populatedGroup,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Leave group
// @route   DELETE /api/groups/:groupId/leave
// @access  Private
export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found',
      });
    }

    // Remove user from members
    group.members = group.members.filter(
      (member) => member.user.toString() !== req.user._id.toString()
    );

    await group.save();

    // Emit socket event
    const io = req.app.get('io');
    group.members.forEach((member) => {
      io.to(member.user.toString()).emit('memberLeftGroup', {
        groupId,
        userId: req.user._id,
      });
    });

    res.json({
      success: true,
      message: 'Left group successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
