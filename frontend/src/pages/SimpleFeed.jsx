import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFeed } from '../services/queryClient';
import { postAPI } from '../services/api';
import { 
  FiHeart, 
  FiMessageSquare, 
  FiBookmark, 
  FiPlay,
  FiUser,
  FiHome,
  FiCompass,
  FiTrendingUp
} from 'react-icons/fi';
import { BsFilm } from 'react-icons/bs';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const SimpleFeed = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('popular');
  const [likedPosts, setLikedPosts] = useState({});
  const [savedPosts, setSavedPosts] = useState({});
  const { data: feedData, isLoading, isError, error, refetch } = useFeed(1, 20);
  
  const posts = feedData?.data?.data || [];

  // Filter posts to show only long videos (60+ seconds)
  const filterPosts = (posts) => {
    const longVideos = posts.filter(post => {
      return typeof post.durationSec === 'number' ? post.durationSec >= 60 : true;
    });
    
    if (filter === 'popular') {
      return [...longVideos].sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
    } else if (filter === 'recent') {
      return [...longVideos].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (filter === 'trending') {
      return [...longVideos].sort((a, b) => (b.views || 0) - (a.views || 0));
    }
    return longVideos;
  };

  const handleLike = async (postId) => {
    try {
      await postAPI.likePost(postId);
      setLikedPosts(prev => ({
        ...prev,
        [postId]: !prev[postId]
      }));
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const handleSave = async (postId) => {
    try {
      await postAPI.savePost(postId);
      setSavedPosts(prev => ({
        ...prev,
        [postId]: !prev[postId]
      }));
    } catch (error) {
      toast.error('Failed to save post');
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDuration = (seconds) => {
    if (typeof seconds !== 'number') return '';
    if (seconds >= 3600) {
      return `${Math.floor(seconds/3600)}:${String(Math.floor((seconds%3600)/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
    }
    return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
  };

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2 dark:text-white">Something went wrong</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error?.message || 'Failed to load feed'}</p>
          <button 
            onClick={refetch}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold dark:text-white">Feed</h1>
            <div className="flex items-center space-x-2">
              <Link to="/explore" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <FiCompass className="text-gray-600 dark:text-gray-300" size={20} />
              </Link>
              <Link to="/" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <FiHome className="text-gray-600 dark:text-gray-300" size={20} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex space-x-2 overflow-x-auto pb-2 hide-scrollbar">
          <button
            onClick={() => setFilter('popular')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              filter === 'popular'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <FiTrendingUp className="inline mr-1" size={14} />
            Popular
          </button>
          <button
            onClick={() => setFilter('recent')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              filter === 'recent'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <FiUser className="inline mr-1" size={14} />
            Recent
          </button>
          <button
            onClick={() => setFilter('trending')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              filter === 'trending'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <FiTrendingUp className="inline mr-1" size={14} />
            Trending
          </button>
        </div>
      </div>

      {/* Feed Content */}
      <div className="max-w-2xl mx-auto px-4 pb-20">
        {isLoading ? (
          <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden animate-pulse">
                <div className="h-64 bg-gray-200 dark:bg-gray-700"></div>
                <div className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    </div>
                  </div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center shadow-sm">
            <div className="text-4xl mb-4">📺</div>
            <h2 className="text-xl font-bold mb-2 dark:text-white">No Videos Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Be the first to upload a video or follow some creators!
            </p>
            <Link 
              to="/explore" 
              className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Explore Videos
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filterPosts(posts).map((post) => (
              <div 
                key={post._id} 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition"
                onClick={() => navigate(`/watch/${post._id}`)}
              >
                {/* Video Thumbnail */}
                <div className="relative aspect-video bg-black">
                  {post.media?.[0]?.thumbnail ? (
                    <img 
                      src={post.media[0].thumbnail} 
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <BsFilm className="text-gray-600" size={40} />
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(post.durationSec)}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/50 rounded-full p-3">
                      <FiPlay className="text-white" size={24} />
                    </div>
                  </div>
                </div>
                
                {/* Post Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <img
                        src={post.author?.avatar || `https://ui-avatars.com/api/?name=${post.author?.username}&background=random`}
                        alt={post.author?.username}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(post.author?.username || 'U') + '&background=random&size=200';
                        }}
                      />
                      <div>
                        <h3 className="font-semibold dark:text-white">{post.author?.username}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <h2 className="font-semibold mb-3 dark:text-white line-clamp-2">
                    {post.title}
                  </h2>
                  
                  {/* Engagement */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(post._id);
                        }}
                        className={`flex items-center space-x-1 ${
                          likedPosts[post._id] ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <FiHeart size={18} className={likedPosts[post._id] ? 'fill-current' : ''} />
                        <span className="text-sm">{formatNumber(post.likes?.length || 0)}</span>
                      </button>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/watch/${post._id}`);
                        }}
                        className="flex items-center space-x-1 text-gray-600 dark:text-gray-400"
                      >
                        <FiMessageSquare size={18} />
                        <span className="text-sm">{formatNumber(post.comments?.length || 0)}</span>
                      </button>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSave(post._id);
                      }}
                      className={`p-1 rounded ${
                        savedPosts[post._id] ? 'text-blue-500' : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <FiBookmark size={18} className={savedPosts[post._id] ? 'fill-current' : ''} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleFeed;