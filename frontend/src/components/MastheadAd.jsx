import { useState } from 'react';
import { AiOutlineClose } from 'react-icons/ai';

const MastheadAd = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 relative">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-white text-blue-600 font-bold text-xl px-3 py-1 rounded">
            AD
          </div>
          <div>
            <h2 className="font-bold text-lg">Special Summer Sale!</h2>
            <p className="text-sm opacity-90">Up to 50% off on premium products</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="bg-white text-blue-600 font-semibold px-4 py-2 rounded-full hover:bg-gray-100 transition">
            Shop Now
          </button>
          <button 
            onClick={() => setIsVisible(false)}
            className="text-white hover:text-gray-200 transition"
            aria-label="Close ad"
          >
            <AiOutlineClose size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MastheadAd;