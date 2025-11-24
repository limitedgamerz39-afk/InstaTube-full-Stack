import { useState } from 'react';
import { AiOutlinePlus } from 'react-icons/ai';

const Highlights = ({ highlights = [], onCreateHighlight, onViewHighlight }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Default handlers if props are not provided
  const handleCreateHighlight = () => {
    if (onCreateHighlight) {
      onCreateHighlight();
    } else {
      console.warn('onCreateHighlight function not provided');
    }
  };

  const handleViewHighlight = (highlight) => {
    if (onViewHighlight) {
      onViewHighlight(highlight);
    } else {
      console.warn('onViewHighlight function not provided');
    }
  };

  return (
    <div className="py-4">
      <div className="flex items-center space-x-4 overflow-x-auto scrollbar-hide pb-2">
        {/* Create New Highlight */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex-shrink-0 flex flex-col items-center group"
        >
          <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center group-hover:border-primary transition-all group-hover:scale-110">
            <AiOutlinePlus size={32} className="text-gray-400 group-hover:text-primary" />
          </div>
          <span className="text-xs mt-2 text-gray-600 dark:text-gray-400">New</span>
        </button>

        {/* Existing Highlights */}
        {highlights.map((highlight) => (
          <button
            key={highlight._id}
            onClick={() => handleViewHighlight(highlight)}
            className="flex-shrink-0 flex flex-col items-center group"
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-primary p-0.5 group-hover:scale-110 transition-transform">
                <img
                  src={highlight.coverImage}
                  alt={highlight.title}
                  className="w-full h-full rounded-full object-cover border-2 border-white dark:border-dark-bg"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-gradient-primary rounded-full p-1 text-white text-xs font-bold">
                {highlight.stories.length}
              </div>
            </div>
            <span className="text-xs mt-2 text-gray-800 dark:text-gray-200 font-medium truncate w-20 text-center">
              {highlight.title}
            </span>
          </button>
        ))}
      </div>

      {/* Create Highlight Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 max-w-md w-full shadow-glow">
            <h2 className="text-2xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Create Highlight
            </h2>
            <input
              type="text"
              placeholder="Highlight name (e.g., Travel, Food)"
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-dark-border rounded-2xl mb-4 focus:border-primary focus:outline-none dark:bg-dark-bg dark:text-white"
              maxLength={50}
            />
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 bg-gray-200 dark:bg-dark-border rounded-2xl font-semibold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleCreateHighlight();
                  setShowCreateModal(false);
                }}
                className="flex-1 btn-primary"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Highlights;