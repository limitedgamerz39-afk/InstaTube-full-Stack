import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { userAPI, postAPI, exploreAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import Loader from '../components/Loader';
import CommentBox from '../components/CommentBox';
import OptimizedImage from '../components/OptimizedImage';
import { 
  FiThumbsUp, 
  FiThumbsDown, 
  FiShare2, 
  FiBookmark, 
  FiMoreHorizontal, 
  FiSend,
  FiEye,
  FiMessageSquare,
  FiFlag,
  FiX,
  FiVolumeX,
  FiVolume2,
  FiPause,
  FiPlay,
  FiMaximize,
  FiMinimize,
  FiClock
} from 'react-icons/fi';
import { 
  BsFillPlayFill, 
  BsFillPauseFill, 
  BsPauseFill, 
  BsFullscreen, 
  BsFullscreenExit,
  BsVolumeUp,
  BsVolumeMute,
  BsChevronLeft,
  BsChevronRight,
  BsThreeDotsVertical
} from 'react-icons/bs';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { MdSlowMotionVideo, MdHighQuality } from 'react-icons/md';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';

const Videos = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { videoId } = useParams();
  
  const [currentVideo, setCurrentVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mobileIsPlaying, setMobileIsPlaying] = useState(false);
  const [desktopIsPlaying, setDesktopIsPlaying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [watchLater, setWatchLater] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [showFullComments, setShowFullComments] = useState(false);
  
  // Single playback coordination
  const [playbackId] = useState(() => Math.random().toString(36).substr(2, 9));
  
  // Video loading states
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState(false);
  
  // Enhanced video player states
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [showQualityOptions, setShowQualityOptions] = useState(false);
  const [showPlaybackOptions, setShowPlaybackOptions] = useState(false);
  const [currentQuality, setCurrentQuality] = useState('1080p');
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [mobileCurrentTime, setMobileCurrentTime] = useState(0);
  const [desktopCurrentTime, setDesktopCurrentTime] = useState(0);
  const [mobileDuration, setMobileDuration] = useState(0);
  const [desktopDuration, setDesktopDuration] = useState(0);
  const [showPlayerControls, setShowPlayerControls] = useState(true);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  
  // Seek forward/backward state
  const [showSeekFeedback, setShowSeekFeedback] = useState(false);
  const [seekDirection, setSeekDirection] = useState(null); // 'forward' or 'backward'
  
  // Double tap detection for mobile
  const [lastTap, setLastTap] = useState(0);
  const [tapTimeout, setTapTimeout] = useState(null);
  
  // Mobile menu options
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const mobileVideoRef = useRef(null);
  const desktopVideoRef = useRef(null);
  const playerContainerRef = useRef(null);
  const fullscreenContainerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const commentInputRef = useRef(null);

  // Fetch videos
  useEffect(() => {
    fetchVideos();
  }, []);

  // Handle video selection
  useEffect(() => {
    if (videoId && videos.length > 0) {
      const video = videos.find(v => v._id === videoId);
      if (video) {
        setCurrentVideo(video);
        setLiked(video.likes?.includes(user?._id) || false);
        setSaved(video.savedBy?.includes(user?._id) || false);
        setWatchLater(video.watchLater?.includes(user?._id) || false);
        fetchComments(video._id);
        incrementViewCount(video._id);
      } else {
        navigate('/videos');
      }
    }
  }, [videoId, videos, navigate, user]);

  // Handle mobile autoplay restrictions
  useEffect(() => {
    const handleFirstInteraction = () => {
      // Don't auto-play if document is hidden
      if (mobileVideoRef.current && autoPlay && mobileVideoRef.current.paused && !document.hidden) {
        togglePlayPause();
      }
      // Remove the event listener after first interaction
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('click', handleFirstInteraction);
    };

    // Add event listeners for first user interaction
    document.addEventListener('touchstart', handleFirstInteraction);
    document.addEventListener('click', handleFirstInteraction);

    return () => {
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('click', handleFirstInteraction);
    };
  }, [currentVideo, autoPlay, mobileVideoRef]);

  // Video event listeners
  useEffect(() => {
    // Determine which video ref to use based on current view
    const isMobileView = window.innerWidth < 768;
    const videoRef = isMobileView ? mobileVideoRef : desktopVideoRef;
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (isMobileView) {
        setMobileCurrentTime(video.currentTime);
        setMobileDuration(video.duration || 0);
      } else {
        setDesktopCurrentTime(video.currentTime);
        setDesktopDuration(video.duration || 0);
      }
    };

    const handleLoadedMetadata = () => {
      if (isMobileView) {
        setMobileDuration(video.duration || 0);
      } else {
        setDesktopDuration(video.duration || 0);
      }
      setVideoLoading(false);
      // Auto-play on mobile after metadata is loaded
      if (autoPlay && video.paused && !document.hidden) {
        togglePlayPause();
      }
    };

    const handlePlay = () => {
      if (isMobileView) {
        setMobileIsPlaying(true);
      } else {
        setDesktopIsPlaying(true);
      }
      setVideoLoading(false);
    };

    const handlePause = () => {
      if (isMobileView) {
        setMobileIsPlaying(false);
      } else {
        setDesktopIsPlaying(false);
      }
    };

    const handleCanPlay = () => {
      // Video is ready to play
      setVideoLoading(false);
      // Don't auto-play if document is hidden (inspect mode, background tab, etc.)
      if (autoPlay && video.paused && !document.hidden) {
        togglePlayPause();
      }
    };

    const handleLoadStart = () => {
      setVideoLoading(true);
    };

    const handleError = () => {
      setVideoLoading(false);
      setVideoError(true);
      toast.error('Failed to load video');
    };

    const handleWaiting = () => {
      setVideoLoading(true);
    };

    // Handle fullscreen change events
    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement || 
                         !!document.webkitFullscreenElement || 
                         !!document.mozFullScreenElement || 
                         !!document.msFullscreenElement;
      setIsFullscreen(isFullscreen);
    };

    // Polling to ensure state is in sync
    const interval = setInterval(() => {
      if (videoRef.current) {
        const isActuallyPlaying = !videoRef.current.paused && !videoRef.current.ended;
        if (isMobileView && isActuallyPlaying !== mobileIsPlaying) {
          setMobileIsPlaying(isActuallyPlaying);
        } else if (!isMobileView && isActuallyPlaying !== desktopIsPlaying) {
          setDesktopIsPlaying(isActuallyPlaying);
        }
      }
    }, 500);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('error', handleError);
    video.addEventListener('waiting', handleWaiting);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      clearInterval(interval);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('error', handleError);
      video.removeEventListener('waiting', handleWaiting);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [currentVideo, autoPlay, mobileIsPlaying, desktopIsPlaying, mobileVideoRef, desktopVideoRef]);

  // Auto-hide controls
  useEffect(() => {
    if (showPlayerControls) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        setShowPlayerControls(false);
      }, 3000);
    }
  }, [showPlayerControls]);

  // Focus comment input when comments modal opens
  useEffect(() => {
    if (showFullComments && commentInputRef.current) {
      setTimeout(() => {
        commentInputRef.current?.focus();
      }, 300);
    }
  }, [showFullComments]);

  // Cross-tab and cross-view playback coordination - FIXED VERSION
  useEffect(() => {
    if (!currentVideo) return;

    // Determine if we're in mobile or desktop view
    const isMobileView = window.innerWidth < 768;
    const viewMode = isMobileView ? 'mobile' : 'desktop';
    
    const handleStorageChange = (e) => {
      if (e.key === 'instatube-current-video' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          // Only sync if it's the same video but different view mode
          if (data.videoId === currentVideo._id && data.viewMode !== viewMode) {
            // If another view mode is playing, pause this one
            if (data.isPlaying && isPlaying) {
              // Pause the current view's video
              if (isMobileView && mobileVideoRef.current) {
                mobileVideoRef.current.pause();
                setIsPlaying(false);
              } else if (!isMobileView && desktopVideoRef.current) {
                desktopVideoRef.current.pause();
                setIsPlaying(false);
              }
            }
          }
        } catch (error) {
          console.log('Error parsing storage event:', error);
        }
      }
    };

    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange);

    // Update localStorage with current playback state
    const updatePlaybackState = () => {
      if (currentVideo) {
        // Get the correct video element based on current view
        const videoElement = isMobileView ? mobileVideoRef.current : desktopVideoRef.current;
        if (!videoElement) return;
        
        const playbackData = {
          videoId: currentVideo._id,
          viewMode: viewMode,
          isPlaying: !videoElement.paused && !videoElement.ended,
          currentTime: videoElement.currentTime,
          volume: videoElement.volume,
          isMuted: videoElement.muted,
          timestamp: Date.now()
        };
        try {
          localStorage.setItem('instatube-current-video', JSON.stringify(playbackData));
        } catch (error) {
          console.log('Error saving playback state:', error);
        }
      }
    };

    // Update playback state periodically
    const playbackInterval = setInterval(updatePlaybackState, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(playbackInterval);
      
      // Clear playback state when component unmounts
      try {
        const currentData = localStorage.getItem('instatube-current-video');
        if (currentData) {
          const data = JSON.parse(currentData);
          if (data.viewMode === viewMode) {
            localStorage.removeItem('instatube-current-video');
          }
        }
      } catch (error) {
        console.log('Error clearing playback state:', error);
      }
    };
  }, [currentVideo, isPlaying]);

  const fetchVideos = async () => {
    try {
      const response = await exploreAPI.getExplorePosts();
      const data = response.data.data || [];
      // Filter only long videos (category === 'long') with duration > 60 seconds
      const longVideos = data.filter((post) => {
        // Must have category 'long' and duration > 60 seconds
        if (post.category === 'long') {
          // If durationSec exists, check it's > 60, otherwise assume it's a long video
          return typeof post.durationSec === 'number' ? post.durationSec > 60 : true;
        }
        return false;
      });
      setVideos(longVideos);
      
      if (videoId) {
        const video = longVideos.find(v => v._id === videoId);
        if (video) {
          setCurrentVideo(video);
          incrementViewCount(video._id);
        }
      }
    } catch (error) {
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = useCallback(async (videoId) => {
    // Debounce comment fetches to prevent rate limiting
    const now = Date.now();
    const lastFetch = localStorage.getItem(`lastCommentFetch_${videoId}`);
    
    // Only fetch if it's been more than 10 seconds since last fetch
    if (!lastFetch || now - parseInt(lastFetch) > 10000) {
      try {
        const response = await postAPI.getComments(videoId);
        setComments(response.data.data || []);
        localStorage.setItem(`lastCommentFetch_${videoId}`, now.toString());
      } catch (error) {
        console.error('Failed to load comments:', error);
      }
    }
  }, []);

  const incrementViewCount = useCallback(async (videoId) => {
    // Debounce view count increments to prevent rate limiting
    const now = Date.now();
    const lastIncrement = localStorage.getItem(`lastViewIncrement_${videoId}`);
    
    // Only increment if it's been more than 30 seconds since last increment
    if (!lastIncrement || now - parseInt(lastIncrement) > 30000) {
      try {
        await postAPI.incrementViewCount(videoId);
        localStorage.setItem(`lastViewIncrement_${videoId}`, now.toString());
      } catch (error) {
        console.error('Failed to increment view count:', error);
      }
    }
  }, []);

  const handleLike = async () => {
    if (!currentVideo) return;
    
    try {
      await postAPI.likePost(currentVideo._id);
      setLiked(!liked);
      if (disliked) setDisliked(false);
      
      const updatedVideo = { ...currentVideo };
      if (liked) {
        updatedVideo.likes = updatedVideo.likes?.filter(id => id !== user._id) || [];
      } else {
        updatedVideo.likes = [...(updatedVideo.likes || []), user._id];
      }
      setCurrentVideo(updatedVideo);
    } catch (error) {
      toast.error('Failed to like video');
    }
  };

  const handleDislike = async () => {
    if (!currentVideo) return;
    
    try {
      setDisliked(!disliked);
      if (liked) setLiked(false);
    } catch (error) {
      toast.error('Failed to dislike video');
    }
  };

  const handleSave = async () => {
    if (!currentVideo) return;
    
    try {
      await postAPI.savePost(currentVideo._id);
      setSaved(!saved);
      toast.success(saved ? 'Video removed from saved' : 'Video saved');
    } catch (error) {
      toast.error('Failed to save video');
    }
  };

  const handleWatchLater = async () => {
    if (!currentVideo) return;
    
    try {
      await postAPI.savePost(currentVideo._id);
      setWatchLater(!watchLater);
      toast.success(watchLater ? 'Video removed from watch later' : 'Video added to watch later');
    } catch (error) {
      toast.error('Failed to add to watch later');
    }
  };

  const handleAddComment = async () => {
    if (!currentVideo || !comment.trim()) return;
    
    try {
      const response = await postAPI.addComment(currentVideo._id, comment);
      const newComment = response.data.data;
      setComments([newComment, ...comments]);
      setComment('');
      toast.success('Comment added');
      
      // Update current video comments count
      setCurrentVideo(prev => ({
        ...prev,
        comments: [...(prev.comments || []), newComment._id]
      }));
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleSubscribe = async () => {
    toast.success('Subscribed to channel');
  };

  // Video player controls
  const togglePlayPause = async () => {
    // Determine which video ref to use based on current view
    const isMobileView = window.innerWidth < 768;
    const videoRef = isMobileView ? mobileVideoRef : desktopVideoRef;
    
    if (videoRef.current) {
      try {
        if (videoRef.current.paused || videoRef.current.ended) {
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            await playPromise;
          }
          // Update state based on view
          if (isMobileView) {
            setMobileIsPlaying(true);
          } else {
            setDesktopIsPlaying(true);
          }
        } else {
          videoRef.current.pause();
          // Update state based on view
          if (isMobileView) {
            setMobileIsPlaying(false);
          } else {
            setDesktopIsPlaying(false);
          }
        }
      } catch (error) {
        // On mobile, sometimes we need to mute to play
        if (error.name === 'NotAllowedError' || error.name === 'AbortError') {
          videoRef.current.muted = true;
          setIsMuted(true);
          try {
            await videoRef.current.play();
            // Update state based on view
            if (isMobileView) {
              setMobileIsPlaying(true);
            } else {
              setDesktopIsPlaying(true);
            }
          } catch (retryError) {
            toast.error('Unable to play video. Please tap to try again.');
          }
        } else {
          toast.error('Unable to play video: ' + error.message);
        }
      }
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    // Determine which video ref to use based on current view
    const isMobileView = window.innerWidth < 768;
    const videoRef = isMobileView ? mobileVideoRef : desktopVideoRef;
    const targetDuration = isMobileView ? mobileDuration : desktopDuration;
    if (videoRef.current) {
      videoRef.current.currentTime = percent * targetDuration;
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    // Determine which video ref to use based on current view
    const isMobileView = window.innerWidth < 768;
    const videoRef = isMobileView ? mobileVideoRef : desktopVideoRef;
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    // Determine which video ref to use based on current view
    const isMobileView = window.innerWidth < 768;
    const videoRef = isMobileView ? mobileVideoRef : desktopVideoRef;
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const changePlaybackRate = (rate) => {
    // Determine which video ref to use based on current view
    const isMobileView = window.innerWidth < 768;
    const videoRef = isMobileView ? mobileVideoRef : desktopVideoRef;
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      setShowPlaybackOptions(false);
    }
  };

  const toggleFullscreen = () => {
    // Check if we're on mobile device
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      // For mobile, we need to handle orientation and use video element for fullscreen
      const videoElement = mobileVideoRef.current;
      if (!videoElement) return;
      
      // Check if video is already in fullscreen
      if (document.fullscreenElement === videoElement) {
        // Exit fullscreen
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { // Safari
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) { // Firefox
          document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) { // IE/Edge
          document.msExitFullscreen();
        }
        setIsFullscreen(false);
      } else {
        // Enter fullscreen
        if (videoElement.requestFullscreen) {
          videoElement.requestFullscreen();
        } else if (videoElement.webkitEnterFullscreen) { // Safari
          videoElement.webkitEnterFullscreen();
        } else if (videoElement.webkitRequestFullscreen) { // Safari (older)
          videoElement.webkitRequestFullscreen();
        } else if (videoElement.mozRequestFullScreen) { // Firefox
          videoElement.mozRequestFullScreen();
        } else if (videoElement.msRequestFullscreen) { // IE/Edge
          videoElement.msRequestFullscreen();
        }
        setIsFullscreen(true);
      }
    } else {
      // Desktop fullscreen logic
      const container = playerContainerRef.current;
      if (!container) return;
      
      if (!document.fullscreenElement) {
        if (container.requestFullscreen) {
          container.requestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    }
  };

  // Seek video forward or backward
  const seekVideo = (direction) => {
    // Determine which video ref to use based on current view
    const isMobileView = window.innerWidth < 768;
    const videoRef = isMobileView ? mobileVideoRef : desktopVideoRef;
    const currentTime = isMobileView ? mobileCurrentTime : desktopCurrentTime;
    const duration = isMobileView ? mobileDuration : desktopDuration;
    
    if (videoRef.current) {
      const seekTime = direction === 'forward' ? 10 : -10; // 10 seconds
      const newTime = Math.max(0, Math.min(currentTime + seekTime, duration));
      videoRef.current.currentTime = newTime;
      
      // Update state
      if (isMobileView) {
        setMobileCurrentTime(newTime);
      } else {
        setDesktopCurrentTime(newTime);
      }
      
      // Show seek feedback
      setSeekDirection(direction);
      setShowSeekFeedback(true);
      setTimeout(() => setShowSeekFeedback(false), 1000);
    }
  };

  // Handle double tap for mobile seek
  const handleDoubleTap = (e, direction) => {
    e.stopPropagation();
    seekVideo(direction);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle shortcuts when not in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          seekVideo('backward');
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekVideo('forward');
          break;
        default:
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileCurrentTime, desktopCurrentTime, mobileDuration, desktopDuration]);

  // Play previous video in the list
  const playPreviousVideo = () => {
    if (!currentVideo || !videos.length) return;
    
    const currentIndex = videos.findIndex(v => v._id === currentVideo._id);
    if (currentIndex > 0) {
      const previousVideo = videos[currentIndex - 1];
      setCurrentVideo(previousVideo);
      navigate(`/watch/${previousVideo._id}`);
      incrementViewCount(previousVideo._id);
      
      // Reset play state
      setMobileIsPlaying(false);
      setDesktopIsPlaying(false);
    }
  };

  // Play next video in the list
  const playNextVideo = () => {
    if (!currentVideo || !videos.length) return;
    
    const currentIndex = videos.findIndex(v => v._id === currentVideo._id);
    if (currentIndex < videos.length - 1) {
      const nextVideo = videos[currentIndex + 1];
      setCurrentVideo(nextVideo);
      navigate(`/watch/${nextVideo._id}`);
      incrementViewCount(nextVideo._id);
      
      // Reset play state
      setMobileIsPlaying(false);
      setDesktopIsPlaying(false);
    }
  };

  // Handle keyboard shortcuts for previous/next video
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle shortcuts when not in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          playPreviousVideo();
          break;
        case 'ArrowDown':
          e.preventDefault();
          playNextVideo();
          break;
        default:
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentVideo, videos]);

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatViews = (count) => {
    if (!count) return '0 views';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M views`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K views`;
    return `${count} views`;
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
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
          <div className="text-6xl mb-4">🎥</div>
          <h2 className="text-2xl font-bold mb-2 dark:text-white">No Videos Available</h2>
          <p className="text-gray-600 dark:text-gray-400">Be the first to upload a video!</p>
        </div>
      </div>
    );
  }

  if (currentVideo) {
    return (
      <div className="bg-white dark:bg-gray-900 min-h-screen">
        {isFullscreen && (
          <div className="fixed inset-0 bg-black z-50">
            {/* Video Player - Fullscreen */}
            <div 
              ref={fullscreenContainerRef}
              className="relative w-full h-full"
            >
              {videoLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <div className="text-white">
                    <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-2">Loading...</p>
                  </div>
                </div>
              )}
              
              {videoError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white">
                  <FiX className="text-red-500" size={48} />
                  <p className="mt-2 text-lg">Failed to load video</p>
                  <button 
                    onClick={() => {
                      setVideoError(false);
                      setVideoLoading(true);
                      if (mobileVideoRef.current) {
                        mobileVideoRef.current.load();
                      }
                    }}
                    className="mt-4 px-4 py-2 bg-red-600 rounded-lg"
                  >
                    Retry
                  </button>
                </div>
              )}
              
              <video
                ref={mobileVideoRef}
                src={currentVideo.media?.[0]?.url || currentVideo.mediaUrl}
                className="w-full h-full object-contain"
                playsInline
                webkit-playsinline
                x5-playsinline
              />
              
              {/* Seek Feedback Overlay */}
              {showSeekFeedback && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-black/50 rounded-full px-6 py-3 text-white text-2xl font-bold">
                    {seekDirection === 'forward' ? '→' : '←'} 10s
                  </div>
                </div>
              )}
              
              {/* D4D HUB-style Controls Overlay */}
              {showPlayerControls && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-between p-3">
                  {/* Top Controls */}
                  <div className="flex justify-between items-center">
                    <button 
                      onClick={() => {
                        setIsFullscreen(false);
                        if (mobileVideoRef.current) {
                          mobileVideoRef.current.style.objectFit = 'cover';
                        }
                      }}
                      className="text-white bg-black/50 rounded-full p-2"
                    >
                      <FiX size={20} />
                    </button>
                    <div className="relative">
                      <button 
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        className="text-white bg-black/50 rounded-full p-2"
                      >
                        <BsThreeDotsVertical size={20} />
                      </button>
                      
                      {showMobileMenu && (
                        <div className="absolute top-full right-0 mt-2 bg-black/90 text-white rounded-lg py-2 w-48 backdrop-blur-sm z-10">
                          <button 
                            onClick={() => {
                              setShowPlaybackOptions(!showPlaybackOptions);
                              setShowMobileMenu(false);
                            }}
                            className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-sm"
                          >
                            Playback Speed
                          </button>
                          <button 
                            onClick={() => {
                              setShowQualityOptions(!showQualityOptions);
                              setShowMobileMenu(false);
                            }}
                            className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-sm"
                          >
                            Quality
                          </button>
                          <button className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-sm">
                            Subtitles
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Center Play/Pause */}
                  <div className="flex-1 flex items-center justify-center">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePlayPause();
                      }}
                      className="text-white bg-black/50 rounded-full p-4"
                    >
                      {mobileIsPlaying ? <BsFillPauseFill size={32} /> : <BsFillPlayFill size={32} />}
                    </button>
                  </div>

                  {/* Bottom Controls */}
                  <div className="space-y-3">
                    {/* Progress Bar */}
                    <div 
                      className="h-1 bg-gray-600/50 rounded-full cursor-pointer"
                      onClick={handleSeek}
                    >
                      <div 
                        className="h-full bg-red-600 rounded-full relative"
                        style={{ width: `${(mobileCurrentTime / mobileDuration) * 100}%` }}
                      >
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full"></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-white text-sm">
                      <span>{formatTime(mobileCurrentTime)}</span>
                      <div className="flex items-center space-x-3">
                        <button onClick={playPreviousVideo} className="hover:text-gray-300 transition-colors">
                          ← Prev
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePlayPause();
                          }}
                        >
                          {mobileIsPlaying ? <FiPause size={18} /> : <FiPlay size={18} />}
                        </button>
                        <button onClick={playNextVideo} className="hover:text-gray-300 transition-colors">
                          Next →
                        </button>
                        <button onClick={toggleMute}>
                          {isMuted || volume === 0 ? <FiVolumeX size={18} /> : <FiVolume2 size={18} />}
                        </button>
                        <button onClick={() => setIsFullscreen(false)}>
                          <FiMinimize size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Non-fullscreen view */}
        {!isFullscreen && (
          <>
            {/* Mobile Layout - Video Player with Back Button */}
            <div className="md:hidden">
              <div className="relative w-full aspect-video bg-black">
                {videoLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black">
                    <div className="text-white">
                      <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  </div>
                )}
                
                <video
                  ref={mobileVideoRef}
                  src={currentVideo.media?.[0]?.url || currentVideo.mediaUrl}
                  className="w-full h-full object-cover"
                  playsInline
                  webkit-playsinline="true"
                  x5-playsinline="true"
                />
                
                {/* Mobile Controls Overlay */}
                <div 
                  className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-3"
                  onClick={togglePlayPause}
                >
                  <div className="flex items-center justify-between text-white">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(-1);
                      }}
                      className="bg-black/50 rounded-full p-2"
                    >
                      <FiX size={20} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsFullscreen(true);
                      }}
                      className="bg-black/50 rounded-full p-2"
                    >
                      <FiMaximize size={20} />
                    </button>
                  </div>
                  
                  {/* Progress Bar */}
                  <div 
                    className="h-1 bg-gray-600/50 rounded-full mt-2 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSeek(e);
                    }}
                  >
                    <div 
                      className="h-full bg-red-600 rounded-full"
                      style={{ width: `${(mobileCurrentTime / mobileDuration) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Video Info for Mobile */}
              <div className="p-4">
                <h1 className="text-lg font-bold mb-2 dark:text-white line-clamp-2">
                  {currentVideo.title}
                </h1>
                
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <span>{formatViews(currentVideo.views || 0)}</span>
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={handleLike}
                      className={`flex items-center space-x-1 ${liked ? 'text-red-500' : ''}`}
                    >
                      <FiThumbsUp size={16} />
                      <span>{formatNumber(currentVideo.likes?.length || 0)}</span>
                    </button>
                    <button 
                      onClick={handleDislike}
                      className={disliked ? 'text-blue-500' : ''}
                    >
                      <FiThumbsDown size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Desktop Layout - D4D HUB Style */}
            <div className="hidden md:block bg-white dark:bg-gray-900 min-h-screen">
              <Navbar />
              <div className="max-w-7xl mx-auto py-6 px-2 sm:px-4">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Main Content */}
                  <div className="flex-1 max-w-4xl">
                    {/* Video Player */}
                    <div 
                      ref={playerContainerRef}
                      className="bg-black rounded-xl overflow-hidden relative group"
                      onMouseEnter={() => setShowPlayerControls(true)}
                      onMouseMove={() => setShowPlayerControls(true)}
                      onMouseLeave={() => setShowPlayerControls(false)}
                    >
                      <video
                        ref={desktopVideoRef}
                        src={currentVideo.media?.[0]?.url || currentVideo.mediaUrl}
                        className="w-full aspect-video"
                        onClick={togglePlayPause}
                        playsInline
                        webkit-playsinline="true"
                        x5-playsinline="true"
                      />
                      
                      {/* D4D HUB-style Controls */}
                      {showPlayerControls && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end">
                          {/* Progress Bar */}
                          <div 
                            className="px-4 cursor-pointer"
                            onClick={handleSeek}
                          >
                            <div className="h-1 bg-gray-600/50 rounded-full relative">
                              <div 
                                className="h-full bg-red-600 rounded-full relative group-hover:bg-red-500"
                                style={{ width: `${(desktopCurrentTime / desktopDuration) * 100}%` }}
                              >
                                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                              </div>
                            </div>
                          </div>

                          {/* Control Bar */}
                          <div className="px-4 py-3 flex items-center justify-between text-white">
                            <div className="flex items-center space-x-4">
                              <button 
                                onClick={togglePlayPause}
                                className="hover:text-gray-300 transition-colors"
                              >
                                {desktopIsPlaying ? <BsFillPauseFill size={20} /> : <BsFillPlayFill size={20} />}
                              </button>

                              <button onClick={playPreviousVideo} className="hover:text-gray-300 transition-colors">
                                ← Previous
                              </button>

                              <button onClick={playNextVideo} className="hover:text-gray-300 transition-colors">
                                Next →
                              </button>

                              <button onClick={toggleMute} className="hover:text-gray-300 transition-colors">
                                {isMuted || volume === 0 ? <FiVolumeX size={18} /> : <FiVolume2 size={18} />}
                              </button>

                              <div className="w-20">
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.1"
                                  value={volume}
                                  onChange={handleVolumeChange}
                                  className="w-full accent-white"
                                />
                              </div>

                              <div className="text-sm">
                                {formatTime(desktopCurrentTime)} / {formatTime(desktopDuration)}
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <button 
                                  onClick={() => setShowPlaybackOptions(!showPlaybackOptions)}
                                  className="hover:text-gray-300 transition-colors text-sm flex items-center"
                                >
                                  <MdSlowMotionVideo size={18} />
                                  <span className="ml-1">{playbackRate}x</span>
                                </button>
                                
                                {showPlaybackOptions && (
                                  <div className="absolute bottom-full right-0 mb-2 bg-black/90 text-white rounded-lg py-2 w-32 backdrop-blur-sm">
                                    {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(rate => (
                                      <button
                                        key={rate}
                                        onClick={() => {
                                          setPlaybackRate(rate);
                                          if (desktopVideoRef.current) {
                                            desktopVideoRef.current.playbackRate = rate;
                                          }
                                          setShowPlaybackOptions(false);
                                        }}
                                        className={`block w-full text-left px-4 py-1 text-sm hover:bg-gray-700 ${playbackRate === rate ? 'text-red-500' : ''}`}
                                      >
                                        {rate}x
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              
                              <button 
                                onClick={() => setShowQualityOptions(!showQualityOptions)}
                                className="hover:text-gray-300 transition-colors text-sm flex items-center"
                              >
                                <MdHighQuality size={18} />
                                <span className="ml-1">{currentQuality}</span>
                              </button>
                              
                              {showQualityOptions && (
                                <div className="absolute bottom-full right-0 mb-2 bg-black/90 text-white rounded-lg py-2 w-32 backdrop-blur-sm">
                                  {['144p', '240p', '360p', '480p', '720p', '1080p'].map(quality => (
                                    <button
                                      key={quality}
                                      onClick={() => {
                                        setCurrentQuality(quality);
                                        setShowQualityOptions(false);
                                      }}
                                      className={`block w-full text-left px-4 py-1 text-sm hover:bg-gray-700 ${currentQuality === quality ? 'text-red-500' : ''}`}
                                    >
                                      {quality}
                                    </button>
                                  ))}
                                </div>
                              )}
                              
                              <button 
                                onClick={toggleFullscreen}
                                className="hover:text-gray-300 transition-colors"
                              >
                                <FiMaximize size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Video Info */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h1 className="text-xl font-bold mb-2 dark:text-white">
                        {currentVideo.title}
                      </h1>
                      
                      <div className="flex flex-wrap items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <div className="flex items-center space-x-4 mb-2 md:mb-0">
                          <span>{formatViews(currentVideo.views || 0)}</span>
                          <span>{new Date(currentVideo.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <button 
                            onClick={handleLike}
                            className={`flex items-center space-x-1 ${liked ? 'text-red-500' : ''}`}
                          >
                            <FiThumbsUp size={16} />
                            <span>{formatNumber(currentVideo.likes?.length || 0)}</span>
                          </button>
                          <button 
                            onClick={handleDislike}
                            className={disliked ? 'text-blue-500' : ''}
                          >
                            <FiThumbsDown size={16} />
                          </button>
                          <button 
                            onClick={handleSave}
                            className={saved ? 'text-blue-500' : ''}
                          >
                            <FiBookmark size={16} />
                          </button>
                          <button 
                            onClick={handleWatchLater}
                            className={watchLater ? 'text-green-500' : ''}
                          >
                            <FiClock size={16} />
                          </button>
                        </div>
                      </div>
                      
                      {/* Channel Info */}
                      <div className="flex items-center justify-between py-3 border-t border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                          <img
                            src={currentVideo.author?.avatar || `https://ui-avatars.com/api/?name=${currentVideo.author?.username}&background=random`}
                            alt={currentVideo.author?.username}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <h3 className="font-semibold dark:text-white">{currentVideo.author?.username}</h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {currentVideo.author?.followers?.length || 0} followers
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={handleSubscribe}
                          className="px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition text-sm font-medium"
                        >
                          Subscribe
                        </button>
                      </div>
                      
                      {/* Description */}
                      <div className="mt-4">
                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                          {currentVideo.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Comments Section */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold dark:text-white">
                          {comments.length} comments
                        </h3>
                        <button 
                          onClick={() => setShowFullComments(true)}
                          className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          View all
                        </button>
                      </div>
                      
                      {/* Add Comment */}
                      <div className="flex space-x-3 mb-4">
                        <img
                          src={user?.avatar || `https://ui-avatars.com/api/?name=User&background=random`}
                          alt="Your avatar"
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1">
                          <textarea
                            ref={commentInputRef}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none text-sm"
                            rows="2"
                          />
                          <div className="flex justify-end mt-2">
                            <button
                              onClick={handleAddComment}
                              disabled={!comment.trim()}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700 transition text-sm"
                            >
                              Comment
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Recent Comments */}
                      <div className="space-y-4">
                        {comments.slice(0, 3).map((comment) => (
                          <div key={comment._id} className="flex space-x-3">
                            <img
                              src={comment.author?.avatar || `https://ui-avatars.com/api/?name=${comment.author?.username}&background=random`}
                              alt={comment.author?.username}
                              className="w-10 h-10 rounded-full"
                            />
                            <div className="flex-1">
                              <div className="flex items-center mb-1">
                                <h4 className="font-semibold text-sm dark:text-white">
                                  {comment.author?.username}
                                </h4>
                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                  {new Date(comment.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 text-sm">
                                {comment.text}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Sidebar - Related Videos */}
                  <div className="w-full lg:w-96">
                    <h3 className="text-lg font-semibold mb-4 dark:text-white px-4">Related Videos</h3>
                    <div className="space-y-4 px-4">
                      {videos.slice(0, 10).map((video) => (
                        <div 
                          key={video._id}
                          onClick={() => {
                            setCurrentVideo(video);
                            navigate(`/watch/${video._id}`);
                            fetchComments(video._id);
                            incrementViewCount(video._id);
                          }}
                          className="flex space-x-3 cursor-pointer group"
                        >
                          <div className="relative w-40 flex-shrink-0">
                            {video.media?.[0]?.thumbnail ? (
                              <img
                                src={video.media[0].thumbnail}
                                alt={video.title}
                                className="w-full h-24 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-full h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                {generateThumbnail(video.title)}
                              </div>
                            )}
                            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 py-0.5 rounded">
                              {formatTime(video.durationSec)}
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-2 dark:text-white mb-1 group-hover:text-red-600 transition-colors">
                              {video.title}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                              {video.author?.username}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {formatViews(video.views || 0)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Full Comments Modal */}
        {showFullComments && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
            <div className="bg-white dark:bg-gray-900 w-full h-4/5 md:h-3/4 md:max-w-2xl rounded-t-2xl md:rounded-2xl flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold dark:text-white">{comments.length} comments</h3>
                <button 
                  onClick={() => setShowFullComments(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <FiX size={24} />
                </button>
              </div>
              
              {/* Add Comment Section */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex space-x-3">
                  <img
                    src={user?.avatar || `https://ui-avatars.com/api/?name=User&background=random`}
                    alt="Your avatar"
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <textarea
                      ref={commentInputRef}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none text-sm"
                      rows="3"
                    />
                    <div className="flex justify-end mt-2 space-x-2">
                      <button
                        onClick={() => {
                          setComment('');
                          setShowFullComments(false);
                        }}
                        className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddComment}
                        disabled={!comment.trim()}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700 transition text-sm flex items-center space-x-2"
                      >
                        <FiSend size={16} />
                        <span>Comment</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto">
                {comments.length > 0 ? (
                  <div className="p-4 space-y-4">
                    {comments.map((comment) => (
                      <div key={comment._id} className="flex space-x-3">
                        <img
                          src={comment.author?.avatar || `https://ui-avatars.com/api/?name=${comment.author?.username}&background=random`}
                          alt={comment.author?.username}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <h4 className="font-semibold text-sm dark:text-white">
                              {comment.author?.username}
                            </h4>
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 text-sm">
                            {comment.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400 text-center">
                      No comments yet. <br />
                      <span className="text-sm">Be the first to comment!</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Video Grid View
  return (
    <div className="flex flex-col md:flex-row max-w-7xl mx-auto">
      
      <div className="flex-1 px-4 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <h1 className="text-3xl font-bold mb-8 dark:text-white">Videos</h1>
        
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {videos.map((video) => (
            <div
              key={video._id}
              className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => {
                navigate(`/watch/${video._id}`);
                incrementViewCount(video._id);
              }}
            >
              <div className="relative bg-black aspect-video overflow-hidden">
                {video.thumbnail || video.media?.[0]?.url || video.mediaUrl ? (
                  <img
                    src={video.thumbnail || video.media?.[0]?.url || video.mediaUrl}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  generateThumbnail(video.title)
                )}
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                  {formatTime(video.durationSec)}
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="bg-black/50 rounded-full p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <BsFillPlayFill size={24} />
                  </div>
                </div>
              </div>
              
              <div className="p-3 sm:p-4">
                <h3 className="font-semibold text-sm line-clamp-2 mb-2 dark:text-white group-hover:text-red-600 transition-colors">
                  {video.title}
                </h3>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img
                      src={video.author?.avatar || `https://ui-avatars.com/api/?name=${video.author?.username}&background=random`}
                      alt={video.author?.username}
                      className="w-6 h-6 rounded-full mr-2"
                    />
                    <p className="text-xs font-medium dark:text-gray-300 truncate max-w-[80px] sm:max-w-[100px] md:max-w-[120px]">{video.author?.username}</p>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{formatViews(video.views || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
   
export default Videos;

// Helper function to generate a random color for thumbnails
const getRandomColor = () => {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Helper function to generate a placeholder thumbnail with initials
const generateThumbnail = (title) => {
  const initials = title ? title.substring(0, 2).toUpperCase() : 'VD';
  const colorClass = getRandomColor();
  return (
    <div className={`w-full h-full flex items-center justify-center ${colorClass}`}>
      <span className="text-white text-2xl font-bold">{initials}</span>
    </div>
  );
};
