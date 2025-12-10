import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSend } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { formatNumber } from '../utils/formatters';
import { formatDuration } from '../utils/formatUtils';

const MobileCommentModal = ({ isOpen, onClose, comments, user, onAddComment, currentVideo }) => {
  const [comment, setComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (comment.trim()) {
      onAddComment(comment);
      setComment('');
      onClose(); // Close the modal after submitting
    }
  };

  // Reset comment when modal closes
  useEffect(() => {
    if (!isOpen) {
      setComment('');
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl max-h-[70vh] flex flex-col"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 500 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold">{formatNumber(comments.length)} Comments</h3>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <FiX size={20} />
              </button>
            </div>
            
            {/* Comment Input */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <form onSubmit={handleSubmit} className="flex items-start gap-3">
                <img 
                  src={user?.avatar || '/default-avatar.png'} 
                  alt="Your avatar" 
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 flex items-center gap-2">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 p-2 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-purple-500 focus:ring-0 outline-none transition resize-none"
                    rows="1"
                  />
                  <button
                    type="submit"
                    disabled={!comment.trim()}
                    className="p-2 text-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiSend size={20} />
                  </button>
                </div>
              </form>
            </div>
            
            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4">
              {comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((c) => (
                    <div key={c._id} className="flex items-start gap-3">
                      <img 
                        src={c.author.avatar} 
                        alt={c.author.username} 
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">
                          <span className="font-semibold">{c.author.username}</span>
                          <span className="text-gray-500 dark:text-gray-400 ml-2">
                            {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                          </span>
                        </p>
                        <p className="text-sm mt-1 break-words">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Be the first to comment!
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MobileCommentModal;