import { useState, useRef } from 'react';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const PullToRefresh = ({ onRefresh, children }) => {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (startY.current === 0 || refreshing) return;

    currentY.current = e.touches[0].clientY;
    const distance = currentY.current - startY.current;

    if (distance > 0 && window.scrollY === 0) {
      setPulling(true);
      setPullDistance(Math.min(distance, 100));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60 && !refreshing) {
      setRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setRefreshing(false);
      }
    }
    
    setPulling(false);
    setPullDistance(0);
    startY.current = 0;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull Indicator */}
      {(pulling || refreshing) && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all"
          style={{
            transform: `translateY(${pulling ? pullDistance - 60 : 0}px)`,
            opacity: pulling ? pullDistance / 60 : 1,
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg">
            <AiOutlineLoading3Quarters
              size={24}
              className={`text-primary ${refreshing ? 'animate-spin' : ''}`}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div
        style={{
          transform: `translateY(${pulling ? pullDistance : 0}px)`,
          transition: pulling ? 'none' : 'transform 0.3s ease',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
