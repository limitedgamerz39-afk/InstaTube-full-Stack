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
    subscriber: 0,
    subscribed: 0,
    engagementRate: 0,
  });
  const [topPosts, setTopPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewerDemographics, setViewerDemographics] = useState({
    ageGroups: [
      { range: '13-17', percentage: 15 },
      { range: '18-24', percentage: 35 },
      { range: '25-34', percentage: 28 },
      { range: '35-44', percentage: 15 },
      { range: '45+', percentage: 7 }
    ],
    genders: [
      { gender: 'Male', percentage: 55 },
      { gender: 'Female', percentage: 42 },
      { gender: 'Other', percentage: 3 }
    ],
    locations: [
      { country: 'United States', percentage: 40 },
      { country: 'India', percentage: 25 },
      { country: 'United Kingdom', percentage: 10 },
      { country: 'Canada', percentage: 8 },
      { country: 'Australia', percentage: 7 },
      { country: 'Other', percentage: 10 }
    ]
  });
  const [retentionData, setRetentionData] = useState([
    100, 95, 90, 85, 80, 78, 75, 72, 70, 68, 65, 63, 60, 58, 55, 53, 50, 48, 45, 43,
    40, 38, 35, 33, 30, 28, 25, 23, 20, 18, 15, 13, 10, 8, 5, 3, 2, 1, 0, 0
  ]);
  const [watchTimeData, setWatchTimeData] = useState({
    today: 1250,
    thisWeek: 8750,
    thisMonth: 32500,
    averagePerVideo: 4.5
  });
  const [engagementMetrics, setEngagementMetrics] = useState({
    likes: 12500,
    comments: 3200,
    shares: 1800,
    saves: 2100,
    clickThroughRate: 8.5
  });
  
  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    // Check if user is available
    if (!user || !user.username) {
      console.error('User not available for analytics');
      setLoading(false);
      return;
    }
    
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
        subscriber: profileRes.data.data.subscriber.length,
        subscribed: profileRes.data.data.subscribed.length,
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
          <p className="text-purple-100">Track your D4D HUB performance</p>
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

          {/* subscriber */}
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-lg hover:shadow-glow transition-all">
            <div className="flex items-center justify-between mb-3">
              <BsPeople className="text-green-500" size={32} />
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-full">
                subscriber
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-800 dark:text-white mb-1">
              {stats.subscriber}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">subscriber</p>
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
                <span>subscribed</span>
                <span className="font-bold">{stats.subscribed}</span>
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
        
        {/* Viewer Demographics */}
        <div className="bg-white dark:bg-dark-card rounded-3xl p-8 shadow-lg mt-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
            📊 Viewer Demographics
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Age Groups */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Age Distribution</h3>
              <div className="space-y-3">
                {viewerDemographics.ageGroups.map((group, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{group.range}</span>
                      <span className="text-sm font-medium text-gray-800 dark:text-white">{group.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" 
                        style={{ width: `${group.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Gender Distribution */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Gender Distribution</h3>
              <div className="space-y-3">
                {viewerDemographics.genders.map((gender, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{gender.gender}</span>
                      <span className="text-sm font-medium text-gray-800 dark:text-white">{gender.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-teal-500 h-2 rounded-full" 
                        style={{ width: `${gender.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Location Distribution */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Top Locations</h3>
              <div className="space-y-3">
                {viewerDemographics.locations.map((location, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{location.country}</span>
                      <span className="text-sm font-medium text-gray-800 dark:text-white">{location.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-yellow-500 h-2 rounded-full" 
                        style={{ width: `${location.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Retention Graph */}
        <div className="bg-white dark:bg-dark-card rounded-3xl p-8 shadow-lg mt-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
            📈 Watch Time Retention
          </h2>
          <div className="h-64 w-full">
            <div className="relative h-full w-full">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>100%</span>
                <span>75%</span>
                <span>50%</span>
                <span>25%</span>
                <span>0%</span>
              </div>
              
              {/* Graph area */}
              <div className="ml-8 h-full">
                {/* Grid lines */}
                <div className="absolute inset-0 ml-8 flex flex-col justify-between">
                  {[0, 25, 50, 75, 100].map((percent) => (
                    <div key={percent} className="border-t border-gray-200 dark:border-gray-700"></div>
                  ))}
                </div>
                
                {/* Retention curve */}
                <div className="absolute inset-0 ml-8 flex items-end">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polyline
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="2"
                      points={retentionData.map((value, index) => 
                        `${(index / (retentionData.length - 1)) * 100},${100 - value}`
                      ).join(' ')}
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#EC4899" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                
                {/* X-axis labels */}
                <div className="absolute bottom-0 left-8 right-0 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            This graph shows how viewer engagement changes throughout your videos. 
            Drops may indicate points where viewers lose interest.
          </p>
        </div>
        
        {/* Watch Time & Engagement Metrics */}
        <div className="grid md:grid-cols-2 gap-8 mt-8">
          {/* Watch Time Stats */}
          <div className="bg-white dark:bg-dark-card rounded-3xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
              ⏱️ Watch Time
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">Today</span>
                <span className="font-semibold text-gray-800 dark:text-white">{watchTimeData.today} minutes</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">This Week</span>
                <span className="font-semibold text-gray-800 dark:text-white">{watchTimeData.thisWeek} minutes</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">This Month</span>
                <span className="font-semibold text-gray-800 dark:text-white">{watchTimeData.thisMonth} minutes</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">Avg. Per Video</span>
                <span className="font-semibold text-gray-800 dark:text-white">{watchTimeData.averagePerVideo} minutes</span>
              </div>
            </div>
          </div>
          
          {/* Engagement Metrics */}
          <div className="bg-white dark:bg-dark-card rounded-3xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
              💬 Engagement Metrics
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">Likes</span>
                <span className="font-semibold text-gray-800 dark:text-white">{engagementMetrics.likes.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">Comments</span>
                <span className="font-semibold text-gray-800 dark:text-white">{engagementMetrics.comments.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">Shares</span>
                <span className="font-semibold text-gray-800 dark:text-white">{engagementMetrics.shares.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">Saves</span>
                <span className="font-semibold text-gray-800 dark:text-white">{engagementMetrics.saves.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">Click-Through Rate</span>
                <span className="font-semibold text-gray-800 dark:text-white">{engagementMetrics.clickThroughRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
