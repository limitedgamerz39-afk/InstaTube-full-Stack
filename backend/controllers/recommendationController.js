import Post from '../models/Post.js';
import User from '../models/User.js';
import Short from '../models/Short.js';
import LongVideo from '../models/LongVideo.js';

// Helper function to calculate similarity between two users based on their interactions
const calculateUserSimilarity = (user1, user2) => {
  // Simple Jaccard similarity based on liked posts
  const user1Likes = new Set(user1.likedPosts || []);
  const user2Likes = new Set(user2.likedPosts || []);
  
  const intersection = [...user1Likes].filter(x => user2Likes.has(x)).length;
  const union = new Set([...user1Likes, ...user2Likes]).size;
  
  return union === 0 ? 0 : intersection / union;
};

// Helper function to get popular posts based on engagement
const getPopularPosts = async (limit = 20) => {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Get posts from all collections
  const [regularPosts, shorts, longVideos] = await Promise.all([
    Post.find({ 
      createdAt: { $gte: oneWeekAgo },
      isArchived: { $ne: true }
    })
    .sort({ likes: -1, views: -1 })
    .limit(limit)
    .populate('author', 'username fullName avatar')
    .lean(),
    
    Short.find({ 
      createdAt: { $gte: oneWeekAgo },
      isArchived: { $ne: true }
    })
    .sort({ likes: -1, views: -1 })
    .limit(limit)
    .populate('author', 'username fullName avatar')
    .lean(),
    
    LongVideo.find({ 
      createdAt: { $gte: oneWeekAgo },
      isArchived: { $ne: true }
    })
    .sort({ likes: -1, views: -1 })
    .limit(limit)
    .populate('author', 'username fullName avatar')
    .lean()
  ]);
  
  // Combine all posts
  let allPosts = [...regularPosts, ...shorts, ...longVideos];
  
  // Calculate engagement scores
  allPosts = allPosts.map(post => ({
    ...post,
    engagementScore: (post.likes?.length || 0) * 2 + (post.views || 0) * 0.1 + (post.comments?.length || 0) * 3
  }));
  
  // Sort by engagement score and return top posts
  return allPosts
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, limit);
};

// @desc    Get personalized recommendations for a user
// @route   GET /api/recommendations/personalized
// @access  Private
export const getPersonalizedRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 20;

    const currentUser = await User.findById(userId).populate('subscribed', '_id').lean();
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 1. Correctly fetch all content liked by the user from all collections
    const [likedPosts, likedShorts, likedLongVideos] = await Promise.all([
      Post.find({ likes: userId }).lean(),
      Short.find({ likes: userId }).lean(),
      LongVideo.find({ likes: userId }).lean(),
    ]);
    const allLikedContent = [...likedPosts, ...likedShorts, ...likedLongVideos];
    const allLikedContentIds = allLikedContent.map(p => p._id);

    // If user has no interactions, return popular posts
    if (allLikedContent.length === 0) {
      const popularContent = await getPopularPosts(limit);
      return res.status(200).json({
        success: true,
        data: popularContent,
        message: 'Showing popular content as no interaction history was found.'
      });
    }

    // 2. Build a comprehensive interest profile
    const interestTags = [...new Set(allLikedContent.flatMap(p => p.tags || []))];
    const interactedAuthorIds = [...new Set(allLikedContent.map(p => p.author.toString()))];
    const subscriptionIds = currentUser.subscribed.map(s => s._id.toString());

    // 3. Fetch recommended content from all collections
    const [similarTagPosts, similarTagShorts, similarTagLongVideos, authorPosts, authorShorts, authorLongVideos, subPosts, subShorts, subLongVideos] = await Promise.all([
      // Content with similar tags
      Post.find({ tags: { $in: interestTags }, _id: { $nin: allLikedContentIds }, isArchived: { $ne: true } }).limit(limit).populate('author', 'username fullName avatar').lean(),
      Short.find({ tags: { $in: interestTags }, _id: { $nin: allLikedContentIds }, isArchived: { $ne: true } }).limit(limit).populate('author', 'username fullName avatar').lean(),
      LongVideo.find({ tags: { $in: interestTags }, _id: { $nin: allLikedContentIds }, isArchived: { $ne: true } }).limit(limit).populate('author', 'username fullName avatar').lean(),
      
      // Content from authors the user has interacted with
      Post.find({ author: { $in: interactedAuthorIds }, _id: { $nin: allLikedContentIds }, isArchived: { $ne: true } }).sort({ createdAt: -1 }).limit(limit).populate('author', 'username fullName avatar').lean(),
      Short.find({ author: { $in: interactedAuthorIds }, _id: { $nin: allLikedContentIds }, isArchived: { $ne: true } }).sort({ createdAt: -1 }).limit(limit).populate('author', 'username fullName avatar').lean(),
      LongVideo.find({ author: { $in: interactedAuthorIds }, _id: { $nin: allLikedContentIds }, isArchived: { $ne: true } }).sort({ createdAt: -1 }).limit(limit).populate('author', 'username fullName avatar').lean(),

      // Content from subscribed creators
      Post.find({ author: { $in: subscriptionIds }, _id: { $nin: allLikedContentIds }, isArchived: { $ne: true } }).sort({ createdAt: -1 }).limit(limit).populate('author', 'username fullName avatar').lean(),
      Short.find({ author: { $in: subscriptionIds }, _id: { $nin: allLikedContentIds }, isArchived: { $ne: true } }).sort({ createdAt: -1 }).limit(limit).populate('author', 'username fullName avatar').lean(),
      LongVideo.find({ author: { $in: subscriptionIds }, _id: { $nin: allLikedContentIds }, isArchived: { $ne: true } }).sort({ createdAt: -1 }).limit(limit).populate('author', 'username fullName avatar').lean(),
    ]);

    const recommendationPool = [
      ...similarTagPosts, ...similarTagShorts, ...similarTagLongVideos,
      ...authorPosts, ...authorShorts, ...authorLongVideos,
      ...subPosts, ...subShorts, ...subLongVideos
    ];

    // 4. Deduplicate and Score
    const uniqueContent = [];
    const seenIds = new Set(allLikedContentIds.map(id => id.toString()));
    for (const content of recommendationPool) {
      if (!seenIds.has(content._id.toString())) {
        seenIds.add(content._id.toString());
        uniqueContent.push(content);
      }
    }

    const scoredContent = uniqueContent.map(content => {
      let score = (content.likes?.length || 0) + (content.views || 0) * 0.1;
      
      // Boost score if from a subscribed creator
      if (subscriptionIds.includes(content.author?._id.toString())) {
        score *= 1.5;
      }
      
      // Boost score for common tags
      const commonTagsCount = content.tags?.filter(tag => interestTags.includes(tag)).length || 0;
      score *= (1 + commonTagsCount * 0.2);

      // Boost if from an author the user has liked before
      if (interactedAuthorIds.includes(content.author?._id.toString())) {
        score *= 1.3;
      }

      return { ...content, personalizedScore: score };
    });

    // 5. Sort and return
    const sortedContent = scoredContent
      .sort((a, b) => b.personalizedScore - a.personalizedScore)
      .slice(0, limit);

    res.status(200).json({ success: true, data: sortedContent });

  } catch (error) {
    console.error('Error in getPersonalizedRecommendations:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get trending recommendations
// @route   GET /api/recommendations/trending
// @access  Public
export const getTrendingRecommendations = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const trendingPosts = await getPopularPosts(limit);
    
    res.status(200).json({
      success: true,
      data: trendingPosts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get recommendations for a specific post (up next)
// @route   GET /api/recommendations/upnext/:postId
// @access  Public
export const getUpNextRecommendations = async (req, res) => {
  try {
    const { postId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    // Get the current post
    let currentPost = await Post.findById(postId);
    if (!currentPost) {
      currentPost = await Short.findById(postId);
    }
    if (!currentPost) {
      currentPost = await LongVideo.findById(postId);
    }
    
    if (!currentPost) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Get posts with similar tags
    const tags = currentPost.tags || [];
    const authorId = currentPost.author;
    
    // Find similar posts based on tags and author from all collections
    const searchPromises = [
      Post.find({ tags: { $in: tags }, _id: { $ne: postId }, isArchived: { $ne: true } }).sort({ createdAt: -1 }).limit(limit).populate('author', 'username fullName avatar').lean(),
      Short.find({ tags: { $in: tags }, _id: { $ne: postId }, isArchived: { $ne: true } }).sort({ createdAt: -1 }).limit(limit).populate('author', 'username fullName avatar').lean(),
      LongVideo.find({ tags: { $in: tags }, _id: { $ne: postId }, isArchived: { $ne: true } }).sort({ createdAt: -1 }).limit(limit).populate('author', 'username fullName avatar').lean(),
      Post.find({ author: authorId, _id: { $ne: postId }, isArchived: { $ne: true } }).sort({ createdAt: -1 }).limit(limit).populate('author', 'username fullName avatar').lean(),
      Short.find({ author: authorId, _id: { $ne: postId }, isArchived: { $ne: true } }).sort({ createdAt: -1 }).limit(limit).populate('author', 'username fullName avatar').lean(),
      LongVideo.find({ author: authorId, _id: { $ne: postId }, isArchived: { $ne: true } }).sort({ createdAt: -1 }).limit(limit).populate('author', 'username fullName avatar').lean()
    ];

    const results = await Promise.all(searchPromises);
    const tagPosts = [...results[0], ...results[1], ...results[2]];
    const authorPosts = [...results[3], ...results[4], ...results[5]];
    
    // Combine and deduplicate
    const allPosts = [...tagPosts, ...authorPosts];
    const uniquePosts = [];
    const seenIds = new Set();
    
    for (const post of allPosts) {
      if (!seenIds.has(post._id.toString())) {
        seenIds.add(post._id.toString());
        uniquePosts.push(post);
      }
    }
    
    // Sort by engagement and limit
    const sortedPosts = uniquePosts
      .map(post => ({
        ...post,
        engagementScore: (post.likes?.length || 0) * 2 + (post.views || 0) * 0.1 + (post.comments?.length || 0) * 3
      }))
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, limit);
    
    res.status(200).json({
      success: true,
      data: sortedPosts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get recommendations based on user subscriptions
// @route   GET /api/recommendations/subscriptions
// @access  Private
export const getSubscriptionRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 20;
    
    // Get current user with subscriptions
    const user = await User.findById(userId).lean();
    const subscriptions = user.subscribed || [];
    
    if (subscriptions.length === 0) {
      // If no subscriptions, return trending posts
      const trendingPosts = await getPopularPosts(limit);
      return res.status(200).json({
        success: true,
        data: trendingPosts,
        message: 'Showing trending posts as no subscriptions found'
      });
    }
    
    // Get recent posts from subscribed creators
    const subscriptionPosts = await Post.find({
      author: { $in: subscriptions },
      isArchived: { $ne: true }
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('author', 'username fullName avatar')
    .lean();
    
    res.status(200).json({
      success: true,
      data: subscriptionPosts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};