import Note from '../models/Note.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

// @desc    Create note
// @route   POST /api/notes
// @access  Private
export const createNote = async (req, res) => {
  try {
    const { content, emoji, visibility } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Note content is required' });
    }

    if (content.length > 60) {
      return res.status(400).json({ success: false, message: 'Note cannot exceed 60 characters' });
    }

    await Note.deleteMany({ user: req.user._id });

    const note = await Note.create({
      user: req.user._id,
      content,
      emoji: emoji || '',
      visibility: visibility || 'subscriber',
    });

    const populatedNote = await Note.findById(note._id)
      .populate('user', 'username profilePicture fullName verified');

    res.status(201).json({ success: true, note: populatedNote });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ success: false, message: 'Failed to create note' });
  }
};

// @desc    Get user's note
// @route   GET /api/notes/user/:userId
// @access  Public
export const getUserNotes = async (req, res) => {
  try {
    const note = await Note.findOne({
      user: req.params.userId,
      expiresAt: { $gt: new Date() },
    }).populate('user', 'username profilePicture fullName verified');

    if (!note) {
      return res.json({ success: true, note: null });
    }

    res.json({ success: true, note });
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch note' });
  }
};

// @desc    Get notes from subscribed
// @route   GET /api/notes/subscribed
// @access  Private
export const getsubscribedNotes = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const notes = await Note.find({
      user: { $in: user.subscribed },
      expiresAt: { $gt: new Date() },
    })
      .populate('user', 'username profilePicture fullName verified')
      .sort({ createdAt: -1 });

    res.json({ success: true, notes });
  } catch (error) {
    console.error('Error fetching subscribed notes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notes' });
  }
};

// @desc    Delete note
// @route   DELETE /api/notes/:id
// @access  Private
export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    if (note.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await note.deleteOne();

    res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ success: false, message: 'Failed to delete note' });
  }
};

// @desc    Like note
// @route   POST /api/notes/:id/like
// @access  Private
export const likeNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    const alreadyLiked = note.likes.includes(req.user._id);

    if (alreadyLiked) {
      note.likes = note.likes.filter((id) => id.toString() !== req.user._id.toString());
    } else {
      note.likes.push(req.user._id);

      if (note.user.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: note.user,
          sender: req.user._id,
          type: 'like',
          message: `${req.user.username} liked your note`,
          link: `/notes/${note._id}`,
        });

        const io = req.app.get('io');
        if (io) {
          io.to(note.user.toString()).emit('newNotification', {
            message: `${req.user.username} liked your note`,
            link: `/notes/${note._id}`,
          });
        }
      }
    }

    await note.save();

    res.json({ success: true, likes: note.likes.length, liked: !alreadyLiked });
  } catch (error) {
    console.error('Error liking note:', error);
    res.status(500).json({ success: false, message: 'Failed to like note' });
  }
};

// @desc    Reply to note
// @route   POST /api/notes/:id/reply
// @access  Private
export const replyToNote = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Reply content is required' });
    }

    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    note.replies.push({
      user: req.user._id,
      content,
    });

    await note.save();

    if (note.user.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: note.user,
        sender: req.user._id,
        type: 'comment',
        message: `${req.user.username} replied to your note`,
        link: `/notes/${note._id}`,
      });
    }

    const populatedNote = await Note.findById(note._id)
      .populate('user', 'username profilePicture verified')
      .populate('replies.user', 'username profilePicture verified');

    res.json({ success: true, note: populatedNote });
  } catch (error) {
    console.error('Error replying to note:', error);
    res.status(500).json({ success: false, message: 'Failed to reply' });
  }
};
