import { useState, useEffect } from 'react';
import { AiOutlineClose } from 'react-icons/ai';

const VideoAd = ({ 
  type = 'pre-roll',
  duration = 5,
  onComplete,
  onSkip 
}) => {
  const [countdown, setCountdown] = useState(duration);
  const [canSkip, setCanSkip] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
        // Set skip availability based on ad type
        const skipAfter = type === 'pre-roll' ? 3 : type === 'mid-roll' ? 3 : 2;
        if (countdown === skipAfter) {
          setCanSkip(true);
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      handleComplete();
    }
  }, [countdown, type]);

  const handleComplete = () => {
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  const handleSkip = () => {
    setIsVisible(false);
    if (onSkip) onSkip();
  };

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm">
            {type === 'pre-roll' ? 'Video will play in ' : type === 'mid-roll' ? 'Ad: ' : 'Thanks for watching!'}
            {countdown}s
          </div>
        </div>

        {canSkip && (
          <button
            onClick={handleSkip}
            className="absolute top-4 left-4 z-10 bg-white text-black px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition"
          >
            <AiOutlineClose size={16} />
            Skip Ad
          </button>
        )}

        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-orange-500">
          <div className="text-center text-white p-8">
            <div className="text-6xl mb-4">📺</div>
            <h3 className="text-2xl font-bold mb-2">Advertisement</h3>
            <p className="text-sm opacity-80">
              {type === 'pre-roll' && 'Your video will start shortly'}
              {type === 'mid-roll' && 'Your video will resume shortly'}
              {type === 'post-roll' && 'Thanks for watching!'}
            </p>
            <div className="mt-6">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${((duration - countdown) / duration) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoAd;