import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const Pagination = ({ currentPage, totalPages, hasMore, onPageChange }) => {
  const showNextButton = hasMore || currentPage < totalPages;
  
  return (
    <div className="flex items-center justify-between p-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={`flex items-center px-4 py-2 rounded-lg ${
          currentPage <= 1
            ? 'bg-gray-100 dark:bg-dark-card-hover text-gray-400 cursor-not-allowed'
            : 'bg-gray-100 dark:bg-dark-card-hover text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-border/50'
        }`}
      >
        <FiChevronLeft className="mr-2" />
        Previous
      </button>
      
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Page {currentPage}
      </div>
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!showNextButton}
        className={`flex items-center px-4 py-2 rounded-lg ${
          !showNextButton
            ? 'bg-gray-100 dark:bg-dark-card-hover text-gray-400 cursor-not-allowed'
            : 'bg-gray-100 dark:bg-dark-card-hover text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-border/50'
        }`}
      >
        Next
        <FiChevronRight className="ml-2" />
      </button>
    </div>
  );
};

export default Pagination;