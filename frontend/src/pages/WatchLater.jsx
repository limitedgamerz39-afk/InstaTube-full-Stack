import { useState, useEffect } from 'react';
import { watchLaterAPI, postAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiEye, FiClock } from 'react-icons/fi';

const WatchLater = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWatchLaterVideos();
  }, []);

  const fetchWatchLaterVideos = async () => {
    try {
      const response = await watchLaterAPI.getWatchLater();
      setVideos(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load watch later videos');
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchLater = async (videoId) => {
    try {
      await watchLaterAPI.removeFromWatchLater(videoId);
      setVideos(videos.filter(video => video._id !== videoId));
      toast.success('Video removed from watch later');
    } catch (error) {
      toast.error('Failed to remove video from watch later');
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatViews = (count) => {
    if (!count) return '0 views';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M views`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K views`;
    return `${count} views`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-red-600"></div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">⏰</div>
          <h2 className="text-2xl font-bold mb-2 dark:text-white">No Videos in Watch Later</h2>
          <p className="text-gray-600 dark:text-gray-400">Start adding videos to watch later!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold dark:text-white flex items-center">
          <FiClock className="mr-3" />
          Watch Later
        </h1>
        <span className="bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full dark:bg-red-900 dark:text-red-100">
          {videos.length} videos
        </span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {videos.map((video) => (
          <div
            key={video._id}
            className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
            onClick={() => navigate(`/watch/${video._id}`)}
          >
            <div className="relative bg-black aspect-video overflow-hidden">
              <video 
                src={video.media?.[0]?.url || video.mediaUrl} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                muted
                preload="auto"
              />
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                {formatDuration(video.durationSec)}
              </div>
              <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center">
                <FiEye className="mr-1" size={12} />
                {formatViews(video.views || 0)}
              </div>
              
              {/* Remove from Watch Later Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromWatchLater(video._id);
                }}
                className="absolute top-2 left-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="p-4">
              <h3 className="font-semibold text-sm line-clamp-2 mb-2 dark:text-white group-hover:text-red-600 transition">
                {video.title}
              </h3>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <img
                    src={video.author?.avatar || 'https://ui-avatars.com/api/?name=U&background=random'}
                    alt={video.author?.username || 'User'}
                    className="w-8 h-8 rounded-full mr-2"
                  />
                  <p className="text-xs font-medium dark:text-gray-300">{video.author?.username || 'Unknown'}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WatchLater;