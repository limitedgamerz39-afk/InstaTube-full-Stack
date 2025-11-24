import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useFeed, useUserSuggestions } from '../services/queryClient';
import { storyAPI, postAPI } from '../services/api';
import { FiEye, FiPlay, FiMoreVertical, FiShare2, FiBookmark, FiFlag, FiHeart, FiMessageSquare, FiTrendingUp, FiClock, FiStar, FiMaximize, FiHome, FiUser } from 'react-icons/fi';
import { BsCompass, BsFilm } from 'react-icons/bs';
import { FiChevronDown } from 'react-icons/fi';
import toast from 'react-hot-toast';
import PullToRefresh from '../components/PullToRefresh';
import { PostSkeleton } from '../components/SkeletonLoader';
import StoriesBar from '../components/StoriesBar';
import videoManager from '../utils/videoManager';
import { shouldShowFeedAd, AD_CONFIG } from '../utils/adConfig';
import OptimizedImage from '../components/OptimizedImage';

const Feed = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const videoRefs = useRef({}); // Refs for all video elements
  const observerRef = useRef(null); // Intersection Observer for auto-play
  const [stories, setStories] = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [reels, setReels] = useState([]); // Store reels data
  const [reelsLoading, setReelsLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(null); // Track which video's menu is open
  const [filter, setFilter] = useState('popular'); // Add filter state
  const [playingVideoId, setPlayingVideoId] = useState(null); // Track which video is currently playing
  
  // Function to pause all videos except the specified one
  const pauseAllVideosExcept = useCallback((videoId) => {
    Object.keys(videoRefs.current).forEach(id => {
      if ((videoId === null || id !== videoId) && videoRefs.current[id]) {
        try {
          videoRefs.current[id].pause();
        } catch (e) {
          console.log('Error pausing video:', e);
        }
      }
    });
  }, [videoRefs]);
  
  // Function to safely play a video
  const safePlayVideo = useCallback(async (videoElement, videoId) => {
    if (!videoElement || !videoId) return;
    
    try {
      if (playingVideoId !== videoId) return;
      if (!videoElement.paused) return;
      await videoElement.play();
    } catch (error) {
      if (playingVideoId === videoId) {
        console.log('Play request was interrupted:', error.message);
      }
    }
  }, [playingVideoId]);

  const [videoProgress, setVideoProgress] = useState({});
  const [videoMuted, setVideoMuted] = useState({});
  const [videoLoading, setVideoLoading] = useState({});
  const [likedPosts, setLikedPosts] = useState({});
  const [savedPosts, setSavedPosts] = useState({});
  const [watchLaterPosts, setWatchLaterPosts] = useState({});
  
  const { data: feedData, isLoading, isError, error, refetch } = useFeed(1, 10);
  const { data: suggestionsData, isLoading: suggestionsLoading } = useUserSuggestions();
  
  const posts = feedData?.data?.data || [];
  const suggestions = suggestionsData?.data?.data || [];

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const response = await storyAPI.getsubscribedStories();
        setStories(response.data.data || []);
      } catch (error) {
        console.error('Failed to load stories:', error);
        setStories([]);
      } finally {
        setStoriesLoading(false);
      }
    };

    const fetchReels = async () => {
      try {
        const response = await postAPI.getFeed(1, 10);
        const reelsData = response.data.data.filter(post => post.category === 'short');
        setReels(reelsData || []);
      } catch (error) {
        console.error('Failed to load reels:', error);
        setReels([]);
      } finally {
        setReelsLoading(false);
      }
    };

    fetchStories();
    fetchReels();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const videoId = entry.target.dataset.videoId;
            const videoElement = videoRefs.current[videoId];
            
            if (entry.isIntersecting && videoElement) {
              if (playingVideoId === null) {
                pauseAllVideosExcept(videoId);
                setTimeout(() => {
                  safePlayVideo(videoElement, videoId);
                  setPlayingVideoId(videoId);
                }, 50);
              }
            } else if (videoElement && playingVideoId === videoId) {
              videoElement.pause();
              setPlayingVideoId(null);
            }
          });
        },
        { threshold: 0.7 }
      );

      document.querySelectorAll('[data-video-id]').forEach((videoContainer) => {
        observerRef.current.observe(videoContainer);
      });

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
        pauseAllVideosExcept(null);
        Object.values(videoRefs.current).forEach(videoElement => {
          if (videoElement) {
            videoManager.unregisterVideo(videoElement);
          }
        });
      };
    }
  }, [posts, playingVideoId]);

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Feed refreshed!');
    } catch (error) {
      if (error.message.includes('Rate limit')) {
        toast.error('Too many requests. Please wait before refreshing again.');
      } else {
        toast.error('Failed to refresh feed');
      }
    }
  };

  const handlePostDelete = (postId) => {
    // Handle post deletion
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

  // Add the missing formatTimeAgo function
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    }
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks}w ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths}mo ago`;
    }
    
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears}y ago`;
  };

  const toggleMenu = (postId) => {
    setMenuOpen(menuOpen === postId ? null : postId);
  };

  const handleShare = (post) => {
    navigator.clipboard.writeText(`${window.location.origin}/watch/${post._id}`);
    toast.success('Link copied to clipboard');
    setMenuOpen(null);
  };

  const handleSave = async (post) => {
    try {
      await postAPI.savePost(post._id);
      setSavedPosts(prev => ({
        ...prev,
        [post._id]: !prev[post._id]
      }));
      toast.success('Post saved!');
    } catch (error) {
      toast.error('Failed to save post');
    }
  };

  const handleWatchLater = async (post) => {
    try {
      await postAPI.watchLater(post._id);
      setWatchLaterPosts(prev => ({
        ...prev,
        [post._id]: !prev[post._id]
      }));
      toast.success('Added to watch later!');
    } catch (error) {
      toast.error('Failed to add to watch later');
    }
  };

  const handleReport = async (post) => {
    try {
      await postAPI.reportPost(post._id);
      toast.success('Post reported!');
      setMenuOpen(null);
    } catch (error) {
      toast.error('Failed to report post');
    }
  };

  const handleVideoClick = (post) => {
    navigate(`/watch/${post._id}`);
  };

  const incrementViewCount = async (postId) => {
    // Debounce view count increments to prevent rate limiting
    const now = Date.now();
    const lastIncrement = localStorage.getItem(`lastViewIncrement_${postId}`);
    
    // Only increment if it's been more than 30 seconds since last increment
    if (!lastIncrement || now - parseInt(lastIncrement) > 30000) {
      try {
        await postAPI.incrementViewCount(postId);
        localStorage.setItem(`lastViewIncrement_${postId}`, now.toString());
      } catch (error) {
        console.error('Failed to increment view count:', error);
      }
    }
  };

  // Filter posts based on selected filter
  const filterPosts = (posts) => {
    // Filter out short videos (less than 60 seconds) from main feed
    const longVideos = posts.filter(post => {
      // If durationSec exists, check it's >= 60, otherwise assume it's a long video
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

  const renderStories = () => {
    if (storiesLoading) {
      return <StoriesBar loading={true} />;
    }
    return <StoriesBar stories={stories} />;
  };

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center w-full max-w-sm">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2 dark:text-white">Something went wrong</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">{error?.message || 'Failed to load feed'}</p>
          <button 
            onClick={refetch}
            className="px-6 py-3 bg-primary text-white rounded-full hover:bg-primary-dark transition font-medium w-full max-w-xs mx-auto"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Mobile-specific header */}
      <div className="md:hidden sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold">Feed</h1>
          <div className="flex space-x-3">
            <button 
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setFilter('popular')}
              aria-label="Popular"
            >
              <FiTrendingUp className={`w-5 h-5 ${filter === 'popular' ? 'text-purple-500' : 'text-gray-500'}`} />
            </button>
            <button 
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setFilter('recent')}
              aria-label="Recent"
            >
              <FiClock className={`w-5 h-5 ${filter === 'recent' ? 'text-purple-500' : 'text-gray-500'}`} />
            </button>
          </div>
        </div>
      </div>
      
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="max-w-2xl mx-auto px-0 sm:px-2">
          {/* Stories Bar - hidden on mobile */}
          <div className="hidden md:block">
            <StoriesBar stories={stories} loading={storiesLoading} />
          </div>
          
          {/* Mobile Stories - simplified for mobile */}
          <div className="md:hidden overflow-x-auto py-3 px-2 hide-scrollbar">
            <div className="flex space-x-3">
              {storiesLoading ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center space-y-1">
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-full w-14 h-14 animate-pulse"></div>
                      <div className="bg-gray-200 dark:bg-gray-700 rounded w-12 h-3 animate-pulse"></div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div className="flex flex-col items-center space-y-1">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-0.5">
                      <div className="bg-white dark:bg-gray-900 rounded-full p-1">
                        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-12 h-12" />
                      </div>
                    </div>
                    <span className="text-xs">Your Story</span>
                  </div>
                  
                  {stories.slice(0, 10).map((story) => (
                    <div key={story._id} className="flex flex-col items-center space-y-1">
                      <div className="bg-gradient-to-r from-yellow-400 to-red-500 rounded-full p-0.5">
                        <div className="bg-white dark:bg-gray-900 rounded-full p-0.5">
                          <img 
                            src={story.author.avatar} 
                            alt={story.author.username}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        </div>
                      </div>
                      <span className="text-xs truncate max-w-[4rem]">{story.author.username}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
          
          {/* Filter tabs for mobile */}
          <div className="md:hidden flex border-b border-gray-200 dark:border-gray-800">
            <button
              className={`flex-1 py-3 text-center text-sm font-medium ${
                filter === 'popular' 
                  ? 'text-purple-600 border-b-2 border-purple-600' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              onClick={() => setFilter('popular')}
            >
              Popular
            </button>
            <button
              className={`flex-1 py-3 text-center text-sm font-medium ${
                filter === 'recent' 
                  ? 'text-purple-600 border-b-2 border-purple-600' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              onClick={() => setFilter('recent')}
            >
              Recent
            </button>
            <button
              className={`flex-1 py-3 text-center text-sm font-medium ${
                filter === 'following' 
                  ? 'text-purple-600 border-b-2 border-purple-600' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              onClick={() => setFilter('following')}
            >
              Following
            </button>
          </div>
          
          {/* Posts */}
          <div className="space-y-4 py-4">
            {isLoading ? (
              <>
                {[...Array(3)].map((_, i) => (
                  <PostSkeleton key={i} />
                ))}
              </>
            ) : isError ? (
              <div className="text-center py-10">
                <p className="text-red-500">Failed to load feed</p>
                <button 
                  onClick={() => refetch()}
                  className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg"
                >
                  Retry
                </button>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-10">
                <FiTrendingUp className="mx-auto w-12 h-12 text-gray-400" />
                <p className="mt-2 text-gray-500">No posts yet</p>
                <Link to="/explore" className="mt-4 inline-block text-purple-500 hover:underline">
                  Explore posts
                </Link>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                  {/* Post Header */}
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={post.author.avatar} 
                        alt={post.author.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <div className="flex items-center space-x-1">
                          <span className="font-semibold text-sm">{post.author.username}</span>
                          {post.author.isVerified && (
                            <span className="text-blue-500">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimeAgo(post.createdAt)}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => toggleMenu(post._id)}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                      aria-label="More options"
                    >
                      <FiMoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Post Content */}
                  <div className="px-3 pb-2">
                    <p className="text-gray-800 dark:text-gray-200">{post.caption}</p>
                  </div>
                  
                  {/* Post Media */}
                  <div className="relative">
                    {post.mediaType === 'video' ? (
                      <div className="relative aspect-video bg-gray-200 dark:bg-gray-700">
                        <video
                          ref={(el) => (videoRefs.current[post._id] = el)}
                          className="w-full h-full object-cover"
                          poster={post.thumbnailUrl}
                          muted={videoMuted[post._id] || false}
                          onLoadedMetadata={(e) => {
                            setVideoProgress(prev => ({
                              ...prev,
                              [post._id]: 0
                            }));
                          }}
                          onTimeUpdate={(e) => {
                            const progress = (e.target.currentTime / e.target.duration) * 100;
                            setVideoProgress(prev => ({
                              ...prev,
                              [post._id]: isNaN(progress) ? 0 : progress
                            }));
                          }}
                          onPlay={() => setPlayingVideoId(post._id)}
                          onPause={() => setPlayingVideoId(null)}
                          onWaiting={() => setVideoLoading(prev => ({ ...prev, [post._id]: true }))}
                          onPlaying={() => setVideoLoading(prev => ({ ...prev, [post._id]: false }))}
                        >
                          <source src={post.mediaUrl} type="video/mp4" />
                        </video>
                        
                        {/* Video Controls */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                          {/* Progress Bar */}
                          <div className="w-full bg-gray-600 rounded-full h-1 mb-2">
                            <div 
                              className="bg-white h-1 rounded-full" 
                              style={{ width: `${videoProgress[post._id] || 0}%` }}
                            ></div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <button 
                                onClick={() => {
                                  const video = videoRefs.current[post._id];
                                  if (video) {
                                    if (video.paused) {
                                      video.play();
                                    } else {
                                      video.pause();
                                    }
                                  }
                                }}
                                className="p-1.5 rounded-full bg-black/50 text-white"
                                aria-label={playingVideoId === post._id ? "Pause" : "Play"}
                              >
                                {playingVideoId === post._id ? (
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </button>
                              
                              <button 
                                onClick={() => setVideoMuted(prev => ({ ...prev, [post._id]: !(prev[post._id] || false) }))}
                                className="p-1.5 rounded-full bg-black/50 text-white"
                                aria-label={videoMuted[post._id] ? "Unmute" : "Mute"}
                              >
                                {videoMuted[post._id] ? (
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15 8.586l1.293 1.293a1 1 0 11-1.414 1.414L15 10l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </button>
                            </div>
                            
                            <div className="flex items-center space-x-2 text-white text-sm">
                              <FiEye className="w-4 h-4" />
                              <span>{formatNumber(post.views)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img 
                        src={post.mediaUrl} 
                        alt="Post content"
                        className="w-full object-cover"
                        style={{ aspectRatio: '4/3' }}
                      />
                    )}
                  </div>
                  
                  {/* Post Actions */}
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-4">
                        <button 
                          onClick={() => handleLike(post)}
                          className={`flex items-center space-x-1 ${
                            likedPosts[post._id] ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
                          }`}
                          aria-label={likedPosts[post._id] ? "Unlike" : "Like"}
                        >
                          <FiHeart className={`w-5 h-5 ${likedPosts[post._id] ? 'fill-current' : ''}`} />
                          <span className="text-sm">{formatNumber(post.likes?.length || 0)}</span>
                        </button>
                        
                        <button 
                          className="flex items-center space-x-1 text-gray-500 dark:text-gray-400"
                          aria-label="Comment"
                        >
                          <FiMessageSquare className="w-5 h-5" />
                          <span className="text-sm">{formatNumber(post.comments?.length || 0)}</span>
                        </button>
                        
                        <button 
                          className="flex items-center space-x-1 text-gray-500 dark:text-gray-400"
                          aria-label="Share"
                        >
                          <FiShare2 className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => handleSave(post)}
                        className={`${
                          savedPosts[post._id] ? 'text-yellow-500' : 'text-gray-500 dark:text-gray-400'
                        }`}
                        aria-label={savedPosts[post._id] ? "Unsave" : "Save"}
                      >
                        <FiBookmark className={`w-5 h-5 ${savedPosts[post._id] ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    
                    {/* Post Description */}
                    <div className="text-sm">
                      <span className="font-semibold">{post.author.username}</span>
                      <span className="text-gray-800 dark:text-gray-200 ml-2">{post.caption}</span>
                    </div>
                    
                    {/* View Comments */}
                    <button className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      View all {post.comments?.length || 0} comments
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </PullToRefresh>
    </div>
  );
};

export default Feed;