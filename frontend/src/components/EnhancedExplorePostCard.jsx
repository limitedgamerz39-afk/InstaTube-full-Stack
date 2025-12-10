import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { formatDuration, getThumbnailUrl } from '../utils/formatUtils';
import { formatNumber } from '../utils/formatters';
import { FiHeart, FiMessageSquare, FiPlay } from 'react-icons/fi';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';

const EnhancedExplorePostCard = ({ post }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubscribed, setIsSubscribed] = useState(false);

  if (!post) return null;

  const handleClick = () => {
    // Navigate based on post type
    if (post.type === 'short' || (post.durationSec && post.durationSec <= 60) || post.category === 'short') {
      navigate(`/reels/${post._id}`);
    } else {
      navigate(`/watch/${post._id}`);
    }
  };

  const handleSubscribe = async (e) => {
    e.stopPropagation();
    try {
      await userAPI.followUser(post.author._id);
      setIsSubscribed(true);
      toast.success(`Subscribed to @${post.author.username}`);
      // Invalidate queries to update UI
      queryClient.invalidateQueries(['explorePosts']);
    } catch (error) {
      toast.error('Failed to subscribe');
    }
  };

  // Determine content type
  const isVideo = post.mediaType === 'video' || post.type === 'short' || post.type === 'long' || post.type === 'video' || post.category === 'short' || post.category === 'long';
  const isReel = post.type === 'short' || post.category === 'short' || (post.durationSec && post.durationSec <= 60);

  return (
    <div className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
      {/* Post Image/Video */}
      <div 
        className="w-full h-full relative"
        onClick={handleClick}
      >
        <img
          src={getThumbnailUrl(post)}
          alt={post.caption || post.title || 'Explore post'}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Video overlay icons */}
        {isVideo && (
          <>
            <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1">
              <FiPlay className="w-4 h-4 text-white" />
            </div>
            {(post.durationSec || post.duration) && (
              <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                {formatDuration(post.durationSec || post.duration)}
              </div>
            )}
          </>
        )}
        
        {/* Reel badge */}
        {isReel && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full font-bold">
            REEL
          </div>
        )}
        
        {/* Hover overlay with engagement stats */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
          <div className="text-white">
            <p className="text-sm font-semibold line-clamp-2 mb-2">{post.caption || post.title || 'Untitled'}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <FiHeart className="w-4 h-4" />
                  <span className="text-xs">{formatNumber(post.likes?.length || post.likeCount || 0)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FiMessageSquare className="w-4 h-4" />
                  <span className="text-xs">{formatNumber(post.comments?.length || post.commentCount || 0)}</span>
                </div>
              </div>
              {!isSubscribed && post.author && (
                <button
                  onClick={handleSubscribe}
                  className="text-xs bg-white text-black px-2 py-1 rounded-full font-semibold hover:bg-gray-200 transition-colors"
                >
                  Follow
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Author info at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img
              src={post.author?.avatar || post.author?.profilePicture}
              alt={post.author?.username}
              className="w-6 h-6 rounded-full object-cover border border-white/20"
              onError={(e) => {
                e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(post.author?.username || 'U') + '&background=random&size=200';
              }}
            />
            <span className="text-white text-xs font-medium truncate">@{post.author?.username}</span>
          </div>
          {(post.views || post.viewCount) && (
            <span className="text-white/80 text-xs">
              {formatNumber(post.views || post.viewCount)} views
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedExplorePostCard;