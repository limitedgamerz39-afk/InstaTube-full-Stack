/**
 * Mobile Utilities for Responsive Design
 */

// Check if device is mobile
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Get screen size category
export const getScreenSize = () => {
  const width = window.innerWidth;
  if (width < 480) return 'xs'; // Extra small (mobile phones)
  if (width < 768) return 'sm'; // Small (tablets)
  if (width < 1024) return 'md'; // Medium (small desktops)
  if (width < 1280) return 'lg'; // Large (desktops)
  return 'xl'; // Extra large (large screens)
};

// Check if screen is mobile-sized
export const isMobileScreen = () => {
  return window.innerWidth < 768;
};

// Check if screen is tablet-sized
export const isTabletScreen = () => {
  return window.innerWidth >= 768 && window.innerWidth < 1024;
};

// Check if screen is desktop-sized
export const isDesktopScreen = () => {
  return window.innerWidth >= 1024;
};

// Add safe area padding for mobile devices
export const addSafeAreaPadding = () => {
  const body = document.body;
  
  // Check for safe area insets support
  if ('visualViewport' in window) {
    const updateSafeArea = () => {
      const viewport = window.visualViewport;
      if (viewport) {
        body.style.paddingLeft = `${viewport.offsetLeft}px`;
        body.style.paddingTop = `${viewport.offsetTop}px`;
      }
    };
    
    window.visualViewport.addEventListener('resize', updateSafeArea);
    updateSafeArea();
  }
};

// Handle orientation change
export const handleOrientationChange = (callback) => {
  const handleResize = () => {
    setTimeout(() => {
      callback({
        isLandscape: window.innerWidth > window.innerHeight,
        isPortrait: window.innerWidth <= window.innerHeight,
        width: window.innerWidth,
        height: window.innerHeight
      });
    }, 100);
  };
  
  window.addEventListener('resize', handleResize);
  handleResize();
  
  return () => window.removeEventListener('resize', handleResize);
};

// Get device pixel ratio
export const getDevicePixelRatio = () => {
  return window.devicePixelRatio || 1;
};

// Optimize for mobile performance
export const optimizeForMobile = () => {
  // Reduce animation intensity on mobile
  if (isMobile()) {
    document.documentElement.style.setProperty('--animation-speed', '0.1s');
  }
  
  // Add touch-friendly CSS classes
  if ('ontouchstart' in window) {
    document.body.classList.add('touch-device');
  }
};

// Mobile-specific event handlers
export const mobileEvents = {
  // Prevent zoom on double tap
  preventZoomOnDoubleTap: (element) => {
    let lastTouchEnd = 0;
    element.addEventListener('touchend', (event) => {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, false);
  },
  
  // Handle swipe gestures
  handleSwipe: (element, callback) => {
    let startX, startY, endX, endY;
    
    element.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, false);
    
    element.addEventListener('touchend', (e) => {
      endX = e.changedTouches[0].clientX;
      endY = e.changedTouches[0].clientY;
      
      const diffX = startX - endX;
      const diffY = startY - endY;
      
      // Only consider significant swipes
      if (Math.abs(diffX) > 50 || Math.abs(diffY) > 50) {
        if (Math.abs(diffX) > Math.abs(diffY)) {
          // Horizontal swipe
          if (diffX > 0) {
            callback('swipe-left');
          } else {
            callback('swipe-right');
          }
        } else {
          // Vertical swipe
          if (diffY > 0) {
            callback('swipe-up');
          } else {
            callback('swipe-down');
          }
        }
      }
    }, false);
  }
};

// Export all utilities
export default {
  isMobile,
  getScreenSize,
  isMobileScreen,
  isTabletScreen,
  isDesktopScreen,
  addSafeAreaPadding,
  handleOrientationChange,
  getDevicePixelRatio,
  optimizeForMobile,
  mobileEvents
};