import React from 'react';
import LoadingSpinner from './LoadingSpinner';

export default function AppLoader() {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-pink-500 border-b-transparent rounded-full animate-spin mx-auto opacity-50 animate-reverse"></div>
        </div>
        <h2 className="mt-4 text-2xl font-bold text-gray-800 dark:text-white">
          D4D HUB
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Loading your experience...
        </p>
      </div>
    </div>
  );
}
