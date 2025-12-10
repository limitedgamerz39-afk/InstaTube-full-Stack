import React from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const SuggestedCreatorCard = ({ creator, onSubscribe }) => {
  const navigate = useNavigate();

  const handleSubscribe = async (e) => {
    e.stopPropagation();
    try {
      await userAPI.followUser(creator._id);
      onSubscribe(creator._id);
      toast.success(`Subscribed to @${creator.username}`);
    } catch (error) {
      toast.error('Failed to subscribe');
    }
  };

  const handleProfileClick = () => {
    navigate(`/profile/${creator.username}`);
  };

  return (
    <div 
      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
      onClick={handleProfileClick}
    >
      <img
        src={creator.avatar}
        alt={creator.username}
        className="w-12 h-12 rounded-full object-cover border-2 border-purple-500"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {creator.fullName || creator.username}
          </h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
          @{creator.username}
        </p>
        <div className="flex items-center space-x-3 mt-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatNumber(creator.subscriberCount || 0)} followers
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatNumber(creator.postCount || 0)} posts
          </span>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleSubscribe(e);
        }}
        className="px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-full hover:opacity-90 transition-opacity"
      >
        Follow
      </button>
    </div>
  );
};

const SuggestedCreators = ({ creators, isLoading, onSubscribe }) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
        <h2 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Suggested Creators</h2>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-3 rounded-lg animate-pulse">
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!creators || creators.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
      <h2 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Suggested Creators</h2>
      <div className="space-y-2">
        {creators.map((creator) => (
          <SuggestedCreatorCard 
            key={creator._id} 
            creator={creator} 
            onSubscribe={onSubscribe}
          />
        ))}
      </div>
    </div>
  );
};

export default SuggestedCreators;