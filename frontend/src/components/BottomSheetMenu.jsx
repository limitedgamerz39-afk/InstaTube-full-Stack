import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiBookmark, FiClock, FiFlag, FiMessageSquare, FiShare } from 'react-icons/fi';

const BottomSheetMenu = ({ 
  isOpen, 
  onClose, 
  post, 
  position,
  onSavePost, 
  onWatchLater, 
  onReportPost, 
  onFeedback 
}) => {
  const menuItems = [
    {
      id: 'save',
      icon: <FiBookmark className="w-5 h-5" />,
      label: 'Save Video',
      action: onSavePost
    },
    {
      id: 'watchLater',
      icon: <FiClock className="w-5 h-5" />,
      label: 'Watch Later',
      action: onWatchLater
    },
    {
      id: 'report',
      icon: <FiFlag className="w-5 h-5" />,
      label: 'Quick Report',
      action: onReportPost
    },
    {
      id: 'feedback',
      icon: <FiMessageSquare className="w-5 h-5" />,
      label: 'Detailed Report',
      action: onFeedback
    }
  ];

  // Close menu when Escape key is pressed
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  // Calculate position styles
  const getPositionStyles = () => {
    if (!position) return {};
    
    // Menu dimensions
    const menuWidth = 250;
    const menuHeight = 200;
    
    // Position menu above and to the right of the clicked button
    let left = position.x;
    let top = position.y - menuHeight - 10; // Position above the button
    
    // Adjust if menu would go off right edge
    if (left + menuWidth > window.innerWidth) {
      left = window.innerWidth - menuWidth - 10;
    }
    
    // Adjust if menu would go off left edge
    if (left < 10) {
      left = 10;
    }
    
    // Adjust if menu would go off top edge
    if (top < 10) {
      top = position.y + 30; // Position below the button if above doesn't fit
    }
    
    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 1000,
      minWidth: '200px',
      maxWidth: '250px'
    };
  };
  
  const isMobile = window.innerWidth < 768;
  const positionStyles = getPositionStyles();
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Menu */}
          <motion.div
            className={`pointer-events-auto bg-white dark:bg-gray-900 rounded-xl shadow-xl max-h-[50vh] flex flex-col absolute`}
            style={positionStyles}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 500 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold">Options</h3>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <FiX size={20} />
              </button>
            </div>
            
            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto py-2 max-w-md">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    item.action(post);
                    onClose();
                  }}
                  className="flex items-center w-full p-4 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="mr-3 text-gray-600 dark:text-gray-300">
                    {item.icon}
                  </div>
                  <span className="text-gray-900 dark:text-gray-100">{item.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BottomSheetMenu;