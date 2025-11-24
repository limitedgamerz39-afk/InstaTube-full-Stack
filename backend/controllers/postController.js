import Post from '../models/Post.js';
import User from '../models/User.js';
import Comment from '../models/Comment.js';
import Notification from '../models/Notification.js';
import Audio from '../models/Audio.js';
import { uploadToStorage, deleteFromStorage } from '../config/minio.js';
import redisClient from '../config/redis.js';
import { uploadMultiple } from '../middleware/uploadMiddleware.js';
import { generateSafeFilename, validateFileType, scanForMaliciousContent, stripExifData } from '../utils/fileProcessing.js';
import { logSecurityEvent } from '../services/securityService.js';
import { cacheWithParams } from '../middleware/cacheMiddleware.js';
import { checkAndAwardAchievements } from '../services/achievementService.js';

// @desc    Create new post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res) => {
  try {
    const { title, description, caption, tags, location, visibility, madeForKids, allowComments, scheduledAt, videoLanguage, license, topicCategory, playlistName, paidPromotion, ageRestricted, contentWarnings, customWarning, allowEmbedding, locationLat, locationLng, category: rawCategory, derivedFrom, remixType, videoStartSec, videoEndSec, playbackRate, filter, beautyFilter, productTags, isBusinessProfile, shoppingCartEnabled, checkInLocation, highlightTitle, igtvTitle, audioId, chapters } = req.body;
    const category = (rawCategory || 'image').toLowerCase();

    if (!['image', 'short', 'long'].includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category',
      });
    }

    // Validate files
    if (!req.files || !req.files.media || req.files.media.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one media file',
      });
    }

    // Process and validate uploaded files
    const processedFiles = [];
    for (const file of req.files.media) {
      // Validate file content
      const isValidContent = validateFileType(file.buffer, file.mimetype);
      if (!isValidContent) {
        // Log security event
        await logSecurityEvent('suspicious_file_upload', 'File content does not match file type', 'high', { mimeType: file.mimetype, originalName: file.originalname }, req);
        return res.status(400).json({
          success: false,
          message: 'File content does not match file type.',
        });
      }

      // Scan for malicious content
      const scanResult = scanForMaliciousContent(file.buffer);
      if (!scanResult.isSafe) {
        // Log security event
        await logSecurityEvent('malicious_content_detected', scanResult.reason, 'critical', { mimeType: file.mimetype, originalName: file.originalname }, req);
        return res.status(400).json({
          success: false,
          message: `Security scan failed: ${scanResult.reason}`,
        });
      }

      // Strip EXIF data for images
      if (file.mimetype.startsWith('image/')) {
        file.buffer = await stripExifData(file.buffer);
      }

      processedFiles.push(file);
    }

    // Upload media files to storage
    const mediaUrls = [];
    for (const file of processedFiles) {
      const safeFilename = generateSafeFilename(file.originalname);
      const result = await uploadToStorage(file.buffer, 'friendflix/posts', safeFilename);
      mediaUrls.push({
        url: result.secure_url,
        type: file.mimetype.startsWith('video') ? 'video' : 'image',
      });
    }

    // Handle thumbnail if provided
    let thumbnailUrl = null;
    if (req.files.thumbnail && req.files.thumbnail.length > 0) {
      // Process thumbnail file
      const thumbnailFile = req.files.thumbnail[0];
      
      // Validate thumbnail content
      const isValidContent = validateFileType(thumbnailFile.buffer, thumbnailFile.mimetype);
      if (!isValidContent) {
        // Log security event
        await logSecurityEvent('suspicious_file_upload', 'Thumbnail content does not match file type', 'high', { mimeType: thumbnailFile.mimetype, originalName: thumbnailFile.originalname }, req);
        return res.status(400).json({
          success: false,
          message: 'Thumbnail content does not match file type.',
        });
      }

      // Scan for malicious content
      const scanResult = scanForMaliciousContent(thumbnailFile.buffer);
      if (!scanResult.isSafe) {
        // Log security event
        await logSecurityEvent('malicious_content_detected', scanResult.reason, 'critical', { mimeType: thumbnailFile.mimetype, originalName: thumbnailFile.originalname }, req);
        return res.status(400).json({
          success: false,
          message: `Security scan failed for thumbnail: ${scanResult.reason}`,
        });
      }

      // Strip EXIF data for thumbnail images
      if (thumbnailFile.mimetype.startsWith('image/')) {
        thumbnailFile.buffer = await stripExifData(thumbnailFile.buffer);
      }

      const safeThumbnailName = generateSafeFilename(thumbnailFile.originalname);
      const thumbnailResult = await uploadToStorage(thumbnailFile.buffer, 'friendflix/thumbnails', safeThumbnailName);
      thumbnailUrl = thumbnailResult.secure_url;
    }

    // Process location data
    let locationData = {};
    if (location) {
      locationData.name = location;
      if (locationLat) locationData.lat = Number(locationLat);
      if (locationLng) locationData.lng = Number(locationLng);
    }

    // Process check-in location data
    let checkInLocationData = {};
    if (checkInLocation) {
      checkInLocationData.name = checkInLocation;
      if (locationLat) checkInLocationData.lat = Number(locationLat);
      if (locationLng) checkInLocationData.lng = Number(locationLng);
    }

    // Calculate duration for videos
    let durationSec = undefined;
    if (category !== 'image' && mediaUrls.length > 0 && mediaUrls[0].type === 'video') {
      // In a real implementation, you would extract duration from the video file
      // For now, we'll set a default duration
      durationSec = category === 'short' ? 30 : 300;
    }

    // Check if audioId is provided and valid
    let audio = null;
    if (audioId) {
      try {
        audio = await Audio.findById(audioId);
        if (!audio) {
          console.warn('Invalid audio ID provided:', audioId);
        }
      } catch (audioError) {
        console.error('Error fetching audio:', audioError);
      }
    }

    // Process chapters if provided
    let processedChapters = [];
    if (chapters) {
      try {
        const chapterArray = Array.isArray(chapters) ? chapters : JSON.parse(chapters);
        if (Array.isArray(chapterArray)) {
          processedChapters = chapterArray.map(chapter => ({
            timestamp: Number(chapter.timestamp),
            title: String(chapter.title).trim()
          })).filter(chapter => 
            !isNaN(chapter.timestamp) && 
            chapter.timestamp >= 0 && 
            chapter.title && 
            chapter.title.length > 0 && 
            chapter.title.length <= 100
          );
        }
      } catch (parseError) {
        console.warn('Error parsing chapters:', parseError);
      }
    }

    // Create post
    const post = await Post.create({
      author: req.user._id,
      title: title || '',
      description: description || '',
      caption: caption || '',
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      location: locationData,
      visibility: visibility || 'public',
      madeForKids: madeForKids === 'true',
      allowComments: allowComments !== 'false',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      videoLanguage: videoLanguage || 'en',
      license: license || 'standard',
      topicCategory: topicCategory || '',
      paidPromotion: paidPromotion === 'true',
      ageRestricted: ageRestricted === 'true',
      contentWarnings: contentWarnings || [],
      customWarning: customWarning || '',
      allowEmbedding: allowEmbedding !== 'false',
      category,
      media: mediaUrls,
      mediaUrl: mediaUrls[0]?.url, // For backward compatibility
      mediaType: mediaUrls[0]?.type, // For backward compatibility
      thumbnail: thumbnailUrl, // Add thumbnail URL
      durationSec,
      derivedFrom: derivedFrom || undefined,
      remixType: remixType || undefined,
      keywords: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      videoStartSec: typeof videoStartSec !== 'undefined' ? Number(videoStartSec) : undefined,
      videoEndSec: typeof videoEndSec !== 'undefined' ? Number(videoEndSec) : undefined,
      playbackRate: typeof playbackRate !== 'undefined' ? Number(playbackRate) : undefined,
      // Instagram-like features
      filter: filter || 'normal',
      beautyFilter: beautyFilter || 'none',
      productTags: productTags ? JSON.parse(productTags) : [],
      isBusinessProfile: isBusinessProfile === 'true',
      shoppingCartEnabled: shoppingCartEnabled === 'true',
      checkInLocation: checkInLocationData,
      highlightTitle: highlightTitle || '',
      igtvTitle: igtvTitle || '',
      // Video chapters
      chapters: processedChapters,
      // Audio association
      audio: audio ? audio._id : undefined
    });

    // Add post to user's posts array
    await User.findByIdAndUpdate(req.user._id, {
      $push: { posts: post._id },
    });

    // Populate author details
    await post.populate('author', 'username fullName avatar isVerified isCreator');
    
    // Populate audio details if audio is associated
    if (audio) {
      await post.populate('audio', 'title artist');
    }

    // Create notification for followers (except for scheduled posts)
    if (!scheduledAt) {
      const followers = await User.find({ subscribedTo: req.user._id }).select('_id');
      const followerIds = followers.map(follower => follower._id);

      // Create notifications for followers
      const notifications = followerIds.map(followerId => ({
        recipient: followerId,
        sender: req.user._id,
        type: 'new_post',
        post: post._id,
        message: `${req.user.username} just posted a new ${category}`,
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
        
        // Emit socket event to notify followers
        const io = req.app.get('io');
        followerIds.forEach(followerId => {
          io.to(followerId.toString()).emit('newNotification', {
            message: `${req.user.username} just posted a new ${category}`,
            type: 'new_post',
            sender: req.user._id,
            post: post._id,
          });
        });
      }
    }

    // Check and award achievements for post creation
    try {
      await checkAndAwardAchievements(req.user._id, 'post_created', { 
        postId: post._id, 
        category: post.category 
      });
    } catch (achievementError) {
      console.error('Error checking achievements:', achievementError);
    }

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: post,
    });
  } catch (error) {
    console.error('❌ Create post error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get feed posts (from subscribed users)
// @route   GET /api/posts/feed
// @access  Private
export const getFeedPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const currentUser = await User.findById(req.user._id);

    // Count total posts for pagination metadata
    const total = await Post.countDocuments({
      author: { $in: [...currentUser.subscribed, currentUser._id] },
      isArchived: { $ne: true },
    });

    // Fetch candidate posts (subscribed + own), lean for performance
    // Add index hint for better performance
    const posts = await Post.find({
      author: { $in: [...currentUser.subscribed, currentUser._id] },
      isArchived: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username fullName avatar subscriber')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'username fullName avatar' },
        options: { sort: { createdAt: -1 }, limit: 2 },
      })
      .populate('audio') // Populate audio field
      .lean()
      .hint({ author: 1, createdAt: -1 }); // Index hint for better performance

    // Compute simple engagement score (Instagram/friendflix-inspired)
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
        total,
        pages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit)
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
      .populate('author', 'username fullName avatar subscriber')
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
      })
      .populate('audio') // Populate audio field
      .lean(); // Add lean() for better performance

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Increment view count
    post.views = (post.views || 0) + 1;
    await Post.findByIdAndUpdate(req.params.id, { views: post.views });

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

    // Check if user already liked the post
    const alreadyLiked = post.likes.some(
      (like) => like.toString() === req.user._id.toString()
    );

    if (alreadyLiked) {
      // Unlike the post
      post.likes = post.likes.filter(
        (like) => like.toString() !== req.user._id.toString()
      );
      
      // Decrement user's likes given count
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { likesGivenCount: -1 }
      });
    } else {
      // Like the post
      post.likes.push(req.user._id);

      // Create notification if user is not liking their own post
      if (post.author.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: post.author,
          sender: req.user._id,
          type: 'like',
          post: post._id,
          message: `${req.user.username} liked your post`,
        });
      }
      
      // Increment user's likes given count for achievements
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { likesGivenCount: 1 }
      });
      
      // Check and award achievements for liking
      try {
        await checkAndAwardAchievements(req.user._id, 'liked');
      } catch (achievementError) {
        console.error('Error checking achievements:', achievementError);
      }
    }

    await post.save();

    res.status(200).json({
      success: true,
      message: alreadyLiked ? 'Post unliked' : 'Post liked',
      data: {
        likes: post.likes.length,
        isLiked: !alreadyLiked,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Comment on post
// @route   POST /api/posts/:id/comment
// @access  Private
export const commentOnPost = async (req, res) => {
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

    const comment = await Comment.create({
      text: text.trim(),
      author: req.user._id,
      post: post._id,
    });

    // Add comment to post
    post.comments.push(comment._id);
    await post.save();

    // Populate comment with author info
    const populatedComment = await Comment.findById(comment._id).populate(
      'author',
      'username fullName avatar'
    );

    // Create notification if user is not commenting on their own post
    if (post.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: 'comment',
        post: post._id,
        comment: comment._id,
        message: `${req.user.username} commented on your post`,
      });
    }

    // Update user's comment count for achievements
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { commentsCount: 1 }
    });

    // Check and award achievements for commenting
    try {
      await checkAndAwardAchievements(req.user._id, 'commented');
    } catch (achievementError) {
      console.error('Error checking achievements:', achievementError);
    }

    res.status(201).json({
      success: true,
      message: 'Comment added',
      data: populatedComment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete comment
// @route   DELETE /api/posts/comment/:id
// @access  Private
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    // Check if user is the author of the comment
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment',
      });
    }

    // Remove comment from post
    await Post.findByIdAndUpdate(comment.post, {
      $pull: { comments: comment._id },
    });

    // Delete the comment
    await comment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Comment deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get trending posts
// @route   GET /api/posts/trending
// @access  Public
export const getTrendingPosts = async (req, res) => {
  try {
    // Try to get cached data
    try {
      const cachedPosts = await redisClient.get('trending:posts');
      if (cachedPosts) {
        console.log('✅ Cache hit for trending posts');
        return res.status(200).json({
          success: true,
          data: JSON.parse(cachedPosts),
          fromCache: true
        });
      }
    } catch (cacheError) {
      console.error('Cache read error:', cacheError);
    }
    
    // Get posts from last 7 days with high engagement
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const posts = await Post.find({
      createdAt: { $gte: oneWeekAgo },
      isArchived: { $ne: true },
    })
      .sort({ likes: -1, comments: -1 })
      .limit(20)
      .populate('author', 'username fullName avatar');

    // Cache the trending posts for 5 minutes
    try {
      await redisClient.setEx('trending:posts', 300, JSON.stringify(posts));
    } catch (cacheError) {
      console.error('Cache write error:', cacheError);
    }

    res.status(200).json({
      success: true,
      data: posts,
      fromCache: false
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get long videos
// @route   GET /api/posts/videos/long
// @access  Public
export const getLongVideos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Try to get cached data
    const cacheKey = `long:videos:${page}:${limit}`;
    try {
      const cachedPosts = await redisClient.get(cacheKey);
      if (cachedPosts) {
        console.log(`✅ Cache hit for long videos (page: ${page})`);
        return res.status(200).json({
          success: true,
          data: JSON.parse(cachedPosts),
          fromCache: true
        });
      }
    } catch (cacheError) {
      console.error('Cache read error:', cacheError);
    }

    const posts = await Post.find({
      category: 'long',
      isArchived: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username fullName avatar')
      .populate('audio'); // Populate audio field

    // Cache the long videos for 5 minutes
    try {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(posts));
    } catch (cacheError) {
      console.error('Cache write error:', cacheError);
    }

    res.status(200).json({
      success: true,
      data: posts,
      fromCache: false
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get short videos
// @route   GET /api/posts/videos/short
// @access  Public
export const getShortVideos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Try to get cached data
    const cacheKey = `short:videos:${page}:${limit}`;
    try {
      const cachedPosts = await redisClient.get(cacheKey);
      if (cachedPosts) {
        console.log(`✅ Cache hit for short videos (page: ${page})`);
        return res.status(200).json({
          success: true,
          data: JSON.parse(cachedPosts),
          fromCache: true
        });
      }
    } catch (cacheError) {
      console.error('Cache read error:', cacheError);
    }

    const posts = await Post.find({
      category: 'short',
      isArchived: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username fullName avatar')
      .populate('audio'); // Populate audio field

    // Cache the short videos for 5 minutes
    try {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(posts));
    } catch (cacheError) {
      console.error('Cache write error:', cacheError);
    }

    res.status(200).json({
      success: true,
      data: posts,
      fromCache: false
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get post comments
// @route   GET /api/posts/:id/comments
// @access  Public
export const getPostComments = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username fullName avatar',
        },
        options: { sort: { createdAt: -1 } },
      });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    res.status(200).json({
      success: true,
      data: post.comments,
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
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const user = await User.findById(req.user._id);

    // Check if user already saved the post
    const isSaved = user.savedPosts.some(
      (savedPost) => savedPost.toString() === req.params.id
    );

    if (isSaved) {
      // Unsave the post
      user.savedPosts = user.savedPosts.filter(
        (savedPost) => savedPost.toString() !== req.params.id
      );
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Post unsaved',
        isSaved: false,
      });
    } else {
      // Save the post
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
    }).populate({
      path: 'savedPosts',
      populate: {
        path: 'audio',
      },
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

    // Check if user is the author
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to archive this post',
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

// @desc    Increment post view count
// @route   POST /api/posts/:id/view
// @access  Public
export const incrementViewCount = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Increment view count
    post.views = (post.views || 0) + 1;
    await post.save();

    // Update user's view count for achievements (if user is logged in)
    if (req.user && req.user._id) {
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { viewsCount: 1 }
      });

      // Check and award achievements for viewing
      try {
        await checkAndAwardAchievements(req.user._id, 'video_watched');
      } catch (achievementError) {
        console.error('Error checking achievements:', achievementError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'View count incremented',
      data: {
        views: post.views
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Reply to comment
// @route   POST /api/posts/:postId/comments/:commentId/reply
// @access  Private
export const replyToComment = async (req, res) => {
  try {
    const { text } = req.body;
    const { postId, commentId } = req.params;

    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Reply text is required',
      });
    }

    const post = await Post.findById(postId);
    const parentComment = await Comment.findById(commentId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    if (!parentComment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    const reply = await Comment.create({
      text: text.trim(),
      author: req.user._id,
      post: postId,
      parentComment: commentId,
    });

    // Add reply to post comments
    post.comments.push(reply._id);
    await post.save();

    // Populate reply with author info
    const populatedReply = await Comment.findById(reply._id).populate(
      'author',
      'username fullName avatar'
    );

    // Create notification for parent comment author (if not replying to own comment)
    if (parentComment.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        user: parentComment.author,
        sender: req.user._id,
        type: 'reply',
        post: postId,
        comment: reply._id,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Reply added',
      data: populatedReply,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Pin comment to post
// @route   POST /api/posts/:postId/pin/:commentId
// @access  Private
export const pinComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    const post = await Post.findById(postId);
    const comment = await Comment.findById(commentId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    // Check if user is the author of the post
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to pin comment on this post',
      });
    }

    post.pinnedComment = commentId;
    await post.save();

    // Populate comment with author info
    const populatedComment = await Comment.findById(commentId).populate(
      'author',
      'username fullName avatar'
    );

    res.status(200).json({
      success: true,
      message: 'Comment pinned',
      data: populatedComment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Unpin comment from post
// @route   POST /api/posts/:postId/unpin
// @access  Private
export const unpinComment = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check if user is the author of the post
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to unpin comment from this post',
      });
    }

    post.pinnedComment = null;
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Comment unpinned',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Export the commentOnPost function as addComment to match the import
export const addComment = commentOnPost;

// @desc    Add chapters to a post
// @route   POST /api/posts/:id/chapters
// @access  Private
export const addChapters = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { chapters } = req.body;
    const userId = req.user._id;

    // Validate chapters data
    if (!chapters || !Array.isArray(chapters) || chapters.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Chapters data is required and must be a non-empty array',
      });
    }

    // Validate each chapter
    const processedChapters = chapters.map(chapter => ({
      timestamp: Number(chapter.timestamp),
      title: String(chapter.title).trim()
    })).filter(chapter => 
      !isNaN(chapter.timestamp) && 
      chapter.timestamp >= 0 && 
      chapter.title && 
      chapter.title.length > 0 && 
      chapter.title.length <= 100
    );

    if (processedChapters.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid chapters provided',
      });
    }

    // Find the post
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check if user is the author of the post
    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add chapters to this post',
      });
    }

    // Update post with chapters
    post.chapters = processedChapters;
    await post.save();

    // Populate author details
    await post.populate('author', 'username fullName avatar isVerified isCreator');

    res.status(200).json({
      success: true,
      message: 'Chapters added successfully',
      data: post,
    });
  } catch (error) {
    console.error('❌ Add chapters error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update chapters for a post
// @route   PUT /api/posts/:id/chapters
// @access  Private
export const updateChapters = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { chapters } = req.body;
    const userId = req.user._id;

    // Validate chapters data
    if (!chapters || !Array.isArray(chapters)) {
      return res.status(400).json({
        success: false,
        message: 'Chapters data is required and must be an array',
      });
    }

    // Validate each chapter (if chapters array is not empty)
    let processedChapters = [];
    if (chapters.length > 0) {
      processedChapters = chapters.map(chapter => ({
        timestamp: Number(chapter.timestamp),
        title: String(chapter.title).trim()
      })).filter(chapter => 
        !isNaN(chapter.timestamp) && 
        chapter.timestamp >= 0 && 
        chapter.title && 
        chapter.title.length > 0 && 
        chapter.title.length <= 100
      );

      if (processedChapters.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid chapters provided',
        });
      }
    }

    // Find the post
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check if user is the author of the post
    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update chapters for this post',
      });
    }

    // Update post with chapters
    post.chapters = processedChapters;
    await post.save();

    // Populate author details
    await post.populate('author', 'username fullName avatar isVerified isCreator');

    res.status(200).json({
      success: true,
      message: 'Chapters updated successfully',
      data: post,
    });
  } catch (error) {
    console.error('❌ Update chapters error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete chapters from a post
// @route   DELETE /api/posts/:id/chapters
// @access  Private
export const deleteChapters = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user._id;

    // Find the post
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check if user is the author of the post
    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete chapters from this post',
      });
    }

    // Remove chapters from post
    post.chapters = [];
    await post.save();

    // Populate author details
    await post.populate('author', 'username fullName avatar isVerified isCreator');

    res.status(200).json({
      success: true,
      message: 'Chapters deleted successfully',
      data: post,
    });
  } catch (error) {
    console.error('❌ Delete chapters error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update video editing features (trimming, playback rate)
// @route   PUT /api/posts/:id/video-editing
// @access  Private
export const updateVideoEditing = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { videoStartSec, videoEndSec, playbackRate } = req.body;
    const userId = req.user._id;

    // Find the post
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check if user is the author of the post
    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update video editing features for this post',
      });
    }

    // Validate and update video editing features
    if (typeof videoStartSec !== 'undefined') {
      const startSec = Number(videoStartSec);
      if (isNaN(startSec) || startSec < 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid video start time',
        });
      }
      post.videoStartSec = startSec;
    }

    if (typeof videoEndSec !== 'undefined') {
      const endSec = Number(videoEndSec);
      if (isNaN(endSec) || endSec < 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid video end time',
        });
      }
      post.videoEndSec = endSec;
    }

    if (typeof playbackRate !== 'undefined') {
      const rate = Number(playbackRate);
      if (isNaN(rate) || rate <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid playback rate',
        });
      }
      post.playbackRate = rate;
    }

    await post.save();

    // Populate author details
    await post.populate('author', 'username fullName avatar isVerified isCreator');

    res.status(200).json({
      success: true,
      message: 'Video editing features updated successfully',
      data: post,
    });
  } catch (error) {
    console.error('❌ Update video editing error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset video editing features
// @route   DELETE /api/posts/:id/video-editing
// @access  Private
export const resetVideoEditing = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user._id;

    // Find the post
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check if user is the author of the post
    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reset video editing features for this post',
      });
    }

    // Reset video editing features
    post.videoStartSec = undefined;
    post.videoEndSec = undefined;
    post.playbackRate = undefined;

    await post.save();

    // Populate author details
    await post.populate('author', 'username fullName avatar isVerified isCreator');

    res.status(200).json({
      success: true,
      message: 'Video editing features reset successfully',
      data: post,
    });
  } catch (error) {
    console.error('❌ Reset video editing error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update age restrictions and content warnings
// @route   PUT /api/posts/:id/restrictions
// @access  Private
export const updatePostRestrictions = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { ageRestricted, contentWarnings, customWarning } = req.body;
    const userId = req.user._id;

    // Find the post
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check if user is the author of the post
    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update restrictions for this post',
      });
    }

    // Update restrictions
    if (typeof ageRestricted !== 'undefined') {
      post.ageRestricted = ageRestricted === 'true' || ageRestricted === true;
    }

    if (contentWarnings) {
      post.contentWarnings = Array.isArray(contentWarnings) ? contentWarnings : [];
    }

    if (customWarning) {
      post.customWarning = String(customWarning).substring(0, 200);
    }

    await post.save();

    // Populate author details
    await post.populate('author', 'username fullName avatar isVerified isCreator');

    res.status(200).json({
      success: true,
      message: 'Post restrictions updated successfully',
      data: post,
    });
  } catch (error) {
    console.error('❌ Update post restrictions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Share post
// @route   POST /api/posts/:id/share
// @access  Private
export const sharePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Update user's share count for achievements
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { sharesCount: 1 }
    });

    // Check and award achievements for sharing
    try {
      await checkAndAwardAchievements(req.user._id, 'shared');
    } catch (achievementError) {
      console.error('Error checking achievements:', achievementError);
    }

    res.status(200).json({
      success: true,
      message: 'Post shared successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Search posts
// @route   GET /api/posts/search
// @access  Public
export const searchPosts = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Try to get cached data
    try {
      const cachedResults = await redisClient.get(`search:posts:${q}:page:${pageNum}:limit:${limitNum}`);
      if (cachedResults) {
        console.log(`✅ Cache hit for post search: ${q}, page: ${pageNum}`);
        return res.status(200).json({
          success: true,
          data: JSON.parse(cachedResults),
          fromCache: true,
          pagination: {
            page: pageNum,
            limit: limitNum,
            hasMore: true // This would need to be calculated properly in a real implementation
          }
        });
      }
    } catch (cacheError) {
      console.error('Cache read error:', cacheError);
    }
    
    const posts = await Post.find({
      $or: [
        { caption: { $regex: q, $options: 'i' } },
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ],
      category: { $in: ['image', 'short', 'long'] }
    })
      .populate('author', 'username fullName avatar')
      .populate('audio') // Populate audio field
      .skip(skip)
      .limit(limitNum);
    
    // Cache the search results for 2 minutes
    try {
      await redisClient.setEx(`search:posts:${q}:page:${pageNum}:limit:${limitNum}`, 120, JSON.stringify(posts));
    } catch (cacheError) {
      console.error('Cache write error:', cacheError);
    }
    
    res.status(200).json({
      success: true,
      data: posts,
      fromCache: false,
      pagination: {
        page: pageNum,
        limit: limitNum,
        hasMore: posts.length === limitNum
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
