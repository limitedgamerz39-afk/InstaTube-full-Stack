import Post from '../models/Post.js';
import User from '../models/User.js';

// @desc    Get explore posts (trending/popular)
// @route   GET /api/explore/posts
// @access  Public
export const getExplorePosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get posts sorted by engagement (likes + comments)
    const posts = await Post.find({ isArchived: { $ne: true } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username fullName avatar subscriber')
      .lean();

    // Calculate engagement score
    const postsWithScore = posts.map((post) => ({
      ...post,
      engagementScore: (post.likes?.length || 0) * 2 + (post.comments?.length || 0),
    }));

    // Sort by engagement
    postsWithScore.sort((a, b) => b.engagementScore - a.engagementScore);

    res.status(200).json({
      success: true,
      data: postsWithScore,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get trending hashtags
// @route   GET /api/explore/hashtags
// @access  Public
export const getTrendingHashtags = async (req, res) => {
  try {
    const now = Date.now();
    const last7Days = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const last24h = new Date(now - 24 * 60 * 60 * 1000);
    const prev24hStart = new Date(now - 48 * 60 * 60 * 1000);
    const prev24hEnd = last24h;

    const recentPosts = await Post.find({
      hashtags: { $exists: true, $ne: [] },
      createdAt: { $gte: last7Days },
    }).lean();

    // Count hashtag frequency over last 7 days
    const hashtagCount = {};
    recentPosts.forEach((post) => {
      (post.hashtags || []).forEach((tag) => {
        hashtagCount[tag] = (hashtagCount[tag] || 0) + 1;
      });
    });

    // Count last 24h and previous 24h for growth indicators
    const last24Posts = await Post.find({
      hashtags: { $exists: true, $ne: [] },
      createdAt: { $gte: last24h },
    }).lean();
    const prev24Posts = await Post.find({
      hashtags: { $exists: true, $ne: [] },
      createdAt: { $gte: prev24hStart, $lt: prev24hEnd },
    }).lean();

    const last24Count = {};
    last24Posts.forEach((post) => {
      (post.hashtags || []).forEach((tag) => {
        last24Count[tag] = (last24Count[tag] || 0) + 1;
      });
    });
    const prev24Count = {};
    prev24Posts.forEach((post) => {
      (post.hashtags || []).forEach((tag) => {
        prev24Count[tag] = (prev24Count[tag] || 0) + 1;
      });
    });

    // Build array with growth metrics
    const trending = Object.entries(hashtagCount)
      .map(([tag, count]) => {
        const last = last24Count[tag] || 0;
        const prev = prev24Count[tag] || 0;
        const growthPct = prev === 0 ? (last > 0 ? 100 : 0) : Math.round(((last - prev) / prev) * 100);
        return { tag, count, last24h: last, prev24h: prev, growthPct };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);

    res.status(200).json({ success: true, data: trending });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Search by hashtag
// @route   GET /api/explore/tags/:tag
// @access  Public
export const getPostsByHashtag = async (req, res) => {
  try {
    const { tag } = req.params;
    const posts = await Post.find({
      hashtags: tag.toLowerCase(),
      isArchived: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .populate('author', 'username fullName avatar')
      .limit(50);

    res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get suggested users
// @route   GET /api/explore/users
// @access  Private
export const getSuggestedUsers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);

    // Get users with most subscriber that current user doesn't subscribe to
    const users = await User.find({
      _id: { $nin: [...currentUser.subscribed, currentUser._id] },
    })
      .select('username fullName avatar bio subscriber')
      .sort({ subscriber: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Trending posts with decay-based scoring
export const getTrendingPosts = async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 72; // lookback window
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const limit = parseInt(req.query.limit) || 50;

    const posts = await Post.find({
      isArchived: { $ne: true },
      createdAt: { $gte: since },
    })
      .populate('author', 'username fullName avatar')
      .lean();

    const now = Date.now();
    const halfLifeMs = 24 * 60 * 60 * 1000; // 24h decay
    const scored = posts
      .map((p) => {
        const likesCount = (p.likes || []).length;
        const commentsCount = (p.comments || []).length;
        const ageMs = Math.max(1, now - new Date(p.createdAt).getTime());
        const recencyBoost = Math.exp(-ageMs / halfLifeMs);
        const engagementScore = likesCount * 2 + commentsCount * 3;
        const score = engagementScore * 0.7 + recencyBoost * 100; // tune as needed
        return { ...p, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    res.status(200).json({ success: true, data: scored });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get suggested creators
// @route   GET /api/explore/creators
// @access  Private
export const getSuggestedCreators = async (req, res) => {
  try {
    // Get top creators based on subscriber count, excluding current user
    const creators = await User.find({ 
      role: { $in: ['creator', 'admin'] } // Only get users with creator or admin roles
    })
      .select('username fullName avatar bio subscriber')
      .sort({ subscriber: -1 })
      .limit(20)
      .lean();

    res.status(200).json({
      success: true,
      data: creators,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
