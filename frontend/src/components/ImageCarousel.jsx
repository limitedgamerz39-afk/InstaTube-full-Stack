import { useState, useRef, useEffect } from 'react';
import { AiOutlineLeft, AiOutlineRight, AiOutlineTag } from 'react-icons/ai';
import DoubleTapLike from './DoubleTapLike';
import videoManager from '../utils/videoManager';
import ProductTag from './ProductTag';

const ImageCarousel = ({ media, onLike, isLiked, productTags = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedMedia, setLoadedMedia] = useState({}); // Track loaded media
  const videoRefs = useRef({}); // Store video refs
  const [isInView, setIsInView] = useState(true); // Track if carousel is in view

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

  // Handle media loading
  const handleMediaLoad = (index) => {
    setLoadedMedia(prev => ({ ...prev, [index]: true }));
  };

  // Handle video play/pause for better performance
  useEffect(() => {
    // Pause all videos except current one
    Object.values(videoRefs.current).forEach((video, index) => {
      if (video && index !== currentIndex) {
        videoManager.pauseVideo(video);
      }
    });
  }, [currentIndex]);

  // Preload next and previous media for smoother transitions
  useEffect(() => {
    const preloadIndices = [
      (currentIndex - 1 + mediaArray.length) % mediaArray.length,
      (currentIndex + 1) % mediaArray.length
    ];
    
    preloadIndices.forEach(index => {
      if (!loadedMedia[index] && mediaArray[index]) {
        const media = mediaArray[index];
        if (media.type === 'image') {
          const img = new Image();
          img.src = media.url;
        } else if (media.type === 'video') {
          // For videos, we just let the browser handle it with preload="metadata"
        }
      }
    });
  }, [currentIndex, mediaArray, loadedMedia]);

  return (
    <div className="relative w-full bg-black">
      <DoubleTapLike onLike={onLike} isLiked={isLiked}>
        {/* Current Media */}
        {mediaArray[currentIndex].type === 'video' ? (
          <div className="relative w-full h-0 pb-[100%]"> {/* 1:1 aspect ratio container */}
            <video
              ref={el => {
                if (el) {
                  videoRefs.current[currentIndex] = el;
                  videoManager.registerVideo(el);
                }
              }}
              src={mediaArray[currentIndex].url}
              controls
              className="absolute top-0 left-0 w-full h-full object-contain"
              playsInline
              onLoadedData={() => handleMediaLoad(currentIndex)}
              preload="metadata" // Only load metadata initially
              onPlay={(e) => videoManager.playVideo(e.target)}
              muted // Start muted to allow autoplay
            />
            {/* Loading indicator */}
            {!loadedMedia[currentIndex] && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              </div>
            )}
          </div>
        ) : (
          <div className="relative w-full h-0 pb-[100%]"> {/* 1:1 aspect ratio container */}
            <img
              src={mediaArray[currentIndex].url}
              alt="Post"
              className="absolute top-0 left-0 w-full h-full object-contain"
              onLoad={() => handleMediaLoad(currentIndex)}
              loading="lazy" // Native lazy loading
            />
            {/* Product Tags */}
            {productTags && productTags.map((tag, index) => (
              <ProductTag
                key={index}
                x={tag.x}
                y={tag.y}
                product={{ name: tag.product }}
                onClick={() => console.log('Product tag clicked:', tag.product)}
              />
            ))}
            {/* Loading indicator */}
            {!loadedMedia[currentIndex] && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-800">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
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