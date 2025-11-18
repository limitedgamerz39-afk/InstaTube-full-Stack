import Post from '../models/Post.js';
import User from '../models/User.js';
import Comment from '../models/Comment.js';
import Notification from '../models/Notification.js';
import { uploadToStorage, deleteFromStorage } from '../config/minio.js';

// @desc    Create new post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res) => {
  try {
    const { title, description, caption, tags, location, visibility, madeForKids, allowComments, scheduledAt, videoLanguage, license, topicCategory, playlistName, paidPromotion, ageRestricted, allowEmbedding, locationLat, locationLng, category: rawCategory, derivedFrom, remixType, videoStartSec, videoEndSec, playbackRate } = req.body;
    const category = (rawCategory || 'image').toLowerCase();

    if (!['image', 'short', 'long'].includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category. Use image, short, or long.',
      });
    }

    const role = req.user.role;
    const canUploadLong = ['creator', 'business', 'admin'].includes(role);
    if (category === 'long' && !canUploadLong) {
      return res.status(403).json({
        success: false,
        message: 'Only creators, business, or admin can upload long videos',
      });
    }

    // Basic validations
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    if (title.length > 100) {
      return res.status(400).json({ success: false, message: 'Title cannot exceed 100 characters' });
    }
    if (description && description.length > 5000) {
      return res.status(400).json({ success: false, message: 'Description cannot exceed 5000 characters' });
    }

    // Get media files from request
    const mediaFiles = (req.files && req.files.media) ? req.files.media : (req.files ? req.files : (req.file ? [req.file] : []));

    if (!mediaFiles || mediaFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one image or video',
      });
    }

    // Validate files by category
    if (category === 'image') {
      for (const f of mediaFiles) {
        if (!f.mimetype.startsWith('image/')) {
          return res.status(400).json({ success: false, message: 'Only images allowed for image posts' });
        }
      }
    } else {
      if (mediaFiles.length !== 1) {
        return res.status(400).json({ success: false, message: 'Only one video allowed for shorts/long videos' });
      }
      if (!mediaFiles[0].mimetype.startsWith('video/')) {
        return res.status(400).json({ success: false, message: 'Only video files allowed for shorts/long videos' });
      }
    }

    console.log('📤 Uploading', mediaFiles.length, 'file(s) to MinIO...');

    // Upload all files in parallel
    const uploadResults = await Promise.all(
      mediaFiles.map((file) => uploadToStorage(file.buffer, 'instatube/posts', file.originalname))
    );

    let durationSec;
    if (category !== 'image') {
      durationSec = Math.round(uploadResults[0]?.duration || 0);
      
      // Note: MinIO doesn't provide video duration metadata like Cloudinary does
      // Duration validation is skipped for self-hosted MinIO setups
      // If duration is provided (e.g., from client or future metadata extraction), validate it
      if (durationSec > 0) {
        const limit = category === 'short' ? 60 : 3600;
        if (durationSec > limit) {
          const publicId = uploadResults[0]?.public_id;
          if (publicId) {
            try {
              await deleteFromStorage(publicId);
            } catch (e) {
              console.warn('MinIO cleanup failed:', e?.message);
            }
          }
          return res.status(400).json({
            success: false,
            message: category === 'short' ? 'Shorts must be 60 seconds or less' : 'Long videos must be 1 hour or less',
          });
        }
      } else {
        console.log('⚠️  Video duration not available - skipping duration validation (MinIO limitation)');
      }
    }

    const mediaArray = mediaFiles.map((file, idx) => ({
      url: uploadResults[idx].secure_url,
      type: file.mimetype.startsWith('video') ? 'video' : 'image',
    }));

    console.log('✅ Upload successful!');

    // Optional thumbnail upload
    let thumbnailUrl;
    try {
      const thumbFile = req.files?.thumbnail?.[0];
      if (thumbFile) {
        const thumbUpload = await uploadToStorage(thumbFile.buffer, 'instatube/thumbnails', thumbFile.originalname);
        thumbnailUrl = thumbUpload.secure_url;
      }
    } catch (e) {
      console.warn('Thumbnail upload failed:', e?.message);
    }

    // Extract hashtags from caption
    const hashtags = caption ? caption.match(/#[a-zA-Z0-9_]+/g) || [] : [];
    const cleanHashtags = hashtags.map(tag => tag.substring(1).toLowerCase());

    // Simple keyword extraction from caption and tags
    const keywordSet = new Set();
    if (caption) {
      caption
        .toLowerCase()
        .replace(/[^a-z0-9_\s#@]/g, ' ')
        .split(/\s+/)
        .filter(w => w && w.length > 3 && !w.startsWith('#') && !w.startsWith('@'))
        .slice(0, 20)
        .forEach(w => keywordSet.add(w));
    }
    if (tags) {
      tags.split(',').map(t => t.trim().toLowerCase()).forEach(t => keywordSet.add(t));
    }
    const keywords = Array.from(keywordSet);
    const visibilityVal = ['public', 'private', 'unlisted'].includes((visibility || 'public').toLowerCase())
      ? (visibility || 'public').toLowerCase()
      : 'public';
    const licenseVal = ((license || 'standard').toLowerCase() === 'creative_commons') ? 'creative_commons' : 'standard';
    const allowEmbeddingVal = typeof allowEmbedding === 'undefined' ? true : String(allowEmbedding) === 'true';
    const paidPromotionVal = !!paidPromotion;
    const ageRestrictedVal = !!ageRestricted;
    const locationLatNum = typeof locationLat !== 'undefined' && locationLat !== '' ? Number(locationLat) : undefined;
    const locationLngNum = typeof locationLng !== 'undefined' && locationLng !== '' ? Number(locationLng) : undefined;
    const scheduledDate = scheduledAt ? new Date(scheduledAt) : undefined;

    // Extract mentions from caption
    const mentions = caption ? caption.match(/@[a-zA-Z0-9_]+/g) || [] : [];
    const usernames = mentions.map(mention => mention.substring(1));
    const mentionedUsers = await User.find({ username: { $in: usernames } });

    // Create post
    const post = await Post.create({
      author: req.user._id,
      title: title?.trim() || '',
      description: description?.trim() || '',
      caption,
      media: mediaArray,
      mediaUrl: mediaArray[0].url, // For backward compatibility
      mediaType: mediaArray[0].type,
      thumbnailUrl: thumbnailUrl || undefined,
      tags: tags ? tags.split(',').map((tag) => tag.trim()) : [],
      hashtags: cleanHashtags,
      mentions: mentionedUsers.map(u => u._id),
      location: location || '',
      visibility: visibilityVal,
      madeForKids: !!madeForKids,
      allowComments: typeof allowComments === 'undefined' ? true : String(allowComments) === 'true',
      scheduledAt: scheduledDate,
      videoLanguage: videoLanguage || 'en',
      license: licenseVal,
      topicCategory: topicCategory || undefined,
      playlistName: playlistName || undefined,
      paidPromotion: paidPromotionVal,
      ageRestricted: ageRestrictedVal,
      allowEmbedding: allowEmbeddingVal,
      locationLat: locationLatNum,
      locationLng: locationLngNum,
      category,
      durationSec: category === 'image' ? undefined : durationSec,
      derivedFrom: derivedFrom || undefined,
      remixType: remixType || undefined,
      keywords,
      videoStartSec: typeof videoStartSec !== 'undefined' ? Number(videoStartSec) : undefined,
      videoEndSec: typeof videoEndSec !== 'undefined' ? Number(videoEndSec) : undefined,
      playbackRate: typeof playbackRate !== 'undefined' ? Number(playbackRate) : undefined,
    });

    // Add post to user's posts array
    await User.findByIdAndUpdate(req.user._id, {
      $push: { posts: post._id },
    });

    const populatedPost = await Post.findById(post._id).populate(
      'author',
      'username fullName avatar'
    );

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: populatedPost,
    });
  } catch (error) {
    console.error('❌ Post creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

// @desc    Get feed posts (from followed users)
// @route   GET /api/posts/feed
// @access  Private
export const getFeedPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const currentUser = await User.findById(req.user._id);

    // Fetch candidate posts (followed + own), lean for performance
    const posts = await Post.find({
      author: { $in: [...currentUser.following, currentUser._id] },
      isArchived: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username fullName avatar')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'username fullName avatar' },
        options: { sort: { createdAt: -1 }, limit: 2 },
      })
      .lean();

    // Compute simple engagement score (Instagram/YouTube-inspired)
    const now = Date.now();
    const halfLifeMs = 24 * 60 * 60 * 1000; // 24h recency decay
    const scored = posts.map((p) => {
      const likesCount = (p.likes || []).length;
      const commentsCount = (p.comments || []).length;
      const ageMs = Math.max(1, now - new Date(p.createdAt).getTime());
      const recencyBoost = Math.exp(-ageMs / halfLifeMs);
      const engagementScore = likesCount * 2 + commentsCount * 3;
      const score = engagementScore * 0.7 + recencyBoost * 100; // tuneable weights
      return { ...p, score };
    });

    // Sort by score desc
    scored.sort((a, b) => b.score - a.score);

    res.status(200).json({
      success: true,
      data: scored,
      pagination: {
        page,
        limit,
        total: scored.length,
        pages: Math.ceil(scored.length / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
export const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username fullName avatar')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username fullName avatar',
        },
        options: { sort: { createdAt: -1 } },
      })
      .populate({
        path: 'pinnedComment',
        populate: { path: 'author', select: 'username fullName avatar' },
      });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check if user is the author
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post',
      });
    }

    // Delete all comments associated with the post
    await Comment.deleteMany({ post: post._id });

    // Remove post from user's posts array
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { posts: post._id },
    });

    // Delete the post
    await post.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Like/Unlike post
// @route   POST /api/posts/:id/like
// @access  Private
export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const isLiked = post.likes.includes(req.user._id);

    if (isLiked) {
      // Unlike
      post.likes = post.likes.filter(
        (id) => id.toString() !== req.user._id.toString()
      );
      await post.save();

      res.status(200).json({
        success: true,
        message: 'Post unliked',
        isLiked: false,
        likesCount: post.likes.length,
      });
    } else {
      // Like
      post.likes.push(req.user._id);
      await post.save();

      // Create notification (if not own post)
      if (post.author.toString() !== req.user._id.toString()) {
        const notification = await Notification.create({
          recipient: post.author,
          sender: req.user._id,
          type: 'like',
          post: post._id,
          message: `${req.user.username} liked your post`,
        });

        const populatedNotification = await Notification.findById(
          notification._id
        ).populate('sender', 'username fullName avatar');

        // Emit socket event
        const io = req.app.get('io');
        io.to(post.author.toString()).emit('notification', populatedNotification);
      }

      // Emit real-time like update
      const io = req.app.get('io');
      io.emit('postLiked', {
        postId: post._id,
        userId: req.user._id,
        likesCount: post.likes.length,
      });

      res.status(200).json({
        success: true,
        message: 'Post liked',
        isLiked: true,
        likesCount: post.likes.length,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Add comment to post
// @route   POST /api/posts/:id/comment
// @access  Private
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required',
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Create comment
    const comment = await Comment.create({
      post: post._id,
      author: req.user._id,
      text,
    });

    // Add comment to post
    post.comments.push(comment._id);
    await post.save();

    const populatedComment = await Comment.findById(comment._id).populate(
      'author',
      'username fullName avatar'
    );

    // Notify post author (if not own post)
    if (post.author.toString() !== req.user._id.toString()) {
      const notification = await Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: 'comment',
        post: post._id,
        comment: comment._id,
        message: `${req.user.username} commented on your post`,
      });

      const populatedNotification = await Notification.findById(notification._id)
        .populate('sender', 'username fullName avatar');

      // Emit socket event
      const io = req.app.get('io');
      io.to(post.author.toString()).emit('notification', populatedNotification);
    }

    // Mentions notifications (notify mentioned users in this comment)
    const mentions = text ? text.match(/@[a-zA-Z0-9_]+/g) || [] : [];
    if (mentions.length) {
      const usernames = [...new Set(mentions.map((m) => m.substring(1)))];
      const mentionedUsers = await User.find({ username: { $in: usernames } }, '_id');
      const notifyUsers = mentionedUsers
        .map((u) => u._id.toString())
        .filter((uid) => uid !== req.user._id.toString()); // don't notify self

      for (const uid of notifyUsers) {
        const mentionNotification = await Notification.create({
          recipient: uid,
          sender: req.user._id,
          type: 'mention',
          post: post._id,
          comment: comment._id,
          message: `${req.user.username} mentioned you in a comment`,
        });

        const populatedMention = await Notification.findById(mentionNotification._id)
          .populate('sender', 'username fullName avatar');

        const io = req.app.get('io');
        io.to(uid).emit('notification', populatedMention);
      }
    }

    // Emit real-time comment
    const io = req.app.get('io');
    io.emit('newComment', {
      postId: post._id,
      comment: populatedComment,
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: populatedComment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all comments for a post
// @route   GET /api/posts/:id/comments
// @access  Public
export const getPostComments = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.id })
      .sort({ createdAt: -1 })
      .populate('author', 'username fullName avatar');

    res.status(200).json({
      success: true,
      data: comments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Save/Unsave post
// @route   POST /api/posts/:id/save
// @access  Private
export const savePost = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const isSaved = user.savedPosts.includes(req.params.id);

    if (isSaved) {
      // Unsave
      user.savedPosts = user.savedPosts.filter(
        (id) => id.toString() !== req.params.id
      );
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Post unsaved',
        isSaved: false,
      });
    } else {
      // Save
      user.savedPosts.push(req.params.id);
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Post saved',
        isSaved: true,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get saved posts
// @route   GET /api/posts/saved
// @access  Private
export const getSavedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedPosts',
      populate: {
        path: 'author',
        select: 'username fullName avatar',
      },
      options: { sort: { createdAt: -1 } },
    });

    res.status(200).json({
      success: true,
      data: user.savedPosts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Archive/Unarchive post
// @route   POST /api/posts/:id/archive
// @access  Private
export const archivePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    post.isArchived = !post.isArchived;
    await post.save();

    res.status(200).json({
      success: true,
      message: post.isArchived ? 'Post archived' : 'Post unarchived',
      isArchived: post.isArchived,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete comment
// @route   DELETE /api/posts/:postId/comments/:commentId
// @access  Private
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    // Check if user is the author
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment',
      });
    }

    // Remove comment from post
    await Post.findByIdAndUpdate(req.params.postId, {
      $pull: { comments: comment._id },
    });

    await comment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Reply to a comment (nested threads)
export const replyToComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const parent = await Comment.findById(req.params.commentId);
    if (!parent || parent.post.toString() !== post._id.toString()) {
      return res.status(400).json({ success: false, message: 'Invalid parent comment' });
    }

    const comment = await Comment.create({
      post: post._id,
      author: req.user._id,
      text,
      parentComment: parent._id,
    });

    // Add reply to post comments array (flat storage; UI will thread via parentComment)
    post.comments.push(comment._id);
    await post.save();

    const populatedComment = await Comment.findById(comment._id).populate('author', 'username fullName avatar');

    // Emit real-time comment
    const io = req.app.get('io');
    io.emit('newComment', { postId: post._id, comment: populatedComment });

    res.status(201).json({ success: true, message: 'Reply added successfully', data: populatedComment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Pin a comment on a post (author only)
export const pinComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to pin comments' });
    }

    const comment = await Comment.findById(req.params.commentId);
    if (!comment || comment.post.toString() !== post._id.toString()) {
      return res.status(400).json({ success: false, message: 'Invalid comment for this post' });
    }

    post.pinnedComment = comment._id;
    await post.save();

    const populatedPinned = await Comment.findById(comment._id).populate('author', 'username fullName avatar');

    // Emit real-time pin update
    const io = req.app.get('io');
    io.emit('commentPinned', { postId: post._id, comment: populatedPinned });

    res.status(200).json({ success: true, message: 'Comment pinned', data: populatedPinned });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Unpin comment
export const unpinComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to unpin comments' });
    }

    post.pinnedComment = null;
    await post.save();

    const io = req.app.get('io');
    io.emit('commentPinned', { postId: post._id, comment: null });

    res.status(200).json({ success: true, message: 'Comment unpinned' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
