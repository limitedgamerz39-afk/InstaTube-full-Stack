import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postAPI } from '../services/api';
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
import { FiSend } from 'react-icons/fi';
import { timeAgo } from '../utils/timeAgo';
import CommentBox from './CommentBox';
import ImageCarousel from './ImageCarousel';
import CaptionWithLinks from './CaptionWithLinks';

const PostCard = ({ post: initialPost, onDelete }) => {
  const { user } = useAuth();
  const [post, setPost] = useState(initialPost);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(post.likes.includes(user?._id));
  const [likesCount, setLikesCount] = useState(post.likes.length);
  const [isSaved, setIsSaved] = useState(false);
  const [isArchived, setIsArchived] = useState(post.isArchived || false);

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

  return (
    <div className="card mb-6 overflow-hidden animate-fadeIn hover:shadow-card-hover transition-all duration-300">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <Link
          to={`/profile/${post.author.username}`}
          className="flex items-center gap-3 group"
        >
          <div className="relative">
            <img
              src={post.author.avatar}
              alt={post.author.username}
              className="h-11 w-11 rounded-full object-cover ring-2 ring-gray-200 dark:ring-dark-border group-hover:ring-primary-400 transition-all duration-200"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-success-500 rounded-full border-2 border-white dark:border-dark-card"></div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-bold text-gray-900 dark:text-white truncate group-hover:text-primary-500 transition-colors">
                {post.author.username}
              </p>
              {getCategoryBadge()}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{timeAgo(post.createdAt)}</p>
          </div>
        </Link>

        {user?._id === post.author._id && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-card-hover transition-colors text-gray-600 dark:text-gray-400"
            >
              <BsThreeDots size={20} />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
                <div className="absolute right-0 mt-2 w-48 card p-2 z-50 animate-scale-in">
                  <button
                    onClick={handleArchive}
                    className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-card-hover text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <BsArchive className="w-4 h-4" />
                    <span className="font-medium">{isArchived ? 'Unarchive' : 'Archive'}</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl hover:bg-danger-50 dark:hover:bg-danger-900/20 text-danger-500 transition-colors"
                  >
                    <AiOutlineDelete className="w-4 h-4" />
                    <span className="font-medium">Delete</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Post Media with Carousel */}
      {(post.media?.length > 0 || post.mediaUrl) ? (
        <ImageCarousel
          media={
            post.media && post.media.length > 0
              ? post.media
              : post.mediaUrl
              ? [{ url: post.mediaUrl, type: post.mediaType || 'image' }]
              : null
          }
          onLike={handleLike}
          isLiked={isLiked}
        />
      ) : (
        <div className="w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-dark-card dark:to-dark-card-hover flex items-center justify-center">
          <div className="text-center">
            <span className="text-4xl mb-2 block">📷</span>
            <p className="text-gray-500 dark:text-gray-400 font-medium">No media available</p>
          </div>
        </div>
      )}

      {/* Post Actions */}
      <div className="p-4 pt-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={handleLike} 
              className={`p-2 rounded-xl transition-all duration-200 ${
                isLiked 
                  ? 'bg-danger-50 dark:bg-danger-900/20 scale-110' 
                  : 'hover:bg-gray-100 dark:hover:bg-dark-card-hover hover:scale-110'
              }`}
            >
              {isLiked ? (
                <AiFillHeart size={26} className="text-danger-500 animate-like-burst" />
              ) : (
                <AiOutlineHeart size={26} className="text-gray-700 dark:text-gray-300" />
              )}
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className={`p-2 rounded-xl transition-all duration-200 ${
                showComments
                  ? 'bg-info-50 dark:bg-info-900/20'
                  : 'hover:bg-gray-100 dark:hover:bg-dark-card-hover'
              } hover:scale-110`}
            >
              <AiOutlineComment size={26} className={showComments ? 'text-info-500' : 'text-gray-700 dark:text-gray-300'} />
            </button>

            <button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-card-hover transition-all duration-200 hover:scale-110">
              <FiSend size={24} className="text-gray-700 dark:text-gray-300" />
            </button>
          </div>

          <button 
            onClick={handleSave} 
            className={`p-2 rounded-xl transition-all duration-200 ${
              isSaved 
                ? 'bg-warning-50 dark:bg-warning-900/20 scale-110' 
                : 'hover:bg-gray-100 dark:hover:bg-dark-card-hover hover:scale-110'
            }`}
          >
            {isSaved ? (
              <BsBookmarkFill size={24} className="text-warning-500" />
            ) : (
              <BsBookmark size={24} className="text-gray-700 dark:text-gray-300" />
            )}
          </button>
        </div>

        {/* Likes Count */}
        {likesCount > 0 && (
          <p className="font-bold text-gray-900 dark:text-white mb-3">
            {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
          </p>
        )}

        {/* Caption with Hashtags & Mentions */}
        {post.caption && (
          <div className="mb-3">
            <CaptionWithLinks caption={post.caption} author={post.author} />
          </div>
        )}

        {/* Location */}
        {post.location && (
          <div className="flex items-center gap-2 mb-3 text-sm text-gray-600 dark:text-gray-400">
            <span className="text-base">📍</span>
            <span className="font-medium">{post.location}</span>
          </div>
        )}

        {/* Comments Preview */}
        {post.comments.length > 0 && !showComments && (
          <button
            onClick={() => setShowComments(true)}
            className="text-gray-500 dark:text-gray-400 text-sm font-medium hover:text-gray-700 dark:hover:text-gray-300 transition-colors mb-2"
          >
            View all {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
          </button>
        )}

        {/* Comments Section */}
        {showComments && <CommentBox post={post} setPost={setPost} />}
      </div>
    </div>
  );
};

export default PostCard;
