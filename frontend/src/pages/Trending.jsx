import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trendingAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiTrendingUp, FiHash, FiUsers, FiPlay, FiBarChart2, FiClock, FiHeart, FiEye } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import Loader from '../components/Loader';

function Trending() {
  const [activeTab, setActiveTab] = useState('videos');
  const [videos, setVideos] = useState([]);
  const [hashtags, setHashtags] = useState([]);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('7d');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrendingData();
  }, [activeTab, timeframe]);

  const fetchTrendingData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'videos') {
        const response = await trendingAPI.getTrendingVideos(timeframe);
        setVideos(response.data.videos || []);
      } else if (activeTab === 'hashtags') {
        const response = await trendingAPI.getTrendingHashtags();
        setHashtags(response.data.hashtags || []);
      } else if (activeTab === 'creators') {
        const response = await trendingAPI.getTrendingCreators();
        setCreators(response.data.creators || []);
      }
    } catch (error) {
      console.error('Error fetching trending data:', error);
      toast.error('Failed to load trending data');
    } finally {
      setLoading(false);
    }
  };

  // Format large numbers
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-6 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <FiTrendingUp className="w-8 h-8 text-purple-500" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trending</h1>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-6 py-2 rounded-lg whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'videos'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <FiPlay className="w-4 h-4" />
            Videos
          </button>
          <button
            onClick={() => setActiveTab('hashtags')}
            className={`px-6 py-2 rounded-lg whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'hashtags'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <FiHash className="w-4 h-4" />
            Hashtags
          </button>
          <button
            onClick={() => setActiveTab('creators')}
            className={`px-6 py-2 rounded-lg whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'creators'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <FiUsers className="w-4 h-4" />
            Creators
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-2 rounded-lg whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <FiBarChart2 className="w-4 h-4" />
            Analytics
          </button>
        </div>

        {activeTab === 'videos' && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setTimeframe('1d')}
              className={`px-4 py-2 rounded-lg text-sm flex items-center gap-1 ${
                timeframe === '1d'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <FiClock className="w-3 h-3" />
              Today
            </button>
            <button
              onClick={() => setTimeframe('7d')}
              className={`px-4 py-2 rounded-lg text-sm flex items-center gap-1 ${
                timeframe === '7d'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <FiClock className="w-3 h-3" />
              This Week
            </button>
            <button
              onClick={() => setTimeframe('30d')}
              className={`px-4 py-2 rounded-lg text-sm flex items-center gap-1 ${
                timeframe === '30d'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <FiClock className="w-3 h-3" />
              This Month
            </button>
          </div>
        )}

        {loading ? (
          <Loader />
        ) : (
          <div>
            {activeTab === 'videos' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {videos.map((video, index) => (
                  <div
                    key={video._id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition cursor-pointer group"
                    onClick={() => navigate(video.category === 'short' ? `/reels/${video._id}` : `/watch/${video._id}`)}
                  >
                    <div className="relative aspect-video bg-gray-200 dark:bg-gray-700 rounded-t-lg overflow-hidden">
                      {video.media && video.media[0] && (
                        <img
                          src={video.thumbnailUrl || video.media[0].url}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      <div className="absolute top-2 left-2 bg-purple-500 text-white px-2 py-1 rounded text-xs font-bold">
                        #{index + 1}
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {video.duration ? `${Math.floor(video.duration/60)}:${String(video.duration%60).padStart(2,'0')}` : 'Video'}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                        <div className="text-white text-sm font-semibold truncate">
                          {video.title || 'Untitled'}
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">
                        {video.title || 'Untitled'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {video.author?.username}
                      </p>
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <div className="flex items-center gap-1">
                          <FiEye className="w-3 h-3" />
                          <span>{formatNumber(video.viewCount || 0)} views</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FiHeart className="w-3 h-3" />
                          <span>{formatNumber(video.likeCount || 0)} likes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'hashtags' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hashtags.map((tag, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition hover:bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20"
                    onClick={() => navigate(`/hashtag/${tag.hashtag}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-purple-100 dark:bg-purple-900/20 p-4 rounded-full">
                        <FiHash className="w-8 h-8 text-purple-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          #{tag.hashtag}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatNumber(tag.postCount)} posts
                        </p>
                        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" 
                            style={{ width: `${Math.min(100, (tag.postCount / Math.max(1, hashtags[0]?.postCount)) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-purple-500">
                        #{index + 1}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'creators' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {creators.map((creator, index) => (
                  <div
                    key={creator._id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition hover:bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20"
                    onClick={() => navigate(`/profile/${creator.username}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={creator.profilePicture || '/default-avatar.png'}
                          alt={creator.username}
                          className="w-16 h-16 rounded-full object-cover border-2 border-purple-500"
                        />
                        <div className="absolute -top-1 -right-1 bg-purple-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {creator.fullName || creator.username}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          @{creator.username}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-500">
                            {formatNumber(creator.followerCount)} subscribers
                          </span>
                          <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full">
                            {creator.category || 'Creator'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Avg. Views: {formatNumber(creator.avgViews || 0)}</span>
                        <span>Engagement: {creator.engagementRate || 0}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Trending Analytics</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg p-6 text-white">
                    <div className="text-3xl font-bold">{videos.length}</div>
                    <div className="text-lg">Trending Videos</div>
                    <div className="text-sm opacity-80 mt-2">This {timeframe === '1d' ? 'day' : timeframe === '7d' ? 'week' : 'month'}</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg p-6 text-white">
                    <div className="text-3xl font-bold">{hashtags.length}</div>
                    <div className="text-lg">Trending Hashtags</div>
                    <div className="text-sm opacity-80 mt-2">Most used tags</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-teal-500 rounded-lg p-6 text-white">
                    <div className="text-3xl font-bold">{creators.length}</div>
                    <div className="text-lg">Top Creators</div>
                    <div className="text-sm opacity-80 mt-2">Most subscribed</div>
                  </div>
                </div>
                
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Categories</h3>
                  <div className="space-y-4">
                    {['Entertainment', 'Education', 'Gaming', 'Music', 'Sports', 'News'].map((category, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-32 text-sm text-gray-600 dark:text-gray-400">{category}</div>
                        <div className="flex-1 ml-4">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div 
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full" 
                              style={{ width: `${100 - index * 15}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="w-12 text-right text-sm text-gray-600 dark:text-gray-400">
                          {100 - index * 15}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default Trending;