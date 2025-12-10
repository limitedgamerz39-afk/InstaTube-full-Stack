import { useState, useEffect } from 'react';
import { postAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import { BsClock, BsHeart } from 'react-icons/bs';
import { FiPlay } from 'react-icons/fi';

const History = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('history'); // 'history' or 'liked'
  const [historyPosts, setHistoryPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, [activeTab]);

  const fetchContent = async () => {
    try {
      if (activeTab === 'history') {
        // For now, we'll use a placeholder since there's no specific API endpoint
        // In a real implementation, this would call something like:
        // const response = await postAPI.getHistory();
        // setHistoryPosts(response.data.data);
        setHistoryPosts([]);
      } else if (activeTab === 'liked') {
        // For now, we'll use a placeholder since there's no specific API endpoint
        // In a real implementation, this would call something like:
        // const response = await postAPI.getLikedPosts();
        // setLikedPosts(response.data.data);
        setLikedPosts([]);
      }
    } catch (error) {
      console.error(`Failed to load ${activeTab} posts:`, error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getCurrentPosts = () => {
    return activeTab === 'history' ? historyPosts : likedPosts;
  };

  if (loading && getCurrentPosts().length === 0) {
    return <Loader />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-20 md:pb-8">
      <h1 className="text-2xl font-bold mb-6 dark:text-white flex items-center">
        <BsClock className="mr-2" />
        {activeTab === 'history' ? 'Watch History' : 'Liked Videos'}
      </h1>

      {/* Tab Navigation */}
      <div className="flex mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'history'
              ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-500'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Watch History
        </button>
        <button
          onClick={() => setActiveTab('liked')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'liked'
              ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-500'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Liked Videos
        </button>
      </div>

      {getCurrentPosts().length === 0 ? (
        <div className="card p-12 text-center">
          {activeTab === 'history' ? (
            <>
              <BsClock size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No watch history yet
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Videos you watch will appear here
              </p>
            </>
          ) : (
            <>
              <BsHeart size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No liked videos yet
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Videos you like will appear here
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {getCurrentPosts().map((post) => (
            <div
              key={post._id}
              onClick={() => {
                // Navigate based on duration
                // If duration is less than or equal to 60 seconds, go to reels
                // Otherwise, go to watch page
                if (post.durationSec && post.durationSec <= 60) {
                  navigate(`/reels/${post._id}`);
                } else if (post.category === 'short') {
                  // Fallback for short category posts
                  navigate(`/reels/${post._id}`);
                } else {
                  navigate(`/watch/${post._id}`);
                }
              }}
              className="cursor-pointer hover:opacity-90 transition rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow"
            >
              <div className="relative aspect-video">
                {post.category === 'long' || post.category === 'short' ? (
                  // Video post
                  <video
                    src={post.media?.[0]?.url || post.mediaUrl}
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                  />
                ) : (
                  // Image post
                  <img
                    src={post.media?.[0]?.url || post.mediaUrl}
                    alt={post.caption}
                    className="w-full h-full object-cover"
                  />
                )}
                {post.durationSec && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(post.durationSec)}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end p-3">
                  <div className="text-white text-sm font-semibold truncate">
                    {post.caption || 'Untitled'}
                  </div>
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">
                  {post.caption || 'Untitled'}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                  {post.author?.username}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;