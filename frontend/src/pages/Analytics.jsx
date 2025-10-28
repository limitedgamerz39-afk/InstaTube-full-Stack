import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { postAPI, userAPI } from '../services/api';
import {
  AiOutlineHeart,
  AiOutlineComment,
  AiOutlineEye,
  AiOutlineRise,
} from 'react-icons/ai';
import { BsGraphUp, BsPeople, BsImage } from 'react-icons/bs';

const Analytics = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    totalViews: 0,
    followers: 0,
    following: 0,
    engagementRate: 0,
  });
  const [topPosts, setTopPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [postsRes, profileRes] = await Promise.all([
        postAPI.getFeed(),
        userAPI.getProfile(user.username),
      ]);

      const userPosts = postsRes.data.data.filter(
        (post) => post.author._id === user._id
      );

      const totalLikes = userPosts.reduce((sum, post) => sum + post.likes.length, 0);
      const totalComments = userPosts.reduce(
        (sum, post) => sum + post.comments.length,
        0
      );

      // Sort posts by engagement
      const sortedPosts = userPosts
        .map((post) => ({
          ...post,
          engagement: post.likes.length * 2 + post.comments.length,
        }))
        .sort((a, b) => b.engagement - a.engagement)
        .slice(0, 5);

      setStats({
        totalPosts: userPosts.length,
        totalLikes,
        totalComments,
        totalViews: totalLikes + totalComments * 3, // Estimate
        followers: profileRes.data.data.followers.length,
        following: profileRes.data.data.following.length,
        engagementRate:
          userPosts.length > 0
            ? ((totalLikes + totalComments) / userPosts.length).toFixed(1)
            : 0,
      });
      setTopPosts(sortedPosts);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 dark:from-dark-bg dark:via-dark-bg dark:to-dark-bg pb-20 md:pb-8">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-primary text-white rounded-3xl p-8 mb-8 shadow-glow">
          <h1 className="text-4xl font-bold mb-2 flex items-center">
            <BsGraphUp className="mr-3" />
            Analytics Dashboard
          </h1>
          <p className="text-purple-100">Track your InstaTube performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Total Posts */}
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-lg hover:shadow-glow transition-all">
            <div className="flex items-center justify-between mb-3">
              <BsImage className="text-purple-500" size={32} />
              <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-full">
                Posts
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-800 dark:text-white mb-1">
              {stats.totalPosts}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Posts</p>
          </div>

          {/* Total Likes */}
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-lg hover:shadow-glow-pink transition-all">
            <div className="flex items-center justify-between mb-3">
              <AiOutlineHeart className="text-red-500" size={32} />
              <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded-full">
                Likes
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-800 dark:text-white mb-1">
              {stats.totalLikes}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Likes</p>
          </div>

          {/* Total Comments */}
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-lg hover:shadow-glow transition-all">
            <div className="flex items-center justify-between mb-3">
              <AiOutlineComment className="text-blue-500" size={32} />
              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                Comments
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-800 dark:text-white mb-1">
              {stats.totalComments}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Comments
            </p>
          </div>

          {/* Followers */}
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-lg hover:shadow-glow transition-all">
            <div className="flex items-center justify-between mb-3">
              <BsPeople className="text-green-500" size={32} />
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-full">
                Followers
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-800 dark:text-white mb-1">
              {stats.followers}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Followers</p>
          </div>
        </div>

        {/* Engagement Rate Card */}
        <div className="bg-gradient-secondary text-white rounded-3xl p-8 mb-8 shadow-glow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 mb-2">Average Engagement per Post</p>
              <p className="text-5xl font-bold">{stats.engagementRate}</p>
            </div>
            <div className="w-24 h-24 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center">
              <AiOutlineRise size={48} />
            </div>
          </div>
        </div>

        {/* Top Performing Posts */}
        <div className="bg-white dark:bg-dark-card rounded-3xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
            🏆 Top Performing Posts
          </h2>
          <div className="space-y-4">
            {topPosts.map((post, index) => (
              <div
                key={post._id}
                className="flex items-center space-x-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl hover:scale-105 transition-transform"
              >
                <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
                <img
                  src={post.media?.[0]?.url || post.mediaUrl}
                  alt="Post"
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {post.caption || 'No caption'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2 text-sm mb-1">
                    <AiOutlineHeart className="text-red-500" />
                    <span className="font-semibold">{post.likes.length}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <AiOutlineComment className="text-blue-500" />
                    <span className="font-semibold">{post.comments.length}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Growth Insights */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="bg-gradient-to-br from-green-400 to-blue-500 text-white rounded-3xl p-6 shadow-glow">
            <h3 className="text-xl font-bold mb-4">📈 Growth Tips</h3>
            <ul className="space-y-2 text-sm">
              <li>✓ Post consistently (3-5 times/week)</li>
              <li>✓ Use trending hashtags</li>
              <li>✓ Engage with your audience</li>
              <li>✓ Share stories daily</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-purple-400 to-pink-500 text-white rounded-3xl p-6 shadow-glow-pink">
            <h3 className="text-xl font-bold mb-4">🎯 Quick Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Following</span>
                <span className="font-bold">{stats.following}</span>
              </div>
              <div className="flex justify-between">
                <span>Est. Reach</span>
                <span className="font-bold">{stats.totalViews}</span>
              </div>
              <div className="flex justify-between">
                <span>Interactions</span>
                <span className="font-bold">
                  {stats.totalLikes + stats.totalComments}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
