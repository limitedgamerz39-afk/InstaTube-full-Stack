import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { userAPI, postAPI, recommendationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { formatDuration, getThumbnailUrl } from '../utils/formatUtils';
import { formatNumber } from '../utils/formatters';
import useMobile from '../hooks/useMobile';
import MobileCommentModal from '../components/MobileCommentModal';
import Loader from '../components/Loader';
import { FiThumbsUp, FiThumbsDown, FiShare2, FiBookmark, FiChevronDown, FiBell, FiMoreVertical, FiSend } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

const WatchPage = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const videoRef = useRef(null);
  const queryClient = useQueryClient();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [hasIncrementedView, setHasIncrementedView] = useState(false);
  const [isMobileCommentOpen, setIsMobileCommentOpen] = useState(false);
  const isMobile = useMobile();

  // Fetch video data
  const { data: videoData, isLoading: isVideoLoading, isError: isVideoError } = useQuery({
    queryKey: ['video', videoId],
    queryFn: () => postAPI.getPost(videoId),
    enabled: !!videoId,
  });

  // Fetch related videos
  const { data: relatedVideosData, isLoading: areRelatedVideosLoading } = useQuery({
    queryKey: ['relatedVideos', videoId],
    queryFn: () => recommendationAPI.getUpNext(videoId, { limit: 20 }),
    enabled: !!videoId,
  });

  // Fetch comments
  const { data: commentsData, refetch: refetchComments } = useQuery({
    queryKey: ['comments', videoId],
    queryFn: () => postAPI.getComments(videoId),
    enabled: !!videoId,
  });
  
  const currentVideo = videoData?.data?.data;
  const relatedVideos = relatedVideosData?.data?.data?.filter(v => 
    v._id !== videoId && v.category === 'long'
  ) ?? [];
  const comments = commentsData?.data?.data ?? [];

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isDisliked, setIsDisliked] = useState(false);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (currentVideo) {
      // Set like state - check if current user's ID is in the likes array
      const userHasLiked = user && currentVideo.likes?.includes(user._id);
      setIsLiked(userHasLiked || false);
      setLikeCount(currentVideo.likes?.length || 0);
      
      // Load dislike state from localStorage for this video
      if (videoId) {
        const videoReactions = JSON.parse(localStorage.getItem('videoReactions') || '{}');
        const videoReaction = videoReactions[videoId];
        
        // If user has liked the video on server, they can't have disliked it
        if (userHasLiked) {
          setIsDisliked(false);
          setDislikeCount(0);
        } else {
          // If not liked on server, use the local dislike state
          setIsDisliked(videoReaction?.disliked || false);
          setDislikeCount(videoReaction?.disliked ? 1 : 0);
        }
      } else {
        // No videoId, reset state
        setIsDisliked(false);
        setDislikeCount(0);
      }

      // Set subscribe state
      if (user && currentVideo.author) {
        const amISubscribed = currentVideo.author.subscriber?.some(sub => sub === user._id) || false;
        setIsSubscribed(amISubscribed);
      }
      setSubscriberCount(currentVideo.author?.subscriber?.length || 0);
    }
  }, [currentVideo, user, videoId]);

  useEffect(() => {
    // Reset view increment flag when video changes
    setHasIncrementedView(false);
  }, [videoId]);

  useEffect(() => {
    // Increment view count only once per visit to a video
    if (currentVideo && !hasIncrementedView && videoId) {
      const incrementView = async () => {
        try {
          await postAPI.incrementViewCount(videoId);
          setHasIncrementedView(true);
          queryClient.invalidateQueries(['video', videoId]);
        } catch (error) {
          console.error("Failed to increment view count", error);
        }
      };
      incrementView();
    }
  }, [currentVideo, videoId, hasIncrementedView, queryClient]);

  const handleVideoEnd = useCallback(() => {
    if (relatedVideos && relatedVideos.length > 0) {
      const nextVideo = relatedVideos[0];
      const nextVideoUrl = nextVideo.durationSec && nextVideo.durationSec <= 60 ? `/reels/${nextVideo._id}` : `/watch/${nextVideo._id}`;
      toast.success(`Playing next: ${nextVideo.caption}`);
      navigate(nextVideoUrl);
    }
  }, [relatedVideos, navigate]);

  const handleLike = async () => {
    if (!user) return toast.error("You must be logged in to like a video.");
    if (!videoId) return toast.error("Video ID is missing.");
    
    try {
      let newLikedState = isLiked;
      
      if (isLiked) {
        // If already liked, remove the like
        await postAPI.unlikePost(videoId);
        setIsLiked(false);
        setLikeCount(prev => prev - 1);
        toast.success('Like removed');
        newLikedState = false;
      } else {
        // If not liked, add the like
        await postAPI.likePost(videoId);
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
        toast.success('Video liked');
        newLikedState = true;
        
        // Reset dislike state when liking (can't like and dislike at the same time)
        setIsDisliked(false);
        setDislikeCount(0);
      }
      
      // Save reaction state to localStorage
      if (videoId) {
        const videoReactions = JSON.parse(localStorage.getItem('videoReactions') || '{}');
        videoReactions[videoId] = {
          liked: newLikedState,
          disliked: false // Always false when liking
        };
        localStorage.setItem('videoReactions', JSON.stringify(videoReactions));
      }
      
      // Invalidate the video query to refresh the data
      queryClient.invalidateQueries(['video', videoId]);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to update like status');
    }
  };
  
  const handleDislike = async () => {
    if (!user) return toast.error("You must be logged in to dislike a video.");
    if (!videoId) return toast.error("Video ID is missing.");
    
    try {
      let newDislikedState = isDisliked;
      
      // Check if already disliked
      if (isDisliked) {
        // If already disliked, remove the dislike
        setIsDisliked(false);
        setDislikeCount(0);
        toast.success('Dislike removed');
        newDislikedState = false;
      } else {
        // If not disliked, add the dislike
        setIsDisliked(true);
        setDislikeCount(1);
        toast.success('Video disliked');
        newDislikedState = true;
        
        // Reset like state when disliking (can't like and dislike at the same time)
        if (isLiked) {
          await postAPI.unlikePost(videoId);
          setIsLiked(false);
          setLikeCount(prev => prev - 1);
        }
      }
      
      // Save reaction state to localStorage
      if (videoId) {
        const videoReactions = JSON.parse(localStorage.getItem('videoReactions') || '{}');
        videoReactions[videoId] = {
          liked: false, // Always false when disliking
          disliked: newDislikedState
        };
        localStorage.setItem('videoReactions', JSON.stringify(videoReactions));
      }
      
      // Invalidate the video query to refresh the data
      queryClient.invalidateQueries(['video', videoId]);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to dislike video');
    }
  };
  
  const handleSubscribe = async () => {
    if (!user) return toast.error("You must be logged in to subscribe.");
    if (user._id === currentVideo.author._id) return toast.error("You cannot subscribe to yourself.");

    try {
        await userAPI.followUser(currentVideo.author._id);
        if (isSubscribed) {
            setSubscriberCount(prev => prev - 1);
            toast.success(`Unsubscribed from ${currentVideo.author.username}`);
        } else {
            setSubscriberCount(prev => prev + 1);
            toast.success(`Subscribed to ${currentVideo.author.username}`);
        }
        setIsSubscribed(prev => !prev);
        queryClient.invalidateQueries(['video', videoId]);
        
        // Also invalidate the author's profile data to update subscriber count there
        queryClient.invalidateQueries(['profile', currentVideo.author.username]);
    } catch (error) {
        toast.error(error.response?.data?.message || "Failed to subscribe.");
    }
  };
  
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: currentVideo?.caption,
          text: 'Check out this video!',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      toast.error('Failed to share.');
    }
  };

  const handleSave = async () => {
    if (!user) return toast.error("You must be logged in to save videos.");
    try {
      await postAPI.savePost(videoId);
      toast.success('Video saved!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save video');
    }
  };
  
  const handleAddComment = async (commentText = comment) => {
    if (!commentText.trim()) return;
    try {
      await postAPI.addComment(videoId, commentText);
      setComment('');
      toast.success('Comment posted!');
      refetchComments();
    } catch (error) {
      toast.error('Failed to post comment.');
    }
  };

  if (isVideoLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><Loader /></div>;
  if (isVideoError || !currentVideo) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-center px-4"><div className="text-6xl mb-4">😢</div><h2 className="text-2xl font-bold mb-2">Video Not Found</h2><p className="text-gray-600 dark:text-gray-400 mb-6">This video may have been removed or the link is incorrect.</p><button onClick={() => navigate('/videos')} className="px-6 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition font-medium">Explore Other Videos</button></div>;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-screen-xl mx-auto px-2 sm:px-4 lg:px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-x-8 gap-y-6">
          
          {/* Main Content (Left Column on Desktop) */}
          <div className="lg:col-span-8">
            {/* Video Player */}
            <div className="relative bg-black rounded-xl overflow-hidden shadow-lg aspect-video w-full">
              <video
                ref={videoRef}
                src={currentVideo.mediaUrl}
                className="w-full h-full"
                controls
                autoPlay
                playsInline
                onEnded={handleVideoEnd}
              />
            </div>

            {/* Video Metadata */}
            <div className="py-4">
              <h1 className="text-xl md:text-2xl font-bold leading-tight mb-2">
                {currentVideo.caption}
              </h1>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-wrap">
                 {/* Channel Info & Subscribe Button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Link to={`/profile/${currentVideo.author.username}`} className="flex-shrink-0">
                      <img 
                        src={currentVideo.author.avatar} 
                        alt={currentVideo.author.username} 
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    </Link>
                    <div className="ml-3">
                      <Link to={`/profile/${currentVideo.author.username}`} className="font-semibold text-base flex items-center">
                        {currentVideo.author.username}
                        {currentVideo.author.isVerified && <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 ml-1.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                      </Link>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatNumber(subscriberCount)} subscribers
                      </p>
                    </div>
                  </div>
                  <motion.button 
                    onClick={handleSubscribe} 
                    className={`ml-6 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 flex items-center gap-2 whitespace-nowrap ${isSubscribed ? 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600' : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90'}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={!user || user._id === currentVideo.author._id}
                  >
                    {isSubscribed && <FiBell />}
                    {isSubscribed ? 'Subscribed' : 'Subscribe'}
                  </motion.button>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full">
                    <motion.button 
                      onClick={handleLike} 
                      className={`flex items-center space-x-2 px-4 py-2 rounded-l-full transition hover:bg-gray-200 dark:hover:bg-gray-700 ${isLiked ? 'text-purple-500' : ''}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FiThumbsUp size={18} />
                      <span className="font-medium text-sm">{formatNumber(likeCount)}</span>
                    </motion.button>
                    <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
                     <motion.button
                        onClick={handleDislike}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-r-full transition hover:bg-gray-200 dark:hover:bg-gray-700 ${isDisliked ? 'text-red-500' : ''}`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                       <FiThumbsDown size={18} />
                       <span className="font-medium text-sm">{formatNumber(dislikeCount)}</span>
                    </motion.button>
                  </div>
                  
                  <motion.button 
                    onClick={handleShare} 
                    className="flex items-center space-x-2 px-4 py-2 rounded-full transition bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiShare2 size={18} />
                    <span className="text-sm font-medium">Share</span>
                  </motion.button>
                  <motion.button 
                    onClick={handleSave} 
                    className="flex items-center space-x-2 px-4 py-2 rounded-full transition bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiBookmark size={18} />
                    <span className="text-sm font-medium">Save</span>
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Description Box */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 mt-4">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-semibold text-sm">
                    <span>{formatNumber(currentVideo.views)} views</span>
                    <span>{formatDistanceToNow(new Date(currentVideo.createdAt))} ago</span>
                    {currentVideo.tags && currentVideo.tags.map(tag => (
                        <span key={tag} className="text-purple-500">#{tag}</span>
                    ))}
                </div>
                <div className={`text-sm mt-2 whitespace-pre-wrap ${!isDescriptionExpanded ? 'line-clamp-2' : ''}`}>
                    {currentVideo.description || "No description provided."}
                </div>
                <button onClick={() => setIsDescriptionExpanded(prev => !prev)} className="text-sm font-semibold mt-2 hover:underline">
                    {isDescriptionExpanded ? 'Show less' : '...more'}
                </button>
            </div>
            
            {/* Comments Section */}
            {!isMobile ? (
              <div className="mt-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold">{formatNumber(comments.length)} Comments</h2>
                    <div className="flex items-center text-sm">
                      <FiChevronDown className="mr-1"/>
                      <span className="font-semibold">Sort by</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 mb-8">
                      <img src={user?.avatar || '/default-avatar.png'} alt="your avatar" className="w-10 h-10 rounded-full object-cover flex-shrink-0"/>
                      <div className="w-full">
                          <textarea 
                            value={comment} 
                            onChange={(e) => setComment(e.target.value)} 
                            placeholder="Add a comment..." 
                            className="w-full p-2 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-0 outline-none transition" 
                            rows="1"
                          />
                          {comment && (
                            <div className="flex justify-end items-center mt-2 space-x-3">
                                <button onClick={() => setComment('')} className="text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1.5 rounded-full">Cancel</button>
                                <motion.button 
                                  onClick={handleAddComment} 
                                  className="px-4 py-2 bg-purple-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition text-sm font-semibold" 
                                  whileHover={{ scale: 1.05 }} 
                                  whileTap={{ scale: 0.95 }}
                                >
                                    Comment
                                </motion.button>
                            </div>
                          )}
                      </div>
                  </div>
                  <div className="space-y-6">
                    {comments.length > 0 ? comments.map(c => (
                        <div key={c._id} className="flex items-start gap-4">
                          <img src={c.author.avatar} alt={c.author.username} className="w-10 h-10 rounded-full object-cover flex-shrink-0"/>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm">
                              <span className="font-semibold">{c.author.username}</span>
                              <span className="text-gray-500 dark:text-gray-400 ml-2">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                            </p>
                            <p className="text-sm mt-1 break-words">{c.text}</p>
                          </div>
                        </div>
                    )) : <p className="text-center py-8 text-gray-500 dark:text-gray-400">Be the first to comment!</p>}
                  </div>
              </div>
            ) : (
              // Simplified comment section for mobile
              <div className="mt-8">
                <div 
                  className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-full cursor-pointer"
                  onClick={() => setIsMobileCommentOpen(true)}
                >
                  <img src={user?.avatar || '/default-avatar.png'} alt="your avatar" className="w-8 h-8 rounded-full object-cover flex-shrink-0"/>
                  <span className="text-gray-500 dark:text-gray-400 flex-1">Add a comment...</span>
                  <FiSend className="text-gray-500 dark:text-gray-400" />
                </div>
              </div>
            )}
          </div>

          {/* Related Videos (Right Column on Desktop) */}
          <div className="lg:col-span-4">
              <h3 className="text-lg font-semibold mb-4 hidden lg:block">Up Next</h3>
              <div className="space-y-2">
                {areRelatedVideosLoading 
                  ? [...Array(8)].map((_, i) => (
                      <div key={i} className="flex gap-3 p-2">
                        <div className="w-2/5 sm:w-32 aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse flex-shrink-0"></div>
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-3/4"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-1/2"></div>
                        </div>
                      </div>
                    ))
                  : relatedVideos.map((video) => (
                      <motion.div key={video._id} whileHover={{ backgroundColor: 'rgba(156, 163, 175, 0.1)'}} className="rounded-lg">
                        <Link to={video.durationSec && video.durationSec <= 60 ? `/reels/${video._id}` : `/watch/${video._id}`} className="flex gap-3 cursor-pointer group p-2">
                            <div className="relative w-2/5 sm:w-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800 aspect-video">
                                <img 
                                    src={getThumbnailUrl(video)} 
                                    alt={video.caption} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        // Fallback to mediaUrl if thumbnail fails to load
                                        if (e.target.src !== video.mediaUrl) {
                                            e.target.src = video.mediaUrl;
                                        }
                                    }}
                                />
                                {video.durationSec && (
                                    <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 py-0.5 rounded">
                                        {formatDuration(video.durationSec)}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-purple-400 transition-colors">{video.caption}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center truncate">
                                  {video.author?.username}
                                  {video.author?.isVerified && <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-500 ml-1 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                                </p>
                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-500 space-x-1.5">
                                  <span>{formatNumber(video.views)} views</span>
                                  <span>•</span>
                                  <span>{formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}</span>
                                </div>
                            </div>
                        </Link>
                      </motion.div>
                  ))}
              </div>
          </div>

        </div>
      </div>
      {isMobile && (
        <MobileCommentModal 
          isOpen={isMobileCommentOpen} 
          onClose={() => setIsMobileCommentOpen(false)}
          comments={comments}
          user={user}
          onAddComment={handleAddComment}
          currentVideo={currentVideo}
        />
      )}
    </div>
  );
};

export default WatchPage;
