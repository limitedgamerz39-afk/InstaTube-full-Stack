import { useState } from 'react';
import { AiOutlineClose } from 'react-icons/ai';

const StoriesAd = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="relative w-40 flex-shrink-0 group">
      <div 
        className="w-full h-64 rounded-lg overflow-hidden relative bg-gradient-to-br from-purple-500 to-pink-500"
        onClick={() => {
          // Handle ad click
          console.log('Stories ad clicked');
        }}
      >
        {/* Ad badge */}
        <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
          AD
        </div>
        
        {/* Close button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
            if (onClose) onClose();
          }}
          className="absolute top-2 right-2 text-white bg-black bg-opacity-30 rounded-full p-1 hover:bg-opacity-50 z-10"
          aria-label="Close ad"
        >
          <AiOutlineClose size={16} />
        </button>
        
        {/* Ad content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-3 mb-3">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-12 h-12" />
          </div>
          <h3 className="text-white font-bold text-sm mb-1">Special Offer!</h3>
          <p className="text-white text-xs opacity-90 mb-2">50% off on summer collection</p>
          <button className="bg-white text-black text-xs font-bold px-3 py-1 rounded-full hover:bg-gray-100">
            Shop Now
          </button>
        </div>
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      </div>
      
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-600">
        <div className="h-full bg-white w-3/4"></div>
      </div>
    </div>
  );
};

export default StoriesAd;