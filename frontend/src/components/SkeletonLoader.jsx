import React from 'react';

const PostSkeleton = () => (
  <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm mb-3 animate-pulse">
    {/* Video Container */}
    <div className="relative w-full aspect-video bg-gray-300 dark:bg-gray-700">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-gray-400 dark:bg-gray-600 rounded-full p-2 opacity-70">
          <div className="w-8 h-8" />
        </div>
      </div>
    </div>

    {/* Video Info */}
    <div className="p-3">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-1"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
        <div className="h-5 w-5 rounded bg-gray-300 dark:bg-gray-700 ml-2"></div>
      </div>
      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
        <div className="h-3 w-3 rounded-full bg-gray-300 dark:bg-gray-700 mr-1"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-16 mx-1"></div>
        <div className="h-3 w-1 rounded bg-gray-300 dark:bg-gray-700 mx-1"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-20 ml-1"></div>
      </div>
    </div>
  </div>
);

const StorySkeleton = () => (
  <div className="flex flex-col items-center min-w-[52px] animate-pulse">
    <div className="relative w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700"></div>
    <div className="h-2.5 w-12 bg-gray-300 dark:bg-gray-700 rounded mt-1.5"></div>
  </div>
);

const ProfileSkeleton = () => (
  <div className="animate-pulse">
    <div className="flex items-center space-x-8 mb-8">
      <div className="h-32 w-32 rounded-full bg-gray-300 dark:bg-gray-700"></div>
      <div className="flex-1">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-32 mb-4"></div>
        <div className="flex space-x-8 mb-4">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
        </div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3"></div>
      </div>
    </div>
  </div>
);

const MessageSkeleton = () => (
  <div className="flex items-center space-x-4 p-4 animate-pulse">
    <div className="h-14 w-14 rounded-full bg-gray-300 dark:bg-gray-700"></div>
    <div className="flex-1">
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24 mb-2"></div>
      <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
    </div>
  </div>
);

// New SkeletonLoader component for flexible usage
const SkeletonLoader = ({ type = 'default', count = 1 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'user':
        return (
          <div className="flex items-center space-x-4 p-4">
            <div className="rounded-full bg-gray-200 dark:bg-dark-card-hover h-12 w-12 animate-pulse"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-dark-card-hover rounded w-3/4 animate-pulse"></div>
              <div className="h-3 bg-gray-200 dark:bg-dark-card-hover rounded w-1/2 animate-pulse"></div>
            </div>
            <div className="h-8 w-20 bg-gray-200 dark:bg-dark-card-hover rounded animate-pulse"></div>
          </div>
        );
      
      case 'post':
        return (
          <div className="aspect-square bg-gray-200 dark:bg-dark-card-hover rounded-lg overflow-hidden animate-pulse"></div>
        );
      
      case 'reel':
        return (
          <div className="bg-gray-200 dark:bg-dark-card-hover rounded-lg overflow-hidden animate-pulse">
            <div className="w-full aspect-[9/16]"></div>
            <div className="p-3">
              <div className="h-3 bg-gray-300 dark:bg-dark-card-hover rounded w-full mb-2 animate-pulse"></div>
              <div className="h-3 bg-gray-300 dark:bg-dark-card-hover rounded w-2/3 animate-pulse"></div>
            </div>
          </div>
        );
      
      case 'video':
        return (
          <div className="bg-gray-200 dark:bg-dark-card-hover rounded-lg overflow-hidden animate-pulse">
            <div className="w-full aspect-video bg-gray-300 dark:bg-dark-card-hover"></div>
            <div className="p-3">
              <div className="h-4 bg-gray-300 dark:bg-dark-card-hover rounded w-3/4 mb-2 animate-pulse"></div>
              <div className="h-3 bg-gray-300 dark:bg-dark-card-hover rounded w-1/2 animate-pulse"></div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="p-4">
            <div className="h-4 bg-gray-200 dark:bg-dark-card-hover rounded w-full animate-pulse"></div>
          </div>
        );
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          {renderSkeleton()}
        </div>
      ))}
    </>
  );
};

export { PostSkeleton, StorySkeleton, ProfileSkeleton, MessageSkeleton };
export default SkeletonLoader;