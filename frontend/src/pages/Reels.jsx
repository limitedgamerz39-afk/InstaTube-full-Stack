import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useInfiniteQuery, useQueryClient, useQuery } from '@tanstack/react-query';
import { postAPI, exploreAPI, userAPI, recommendationAPI, messageAPI } from '../services/api';
import socketService from '../services/socket';
import toast from 'react-hot-toast';
import { AiOutlineHeart, AiFillHeart, AiOutlineComment, AiOutlineShareAlt, AiOutlineCheck } from 'react-icons/ai';
import { BsBookmark, BsBookmarkFill, BsPlayFill } from 'react-icons/bs';
import { FiX, FiUsers } from 'react-icons/fi';
import { IoMusicalNotes } from 'react-icons/io5';
import { MdOutlineVolumeOff, MdOutlineVolumeUp } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';

const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
};

const ReelCard = ({ reel, isActive, isMuted, onLike, onSubscribe, onShowComments, onShowShare }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const lastTap = useRef(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.currentTime = 0;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleTimeUpdate = () => setProgress((video.currentTime / video.duration) * 100);
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, []);

  useEffect(() => {
    // Check if current user is subscribed to the reel author
    if (reel && reel.author && reel.author.subscribers) {
      // In a real app, you would check against the current user ID
      // For now, we'll just set a default value
      setIsSubscribed(false);
    }
  }, [reel]);

  const handleVideoTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) { // Double-tap
      // Determine current like state
      const isCurrentlyLiked = reel.isLiked || false;
      onLike(reel._id, isCurrentlyLiked);
      setShowLikeAnimation(true);
      setTimeout(() => setShowLikeAnimation(false), 1000);
    } else { // Single-tap
      const video = videoRef.current;
      if (video) {
        if (video.paused) {
          video.play();
          setIsPlaying(true);
        } else {
          video.pause();
          setIsPlaying(false);
        }
      }
    }
    lastTap.current = now;
  };

  if (!reel || !reel.author) return null;

  // Determine if the reel is liked by the current user
  const isLiked = reel.isLiked || false;

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <video
        ref={videoRef}
        src={reel.mediaUrl}
        className="w-full h-full object-contain"
        loop
        muted={isMuted}
        playsInline
        webkit-playsinline="true"
      />

      <div className="absolute inset-0" onClick={handleVideoTap}>
        {!isPlaying && isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-black/50 rounded-full p-4">
                <BsPlayFill size={60} className="text-white" />
              </div>
            </motion.div>
          </div>
        )}
        
        {/* Double-tap like animation */}
        <AnimatePresence>
          {showLikeAnimation && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-black/30 rounded-full p-6">
                <AiFillHeart size={100} className="text-red-500" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <Link to={`/profile/${reel.author.username}`}>
                <motion.img 
                  src={reel.author.avatar} 
                  className="w-12 h-12 rounded-full border-2 border-white cursor-pointer flex-shrink-0" 
                  alt={reel.author.username}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <Link to={`/profile/${reel.author.username}`}>
                    <motion.h3 
                      className="text-white font-bold text-base cursor-pointer truncate"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      @{reel.author.username}
                    </motion.h3>
                  </Link>
                  {!isSubscribed && (
                    <motion.button 
                      onClick={() => onSubscribe(reel.author._id)}
                      className="px-4 py-1.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Subscribe
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
            <motion.div 
              className="text-white text-sm mb-1 max-h-12 overflow-hidden"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <p className="line-clamp-2 leading-tight">
                {reel.caption}
              </p>
            </motion.div>
            <div className="flex items-center mt-2 text-white/80">
              <IoMusicalNotes className="mr-2" size={16} />
              <span className="text-xs font-medium">Original Sound</span>
            </div>
          </div>
          
          <div className="flex flex-col items-center space-y-6 text-white">
            <motion.button 
              onClick={() => {
                // Pass both the reel ID and current like state
                onLike(reel._id, isLiked);
                setShowLikeAnimation(true);
                setTimeout(() => setShowLikeAnimation(false), 1000);
              }} 
              className="flex flex-col items-center group"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isLiked ? (
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type:
                     "spring", stiffness: 500, damping: 15 }}
                >
                  <AiFillHeart size={28} className="text-red-500" />
                </motion.div>
              ) : (
                <AiOutlineHeart size={28} />
              )}
              <span className="text-xs mt-1 group-hover:text-red-400 transition-colors">{formatNumber(reel.likesCount || reel.likes?.length || 0)}</span>
            </motion.button>
            <motion.button 
              onClick={() => onShowComments(reel)} 
              className="flex flex-col items-center group"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <AiOutlineComment size={28} />
              <span className="text-xs mt-1 group-hover:text-blue-400 transition-colors">{formatNumber(reel.comments?.length || 0)}</span>
            </motion.button>
            <motion.button 
              onClick={() => toast("Save feature coming soon!")} 
              className="flex flex-col items-center group"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {reel.saved ? <BsBookmarkFill size={26} /> : <BsBookmark size={26} />}
            </motion.button>
            <motion.button 
              onClick={() => onShowShare(reel)} 
              className="flex flex-col items-center group"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <AiOutlineShareAlt size={28} />
            </motion.button>
          </div>
        </div>
      </div>
      
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
        <motion.div 
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500" 
          style={{ width: `${progress}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
    </div>
  );
};

const ShareModal = ({ reel, onClose, isVisible, onShareToMessages }) => {
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isVisible) {
      // Fetch user's friends/contacts
      const fetchFriends = async () => {
        try {
          // Fetch conversations (friends) from the messaging API
          const response = await messageAPI.getConversations();
          const conversations = response.data.data || [];
          
          // Transform conversations to friend format
          const friendList = conversations.map(conv => ({
            id: conv.user._id,
            username: conv.user.username,
            avatar: conv.user.avatar,
            online: conv.user.isOnline || false, // Assuming there's an isOnline field
          }));
          
          setFriends(friendList);
        } catch (error) {
          console.error('Error fetching friends:', error);
          toast.error('Failed to load contacts');
        }
      };
      fetchFriends();
      
      // Listen for real-time online status updates
      const handleUserStatusChange = (data) => {
        setFriends(prevFriends => 
          prevFriends.map(friend => 
            friend.id === data.userId 
              ? { ...friend, online: data.isOnline } 
              : friend
          )
        );
      };
      
      socketService.on('user-status-change', handleUserStatusChange);
      
      // Cleanup listener on unmount
      return () => {
        socketService.off('user-status-change', handleUserStatusChange);
      };
    }
  }, [isVisible]);

  const filteredFriends = friends.filter(friend => 
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFriendSelection = (friendId) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleShare = async () => {
    if (selectedFriends.length === 0) {
      toast.error('Please select at least one friend');
      return;
    }

    try {
      // Call the share function passed from parent, passing the message text
      await onShareToMessages(selectedFriends, reel, message);
      setMessage(''); // Clear the message
      onClose();
    } catch (error) {
      console.error('Error sharing:', error);
      // Error is handled in handleShareToMessages
    }
  };

  if (!isVisible || !reel) return null;

  return (
    <motion.div 
      className="fixed inset-0 bg-black/50 z-50 flex justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div 
        className="bg-white dark:bg-gray-900 w-full max-w-md h-full flex flex-col"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold dark:text-white">Share Reel</h3>
          <motion.button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiX size={24} />
          </motion.button>
        </div>
        
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search friends..."
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FiUsers className="absolute right-3 top-2.5 text-gray-400" />
          </div>
          
          {/* Quick Share Options */}
          <div className="flex space-x-2 mb-4">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/post/${reel._id}`);
                toast.success('Link copied to clipboard!');
              }}
              className="flex-1 flex flex-col items-center justify-center p-3 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs font-medium dark:text-white">Copy Link</span>
            </button>
            
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'Check out this reel',
                    text: reel.caption || 'Amazing reel!',
                    url: `${window.location.origin}/post/${reel._id}`
                  }).catch(console.error);
                } else {
                  toast.error('Web Share API not supported in your browser');
                }
              }}
              className="flex-1 flex flex-col items-center justify-center p-3 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <span className="text-xs font-medium dark:text-white">Share</span>
            </button>
            
            <button 
              onClick={() => toast('Share to story coming soon!')}
              className="flex-1 flex flex-col items-center justify-center p-3 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012" />
                </svg>
              </div>
              <span className="text-xs font-medium dark:text-white">Story</span>
            </button>
          </div>
          
          {/* Reel Preview */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Preview:</h4>
            <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
              {reel.mediaUrl && (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                  <video 
                    src={reel.mediaUrl} 
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <BsPlayFill className="text-white" />
                  </div>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium dark:text-white truncate">{reel.caption || 'Untitled Reel'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">@{reel.author?.username || 'Unknown'}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {filteredFriends.length > 0 ? (
              filteredFriends.map(friend => (
                <motion.div 
                  key={friend.id}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer ${selectedFriends.includes(friend.id) ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                  onClick={() => toggleFriendSelection(friend.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="relative">
                    <img 
                      src={friend.avatar} 
                      alt={friend.username} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {friend.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium dark:text-white">{friend.username}</div>
                  </div>
                  {selectedFriends.includes(friend.id) && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <AiOutlineCheck className="text-white text-xs" />
                    </div>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <div className="mb-4 text-4xl">👥</div>
                <p className="font-medium">No friends found</p>
                <p className="text-sm mt-1">Try a different search term</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="mb-4">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message (optional)..."
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows="3"
            />
          </div>
          <motion.button
            onClick={handleShare}
            disabled={sending || selectedFriends.length === 0}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center"
            whileHover={{ scale: !sending && selectedFriends.length > 0 ? 1.02 : 1 }}
            whileTap={{ scale: !sending && selectedFriends.length > 0 ? 0.98 : 1 }}
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              `Share to ${selectedFriends.length} friend(s)`
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const CommentsModal = ({ reel, onClose, isVisible }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isVisible && reel) {
      // Fetch comments for the reel
      const fetchComments = async () => {
        try {
          const response = await postAPI.getComments(reel._id);
          setComments(response.data.data || []);
        } catch (error) {
          console.error('Error fetching comments:', error);
          toast.error('Failed to load comments');
        }
      };
      fetchComments();
    }
  }, [isVisible, reel]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setLoading(true);
    try {
      const response = await postAPI.addComment(reel._id, newComment);
      setComments(prev => [response.data.data, ...prev]);
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error(error.response?.data?.message || 'Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible || !reel) return null;

  return (
    <motion.div 
      className="fixed inset-0 bg-black/50 z-50 flex justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div 
        className="bg-white dark:bg-gray-900 w-full max-w-md h-full flex flex-col"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold dark:text-white">Comments ({comments.length})</h3>
          <motion.button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiX size={24} />
          </motion.button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence>
            {comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map(comment => (
                  <motion.div 
                    key={comment._id} 
                    className="flex gap-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img 
                      src={comment.author?.avatar || '/default-avatar.png'} 
                      alt={comment.author?.username} 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-3 py-2">
                        <div className="font-semibold text-sm dark:text-white flex items-center">
                          {comment.author?.username}
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm dark:text-gray-200">{comment.text}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div 
                className="text-center py-8 text-gray-500 dark:text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="mb-4 text-4xl">💬</div>
                <p className="font-medium">No comments yet</p>
                <p className="text-sm mt-1">Be the first to comment!</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !loading && newComment.trim()) {
                  handleAddComment();
                }
              }}
            />
            <motion.button
              onClick={handleAddComment}
              disabled={loading || !newComment.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-medium disabled:opacity-50 flex items-center justify-center"
              whileHover={{ scale: !loading && newComment.trim() ? 1.05 : 1 }}
              whileTap={{ scale: !loading && newComment.trim() ? 0.95 : 1 }}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Post'
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Reels = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [selectedReel, setSelectedReel] = useState(null);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams(); // Get the reel ID from URL params

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      socketService.connect(token);
    }

    return () => {
      socketService.disconnect();
    };
  }, []);

  const fetchReels = async ({ pageParam = 1 }) => {
    // Fetch all posts and filter by duration (60 seconds or less) or type 'short'
    const response = await postAPI.getFeed(pageParam, 10, 'popular');
    // Filter the posts to only include those with duration <= 60 seconds or type 'short'
    if (response.data && response.data.data) {
      response.data.data = response.data.data.filter(post => 
        (post.durationSec && post.durationSec <= 60) || post.type === 'short'
      ).map(post => ({
        ...post,
        // Initialize isLiked based on whether the current user has liked the post
        isLiked: post.likes && post.likes.some(like => like._id === 'current_user'),
        // Initialize likesCount if not already present
        likesCount: post.likes ? post.likes.length : 0
      }));
    }
    return response.data;
  };

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['reels'],
    queryFn: fetchReels,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined;
    },
  });

  // Extract reels from the paginated data
  const reels = data?.pages?.flatMap(page => page.data || []) ?? [];
  
  // For now, we'll just use the main reels data
  const allReels = reels;

  useEffect(() => {
    if (allReels.length > 0) {
      // If there's an ID in the URL, find the corresponding reel and set it as active
      if (id) {
        const reelIndex = allReels.findIndex(reel => reel._id === id);
        if (reelIndex !== -1) {
          setActiveIndex(reelIndex);
        } else {
          // If the reel with the given ID is not found, default to the first reel
          setActiveIndex(0);
        }
      } else {
        // If no ID in URL, default to the first reel
        setActiveIndex(0);
      }
    }
  }, [allReels.length, id]);

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && activeIndex >= allReels.length - 2) {
      fetchNextPage();
    }
  }, [activeIndex, hasNextPage, isFetchingNextPage, fetchNextPage, allReels.length]);

  const changeReel = useCallback((direction) => {
    setActiveIndex(prev => {
      const newIndex = prev + direction;
      if (newIndex >= 0 && newIndex < allReels.length) {
        return newIndex;
      }
      return prev;
    });
  }, [allReels.length]);

  const handleWheel = (e) => {
    if (e.deltaY > 0) {
      changeReel(1);
    } else if (e.deltaY < 0) {
      changeReel(-1);
    }
  };
  
  const touchStartY = useRef(0);
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    if (touchStartY.current - touchEndY > 50) { // Swiped up
        changeReel(1);
    } else if (touchEndY - touchStartY.current > 50) { // Swiped down
        changeReel(-1);
    }
  };

  const handleLike = async (postId, isLiked) => {
    try {
      // Validate postId before making API call
      if (!postId) {
        toast.error('Invalid post ID');
        return;
      }
      
      // Determine which action to take based on current state
      const response = isLiked 
        ? await postAPI.unlikePost(postId)
        : await postAPI.likePost(postId);
      
      // Only show success message for actual successful operations
      if (response.data && response.data.message) {
        toast.success(response.data.message);
      }
      
      // Update the cache with the new like state
      queryClient.setQueryData(['reels'], oldData => {
        const newData = {...oldData};
        newData.pages = newData.pages.map(page => {
          const newPage = {...page};
          newPage.data = newPage.data.map(reel => {
            if (reel._id === postId) {
              const newReel = {...reel};
              // Toggle the liked state and update like count
              if (isLiked) {
                newReel.isLiked = false;
                newReel.likesCount = Math.max(0, (newReel.likesCount || 0) - 1);
              } else {
                newReel.isLiked = true;
                newReel.likesCount = (newReel.likesCount || 0) + 1;
              }
              return newReel;
            }
            return reel;
          });
          return newPage;
        });
        return newData;
      });
    } catch (error) {
      console.error('Like/Unlike error:', error);
      
      // Even if API fails, still update UI state to provide smooth user experience
      // This handles cases where user double-clicks like button
      queryClient.setQueryData(['reels'], oldData => {
        const newData = {...oldData};
        newData.pages = newData.pages.map(page => {
          const newPage = {...page};
          newPage.data = newPage.data.map(reel => {
            if (reel._id === postId) {
              const newReel = {...reel};
              // Toggle the liked state and update like count regardless of API result
              if (isLiked) {
                // User is trying to unlike - update UI to show unliked state
                newReel.isLiked = false;
                newReel.likesCount = Math.max(0, (newReel.likesCount || 0) - 1);
              } else {
                // User is trying to like - update UI to show liked state
                newReel.isLiked = true;
                newReel.likesCount = (newReel.likesCount || 0) + 1;
              }
              return newReel;
            }
            return reel;
          });
          return newPage;
        });
        return newData;
      });
      
      // Only show error messages for critical errors, not for duplicate like/unlike attempts
      if (error.response) {
        if (error.response.status === 404) {
          toast.error('Reel not found');
        } else if (error.response.status >= 500) {
          toast.error('Server error. Please try again.');
        }
        // For 400 errors (like "already liked" or "not liked yet"), we silently handle them
        // by updating the UI state above without showing error messages
      } else {
        // Network or other unexpected errors
        toast.error('Failed to like/unlike reel. Please check your connection.');
      }
    }
  };

  const handleSubscribe = async (userId) => {
    try {
      // Validate userId before making API call
      if (!userId) {
        toast.error('Invalid user ID');
        return;
      }
      
      const response = await userAPI.followUser(userId);
      toast.success(response.data.message);
      
      // Update UI to reflect subscription state
      queryClient.setQueryData(['reels'], oldData => {
        const newData = {...oldData};
        newData.pages = newData.pages.map(page => {
          const newPage = {...page};
          newPage.data = newPage.data.map(reel => {
            if (reel.author._id === userId) {
              const newReel = {...reel};
              newReel.author = {...newReel.author};
              // Update the subscription state if needed
              newReel.author.isSubscribed = response.data.isSubscribed;
              return newReel;
            }
            return reel;
          });
          return newPage;
        });
        return newData;
      });
    } catch (error) {
      console.error('Subscribe/Unsubscribe error:', error);
      if (error.response && error.response.status === 400) {
        // Handle specific error cases with exact message matching
        const errorMessage = error.response.data.message;
        if (errorMessage === 'You cannot subscribe to yourself') {
          toast.error('You cannot subscribe to yourself');
        } else if (errorMessage === 'User not found') {
          toast.error('User not found');
        } else {
          toast.error(errorMessage || 'Subscription action failed');
        }
      } else if (error.response && error.response.status === 404) {
        toast.error('User not found');
      } else {
        toast.error('Failed to subscribe/unsubscribe');
      }
    }
  };

  const handleShowComments = (reel) => {
    setSelectedReel(reel);
    setShowComments(true);
  };

  const handleShowShare = (reel) => {
    setSelectedReel(reel);
    setShowShare(true);
  };

  const handleShareToMessages = async (friendIds, reel, messageText = '') => {
    // Send the reel to the selected friends via the messaging system
    setSending(true);
    try {
      // Send the reel to each selected friend
      const sharePromises = friendIds.map(async (friendId) => {
        // Create a message with the reel link and optional personal message
        const fullMessageText = messageText ? `${messageText}\n\nCheck out this reel: ${window.location.origin}/reels/${reel._id}` : `Check out this reel: ${window.location.origin}/reels/${reel._id}`;
        return await messageAPI.sendMessage(friendId, fullMessageText);
      });
      
      await Promise.all(sharePromises);
      
      toast.success(`Reel shared to ${friendIds.length} friend(s)!`);
      return Promise.resolve();
    } catch (error) {
      console.error('Error sharing reel:', error);
      toast.error('Failed to share reel');
      throw error;
    } finally {
      setSending(false);
    }
  };

  const handleCloseComments = () => {
    setShowComments(false);
    setSelectedReel(null);
  };

  const handleCloseShare = () => {
    setShowShare(false);
    setSelectedReel(null);
  };

  const renderWindow = () => {
    const items = [];
    // Render only current, prev, and next for virtualization
    for (let i = Math.max(0, activeIndex - 1); i <= Math.min(allReels.length - 1, activeIndex + 1); i++) {
      items.push(
        <motion.div 
            key={allReels[i]._id} 
            className="h-full w-full absolute top-0 left-0" 
            style={{ y: (i - activeIndex) * 100 + '%' }}
            initial={{ y: (i - activeIndex) * 100 + '%' }}
            animate={{ y: (i - activeIndex) * 100 + '%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <ReelCard
            reel={allReels[i]}
            isActive={i === activeIndex}
            isMuted={isMuted}
            onLike={handleLike}
            onSubscribe={handleSubscribe}
            onShowComments={handleShowComments}
            onShowShare={handleShowShare}
          />
        </motion.div>
      );
    }
    return items;
  };
  
  if (!allReels.length && isFetchingNextPage) return (
    <div className="h-screen w-screen flex items-center justify-center bg-black text-white">
      <motion.div 
        className="text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 w-24 h-24 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-2 w-20 h-20 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
        </div>
        <h3 className="text-xl font-semibold mb-2">Loading Reels</h3>
        <p className="text-gray-400">Preparing your entertainment...</p>
      </motion.div>
    </div>
  );
  
  if (error) return (
    <div className="h-screen w-screen flex items-center justify-center bg-black text-white">
      <motion.div 
        className="text-center p-6 max-w-md"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-6xl mb-6">🎬</div>
        <h2 className="text-2xl font-bold mb-3 text-white">Oops! Something went wrong</h2>
        <p className="mb-6 text-gray-300 text-base">{error.message || 'We couldn\'t load the reels. Please check your connection and try again.'}</p>
        <div className="flex gap-3 justify-center">
          <motion.button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry
          </motion.button>
          <motion.button 
            onClick={() => navigate('/')} 
            className="px-6 py-3 bg-gray-700 rounded-xl font-semibold flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Home
          </motion.button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div 
        className="h-screen w-screen bg-black relative overflow-hidden"
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
    >
      <div className="absolute top-4 left-4 z-20">
        <motion.button 
          onClick={() => {
            // If we came from a specific reel URL, go back to feed
            // Otherwise, go back in history
            if (id) {
              navigate('/'); // Go to home/feed
            } else {
              navigate(-1); // Go back in history
            }
          }} 
          className="text-white bg-black/30 p-2 rounded-full backdrop-blur-sm"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FiX size={24} />
        </motion.button>
      </div>
      <div className="absolute top-4 right-4 z-20">
        <motion.button 
          onClick={() => setIsMuted(m => !m)} 
          className="text-white bg-black/30 p-2 rounded-full backdrop-blur-sm"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isMuted ? <MdOutlineVolumeOff size={24} /> : <MdOutlineVolumeUp size={24} />}
        </motion.button>
      </div>
      
      {allReels.length > 0 ? renderWindow() : (
        <motion.div 
          className="text-white text-center flex flex-col items-center justify-center h-full p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-6xl mb-6">📱</div>
          <h3 className="text-2xl font-bold mb-3">No Reels Available</h3>
          <p className="text-gray-400 mb-6 max-w-md">There are no reels to show right now. Check back later or create your own reel!</p>
          <motion.button 
            onClick={() => navigate('/upload')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Reel
          </motion.button>
        </motion.div>
      )}
      
      {/* Loading indicator for fetching more reels */}
      {isFetchingNextPage && (
        <motion.div 
          className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 backdrop-blur-sm"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Loading more reels...
        </motion.div>
      )}
      
      <CommentsModal 
        reel={selectedReel} 
        isVisible={showComments} 
        onClose={handleCloseComments} 
      />
      <ShareModal 
        reel={selectedReel} 
        isVisible={showShare} 
        onClose={handleCloseShare} 
        onShareToMessages={handleShareToMessages}
      />
    </div>
  );
};

export default Reels;