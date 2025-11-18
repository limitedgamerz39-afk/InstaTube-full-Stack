import CommunityPost from '../models/CommunityPost.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { uploadToStorage } from '../config/minio.js';

// @desc    Create community post
// @route   POST /api/community
// @access  Private
export const createCommunityPost = async (req, res) => {
  try {
    const { content, type, pollQuestion, pollOptions, visibility } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }

    const postData = {
      creator: req.user._id,
      content,
      type: type || 'text',
      visibility: visibility || 'public',
    };

    if (req.file) {
      const uploadResult = await uploadToStorage(req.file.buffer, 'instatube/community', req.file.originalname);
      postData.media = {
        url: uploadResult.secure_url,
        type: req.file.mimetype.startsWith('image/') ? 'image' : 'video',
      };
      postData.type = postData.media.type;
    }

    if (type === 'poll' && pollQuestion && pollOptions) {
      const options = JSON.parse(pollOptions);
      postData.type = 'poll';
      postData.poll = {
        question: pollQuestion,
        options: options.map((opt) => ({ text: opt, votes: [] })),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };
    }

    const communityPost = await CommunityPost.create(postData);

    const populatedPost = await CommunityPost.findById(communityPost._id)
      .populate('creator', 'username profilePicture fullName verified');

    const user = await User.findById(req.user._id);
    if (user.followers && user.followers.length > 0) {
      const notifications = user.followers.map((followerId) => ({
        recipient: followerId,
        sender: req.user._id,
        type: 'community_post',
        message: `${req.user.username} posted in Community`,
        link: `/community/${communityPost._id}`,
      }));

      await Notification.insertMany(notifications);

      const io = req.app.get('io');
      if (io) {
        user.followers.forEach((followerId) => {
          io.to(followerId.toString()).emit('newNotification', {
            message: `${req.user.username} posted in Community`,
            link: `/community/${communityPost._id}`,
          });
        });
      }
    }

    res.status(201).json({ success: true, communityPost: populatedPost });
  } catch (error) {
    console.error('Error creating community post:', error);
    res.status(500).json({ success: false, message: 'Failed to create community post' });
  }
};

// @desc    Get user's community posts
// @route   GET /api/community/user/:userId
// @access  Public
export const getUserCommunityPosts = async (req, res) => {
  try {
    const posts = await CommunityPost.find({ creator: req.params.userId })
      .populate('creator', 'username profilePicture fullName verified')
      .sort({ pinned: -1, createdAt: -1 });

    res.json({ success: true, posts });
  } catch (error) {
    console.error('Error fetching community posts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch posts' });
  }
};

// @desc    Get community post
// @route   GET /api/community/:id
// @access  Public
export const getCommunityPost = async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id)
      .populate('creator', 'username profilePicture fullName verified')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'username profilePicture verified' },
      });

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    res.json({ success: true, post });
  } catch (error) {
    console.error('Error fetching community post:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch post' });
  }
};

// @desc    Update community post
// @route   PUT /api/community/:id
// @access  Private
export const updateCommunityPost = async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { content } = req.body;
    if (content) post.content = content;

    await post.save();

    res.json({ success: true, post });
  } catch (error) {
    console.error('Error updating community post:', error);
    res.status(500).json({ success: false, message: 'Failed to update post' });
  }
};

// @desc    Delete community post
// @route   DELETE /api/community/:id
// @access  Private
export const deleteCommunityPost = async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await post.deleteOne();

    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    console.error('Error deleting community post:', error);
    res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
};

// @desc    Like community post
// @route   POST /api/community/:id/like
// @access  Private
export const likeCommunityPost = async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const alreadyLiked = post.likes.includes(req.user._id);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== req.user._id.toString());
    } else {
      post.likes.push(req.user._id);

      if (post.creator.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: post.creator,
          sender: req.user._id,
          type: 'like',
          message: `${req.user.username} liked your community post`,
          link: `/community/${post._id}`,
        });

        const io = req.app.get('io');
        if (io) {
          io.to(post.creator.toString()).emit('newNotification', {
            message: `${req.user.username} liked your community post`,
            link: `/community/${post._id}`,
          });
        }
      }
    }

    await post.save();

    res.json({ success: true, likes: post.likes.length, liked: !alreadyLiked });
  } catch (error) {
    console.error('Error liking community post:', error);
    res.status(500).json({ success: false, message: 'Failed to like post' });
  }
};

// @desc    Add comment to community post
// @route   POST /api/community/:id/comment
// @access  Private
export const addCommunityComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const post = await CommunityPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comment = await Comment.create({
      author: req.user._id,
      post: post._id,
      text,
    });

    post.comments.push(comment._id);
    await post.save();

    if (post.creator.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.creator,
        sender: req.user._id,
        type: 'comment',
        message: `${req.user.username} commented on your community post`,
        link: `/community/${post._id}`,
      });
    }

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'username profilePicture verified');

    res.status(201).json({ success: true, comment: populatedComment });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
};

// @desc    Vote on poll
// @route   POST /api/community/:id/vote
// @access  Private
export const votePoll = async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const post = await CommunityPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.type !== 'poll') {
      return res.status(400).json({ success: false, message: 'This is not a poll' });
    }

    if (new Date() > post.poll.expiresAt) {
      return res.status(400).json({ success: false, message: 'Poll has expired' });
    }

    const alreadyVoted = post.poll.options.some((opt) =>
      opt.votes.includes(req.user._id)
    );

    if (alreadyVoted) {
      post.poll.options.forEach((opt) => {
        opt.votes = opt.votes.filter((id) => id.toString() !== req.user._id.toString());
      });
    }

    post.poll.options[optionIndex].votes.push(req.user._id);
    await post.save();

    res.json({ success: true, poll: post.poll });
  } catch (error) {
    console.error('Error voting on poll:', error);
    res.status(500).json({ success: false, message: 'Failed to vote' });
  }
};

// @desc    Pin community post
// @route   POST /api/community/:id/pin
// @access  Private
export const pinCommunityPost = async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    post.pinned = !post.pinned;
    await post.save();

    res.json({ success: true, pinned: post.pinned });
  } catch (error) {
    console.error('Error pinning post:', error);
    res.status(500).json({ success: false, message: 'Failed to pin post' });
  }
};
