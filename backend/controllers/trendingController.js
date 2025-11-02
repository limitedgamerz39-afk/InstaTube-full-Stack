import Post from '../models/Post.js';
import User from '../models/User.js';

// @desc    Get trending videos
// @route   GET /api/trending/videos
// @access  Public
export const getTrendingVideos = async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '7d';
    const limit = parseInt(req.query.limit) || 50;

    const daysMap = { '1d': 1, '7d': 7, '30d': 30 };
    const days = daysMap[timeframe] || 7;

    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const trendingVideos = await Post.aggregate([
      {
        $match: {
          category: { $in: ['long', 'short'] },
          visibility: 'public',
          createdAt: { $gte: dateThreshold },
        },
      },
      {
        $addFields: {
          viewCount: { $ifNull: ['$views', 0] },
          likeCount: { $size: { $ifNull: ['$likes', []] } },
          commentCount: { $size: { $ifNull: ['$comments', []] } },
        },
      },
      {
        $addFields: {
          engagementScore: {
            $add: [
              { $multiply: ['$viewCount', 1] },
              { $multiply: ['$likeCount', 10] },
              { $multiply: ['$commentCount', 20] },
            ],
          },
        },
      },
      {
        $sort: { engagementScore: -1, createdAt: -1 },
      },
      {
        $limit: limit,
      },
    ]);

    const populatedVideos = await Post.populate(trendingVideos, {
      path: 'author',
      select: 'username profilePicture fullName verified',
    });

    res.json({ success: true, videos: populatedVideos });
  } catch (error) {
    console.error('Error fetching trending videos:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch trending videos' });
  }
};

// @desc    Get trending reels
// @route   GET /api/trending/reels
// @access  Public
export const getTrendingReels = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - 7);

    const trendingReels = await Post.aggregate([
      {
        $match: {
          category: 'short',
          visibility: 'public',
          createdAt: { $gte: dateThreshold },
        },
      },
      {
        $addFields: {
          viewCount: { $ifNull: ['$views', 0] },
          likeCount: { $size: { $ifNull: ['$likes', []] } },
          commentCount: { $size: { $ifNull: ['$comments', []] } },
        },
      },
      {
        $addFields: {
          viralScore: {
            $add: [
              { $multiply: ['$viewCount', 2] },
              { $multiply: ['$likeCount', 15] },
              { $multiply: ['$commentCount', 30] },
            ],
          },
        },
      },
      {
        $sort: { viralScore: -1 },
      },
      {
        $limit: limit,
      },
    ]);

    const populatedReels = await Post.populate(trendingReels, {
      path: 'author',
      select: 'username profilePicture fullName verified',
    });

    res.json({ success: true, reels: populatedReels });
  } catch (error) {
    console.error('Error fetching trending reels:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch trending reels' });
  }
};

// @desc    Get trending hashtags
// @route   GET /api/trending/hashtags
// @access  Public
export const getTrendingHashtags = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - 7);

    const trendingHashtags = await Post.aggregate([
      {
        $match: {
          visibility: 'public',
          createdAt: { $gte: dateThreshold },
          hashtags: { $exists: true, $ne: [] },
        },
      },
      {
        $unwind: '$hashtags',
      },
      {
        $group: {
          _id: '$hashtags',
          count: { $sum: 1 },
          totalLikes: { $sum: { $size: { $ifNull: ['$likes', []] } } },
          totalComments: { $sum: { $size: { $ifNull: ['$comments', []] } } },
        },
      },
      {
        $addFields: {
          popularity: {
            $add: [
              { $multiply: ['$count', 5] },
              { $multiply: ['$totalLikes', 2] },
              '$totalComments',
            ],
          },
        },
      },
      {
        $sort: { popularity: -1 },
      },
      {
        $limit: limit,
      },
      {
        $project: {
          hashtag: '$_id',
          postCount: '$count',
          popularity: 1,
          _id: 0,
        },
      },
    ]);

    res.json({ success: true, hashtags: trendingHashtags });
  } catch (error) {
    console.error('Error fetching trending hashtags:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch trending hashtags' });
  }
};

// @desc    Get trending creators
// @route   GET /api/trending/creators
// @access  Public
export const getTrendingCreators = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - 30);

    const trendingCreators = await User.aggregate([
      {
        $match: {
          role: { $in: ['creator', 'business', 'admin'] },
        },
      },
      {
        $addFields: {
          followerCount: { $size: { $ifNull: ['$followers', []] } },
        },
      },
      {
        $lookup: {
          from: 'posts',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$author', '$$userId'] },
                createdAt: { $gte: dateThreshold },
                visibility: 'public',
              },
            },
            {
              $addFields: {
                likeCount: { $size: { $ifNull: ['$likes', []] } },
                commentCount: { $size: { $ifNull: ['$comments', []] } },
              },
            },
            {
              $group: {
                _id: null,
                totalPosts: { $sum: 1 },
                totalLikes: { $sum: '$likeCount' },
                totalComments: { $sum: '$commentCount' },
              },
            },
          ],
          as: 'stats',
        },
      },
      {
        $unwind: { path: '$stats', preserveNullAndEmptyArrays: true },
      },
      {
        $addFields: {
          totalPosts: { $ifNull: ['$stats.totalPosts', 0] },
          totalLikes: { $ifNull: ['$stats.totalLikes', 0] },
          totalComments: { $ifNull: ['$stats.totalComments', 0] },
        },
      },
      {
        $addFields: {
          trendingScore: {
            $add: [
              { $multiply: ['$followerCount', 1] },
              { $multiply: ['$totalPosts', 50] },
              { $multiply: ['$totalLikes', 10] },
              { $multiply: ['$totalComments', 20] },
            ],
          },
        },
      },
      {
        $sort: { trendingScore: -1 },
      },
      {
        $limit: limit,
      },
      {
        $project: {
          username: 1,
          fullName: 1,
          profilePicture: 1,
          verified: 1,
          bio: 1,
          followerCount: 1,
          totalPosts: 1,
          trendingScore: 1,
        },
      },
    ]);

    res.json({ success: true, creators: trendingCreators });
  } catch (error) {
    console.error('Error fetching trending creators:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch trending creators' });
  }
};
