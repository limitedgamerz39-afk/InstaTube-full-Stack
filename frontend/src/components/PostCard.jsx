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
} from 'react-icons/ai';
import { BsBookmark, BsBookmarkFill } from 'react-icons/bs';
import { BsThreeDots } from 'react-icons/bs';
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
    // Listen for real-time likes
    socketService.on('postLiked', (data) => {
      if (data.postId === post._id) {
        setLikesCount(data.likesCount);
      }
    });

    // Listen for real-time comments
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
        // Optionally remove from feed
        onDelete?.(post._id);
      }
    } catch (error) {
      toast.error('Failed to archive post');
    }
  };

  return (
    <div className="card mb-6 animate-fadeIn">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <Link
          to={`/profile/${post.author.username}`}
          className="flex items-center space-x-3"
        >
          <img
            src={post.author.avatar}
            alt={post.author.username}
            className="h-10 w-10 rounded-full object-cover"
          />
          <div>
            <p className="font-semibold flex items-center gap-2">
              {post.author.username}
              {post.category && (
                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1 rounded-full">
                  {post.category === 'image' ? 'Image' : post.category === 'short' ? `Short ${typeof post.durationSec==='number' ? `${Math.floor(post.durationSec/60)}:${String(post.durationSec%60).padStart(2,'0')}` : ''}` : `Long ${typeof post.durationSec==='number' ? `${Math.floor(post.durationSec/60)}:${String(post.durationSec%60).padStart(2,'0')}` : ''}`}
                </span>
              )}
            </p>
            <p className="text-xs text-gray-500">{timeAgo(post.createdAt)}</p>
          </div>
        </Link>

        {user?._id === post.author._id && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="hover:bg-gray-100 p-2 rounded-full"
            >
              <BsThreeDots size={20} />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 border border-gray-200 dark:border-gray-700 animate-fadeIn z-10">
                <button
                  onClick={handleArchive}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
                >
                  📦 {isArchived ? 'Unarchive' : 'Archive'}
                </button>
                <button
                  onClick={handleDelete}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500"
                >
                  <AiOutlineDelete className="inline mr-2" />
                  Delete
                </button>
              </div>
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
        <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">No media available</p>
        </div>
      )}

      {/* Post Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-4">
            <button onClick={handleLike} className="hover:scale-110 transition dark:text-white">
              {isLiked ? (
                <AiFillHeart size={28} className="text-red-500" />
              ) : (
                <AiOutlineHeart size={28} />
              )}
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="hover:scale-110 transition dark:text-white"
            >
              <AiOutlineComment size={28} />
            </button>
          </div>

          <button onClick={handleSave} className="hover:scale-110 transition dark:text-white">
            {isSaved ? (
              <BsBookmarkFill size={24} className="text-black dark:text-white" />
            ) : (
              <BsBookmark size={24} />
            )}
          </button>
        </div>

        {/* Likes Count */}
        <p className="font-semibold mb-2">
          {likesCount} {likesCount === 1 ? 'like' : 'likes'}
        </p>

        {/* Caption with Hashtags & Mentions */}
        {post.caption && (
          <CaptionWithLinks caption={post.caption} author={post.author} />
        )}

        {/* Location */}
        {post.location && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            📍 {post.location}
          </p>
        )}

        {/* Comments Preview */}
        {post.comments.length > 0 && !showComments && (
          <button
            onClick={() => setShowComments(true)}
            className="text-gray-500 text-sm mb-2"
          >
            View all {post.comments.length} comments
          </button>
        )}

        {/* Comments Section */}
        {showComments && <CommentBox post={post} setPost={setPost} />}
      </div>
    </div>
  );
};

export default PostCard;
