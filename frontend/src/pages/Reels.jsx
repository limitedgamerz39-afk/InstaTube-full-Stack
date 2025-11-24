import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { postAPI, exploreAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { shouldShowReelAd, AD_CONFIG } from '../utils/adConfig';
import toast from 'react-hot-toast';
import {
  AiOutlineHeart,
  AiFillHeart,
  AiOutlineComment,
  AiOutlineShareAlt,
  AiOutlineMenu,
  AiFillDislike,
  AiFillLike
} from 'react-icons/ai';
import { BsBookmark, BsBookmarkFill, BsThreeDots, BsPlayFill, BsPauseFill } from 'react-icons/bs';
import { FiX, FiChevronUp, FiChevronDown, FiHome, FiUser, FiMoreHorizontal } from 'react-icons/fi';
import { IoMusicalNotes, IoSend } from 'react-icons/io5';
import { MdOutlineVolumeOff, MdOutlineVolumeUp } from 'react-icons/md';
import videoManager from '../utils/videoManager';
import VideoAd from '../components/VideoAd';

const Reels = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { reelId } = useParams();
  const [reels, setReels] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const videoRefs = useRef([]);
  const containerRef = useRef(null);
  const [commentPostId, setCommentPostId] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [subscribed, setSubscribed] = useState({});
  const [showAd, setShowAd] = useState(false);
  const [adType, setAdType] = useState('pre-roll');
  const [midRollShown, setMidRollShown] = useState({});
  const [postRollShown, setPostRollShown] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoProgress, setVideoProgress] = useState({});
  const [isMuted, setIsMuted] = useState(true);
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showHeader, setShowHeader] = useState(false); // New state for header visibility

  // Fetch reels data
  useEffect(() => {
    fetchReels();
    
    return () => {
      videoRefs.current.forEach(video => {
        if (video) {
          video.pause();
          video.src = '';
          video.load();
        }
      });
    };
  }, [reelId]);

  // Handle scroll and video playback
  useEffect(() => {
    if (reels.length > 0 && currentIndex < reels.length) {
      // Play current video, pause others
      videoRefs.current.forEach((video, index) => {
        if (video) {
          if (index === currentIndex) {
            setTimeout(() => {
              videoManager.playVideo(video).catch(e => console.log('Auto-play prevented:', e));
              setIsPlaying(true);
              if (AD_CONFIG.videoAds.midRoll.enabled) {
                video.ontimeupdate = () => handleVideoProgress(video, index);
              }
              video.onended = () => handleVideoEnded(index);
            }, 300);
          } else {
            videoManager.pauseVideo(video);
            video.currentTime = 0;
          }
        }
      });
    }
  }, [currentIndex, reels]);

  // Auto-hide header after 3 seconds
  useEffect(() => {
    if (reels.length > 0) {
      // Show header temporarily when reel changes
      setShowHeader(true);
      const timer = setTimeout(() => {
        setShowHeader(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [currentIndex, reels.length]);

  // Show header on touch/mouse move (like YouTube)
  useEffect(() => {
    const handleUserActivity = () => {
      setShowHeader(true);
      // Hide again after 3 seconds of inactivity
      const timer = setTimeout(() => {
        setShowHeader(false);
      }, 3000);

      return () => clearTimeout(timer);
    };

    window.addEventListener('touchstart', handleUserActivity);
    window.addEventListener('mousemove', handleUserActivity);

    return () => {
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('mousemove', handleUserActivity);
    };
  }, []);

  // Keyboard navigation for desktop
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        goToNextReel();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        goToPrevReel();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      } else if (e.key === 'h' || e.key === 'H') {
        // Toggle header with 'H' key
        setShowHeader(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, reels.length]);

  const fetchReels = async () => {
    try {
      setLoading(true);
      const response = await exploreAPI.getExplorePosts();
      const data = response.data.data || [];
      
      let videoReels = data.filter((post) => {
        if (post.category === 'short') {
          return typeof post.durationSec === 'number' ? post.durationSec <= 60 : true;
        }
        return false;
      });
      
      if (reelId && videoReels.length > 0) {
        const targetIndex = videoReels.findIndex(reel => reel._id === reelId);
        if (targetIndex !== -1) {
          setCurrentIndex(targetIndex);
        }
      }
      
      setReels(videoReels);
    } catch (error) {
      console.error('Failed to load reels:', error);
      toast.error('Failed to load reels');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoProgress = (video, index) => {
    const currentTime = video.currentTime;
    const duration = video.duration;
    const progress = (currentTime / duration) * 100;
    setVideoProgress(prev => ({ ...prev, [index]: progress }));
  };

  const handleVideoEnded = (index) => {
    if (index < reels.length - 1) {
      setTimeout(() => {
        setCurrentIndex(index + 1);
      }, 500);
    }
  };

  const handleAdComplete = () => {
    setShowAd(false);
    const video = videoRefs.current[currentIndex];
    if (video) {
      video.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  // Enhanced touch handling for mobile
  const handleTouchStart = (e) => {
    setTouchStartY(e.touches[0].clientY);
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (isScrolling) return;

    const touchEndY = e.changedTouches[0].clientY;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaY = touchEndY - touchStartY;
    const deltaX = touchEndX - touchStartX;

    // Vertical swipe (priority)
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
      if (deltaY < 0 && currentIndex < reels.length - 1) {
        goToNextReel();
      } else if (deltaY > 0 && currentIndex > 0) {
        goToPrevReel();
      }
    }
  };

  const goToNextReel = useCallback(() => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsPlaying(true);
    }
  }, [currentIndex, reels.length]);

  const goToPrevReel = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsPlaying(true);
    }
  }, [currentIndex]);

  const togglePlayPause = (index) => {
    const video = videoRefs.current[index];
    if (video) {
      if (video.paused) {
        video.play().then(() => setIsPlaying(true));
      } else {
        video.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    videoRefs.current.forEach(video => {
      if (video) {
        video.muted = !isMuted;
      }
    });
    setIsMuted(!isMuted);
  };

  const openComments = async (postId) => {
    setCommentPostId(postId);
    setCommentsLoading(true);
    try {
      const res = await postAPI.getComments(postId);
      setComments(res.data.data || []);
    } catch {
      toast.error('Failed to load comments');
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const closeComments = () => {
    setCommentPostId(null);
    setComments([]);
    setCommentText('');
  };

  const handleLike = async (postId) => {
    try {
      await postAPI.likePost(postId);
      setReels(prevReels => 
        prevReels.map(reel => 
          reel._id === postId 
            ? { 
                ...reel, 
                likes: reel.liked ? reel.likes.filter(id => id !== user._id) : [...reel.likes, user._id],
                liked: !reel.liked
              }
            : reel
        )
      );
    } catch (error) {
      toast.error('Failed to like reel');
    }
  };

  const handleDislike = async (postId) => {
    toast.success('Feedback recorded');
  };

  const handleSave = async (postId) => {
    try {
      await postAPI.savePost(postId);
      setReels(prevReels => 
        prevReels.map(reel => 
          reel._id === postId 
            ? { ...reel, saved: !reel.saved }
            : reel
        )
      );
    } catch (error) {
      toast.error('Failed to save reel');
    }
  };

  const handleSubscribe = async (authorId) => {
    try {
      await userAPI.subscribe(authorId);
      setSubscribed(prev => ({ ...prev, [authorId]: true }));
      toast.success('Subscribed');
    } catch (error) {
      toast.error('Failed to subscribe');
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    
    try {
      const res = await postAPI.addComment(commentPostId, commentText);
      setComments(prev => [res.data.data, ...prev]);
      setCommentText('');
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const shareReel = (reel) => {
    if (navigator.share) {
      navigator.share({
        title: reel.caption || 'Check out this reel',
        url: `${window.location.origin}/reels/${reel._id}`
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/reels/${reel._id}`);
      toast.success('Link copied to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading shorts...</p>
        </div>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">🎬</div>
          <h2 className="text-2xl font-bold mb-2">No Shorts Available</h2>
          <p className="text-gray-400 mb-6">Be the first to create a short video!</p>
          <button 
            onClick={() => navigate('/create')}
            className="bg-red-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-red-700 transition-all duration-300"
          >
            Create Short
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {showAd ? (
        <VideoAd 
          adType={adType} 
          onComplete={handleAdComplete}
          onClose={handleAdComplete}
        />
      ) : (
        <div className="flex h-screen bg-black">
          {/* Mobile Header - Conditionally Rendered */}
          {showHeader && (
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/70 to-transparent p-4 transition-opacity duration-300">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => navigate(-1)}
                  className="text-white p-2"
                >
                  <FiX size={24} />
                </button>
                <h1 className="text-white text-xl font-bold">Shorts</h1>
                <button className="text-white p-2">
                  <AiOutlineMenu size={24} />
                </button>
              </div>
            </div>
          )}

          {/* Alternative: Minimal Back Button (Always visible but small) */}
          {/* Uncomment this if you want a minimal always-visible back button */}
          {/* 
          <div className="md:hidden fixed top-4 left-4 z-50">
            <button
              onClick={() => navigate(-1)}
              className="text-white p-2 bg-black/30 rounded-full backdrop-blur-sm"
            >
              <FiX size={20} />
            </button>
          </div>
          */}

          {/* Main Content - YouTube Shorts Style */}
          <div className="flex-1 flex justify-center relative">
            {/* Desktop Navigation Arrows */}
            <div className="hidden md:flex absolute left-4 top-1/2 transform -translate-y-1/2 z-30">
              {currentIndex > 0 && (
                <button
                  onClick={goToPrevReel}
                  className="bg-black/50 text-white p-3 rounded-full backdrop-blur-sm hover:bg-black/70 transition-all duration-300"
                >
                  <FiChevronUp size={24} />
                </button>
              )}
            </div>

            <div className="hidden md:flex absolute right-4 top-1/2 transform -translate-y-1/2 z-30">
              {currentIndex < reels.length - 1 && (
                <button
                  onClick={goToNextReel}
                  className="bg-black/50 text-white p-3 rounded-full backdrop-blur-sm hover:bg-black/70 transition-all duration-300"
                >
                  <FiChevronDown size={24} />
                </button>
              )}
            </div>

            {/* Reels Container */}
            <div 
              ref={containerRef}
              className="w-full max-w-md md:max-w-lg lg:max-w-xl h-full overflow-hidden relative bg-black"
            >
              {reels.map((reel, index) => (
                <div
                  key={reel._id}
                  className={`absolute inset-0 transition-transform duration-500 ease-in-out ${
                    index === currentIndex ? 'translate-y-0' : 
                    index < currentIndex ? '-translate-y-full' : 'translate-y-full'
                  }`}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  {/* Video Element */}
                  <video
                    ref={(el) => (videoRefs.current[index] = el)}
                    src={reel.media?.[0]?.url || reel.mediaUrl}
                    className="w-full h-full object-cover"
                    loop
                    muted={isMuted}
                    playsInline
                    webkit-playsinline="true"
                    onClick={() => {
                      togglePlayPause(index);
                      setShowHeader(prev => !prev); // Toggle header on tap
                    }}
                  />

                  {/* Progress Bar - YouTube Style */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gray-600/30 z-20">
                    <div 
                      className="h-full bg-red-600 transition-all duration-100"
                      style={{ width: `${videoProgress[index] || 0}%` }}
                    ></div>
                  </div>

                  {/* Play/Pause Overlay */}
                  {!isPlaying && index === currentIndex && (
                    <div 
                      className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer"
                      onClick={() => togglePlayPause(index)}
                    >
                      <div className="bg-black/60 rounded-full p-6 backdrop-blur-sm">
                        <BsPlayFill size={48} className="text-white ml-1" />
                      </div>
                    </div>
                  )}

                  {/* YouTube-style Controls Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40">
                    
                    {/* Top Controls - Conditionally Rendered */}
                    {showHeader && (
                      <div className="absolute top-4 right-4 z-10">
                        <button
                          onClick={toggleMute}
                          className="bg-black/50 text-white p-3 rounded-full backdrop-blur-sm hover:bg-black/70 transition-all duration-300 mb-2"
                        >
                          {isMuted ? <MdOutlineVolumeOff size={20} /> : <MdOutlineVolumeUp size={20} />}
                        </button>
                        <button className="bg-black/50 text-white p-3 rounded-full backdrop-blur-sm hover:bg-black/70 transition-all duration-300">
                          <BsThreeDots size={20} />
                        </button>
                      </div>
                    )}

                    {/* Right Action Buttons - Always Visible */}
                    <div className="absolute right-4 bottom-32 z-10 flex flex-col items-center space-y-6">
                      {/* Like Button */}
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => handleLike(reel._id)}
                          className="text-white p-3 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-all duration-300 transform hover:scale-110"
                        >
                          {reel.liked ? (
                            <AiFillHeart size={28} className="text-red-500" />
                          ) : (
                            <AiOutlineHeart size={28} />
                          )}
                        </button>
                        <span className="text-white text-xs mt-1 font-medium bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">
                          {formatNumber(reel.likes?.length || 0)}
                        </span>
                      </div>

                      {/* Dislike Button */}
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => handleDislike(reel._id)}
                          className="text-white p-3 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-all duration-300 transform hover:scale-110"
                        >
                          <AiFillDislike size={28} />
                        </button>
                      </div>

                      {/* Comment Button */}
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => openComments(reel._id)}
                          className="text-white p-3 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-all duration-300 transform hover:scale-110"
                        >
                          <AiOutlineComment size={28} />
                        </button>
                        <span className="text-white text-xs mt-1 font-medium bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">
                          {formatNumber(reel.comments?.length || 0)}
                        </span>
                      </div>

                      {/* Save Button */}
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => handleSave(reel._id)}
                          className="text-white p-3 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-all duration-300 transform hover:scale-110"
                        >
                          {reel.saved ? (
                            <BsBookmarkFill size={26} className="text-red-400" />
                          ) : (
                            <BsBookmark size={26} />
                          )}
                        </button>
                      </div>

                      {/* Share Button */}
                      <div className="flex flex-col items-center">
                        <button 
                          onClick={() => shareReel(reel)}
                          className="text-white p-3 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-all duration-300 transform hover:scale-110"
                        >
                          <AiOutlineShareAlt size={28} />
                        </button>
                      </div>

                      {/* YouTube-style Music Note */}
                      <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-lg mt-4">
                        <IoMusicalNotes size={24} className="text-white" />
                      </div>
                    </div>

                    {/* Bottom Content - Conditionally Rendered */}
                    {showHeader && (
                      <div className="absolute bottom-6 left-4 right-20 z-10">
                        <div className="flex items-start space-x-3 mb-3">
                          <img
                            src={reel.author?.avatar || `https://ui-avatars.com/api/?name=${reel.author?.username}&background=random`}
                            alt={reel.author?.username}
                            className="w-10 h-10 rounded-full object-cover border-2 border-white/80 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="text-white font-semibold text-base">@{reel.author?.username}</h3>
                              {!subscribed[reel.author?._id] && (
                                <button
                                  onClick={() => handleSubscribe(reel.author?._id)}
                                  className="text-xs px-3 py-1 rounded-full font-medium transition-all duration-300 bg-red-600 text-white hover:bg-red-700"
                                >
                                  Subscribe
                                </button>
                              )}
                            </div>
                            <p className="text-white text-sm leading-relaxed line-clamp-2">{reel.caption}</p>
                            
                            {/* Hashtags */}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {reel.hashtags?.slice(0, 2).map((tag, i) => (
                                <span key={i} className="text-blue-400 text-xs font-medium">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                            
                            {/* Music */}
                            <div className="flex items-center mt-2 text-white/80">
                              <IoMusicalNotes className="mr-1" size={14} />
                              <span className="text-xs">Original Sound - {reel.author?.username}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Mobile Navigation Hint - Conditionally Rendered */}
              {showHeader && (
                <div className="md:hidden absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full backdrop-blur-sm text-sm animate-bounce">
                  Swipe up for next
                </div>
              )}
            </div>
          </div>

          {/* Comments Modal */}
          {commentPostId && (
            <div className="fixed inset-0 bg-black z-50 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-black">
                <button
                  onClick={closeComments}
                  className="text-white p-2"
                >
                  <FiX size={24} />
                </button>
                <h3 className="text-white text-lg font-semibold">Comments</h3>
                <div className="w-10"></div>
              </div>
              
              {/* Comments List */}
              <div className="flex-1 overflow-y-auto bg-black">
                <div className="max-w-2xl mx-auto">
                  {commentsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-8">
                      <AiOutlineComment size={48} className="text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No comments yet</p>
                      <p className="text-gray-500 text-sm mt-1">Be the first to comment!</p>
                    </div>
                  ) : (
                    <div className="space-y-4 p-4">
                      {comments.map((comment) => (
                        <div key={comment._id} className="flex items-start space-x-3">
                          <img
                            src={comment.author?.avatar || `https://ui-avatars.com/api/?name=${comment.author?.username}&background=random`}
                            alt={comment.author?.username}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="text-white font-semibold text-sm">@{comment.author?.username}</h4>
                              <span className="text-gray-400 text-xs">
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-200 text-sm leading-relaxed">{comment.text}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                              <button className="flex items-center space-x-1 hover:text-white transition-colors">
                                <AiFillLike size={14} />
                                <span>123</span>
                              </button>
                              <button className="hover:text-white transition-colors">Reply</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Comment Input */}
              <div className="border-t border-gray-800 p-4 bg-gray-900">
                <div className="max-w-2xl mx-auto flex space-x-3 items-center">
                  <div className="flex-1 bg-gray-800 rounded-full px-4 py-3 flex items-center">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                  </div>
                  <button
                    onClick={handleAddComment}
                    disabled={!commentText.trim()}
                    className="text-red-500 p-2 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <IoSend size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Reels;