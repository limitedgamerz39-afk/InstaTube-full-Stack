import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHeart, FiMessageSquare } from 'react-icons/fi';
import OptimizedImage from './OptimizedImage';

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num;
};

const ExplorePostCard = React.memo(({ post }) => {
  const navigate = useNavigate();

  if (!post) return null;

  const handleClick = () => {
    // Navigate to post detail page, reel viewer, etc.
    navigate(`/watch/${post._id}`);
  };

  return (
    <div
      className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg"
      onClick={handleClick}
    >
      <OptimizedImage
        src={post.thumbnailUrl || post.mediaUrl}
        alt={post.caption || 'Explore post'}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
        <div className="flex items-center space-x-4 text-white">
          <div className="flex items-center space-x-1">
            <FiHeart className="w-5 h-5" />
            <span className="font-semibold text-sm">{formatNumber(post.likes?.length || 0)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <FiMessageSquare className="w-5 h-5" />
            <span className="font-semibold text-sm">{formatNumber(post.comments?.length || 0)}</span>
          </div>
        </div>
      </div>
      {post.mediaType === 'video' && (
        <div className="absolute top-2 right-2">
          <svg className="w-5 h-5 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"></path>
          </svg>
        </div>
      )}
    </div>
  );
});

ExplorePostCard.displayName = 'ExplorePostCard';
export default ExplorePostCard;
