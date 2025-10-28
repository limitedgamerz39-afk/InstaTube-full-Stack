import { useState } from 'react';
import { AiFillHeart } from 'react-icons/ai';

const DoubleTapLike = ({ children, onLike, isLiked }) => {
  const [showHeart, setShowHeart] = useState(false);
  const [lastTap, setLastTap] = useState(0);

  const handleDoubleTap = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTap;

    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Double tap detected
      if (!isLiked) {
        onLike();
      }
      
      // Show animation
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 1000);
    }

    setLastTap(now);
  };

  return (
    <div className="relative" onClick={handleDoubleTap}>
      {children}
      
      {/* Heart Animation */}
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <AiFillHeart
            size={100}
            className="text-white animate-like-burst opacity-0"
          />
        </div>
      )}
    </div>
  );
};

export default DoubleTapLike;
