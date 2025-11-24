import React from 'react';

const LoadingSpinner = ({ size = 'md', message = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const borderSizeClasses = {
    sm: 'border-2',
    md: 'border-4',
    lg: 'border-4',
    xl: 'border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className={`animate-spin rounded-full border-t-transparent border-primary ${sizeClasses[size]} ${borderSizeClasses[size]}`} />
      {message && (
        <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;