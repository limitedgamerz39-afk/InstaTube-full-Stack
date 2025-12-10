import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { FiMoreVertical, FiEye, FiHeart, FiMessageSquare, FiPlay } from 'react-icons/fi';
import OptimizedImage from './OptimizedImage';
import BottomSheetMenu from './BottomSheetMenu';
import ReportForm from './ReportForm';
import { postAPI } from '../services/api';
import toast from 'react-hot-toast';

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num;
};

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
};

// New component to handle media rendering
const PostMedia = ({ post }) => {
  const isVideo = post.category === 'short' || post.category === 'long';
  const mediaUrl = post.mediaUrl || (post.media && post.media[0]?.url);
  const customThumbnail = post.thumbnail; // Correct field name

  if (isVideo) {
    return (
      <div className="relative w-full h-full">
        {/* Render video muted and looping for preview effect */}
        <video
          src={`${mediaUrl}#t=0.1`} // #t=0.1 helps browsers show the first frame
          className="w-full h-full object-cover"
          preload="metadata"
          muted
          playsInline
          loop
          onMouseOver={e => e.target.play()}
          onMouseOut={e => e.target.pause()}
        />
        {/* Overlay custom thumbnail if it exists */}
        {customThumbnail && (
          <img
            src={customThumbnail}
            alt={post.caption || 'thumbnail'}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0"
            loading="lazy"
          />
        )}
      </div>
    );
  }

  // Fallback for images
  return (
    <OptimizedImage
      src={mediaUrl}
      alt={post.caption || post.title || 'Post'}
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
  );
};


const Post = React.memo(({ post }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState(null);
  const [isReportFormOpen, setIsReportFormOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const isVideo = post.category === 'short' || post.category === 'long';

  // Get current user on component mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user')) || null;
    setCurrentUser(user);
  }, []);

  const handlePostClick = () => {
    // Only navigate if it's a video
    if (!isVideo) {
      return;
    }

    if (post.category === 'short' || (post.durationSec && post.durationSec <= 60)) {
      navigate(`/reels/${post._id}`);
    } else {
      navigate(`/watch/${post._id}`);
    }
  };

  if (!post || !post.author) {
    return null;
  }
  
  const containerClasses = `flex flex-col space-y-3 mb-4 group ${isVideo ? 'cursor-pointer' : ''}`;
  const mediaContainerClasses = `relative w-full aspect-video bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden shadow-md transition-all duration-300 ${isVideo ? 'group-hover:shadow-purple-400/30 group-hover:shadow-lg' : ''}`;


  const handleSavePost = async (post) => {
    try {
      await postAPI.savePost(post._id);
      toast.success('Post saved successfully!');
    } catch (error) {
      toast.error('Failed to save post');
      console.error('Error saving post:', error);
    }
  };

  const handleWatchLater = async (post) => {
    try {
      await postAPI.watchLater(post._id);
      toast.success('Added to Watch Later!');
    } catch (error) {
      toast.error('Failed to add to Watch Later');
      console.error('Error adding to Watch Later:', error);
    }
  };

  const handleReportPost = async (post) => {
    // For quick reporting, we'll just show a success message
    // Detailed reporting is handled by the ReportForm
    toast.success('Quick report submitted! For detailed reporting, please use the report form.');
  };

  const handleFeedback = (post) => {
    // Open the report form
    setIsReportFormOpen(true);
  };

  return (
    <>
      <div className={containerClasses} onClick={handlePostClick}>
        {/* Media Thumbnail */}
        <div className={mediaContainerClasses}>
          <PostMedia post={post} />
          {post.durationSec && (
            <span className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
              {new Date(post.durationSec * 1000).toISOString().substr(14, 5)}
            </span>
          )}
          
          {/* Play icon overlay for videos */}
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-white/80 backdrop-blur-sm rounded-full p-3 transform scale-75 group-hover:scale-100 transition-transform">
                <FiPlay className="w-6 h-6 text-black ml-0.5" />
              </div>
            </div>
          )}
        </div>

        {/* Post Details */}
        <div className={`flex items-start space-x-3 ${isVideo ? 'cursor-pointer' : ''}`}>
          <Link to={`/profile/${post.author.username}`} onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
            <img
              src={post.author.avatar || '/default-avatar.png'}
              alt={post.author.username}
              className="w-9 h-9 rounded-full object-cover border-2 border-transparent group-hover:border-purple-400 transition-colors"
            />
          </Link>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 line-clamp-2 mb-0.5">
              {post.caption || post.title || 'Untitled'}
            </h3>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <Link to={`/profile/${post.author.username}`} onClick={(e) => e.stopPropagation()} className="font-medium hover:underline">{post.author.username}</Link>
              <div className="flex items-center space-x-1.5 mt-1">
                <span>{formatNumber(post.views || 0)} views</span>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span>{formatTimeAgo(post.createdAt)}</span>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                
                // Get position of the clicked button
                const rect = e.currentTarget.getBoundingClientRect();
                setMenuPosition({
                  x: rect.left + window.pageXOffset,
                  y: rect.top + window.pageYOffset
                });
                
                setIsMenuOpen(true);
              }}
              className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
              aria-label="More options"
            >
              <FiMoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      <BottomSheetMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        post={post}
        position={menuPosition}
        onSavePost={handleSavePost}
        onWatchLater={handleWatchLater}
        onReportPost={handleReportPost}
        onFeedback={handleFeedback}
      />
      
      <ReportForm
        isOpen={isReportFormOpen}
        onClose={() => setIsReportFormOpen(false)}
        post={post}
        user={currentUser}
      />
    </>
  );
});

Post.displayName = 'Post';
export default Post;
