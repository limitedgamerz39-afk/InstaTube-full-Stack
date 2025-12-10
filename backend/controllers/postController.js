import Post from '../models/Post.js';
import Short from '../models/Short.js';
import LongVideo from '../models/LongVideo.js';
import CommunityPost from '../models/CommunityPost.js';
import User from '../models/User.js';
import Comment from '../models/Comment.js';
import Notification from '../models/Notification.js';
import Audio from '../models/Audio.js';
import Report from '../models/Report.js';
import { uploadToStorage, deleteFromStorage } from '../config/minio.js';
import redisClient from '../config/redis.js';
import { uploadMultiple } from '../middleware/uploadMiddleware.js';
import { generateSafeFilename, validateFileType, scanForMaliciousContent, stripExifData, extractVideoDuration } from '../utils/fileProcessing.js';
import { logSecurityEvent } from '../services/securityService.js';
import { cacheWithParams } from '../middleware/cacheMiddleware.js';
import { checkAndAwardAchievements } from '../services/achievementService.js';

// @desc    Create new post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res) => {
  console.log('=== POST UPLOAD REQUEST RECEIVED ===');
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  console.log('Files received:', req.files ? req.files.length : 0);
  
  try {
    const { title, description, caption, tags, location, visibility, madeForKids, allowComments, scheduledAt, videoLanguage, license, topicCategory, playlistName, paidPromotion, ageRestricted, contentWarnings, customWarning, allowEmbedding, locationLat, locationLng, category: rawCategory, derivedFrom, remixType, videoStartSec, videoEndSec, playbackRate, filter, beautyFilter, productTags, isBusinessProfile, shoppingCartEnabled, checkInLocation, highlightTitle, igtvTitle, audioId, chapters } = req.body;
    const category = (rawCategory || 'image').toLowerCase();
    
    console.log('Processing upload with category:', category);

    if (!['image', 'short', 'long'].includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category',
      });
    }

    // Validate files
    // When using upload.array(), files are stored in req.files directly, not req.files.media
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one media file',
      });
    }

    // For consistency, we'll put files in req.files.media as well
    if (!req.files.media) {
      req.files.media = req.files;
    }

    // Validate file types based on category AFTER upload
    const allowedFileTypes = {
      image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      short: ['video/mp4', 'video/quicktime', 'video/webm', 'video/ogg', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      long: ['video/mp4', 'video/quicktime', 'video/webm', 'video/ogg', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    };

    // Check each uploaded file against allowed types for the category
    for (const file of req.files.media) {
      if (!allowedFileTypes[category].includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: `Invalid file type for ${category}. You uploaded a ${file.mimetype} file. Allowed types: ${allowedFileTypes[category].join(', ')}`
        });
      }
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
      try {
        const safeFilename = generateSafeFilename(file.originalname);
        const result = await uploadToStorage(file.buffer, 'd4dhub/posts', safeFilename);
        mediaUrls.push({
          url: result.secure_url,
          type: file.mimetype.startsWith('video') ? 'video' : 'image',
        });
      } catch (uploadError) {
        console.error('Storage upload error:', uploadError);
        // Log the error but continue with other files
        await logSecurityEvent('storage_upload_error', uploadError.message, 'high', { 
          fileName: file.originalname, 
          fileSize: file.size,
          error: uploadError.message 
        }, req);
        
        // Return error for this specific file
        return res.status(500).json({
          success: false,
          message: `Failed to upload file: ${file.originalname}. ${uploadError.message}`,
        });
      }
    }

    // Handle thumbnail if provided
    let thumbnailUrl = null;
    if (req.files.thumbnail && req.files.thumbnail.length > 0) {
      try {
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
        const thumbnailResult = await uploadToStorage(thumbnailFile.buffer, 'd4dhub/thumbnails', safeThumbnailName);
        thumbnailUrl = thumbnailResult.secure_url;
      } catch (thumbnailError) {
        console.error('Thumbnail upload error:', thumbnailError);
        // Log the error but don't stop the entire process
        await logSecurityEvent('thumbnail_upload_error', thumbnailError.message, 'medium', { 
          error: thumbnailError.message 
        }, req);
        // Continue without thumbnail
      }
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
      // Extract actual duration from video file if possible
      try {
        // Use the file buffer to extract duration
        if (req.files && req.files.media && req.files.media.length > 0) {
          const fileBuffer = req.files.media[0].buffer;
          if (fileBuffer) {
            const actualDuration = await extractVideoDuration(fileBuffer);
            durationSec = actualDuration || (category === 'short' ? 30 : 300); // Fallback to defaults
          } else {
            // Fallback to estimated durations
            durationSec = category === 'short' ? 30 : 300;
          }
        } else {
          // Fallback to estimated durations
          durationSec = category === 'short' ? 30 : 300;
        }
      } catch (durationError) {
        console.error('Error extracting video duration:', durationError);
        // Fallback to estimated durations
        durationSec = category === 'short' ? 30 : 300;
      }
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

    // Create post in the appropriate collection based on category
    let post;
    const postData = {
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
      media: mediaUrls,
      mediaUrl: mediaUrls[0]?.url, // For backward compatibility
      mediaType: mediaUrls[0]?.type, // For backward compatibility
      thumbnail: thumbnailUrl, // Add thumbnail URL
      durationSec,
      derivedFrom: derivedFrom || undefined,
      remixType: remixType || undefined,
      keywords: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      // Video editing features
      videoStartSec: videoStartSec ? Number(videoStartSec) : undefined,
      videoEndSec: videoEndSec ? Number(videoEndSec) : undefined,
      playbackRate: playbackRate ? Number(playbackRate) : 1,
      filter: filter || 'normal',
      beautyFilter: beautyFilter === 'true',
      // Product tagging for business profiles
      productTags: productTags || [],
      isBusinessProfile: isBusinessProfile === 'true',
      shoppingCartEnabled: shoppingCartEnabled === 'true',
      // Location check-in
      checkInLocation: checkInLocationData,
      // For IGTV and Highlights
      highlightTitle: highlightTitle || '',
      igtvTitle: igtvTitle || '',
      // Audio association
      audio: audio ? audio._id : undefined,
      // Chapters
      chapters: processedChapters,
    };

    // Save to appropriate collection
    if (category === 'short') {
      post = await Short.create(postData);
    } else if (category === 'long') {
      post = await LongVideo.create(postData);
    } else {
      // For images and other content, save to Post collection
      post = await Post.create(postData);
    }

    // Populate author info
    await post.populate('author', 'username avatar displayName');

    // Award achievements for posting
    await checkAndAwardAchievements(req.user._id, 'POST_CREATED', { postId: post._id });

    res.status(201).json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error('Create post error:', error);
    
    // Log the error for debugging
    try {
      await logSecurityEvent('create_post_error', error.message, 'high', { 
        error: error.message,
        stack: error.stack
      }, req);
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    // Send a more detailed error response
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return res.status(408).json({
        success: false,
        message: 'Request timeout. Upload took too long. Please try again with a smaller file or better connection.',
        error: error.message,
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during upload. Please try again.',
      error: error.message,
    });
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
    const filter = req.query.filter || 'popular'; // Add filter support

    const currentUser = await User.findById(req.user._id);

    // Get user's interests based on their activity
    const userInterests = await getUserInterests(currentUser._id);

    // Build query based on filter
    let query = {
      author: { $in: [...currentUser.subscribed, currentUser._id] },
      isArchived: { $ne: true },
    };

    // For community posts, use creator instead of author
    let communityQuery = {
      creator: { $in: [...currentUser.subscribed, currentUser._id] },
    };

    // Apply filter-specific conditions
    if (filter === 'music') {
      query.$or = [
        { audio: { $exists: true } },
        { tags: { $in: ['music', 'song', 'audio'] } }
      ];
      communityQuery.$or = [
        { audio: { $exists: true } },
        { tags: { $in: ['music', 'song', 'audio'] } }
      ];
    } else if (filter === 'gaming') {
      query.tags = { $in: ['game', 'gaming', 'play', 'minecraft', 'fortnite', 'pubg'] };
      communityQuery.tags = { $in: ['game', 'gaming', 'play', 'minecraft', 'fortnite', 'pubg'] };
    } else if (filter === 'sports') {
      query.tags = { $in: ['sport', 'football', 'basketball', 'cricket', 'tennis', 'soccer'] };
      communityQuery.tags = { $in: ['sport', 'football', 'basketball', 'cricket', 'tennis', 'soccer'] };
    } else if (filter === 'news') {
      query.tags = { $in: ['news', 'breaking', 'update', 'current'] };
      communityQuery.tags = { $in: ['news', 'breaking', 'update', 'current'] };
    }

    // Fetch posts from all collections with proper pagination
    const [posts, shorts, longVideos, community] = await Promise.all([
      Post.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'username fullName avatar subscriber')
        .populate({
          path: 'comments',
          populate: { path: 'author', select: 'username fullName avatar' },
          options: { sort: { createdAt: -1 }, limit: 2 },
        })
        .populate('audio')
        .lean()
        .hint({ author: 1, createdAt: -1 }),
      Short.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'username fullName avatar subscriber')
        .populate({
          path: 'comments',
          populate: { path: 'author', select: 'username fullName avatar' },
          options: { sort: { createdAt: -1 }, limit: 2 },
        })
        .populate('audio')
        .lean()
        .hint({ author: 1, createdAt: -1 }),
      LongVideo.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'username fullName avatar subscriber')
        .populate({
          path: 'comments',
          populate: { path: 'author', select: 'username fullName avatar' },
          options: { sort: { createdAt: -1 }, limit: 2 },
        })
        .populate('audio')
        .lean()
        .hint({ author: 1, createdAt: -1 }),
      CommunityPost.find(communityQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('creator', 'username fullName avatar subscriber')
        .populate({
          path: 'comments',
          populate: { path: 'author', select: 'username fullName avatar' },
          options: { sort: { createdAt: -1 }, limit: 2 },
        })
        .lean()
        .hint({ creator: 1, createdAt: -1 })
    ]);

    // Combine all posts and add type information
    const allPosts = [
      ...posts.map(p => ({ ...p, type: 'image' })),
      ...shorts.map(p => ({ ...p, type: 'short' })),
      ...longVideos.map(p => ({ ...p, type: 'long' })),
      ...community.map(p => ({ ...p, type: 'community' }))
    ];

    // Count total posts for pagination metadata
    const [postsCount, shortsCount, longVideosCount, communityCount] = await Promise.all([
      Post.countDocuments(query),
      Short.countDocuments(query),
      LongVideo.countDocuments(query),
      CommunityPost.countDocuments(communityQuery)
    ]);
    
    const total = postsCount + shortsCount + longVideosCount + communityCount;

    // Apply personalized sorting based on user interests
    const now = Date.now();
    const halfLifeMs = 24 * 60 * 60 * 1000; // 24h recency decay
    
    const scored = allPosts.map((p) => {
      // Base engagement score
      const likesCount = (p.likes || []).length;
      const commentsCount = (p.comments || []).length;
      const ageMs = Math.max(1, now - new Date(p.createdAt).getTime());
      const recencyBoost = Math.exp(-ageMs / halfLifeMs);
      
      // Personalization boost based on user interests
      let personalizationBoost = 1;
      if (userInterests.length > 0) {
        // Boost posts with tags that match user interests
        const matchingTags = p.tags?.filter(tag => 
          userInterests.some(interest => 
            tag.toLowerCase().includes(interest.toLowerCase())
          )
        ) || [];
        
        personalizationBoost = 1 + (matchingTags.length * 0.5); // 50% boost per matching tag
        
        // Additional boost for posts from authors the user frequently interacts with
        if (currentUser.subscribed.includes((p.author || p.creator)?._id.toString())) {
          personalizationBoost *= 1.2; // 20% boost for subscribed authors
        }
      }
      
      // Category-specific boosts
      let categoryBoost = 1;
      if (p.type === 'short') {
        categoryBoost = 1.1; // Slight boost for shorts
      } else if (p.type === 'long') {
        categoryBoost = 1.05; // Small boost for long videos
      }
      
      const engagementScore = likesCount * 2 + commentsCount * 3;
      const score = (engagementScore * 0.7 + recencyBoost * 100) * personalizationBoost * categoryBoost;
      
      return { ...p, score };
    });

    // Sort by personalized score desc for popular/relevant filter
    if (filter === 'popular' || filter === 'trending') {
      scored.sort((a, b) => b.score - a.score);
    }

    // Take only the requested limit
    const limitedPosts = scored.slice(0, limit);

    // Return data in the structure expected by the frontend
    res.status(200).json({
      success: true,
      data: limitedPosts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: skip + limitedPosts.length < total,
        nextPage: skip + limitedPosts.length < total ? page + 1 : null
      },
    });
  } catch (error) {
    console.error("Feed error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper function to get user interests based on their activity
const getUserInterests = async (userId) => {
  try {
    const user = await User.findById(userId);
    
    // Get user's liked posts from all collections
    const [likedPostsFromCollections, commentedPostsFromCollections] = await Promise.all([
      Promise.all([
        Post.find({ likes: userId }).select('tags category').limit(50),
        Short.find({ likes: userId }).select('tags category').limit(50),
        LongVideo.find({ likes: userId }).select('tags category').limit(50),
        CommunityPost.find({ likes: userId }).select('tags').limit(50)
      ]),
      Promise.all([
        Post.find({ 'comments.author': userId }).select('tags category').limit(30),
        Short.find({ 'comments.author': userId }).select('tags category').limit(30),
        LongVideo.find({ 'comments.author': userId }).select('tags category').limit(30),
        CommunityPost.find({ 'comments.author': userId }).select('tags').limit(30)
      ])
    ]);
    
    // Flatten the arrays
    const likedPosts = likedPostsFromCollections.flat();
    const commentedPosts = commentedPostsFromCollections.flat();
    
    // Get user's saved posts (assuming this is only for Post collection)
    const savedPosts = await Post.find({ savedBy: userId })
      .select('tags category')
      .limit(30);
    
    // Combine all posts
    const allPosts = [...likedPosts, ...commentedPosts, ...savedPosts];
    
    // Extract and count tags
    const tagCounts = {};
    const categoryCounts = {};
    
    allPosts.forEach(post => {
      // Count tags
      if (post.tags) {
        post.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
      
      // Count categories (not applicable for CommunityPost)
      if (post.category) {
        categoryCounts[post.category] = (categoryCounts[post.category] || 0) + 1;
      }
    });
    
    // Get top 10 tags by count
    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);
    
    // Get top 3 categories by count
    const sortedCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);
    
    // Combine tags and categories as interests
    return [...sortedTags, ...sortedCategories];
  } catch (error) {
    console.error('Error getting user interests:', error);
    return [];
  }
};

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
export const getPost = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to find the post in all collections
    let post = await Post.findById(id)
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

    // If not found in Post collection, try Short collection
    if (!post) {
      post = await Short.findById(id)
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
        .populate('audio')
        .lean();
    }

    // If not found in Short collection, try LongVideo collection
    if (!post) {
      post = await LongVideo.findById(id)
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
        .populate('audio')
        .lean();
    }

    // If not found in LongVideo collection, try CommunityPost collection
    if (!post) {
      post = await CommunityPost.findById(id)
        .populate('creator', 'username fullName avatar subscriber')
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
        .populate('audio')
        .lean();
    }

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
    console.error('Get post error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, caption, tags, location, visibility, madeForKids, allowComments, scheduledAt, videoLanguage, license, topicCategory, playlistName, paidPromotion, ageRestricted, contentWarnings, customWarning, allowEmbedding, locationLat, locationLng, category: rawCategory, derivedFrom, remixType, videoStartSec, videoEndSec, playbackRate, filter, beautyFilter, productTags, isBusinessProfile, shoppingCartEnabled, checkInLocation, highlightTitle, igtvTitle, audioId, chapters } = req.body;
    const category = (rawCategory || 'image').toLowerCase();

    if (!['image', 'short', 'long'].includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category',
      });
    }

    // Fetch the post from the appropriate collection
    let post;
    if (category === 'short') {
      post = await Short.findById(id);
    } else if (category === 'long') {
      post = await LongVideo.findById(id);
    } else {
      post = await Post.findById(id);
    }

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check if the user is the author of the post
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this post',
      });
    }

    // Update post fields
    post.title = title || post.title;
    post.description = description || post.description;
    post.caption = caption || post.caption;
    post.tags = tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : post.tags;
    post.location = location ? { name: location, lat: locationLat ? Number(locationLat) : post.location.lat, lng: locationLng ? Number(locationLng) : post.location.lng } : post.location;
    post.visibility = visibility || post.visibility;
    post.madeForKids = madeForKids === 'true' || post.madeForKids;
    post.allowComments = allowComments !== 'false' || post.allowComments;
    post.scheduledAt = scheduledAt ? new Date(scheduledAt) : post.scheduledAt;
    post.videoLanguage = videoLanguage || post.videoLanguage;
    post.license = license || post.license;
    post.topicCategory = topicCategory || post.topicCategory;
    post.paidPromotion = paidPromotion === 'true' || post.paidPromotion;
    post.ageRestricted = ageRestricted === 'true' || post.ageRestricted;
    post.contentWarnings = contentWarnings || post.contentWarnings;
    post.customWarning = customWarning || post.customWarning;
    post.allowEmbedding = allowEmbedding !== 'false' || post.allowEmbedding;
    post.derivedFrom = derivedFrom || post.derivedFrom;
    post.remixType = remixType || post.remixType;
    post.keywords = tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : post.keywords;
    post.videoStartSec = videoStartSec ? Number(videoStartSec) : post.videoStartSec;
    post.videoEndSec = videoEndSec ? Number(videoEndSec) : post.videoEndSec;
    post.playbackRate = playbackRate ? Number(playbackRate) : post.playbackRate;
    post.filter = filter || post.filter;
    post.beautyFilter = beautyFilter === 'true' || post.beautyFilter;
    post.productTags = productTags || post.productTags;
    post.isBusinessProfile = isBusinessProfile === 'true' || post.isBusinessProfile;
    post.shoppingCartEnabled = shoppingCartEnabled === 'true' || post.shoppingCartEnabled;
    post.checkInLocation = checkInLocation ? { name: checkInLocation, lat: locationLat ? Number(locationLat) : post.checkInLocation.lat, lng: locationLng ? Number(locationLng) : post.checkInLocation.lng } : post.checkInLocation;
    post.highlightTitle = highlightTitle || post.highlightTitle;
    post.igtvTitle = igtvTitle || post.igtvTitle;

    // Handle audio update
    if (audioId) {
      try {
        const audio = await Audio.findById(audioId);
        if (audio) {
          post.audio = audio._id;
        } else {
          console.warn('Invalid audio ID provided:', audioId);
        }
      } catch (audioError) {
        console.error('Error fetching audio:', audioError);
      }
    }

    // Handle chapters update
    if (chapters) {
      try {
        const chapterArray = Array.isArray(chapters) ? chapters : JSON.parse(chapters);
        if (Array.isArray(chapterArray)) {
          post.chapters = chapterArray.map(chapter => ({
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

    // Save the updated post
    await post.save();

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the post from the appropriate collection
    let post;
    post = await Post.findById(id);
    if (!post) {
      post = await Short.findById(id);
    }
    if (!post) {
      post = await LongVideo.findById(id);
    }
    if (!post) {
      post = await CommunityPost.findById(id);
    }

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check if the user is the author of the post
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this post',
      });
    }

    // Delete the post
    await post.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Like post
// @route   POST /api/posts/:id/like
// @access  Private
export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate post ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log(`Invalid post ID format: ${id}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID format',
      });
    }

    // Fetch the post from the appropriate collection
    let post;
    post = await Post.findById(id);
    if (!post) {
      post = await Short.findById(id);
    }
    if (!post) {
      post = await LongVideo.findById(id);
    }
    if (!post) {
      post = await CommunityPost.findById(id);
    }

    if (!post) {
      console.log(`Post not found with ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check if the user has already liked the post
    if (post.likes.includes(req.user._id)) {
      console.log(`User ${req.user._id} has already liked post ${id}`);
      return res.status(400).json({
        success: false,
        message: 'You have already liked this post',
      });
    }

    // Add the user to the likes array
    post.likes.push(req.user._id);

    // Save the updated post
    await post.save();
    console.log(`User ${req.user._id} liked post ${id}`);

    res.status(200).json({
      success: true,
      message: 'Post liked successfully',
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Unlike post
// @route   POST /api/posts/:id/unlike
// @access  Private
export const unlikePost = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate post ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log(`Invalid post ID format: ${id}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid post ID format',
      });
    }

    // Fetch the post from the appropriate collection
    let post;
    post = await Post.findById(id);
    if (!post) {
      post = await Short.findById(id);
    }
    if (!post) {
      post = await LongVideo.findById(id);
    }
    if (!post) {
      post = await CommunityPost.findById(id);
    }

    if (!post) {
      console.log(`Post not found with ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check if the user has already liked the post
    if (!post.likes.includes(req.user._id)) {
      console.log(`User ${req.user._id} has not liked post ${id}`);
      return res.status(400).json({
        success: false,
        message: 'You have not liked this post',
      });
    }

    // Remove the user from the likes array
    post.likes = post.likes.filter(like => like.toString() !== req.user._id.toString());

    // Save the updated post
    await post.save();
    console.log(`User ${req.user._id} unliked post ${id}`);

    res.status(200).json({
      success: true,
      message: 'Post unliked successfully',
    });
  } catch (error) {
    console.error('Unlike post error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Save post to post's savedBy array
// @route   POST /api/posts/:id/save
// @access  Private
export const savePostToPost = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the post from the appropriate collection
    let post;
    post = await Post.findById(id);
    if (!post) {
      post = await Short.findById(id);
    }
    if (!post) {
      post = await LongVideo.findById(id);
    }
    if (!post) {
      post = await CommunityPost.findById(id);
    }

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check if the user has already saved the post
    if (post.savedBy.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You have already saved this post',
      });
    }

    // Add the user to the savedBy array
    post.savedBy.push(req.user._id);

    // Save the updated post
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post saved successfully',
    });
  } catch (error) {
    console.error('Save post error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Unsave post from post's savedBy array
// @route   POST /api/posts/:id/unsave
// @access  Private
export const unsavePostFromPost = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the post from the appropriate collection
    let post;
    post = await Post.findById(id);
    if (!post) {
      post = await Short.findById(id);
    }
    if (!post) {
      post = await LongVideo.findById(id);
    }
    if (!post) {
      post = await CommunityPost.findById(id);
    }

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check if the user has already saved the post
    if (!post.savedBy.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You have not saved this post',
      });
    }

    // Remove the user from the savedBy array
    post.savedBy = post.savedBy.filter(user => user.toString() !== req.user._id.toString());

    // Save the updated post
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post unsaved successfully',
    });
  } catch (error) {
    console.error('Unsave post error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};



// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private


// @desc    Like/Unlike post
// @route   POST /api/posts/:id/like
// @access  Private


// @desc    Comment on post
// @route   POST /api/posts/:id/comment
// @access  Private
export const commentOnPost = async (req, res) => {
  try {
    const { text } = req.body;
    const { id } = req.params;

    if (!text || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required',
      });
    }

    // Try to find the post in all collections
    let post = await Post.findById(id);

    // If not found in Post collection, try Short collection
    if (!post) {
      post = await Short.findById(id);
    }

    // If not found in Short collection, try LongVideo collection
    if (!post) {
      post = await LongVideo.findById(id);
    }

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
    
    // Save the post in the appropriate collection
    if (post.category === 'short') {
      await Short.findByIdAndUpdate(id, { comments: post.comments });
    } else if (post.category === 'long') {
      await LongVideo.findByIdAndUpdate(id, { comments: post.comments });
    } else {
      await Post.findByIdAndUpdate(id, { comments: post.comments });
    }

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
    
    const query = {
      createdAt: { $gte: oneWeekAgo },
      isArchived: { $ne: true },
    };
    
    // Fetch posts from all collections
    const [posts, shorts, longVideos] = await Promise.all([
      Post.find(query)
        .sort({ likes: -1, comments: -1 })
        .limit(20)
        .populate('author', 'username fullName avatar'),
      Short.find(query)
        .sort({ likes: -1, comments: -1 })
        .limit(20)
        .populate('author', 'username fullName avatar'),
      LongVideo.find(query)
        .sort({ likes: -1, comments: -1 })
        .limit(20)
        .populate('author', 'username fullName avatar')
    ]);

    // Combine all posts and sort by engagement
    const allPosts = [...posts, ...shorts, ...longVideos];
    allPosts.sort((a, b) => {
      const aEngagement = (a.likes?.length || 0) + (a.comments?.length || 0);
      const bEngagement = (b.likes?.length || 0) + (b.comments?.length || 0);
      return bEngagement - aEngagement;
    });
    
    // Take top 20
    const trendingPosts = allPosts.slice(0, 20);

    // Cache the trending posts for 5 minutes
    try {
      await redisClient.setEx('trending:posts', 300, JSON.stringify(trendingPosts));
    } catch (cacheError) {
      console.error('Cache write error:', cacheError);
    }

    res.status(200).json({
      success: true,
      data: trendingPosts,
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

    const query = {
      isArchived: { $ne: true },
    };

    const posts = await LongVideo.find(query)
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

    const query = {
      isArchived: { $ne: true },
    };

    const posts = await Short.find(query)
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
    // Try to find the post in all collections
    let post = await Post.findById(req.params.id)
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username fullName avatar',
        },
        options: { sort: { createdAt: -1 } },
      });

    // If not found in Post collection, try Short collection
    if (!post) {
      post = await Short.findById(req.params.id)
        .populate({
          path: 'comments',
          populate: {
            path: 'author',
            select: 'username fullName avatar',
          },
          options: { sort: { createdAt: -1 } },
        });
    }

    // If not found in Short collection, try LongVideo collection
    if (!post) {
      post = await LongVideo.findById(req.params.id)
        .populate({
          path: 'comments',
          populate: {
            path: 'author',
            select: 'username fullName avatar',
          },
          options: { sort: { createdAt: -1 } },
        });
    }

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

// @desc    Save/Unsave post (user-centric)
// @route   POST /api/posts/:id/save
// @access  Private
export const savePost = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to find the post in all collections
    let post = await Post.findById(id);

    // If not found in Post collection, try Short collection
    if (!post) {
      post = await Short.findById(id);
    }

    // If not found in Short collection, try LongVideo collection
    if (!post) {
      post = await LongVideo.findById(id);
    }

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
    const { id } = req.params;
    
    // Try to find the post in all collections
    let post = await Post.findById(id);

    // If not found in Post collection, try Short collection
    if (!post) {
      post = await Short.findById(id);
    }

    // If not found in Short collection, try LongVideo collection
    if (!post) {
      post = await LongVideo.findById(id);
    }

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
    
    // Save the post in the appropriate collection
    if (post.category === 'short') {
      await Short.findByIdAndUpdate(id, { isArchived: post.isArchived });
    } else if (post.category === 'long') {
      await LongVideo.findByIdAndUpdate(id, { isArchived: post.isArchived });
    } else {
      await Post.findByIdAndUpdate(id, { isArchived: post.isArchived });
    }

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
    const { id } = req.params;
    
    // Try to find the post in all collections
    let post = await Post.findById(id);

    // If not found in Post collection, try Short collection
    if (!post) {
      post = await Short.findById(id);
    }

    // If not found in Short collection, try LongVideo collection
    if (!post) {
      post = await LongVideo.findById(id);
    }

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Increment view count
    post.views = (post.views || 0) + 1;
    
    // Save the post in the appropriate collection
    if (post.category === 'short') {
      await Short.findByIdAndUpdate(id, { views: post.views });
    } else if (post.category === 'long') {
      await LongVideo.findByIdAndUpdate(id, { views: post.views });
    } else {
      await Post.findByIdAndUpdate(id, { views: post.views });
    }

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

// @desc    Get related videos
// @route   GET /api/posts/:id/related
// @access  Public
export const getRelatedVideos = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    // Try to find the post in all collections to get its details
    let post = await Post.findById(id);
    
    // If not found in Post collection, try Short collection
    if (!post) {
      post = await Short.findById(id);
    }
    
    // If not found in Short collection, try LongVideo collection
    if (!post) {
      post = await LongVideo.findById(id);
    }
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }
    
    // Build query for related videos based on tags, author, and category
    const query = {
      _id: { $ne: post._id }, // Exclude the current video
      isArchived: { $ne: true },
    };
    
    // Add category filter if the post has a category
    if (post.category) {
      query.category = post.category;
    }
    
    // Add tag-based filtering if the post has tags
    if (post.tags && post.tags.length > 0) {
      query.tags = { $in: post.tags.slice(0, 5) }; // Use up to 5 tags
    }
    
    // Add author-based filtering (videos from the same author)
    query.author = post.author;
    
    // Determine which collection to query based on the post's category
    let RelatedVideoModel;
    if (post.category === 'short') {
      RelatedVideoModel = Short;
    } else if (post.category === 'long') {
      RelatedVideoModel = LongVideo;
    } else {
      RelatedVideoModel = Post;
    }
    
    // Get related videos
    const relatedVideos = await RelatedVideoModel.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('author', 'username fullName avatar')
      .populate('audio')
      .lean();
    
    // If we don't have enough related videos, get more by relaxing the author constraint
    if (relatedVideos.length < limit) {
      const additionalQuery = {
        _id: { $ne: post._id },
        isArchived: { $ne: true },
      };
      
      // Still use tag filtering if available
      if (post.tags && post.tags.length > 0) {
        additionalQuery.tags = { $in: post.tags.slice(0, 3) };
      }
      
      // Get additional videos
      const additionalVideos = await RelatedVideoModel.find(additionalQuery)
        .sort({ views: -1, createdAt: -1 }) // Sort by popularity
        .limit(limit - relatedVideos.length)
        .populate('author', 'username fullName avatar')
        .populate('audio')
        .lean();
      
      // Combine the results
      relatedVideos.push(...additionalVideos);
    }
    
    res.status(200).json({
      success: true,
      data: relatedVideos,
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
    
    // Search in all collections
    const searchQuery = {
      $or: [
        { caption: { $regex: q, $options: 'i' } },
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ]
    };
    
    const [posts, shorts, longVideos] = await Promise.all([
      Post.find(searchQuery)
        .populate('author', 'username fullName avatar')
        .populate('audio')
        .skip(skip)
        .limit(limitNum),
      Short.find(searchQuery)
        .populate('author', 'username fullName avatar')
        .populate('audio')
        .skip(skip)
        .limit(limitNum),
      LongVideo.find(searchQuery)
        .populate('author', 'username fullName avatar')
        .populate('audio')
        .skip(skip)
        .limit(limitNum)
    ]);
    
    // Combine all results
    const allPosts = [...posts, ...shorts, ...longVideos];

    // Cache the search results for 2 minutes
    try {
      await redisClient.setEx(`search:posts:${q}:page:${pageNum}:limit:${limitNum}`, 120, JSON.stringify(allPosts));
    } catch (cacheError) {
      console.error('Cache write error:', cacheError);
    }
    
    res.status(200).json({
      success: true,
      data: allPosts,
      fromCache: false,
      pagination: {
        page: pageNum,
        limit: limitNum,
        hasMore: allPosts.length === limitNum
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get random posts for discovery
// @route   GET /api/posts/random
// @access  Private
export const getRandomPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    // Get current user
    const currentUser = await User.findById(req.user._id);
    
    // Find random posts that are public and not from blocked users
    // Use a more efficient approach by first getting random post IDs from all collections
    const [randomPostIds, randomShortIds, randomLongVideoIds] = await Promise.all([
      Post.aggregate([
        { $match: { 
            visibility: 'public',
            author: { $nin: currentUser.blocked || [] }
          } 
        },
        { $sample: { size: limit * 2 } }, // Get more IDs to ensure we have enough after population
        { $project: { _id: 1 } }
      ]),
      Short.aggregate([
        { $match: { 
            visibility: 'public',
            author: { $nin: currentUser.blocked || [] }
          } 
        },
        { $sample: { size: limit * 2 } }, // Get more IDs to ensure we have enough after population
        { $project: { _id: 1 } }
      ]),
      LongVideo.aggregate([
        { $match: { 
            visibility: 'public',
            author: { $nin: currentUser.blocked || [] }
          } 
        },
        { $sample: { size: limit * 2 } }, // Get more IDs to ensure we have enough after population
        { $project: { _id: 1 } }
      ])
    ]);
    
    // Extract just the IDs
    const postIds = randomPostIds.map(post => post._id);
    const shortIds = randomShortIds.map(short => short._id);
    const longVideoIds = randomLongVideoIds.map(longVideo => longVideo._id);
    
    // Fetch the actual posts with all needed data
    const [posts, shorts, longVideos] = await Promise.all([
      Post.find({ _id: { $in: postIds } })
        .limit(limit)
        .populate('author', 'username avatar displayName isVerified')
        .populate({
          path: 'comments',
          options: { limit: 3 }
        })
        .populate('audio')
        .lean(),
      Short.find({ _id: { $in: shortIds } })
        .limit(limit)
        .populate('author', 'username avatar displayName isVerified')
        .populate({
          path: 'comments',
          options: { limit: 3 }
        })
        .populate('audio')
        .lean(),
      LongVideo.find({ _id: { $in: longVideoIds } })
        .limit(limit)
        .populate('author', 'username avatar displayName isVerified')
        .populate({
          path: 'comments',
          options: { limit: 3 }
        })
        .populate('audio')
        .lean()
    ]);
    
    // Combine all posts
    const allPosts = [...posts, ...shorts, ...longVideos];
    
    // Shuffle the combined array
    for (let i = allPosts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allPosts[i], allPosts[j]] = [allPosts[j], allPosts[i]];
    }
    
    // Take only the requested limit
    const randomPosts = allPosts.slice(0, limit);

    res.status(200).json({
      success: true,
      data: randomPosts,
      message: 'Random posts fetched successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get posts by user ID
// @route   GET /api/posts/user/:userId
// @access  Public
export const getPostsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 12, category = 'all' } = req.query;
    
    // Validate user ID format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Build query based on category
    let query = { author: userId };
    if (category !== 'all') {
      query.category = category;
    }
    
    // Try to get cached data
    try {
      const cacheKey = `user-posts:${userId}:page:${pageNum}:limit:${limitNum}:category:${category}`;
      const cachedResults = await redisClient.get(cacheKey);
      if (cachedResults) {
        console.log(`✅ Cache hit for user posts: ${userId}, page: ${pageNum}`);
        return res.status(200).json({
          success: true,
          data: JSON.parse(cachedResults),
          fromCache: true
        });
      }
    } catch (cacheError) {
      console.error('Cache read error:', cacheError);
    }
    
    // Get posts from all collections
    const [posts, shorts, longVideos] = await Promise.all([
      Post.find(query)
        .populate('author', 'username fullName avatar')
        .populate('audio')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Short.find(query)
        .populate('author', 'username fullName avatar')
        .populate('audio')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      LongVideo.find(query)
        .populate('author', 'username fullName avatar')
        .populate('audio')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
    ]);
    
    // Combine all results
    const allPosts = [...posts, ...shorts, ...longVideos];
    
    // Sort by createdAt descending
    allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Limit to requested amount
    const paginatedPosts = allPosts.slice(0, limitNum);
    
    const result = {
      docs: paginatedPosts,
      hasNextPage: allPosts.length > limitNum,
      nextPage: pageNum + 1,
      page: pageNum,
      limit: limitNum
    };
    
    // Cache the results for 2 minutes
    try {
      const cacheKey = `user-posts:${userId}:page:${pageNum}:limit:${limitNum}:category:${category}`;
      await redisClient.setEx(cacheKey, 120, JSON.stringify(result));
    } catch (cacheError) {
      console.error('Cache write error:', cacheError);
    }
    
    res.status(200).json({
      success: true,
      data: result,
      fromCache: false
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Report a post
// @route   POST /api/posts/:id/report
// @access  Private
export const reportPost = async (req, res) => {
  try {
    const { reason, description } = req.body;
    const postId = req.params.id;
    
    // Validate required fields
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required',
      });
    }
    
    // Create the report
    const report = await Report.create({
      reporter: req.user._id,
      reportedType: 'post',
      reportedId: postId,
      reason,
      description: description || '',
    });
    
    res.status(201).json({
      success: true,
      message: 'Post reported successfully',
      data: report,
    });
  } catch (error) {
    console.error('Error reporting post:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to report post',
    });
  }
};