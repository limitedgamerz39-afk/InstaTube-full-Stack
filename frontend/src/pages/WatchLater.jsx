import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { watchLaterAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiClock, FiTrash2, FiX } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import Loader from '../components/Loader';

function WatchLater() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWatchLater();
  }, []);

  const fetchWatchLater = async () => {
    try {
      setLoading(true);
      const response = await watchLaterAPI.getWatchLater();
      setVideos(response.data.videos || []);
    } catch (error) {
      console.error('Error fetching Watch Later:', error);
      toast.error('Failed to load Watch Later');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (postId) => {
    try {
      await watchLaterAPI.removeFromWatchLater(postId);
      setVideos(videos.filter((v) => v.post._id !== postId));
      toast.success('Removed from Watch Later');
    } catch (error) {
      console.error('Error removing video:', error);
      toast.error('Failed to remove video');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all videos from Watch Later?')) return;

    try {
      await watchLaterAPI.clearWatchLater();
      setVideos([]);
      toast.success('Watch Later cleared');
    } catch (error) {
      console.error('Error clearing Watch Later:', error);
      toast.error('Failed to clear Watch Later');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-6 pb-20">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <FiClock className="w-8 h-8 text-purple-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Watch Later</h1>
          </div>
          {videos.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-4 py-2 text-red-500 border border-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <FiTrash2 /> Clear All
            </button>
          )}
        </div>

        {videos.length === 0 ? (
          <div className="text-center py-20">
            <FiClock className="w-20 h-20 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">No videos in Watch Later</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              Save videos to watch them later
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos.map(({ post, addedAt }) => (
              <div
                key={post._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition group relative"
              >
                <div
                  className="cursor-pointer"
                  onClick={() => navigate(post.category === 'short' ? `/reels/${post._id}` : `/videos/${post._id}`)}
                >
                  <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-t-lg overflow-hidden">
                    {post.media && post.media[0] && (
                      <img
                        src={post.thumbnailUrl || post.media[0].url}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">
                      {post.title || 'Untitled'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {post.author?.username}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Added {new Date(addedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(post._id)}
                  className="absolute top-2 right-2 bg-black bg-opacity-70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
                >
                  <FiX />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default WatchLater;
