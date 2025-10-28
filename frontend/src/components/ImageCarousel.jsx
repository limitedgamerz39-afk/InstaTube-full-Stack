import { useState } from 'react';
import { AiOutlineLeft, AiOutlineRight } from 'react-icons/ai';
import DoubleTapLike from './DoubleTapLike';

const ImageCarousel = ({ media, onLike, isLiked }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };

  const previousSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  // Handle all possible media formats
  let mediaArray = [];
  
  if (!media) {
    return null;
  }
  
  // If media is array
  if (Array.isArray(media)) {
    mediaArray = media.filter(m => m && m.url); // Filter out invalid entries
  }
  // If media is string (old format - just URL)
  else if (typeof media === 'string') {
    mediaArray = [{ url: media, type: 'image' }];
  }
  // If media is object with url property
  else if (media.url) {
    mediaArray = [media];
  }
  
  if (mediaArray.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full bg-black">
      <DoubleTapLike onLike={onLike} isLiked={isLiked}>
        {/* Current Media */}
        {mediaArray[currentIndex].type === 'video' ? (
          <video
            src={mediaArray[currentIndex].url}
            controls
            className="w-full max-h-[600px] object-contain"
          />
        ) : (
          <img
            src={mediaArray[currentIndex].url}
            alt="Post"
            className="w-full max-h-[600px] object-contain"
          />
        )}

        {/* Navigation Buttons */}
        {mediaArray.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                previousSlide();
              }}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
            >
              <AiOutlineLeft size={24} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                nextSlide();
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition"
            >
              <AiOutlineRight size={24} />
            </button>
          </>
        )}

        {/* Indicators */}
        {mediaArray.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {mediaArray.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition ${
                  index === currentIndex
                    ? 'bg-white w-8'
                    : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}

        {/* Counter */}
        {mediaArray.length > 1 && (
          <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {mediaArray.length}
          </div>
        )}
      </DoubleTapLike>
    </div>
  );
};

export default ImageCarousel;
