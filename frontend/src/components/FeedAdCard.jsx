import { useState } from 'react';
import { AiOutlineClose } from 'react-icons/ai';
import AdSense from './AdSense';

const FeedAdCard = ({ adSlot }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md mb-4 overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Sponsored</span>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Close ad"
        >
          <AiOutlineClose size={16} />
        </button>
      </div>
      
      <div className="p-4">
        <AdSense 
          adSlot={adSlot}
          adFormat="fluid"
          style={{ minHeight: '250px' }}
        />
      </div>
    </div>
  );
};

export default FeedAdCard;
