import { useState, useEffect } from 'react';
import { AiOutlineClose } from 'react-icons/ai';

const VideoAd = ({ 
  type = 'pre-roll',
  adFormat = 'skippable', // skippable, non-skippable, bumper
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
        // Set skip availability based on ad type and format
        let skipAfter = 3;
        if (type === 'pre-roll') {
          skipAfter = adFormat === 'skippable' ? 5 : 
                     adFormat === 'non-skippable' ? duration : 
                     6; // bumper
        } else if (type === 'mid-roll') {
          skipAfter = 3;
        } else if (type === 'post-roll') {
          skipAfter = 2;
        }
        
        if (countdown === skipAfter) {
          setCanSkip(true);
        }
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      handleComplete();
    }
  }, [countdown, type, adFormat, duration]);

  const handleComplete = () => {
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  const handleSkip = () => {
    setIsVisible(false);
    if (onSkip) onSkip();
  };

  if (!isVisible) return null;

  // Mock ad content based on format
  const getMockAdContent = () => {
    const adContents = {
      skippable: {
        title: "Premium Brand Ad",
        description: "Discover amazing products!",
        brand: "BrandCo"
      },
      nonSkippable: {
        title: "Important Announcement",
        description: "Don't miss this exclusive offer!",
        brand: "Exclusive Deals"
      },
      bumper: {
        title: "Quick Message",
        description: "Fast fashion at affordable prices",
        brand: "StyleHub"
      }
    };
    
    return adContents[adFormat] || adContents.skippable;
  };

  const adContent = getMockAdContent();

  return (
    <div className="absolute inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm">
            {type === 'pre-roll' ? 'Ad starts video in ' : 
             type === 'mid-roll' ? 'Ad: ' : 
             'Thanks for watching!'}
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
            <div className="text-6xl mb-4">
              {adFormat === 'skippable' ? '📺' : 
               adFormat === 'non-skippable' ? '📢' : 
               '⚡'}
            </div>
            <h3 className="text-2xl font-bold mb-2">{adContent.title}</h3>
            <p className="text-sm opacity-80 mb-2">{adContent.description}</p>
            <p className="text-xs opacity-60">Presented by {adContent.brand}</p>
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