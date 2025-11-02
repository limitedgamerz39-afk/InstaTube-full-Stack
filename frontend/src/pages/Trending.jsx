import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trendingAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiTrendingUp, FiHash, FiUsers, FiPlay } from 'react-icons/fi';
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
            className={`px-6 py-2 rounded-lg whitespace-nowrap ${
              activeTab === 'videos'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            Videos
          </button>
          <button
            onClick={() => setActiveTab('hashtags')}
            className={`px-6 py-2 rounded-lg whitespace-nowrap ${
              activeTab === 'hashtags'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            Hashtags
          </button>
          <button
            onClick={() => setActiveTab('creators')}
            className={`px-6 py-2 rounded-lg whitespace-nowrap ${
              activeTab === 'creators'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            Creators
          </button>
        </div>

        {activeTab === 'videos' && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setTimeframe('1d')}
              className={`px-4 py-2 rounded-lg text-sm ${
                timeframe === '1d'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeframe('7d')}
              className={`px-4 py-2 rounded-lg text-sm ${
                timeframe === '7d'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeframe('30d')}
              className={`px-4 py-2 rounded-lg text-sm ${
                timeframe === '30d'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
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
                    className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition cursor-pointer"
                    onClick={() => navigate(video.category === 'short' ? `/reels/${video._id}` : `/videos/${video._id}`)}
                  >
                    <div className="relative aspect-video bg-gray-200 dark:bg-gray-700 rounded-t-lg overflow-hidden">
                      {video.media && video.media[0] && (
                        <img
                          src={video.thumbnailUrl || video.media[0].url}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute top-2 left-2 bg-purple-500 text-white px-2 py-1 rounded text-xs font-bold">
                        #{index + 1}
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
                        <span>{video.viewCount || 0} views</span>
                        <span>{video.likeCount || 0} likes</span>
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
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition"
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
                          {tag.postCount} posts
                        </p>
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
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition"
                    onClick={() => navigate(`/profile/${creator.username}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={creator.profilePicture || '/default-avatar.png'}
                          alt={creator.username}
                          className="w-16 h-16 rounded-full object-cover"
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
                        <p className="text-sm text-gray-500 mt-1">
                          {creator.followerCount} followers
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
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
