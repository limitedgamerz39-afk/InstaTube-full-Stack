const PostSkeleton = () => (
  <div className="card mb-6 animate-pulse">
    {/* Header */}
    <div className="flex items-center space-x-3 p-4">
      <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-700"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24 mb-2"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-16"></div>
      </div>
    </div>

    {/* Image */}
    <div className="w-full h-96 bg-gray-300 dark:bg-gray-700"></div>

    {/* Actions */}
    <div className="p-4">
      <div className="flex space-x-4 mb-3">
        <div className="h-7 w-7 rounded bg-gray-300 dark:bg-gray-700"></div>
        <div className="h-7 w-7 rounded bg-gray-300 dark:bg-gray-700"></div>
      </div>

      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20 mb-2"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-1"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
    </div>
  </div>
);

const StorySkeleton = () => (
  <div className="flex-shrink-0 animate-pulse">
    <div className="h-16 w-16 rounded-full bg-gray-300 dark:bg-gray-700"></div>
    <div className="h-3 w-16 bg-gray-300 dark:bg-gray-700 rounded mt-1"></div>
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

export { PostSkeleton, StorySkeleton, ProfileSkeleton, MessageSkeleton };
