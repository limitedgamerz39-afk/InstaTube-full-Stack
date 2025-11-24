import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AiOutlinePlus } from 'react-icons/ai';
import { highlightAPI } from '../services/api';

const StoryHighlights = ({ userId }) => {
  const navigate = useNavigate();
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newHighlightTitle, setNewHighlightTitle] = useState('');
  const [selectedStories, setSelectedStories] = useState([]);

  useEffect(() => {
    fetchHighlights();
  }, [userId]);

  const fetchHighlights = async () => {
    try {
      setLoading(true);
      const response = await highlightAPI.getUserHighlights(userId);
      setHighlights(response.data.highlights || []);
    } catch (error) {
      console.error('Error fetching highlights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHighlight = async () => {
    if (!newHighlightTitle.trim() || selectedStories.length === 0) return;

    try {
      const response = await highlightAPI.createHighlight({
        title: newHighlightTitle.trim(),
        stories: selectedStories
      });
      
      if (response.data.success) {
        setHighlights(prev => [...prev, response.data.highlight]);
        setNewHighlightTitle('');
        setSelectedStories([]);
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Error creating highlight:', error);
    }
  };

  const toggleStorySelection = (storyId) => {
    setSelectedStories(prev => 
      prev.includes(storyId) 
        ? prev.filter(id => id !== storyId) 
        : [...prev, storyId]
    );
  };

  if (loading) {
    return (
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Story Highlights</h3>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="p-1 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          <AiOutlinePlus size={16} />
        </button>
      </div>
      
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {highlights.map((highlight) => (
          <div 
            key={highlight._id} 
            className="flex-shrink-0 flex flex-col items-center cursor-pointer"
            onClick={() => navigate(`/highlights/${highlight._id}`)}
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 to-pink-500 p-0.5">
              <div className="bg-white dark:bg-gray-800 rounded-full w-full h-full flex items-center justify-center">
                {highlight.coverImage ? (
                  <img 
                    src={highlight.coverImage} 
                    alt={highlight.title} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-center px-1">
                    {highlight.title.charAt(0)}
                  </span>
                )}
              </div>
            </div>
            <span className="text-xs mt-1 max-w-[64px] truncate">{highlight.title}</span>
          </div>
        ))}
      </div>

      {/* Create Highlight Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
            <div className="p-4 border-b dark:border-gray-700">
              <h3 className="text-lg font-semibold">Create Highlight</h3>
            </div>
            
            <div className="p-4">
              <input
                type="text"
                value={newHighlightTitle}
                onChange={(e) => setNewHighlightTitle(e.target.value)}
                placeholder="Highlight title"
                className="w-full p-2 border rounded-lg dark:bg-gray-700 mb-4"
                maxLength={50}
              />
              
              <div className="mb-4">
                <h4 className="font-medium mb-2">Select Stories</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {/* In a real implementation, you would fetch user's stories here */}
                  {[1, 2, 3, 4, 5].map((id) => (
                    <div key={id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`story-${id}`}
                        checked={selectedStories.includes(id)}
                        onChange={() => toggleStorySelection(id)}
                        className="rounded"
                      />
                      <label htmlFor={`story-${id}`} className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <span>Story {id}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t dark:border-gray-700 flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-lg border dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateHighlight}
                disabled={!newHighlightTitle.trim() || selectedStories.length === 0}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white disabled:opacity-50"
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

export default StoryHighlights;