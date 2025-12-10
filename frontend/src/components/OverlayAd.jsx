import { useState } from 'react';
import { AiOutlineClose } from 'react-icons/ai';

const OverlayAd = ({ position = 'bottom-right', onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
      default:
        return 'bottom-4 right-4';
    }
  };

  return (
    <div className={`absolute ${getPositionClasses()} z-40 max-w-xs`}>
      <div className="bg-black bg-opacity-80 text-white rounded-lg p-3 shadow-lg">
        <div className="flex justify-between items-start mb-2">
          <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
            AD
          </div>
          <button 
            onClick={() => {
              setIsVisible(false);
              if (onClose) onClose();
            }}
            className="text-gray-300 hover:text-white"
            aria-label="Close ad"
          >
            <AiOutlineClose size={16} />
          </button>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
          <div>
            <h3 className="font-bold text-sm">Limited Time Offer!</h3>
            <p className="text-xs opacity-80">Special discounts on tech gadgets</p>
            <button className="mt-1 text-xs bg-white text-black font-semibold px-2 py-1 rounded hover:bg-gray-200">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverlayAd;