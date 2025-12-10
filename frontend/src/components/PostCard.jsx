import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postAPI } from '../services/api';
import { formatDuration, getThumbnailUrl } from '../utils/formatUtils';
import socketService from '../services/socket';
import toast from 'react-hot-toast';
import {
  AiOutlineHeart,
  AiFillHeart,
  AiOutlineComment,
  AiOutlineDelete,
  AiOutlineShareAlt,
} from 'react-icons/ai';
import { BsBookmark, BsBookmarkFill, BsThreeDots, BsArchive } from 'react-icons/bs';
import { FiSend, FiCopy, FiTwitter, FiFacebook, FiLinkedin, FiMusic } from 'react-icons/fi';
import { IoLocationOutline, IoEllipsisHorizontal, IoShareOutline, IoPencilOutline, IoTrashOutline, IoFlagOutline, IoBanOutline, IoPlay, IoHeart, IoHeartOutline, IoChatbubbleOutline, IoBookmark, IoBookmarkOutline } from 'react-icons/io5';
import { formatDistanceToNow } from 'date-fns';
import CommentBox from './CommentBox';
import ImageCarousel from './ImageCarousel';
import CaptionWithLinks from './CaptionWithLinks';
import { motion } from 'framer-motion';

const PostCard = ({ post: initialPost, onDelete }) => {
  const { user } = useAuth();
  const [post, setPost] = useState(initialPost);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(post.likes.includes(user?._id));
  const [likesCount, setLikesCount] = useState(post.likes.length);
  const [isSaved, setIsSaved] = useState(false);
  const [isArchived, setIsArchived] = useState(post.isArchived || false);

  // Memoize the media array to prevent unnecessary re-renders
  const mediaArray = useMemo(() => {
    if (!post.media && !post.mediaUrl) return [];
    
    if (post.media && Array.isArray(post.media)) {
      return post.media.filter(m => m && m.url);
    } else if (post.mediaUrl) {
      return [{ url: post.mediaUrl, type: post.mediaType || 'image' }];
    }
    
    return [];
  }, [post.media, post.mediaUrl, post.mediaType]);

  useEffect(() => {
    socketService.on('postLiked', (data) => {
      if (data.postId === post._id) {
        setLikesCount(data.likesCount);
      }
    });

    socketService.on('newComment', (data) => {
      if (data.postId === post._id) {
        setPost((prev) => ({
          ...prev,
          comments: [...prev.comments, data.comment],
        }));
      }
    });

    return () => {
      socketService.off('postLiked');
      socketService.off('newComment');
    };
  }, [post._id]);

  const handleLike = async () => {
    try {
      const response = await postAPI.likePost(post._id);
      setIsLiked(response.data.isLiked);
      setLikesCount(response.data.likesCount);
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const handleSave = async () => {
    try {
      const response = await postAPI.savePost(post._id);
      setIsSaved(response.data.isSaved);
      toast.success(response.data.message);
    } catch (error) {
      toast.error('Failed to save post');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await postAPI.deletePost(post._id);
        toast.success('Post deleted successfully');
        onDelete?.(post._id);
      } catch (error) {
        toast.error('Failed to delete post');
      }
    }
  };

  const handleArchive = async () => {
    try {
      const response = await postAPI.archivePost(post._id);
      setIsArchived(response.data.isArchived);
      toast.success(response.data.message);
      setShowMenu(false);
      if (response.data.isArchived) {
        onDelete?.(post._id);
      }
    } catch (error) {
      toast.error('Failed to archive post');
    }
  };

  // Sharing functions
  const copyLink = () => {
    const postUrl = `${window.location.origin}/post/${post._id}`;
    navigator.clipboard.writeText(postUrl);
    toast.success('Link copied to clipboard!');
    setShowShareMenu(false);
  };

  const shareToTwitter = () => {
    const postUrl = encodeURIComponent(`${window.location.origin}/post/${post._id}`);
    const text = encodeURIComponent(post.caption || 'Check out this post!');
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${postUrl}`, '_blank');
    setShowShareMenu(false);
  };

  const shareToFacebook = () => {
    const postUrl = encodeURIComponent(`${window.location.origin}/post/${post._id}`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${postUrl}`, '_blank');
    setShowShareMenu(false);
  };

  const shareToLinkedIn = () => {
    const postUrl = encodeURIComponent(`${window.location.origin}/post/${post._id}`);
    const title = encodeURIComponent('Check out this post!');
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${postUrl}&title=${title}`, '_blank');
    setShowShareMenu(false);
  };

  const shareNative = async () => {
    const postUrl = `${window.location.origin}/post/${post._id}`;
    const text = post.caption || 'Check out this post!';
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'D4D HUB Post',
          text: text,
          url: postUrl,
        });
        setShowShareMenu(false);
      } catch (error) {
        console.log('Sharing failed:', error);
      }
    } else {
      copyLink();
    }
  };

  const getCategoryBadge = () => {
    if (!post.category) return null;
    
    const badges = {
      image: { icon: '📸', label: 'Photo', color: 'from-primary-400 to-primary-600' },
      short: { icon: '🎬', label: 'Short', color: 'from-secondary-400 to-secondary-600' },
      long: { icon: '🎥', label: 'Video', color: 'from-accent-400 to-accent-600' },
    };

    const badge = badges[post.category] || badges.image;
    const duration = typeof post.durationSec === 'number' 
      ? `${Math.floor(post.durationSec/60)}:${String(post.durationSec%60).padStart(2,'0')}` 
      : '';

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r ${badge.color} text-white text-xs font-bold shadow-sm`}>
        <span>{badge.icon}</span>
        <span>{badge.label}</span>
        {duration && <span className="opacity-90">· {duration}</span>}
      </span>
    );
  };

  // Function to display audio information
  const renderAudioInfo = () => {
    if (!post.audio || !post.audio.title) return null;
    
    return (
      <div className="flex items-center gap-2 mt-2 p-2 bg-gray-100 dark:bg-dark-card rounded-lg">
        <FiMusic className="text-primary-500 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {post.audio.title}
          </p>
          {post.audio.extractedBy && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              by {post.audio.extractedBy.username}
            </p>
          )}
        </div>
      </div>
    );
  };

  const handleShare = async () => {
    try {
      const url = post.media?.[0]?.url || post.mediaUrl || `${window.location.origin}/posts/${post._id}`;
      if (navigator.share) {
        await navigator.share({
          title: post.title || `@${post.author.username} on D4D HUB`,
          text: post.caption || 'Check out this post!',
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Unable to share post');
    }
  };

  const handlePlayVideo = () => {
    // Implement video playback logic here
  };

  const handleComment = () => {
    setShowComments(!showComments);
  };

  const handleEdit = () => {
    // Implement edit post logic here
  };

  const handleReport = () => {
    // Implement report post logic here
  };

  const handleBlock = () => {
    // Implement block user logic here
  };

  const isOwnPost = user?._id === post.author?._id;

  const defaultAvatar = '/path/to/default-avatar.jpg';
  const defaultThumbnail = '/path/to/default-thumbnail.jpg';
  const defaultImage = '/path/to/default-image.jpg';

  const navigate = useNavigate();
  const postUrl = `${window.location.origin}/post/${post._id}`;

  const shareData = {
    title: 'D4D HUB Post',
    text: post.caption || 'Check out this post!',
    url: postUrl,
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white dark:bg-dark-card rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 dark:border-dark-border"
      aria-label={`Post by ${post.author?.username || 'unknown user'}`}
    >
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to={`/profile/${post.author?.username}`}>
            <img
              src={post.author?.avatar || defaultAvatar}
              alt={`${post.author?.username} avatar`}
              className="w-10 h-10 rounded-full object-cover border-2 border-primary-200 dark:border-dark-border"
              onError={(e) => {
                e.target.src = defaultAvatar;
              }}
            />
          </Link>
          <div>
            <Link 
              to={`/profile/${post.author?.username}`} 
              className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {post.author?.username}
            </Link>
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <span>
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </span>
              {post.location?.name && (
                <>
                  <span>•</span>
                  <span className="flex items-center">
                    <IoLocationOutline className="w-3 h-3 mr-1" />
                    {post.location.name}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-card-hover rounded-full transition-colors"
            aria-label="Post options"
            aria-expanded={showMenu}
          >
            <IoEllipsisHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-dark-card rounded-xl shadow-lg border border-gray-200 dark:border-dark-border z-50">
              <button
                onClick={handleShare}
                className="w-full px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-card-hover flex items-center space-x-2 transition-colors"
              >
                <IoShareOutline className="w-4 h-4" />
                <span>Share</span>
              </button>
              
              {isOwnPost ? (
                <>
                  <button
                    onClick={handleEdit}
                    className="w-full px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-card-hover flex items-center space-x-2 transition-colors"
                  >
                    <IoPencilOutline className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2 transition-colors"
                  >
                    <IoTrashOutline className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleReport}
                    className="w-full px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-card-hover flex items-center space-x-2 transition-colors"
                  >
                    <IoFlagOutline className="w-4 h-4" />
                    <span>Report</span>
                  </button>
                  <button
                    onClick={handleBlock}
                    className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2 transition-colors"
                  >
                    <IoBanOutline className="w-4 h-4" />
                    <span>Block User</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        {post.caption && (
          <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
            {post.caption}
          </p>
        )}
        
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {post.hashtags.map((tag, index) => (
              <span 
                key={index} 
                className="text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
                onClick={() => navigate(`/explore/tags/${tag.slice(1)}`)}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Media */}
      <div className="relative">
        {post.media?.[0]?.type === 'video' ? (
          <div 
            className="relative bg-black cursor-pointer"
            onClick={handlePlayVideo}
          >
            <img
              src={getThumbnailUrl(post.media[0])}
              alt="Video thumbnail"
              className="w-full aspect-video object-cover"
              onError={(e) => {
                e.target.src = defaultThumbnail;
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/50 rounded-full p-4">
                <IoPlay className="w-8 h-8 text-white" />
              </div>
            </div>
            {post.durationSec && (
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {formatDuration(post.durationSec)}
              </div>
            )}
          </div>
        ) : (
          <img
            src={post.media?.[0]?.url || defaultImage}
            alt="Post content"
            className="w-full aspect-square object-cover cursor-pointer"
            onClick={() => navigate(`/posts/${post._id}`)}
            onError={(e) => {
              e.target.src = defaultImage;
            }}
          />
        )}
      </div>

      {/* Post Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 transition-colors ${
                isLiked 
                  ? 'text-primary-500 hover:text-primary-600' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-primary-500'
              }`}
              aria-label={isLiked ? "Unlike post" : "Like post"}
            >
              {isLiked ? (
                <IoHeart className="w-6 h-6" fill="currentColor" />
              ) : (
                <IoHeartOutline className="w-6 h-6" />
              )}
              <span className="font-medium">
                {post.likes?.length > 0 ? post.likes.length : ''}
              </span>
            </button>
            
            <button
              onClick={handleComment}
              className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors"
              aria-label="Comment on post"
            >
              <IoChatbubbleOutline className="w-6 h-6" />
              <span className="font-medium">
                {post.comments?.length > 0 ? post.comments.length : ''}
              </span>
            </button>
            
            <button
              onClick={handleShare}
              className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors"
              aria-label="Share post"
            >
              <IoShareOutline className="w-6 h-6" />
            </button>
          </div>
          
          <button
            onClick={handleSave}
            className={`transition-colors ${
              isSaved 
                ? 'text-primary-500 hover:text-primary-600' 
                : 'text-gray-600 dark:text-gray-400 hover:text-primary-500'
            }`}
            aria-label={isSaved ? "Unsave post" : "Save post"}
          >
            {isSaved ? (
              <IoBookmark className="w-6 h-6" fill="currentColor" />
            ) : (
              <IoBookmarkOutline className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>
    </motion.article>
  );
};

export default PostCard;