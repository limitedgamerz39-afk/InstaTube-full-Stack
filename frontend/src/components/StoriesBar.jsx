import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { storyAPI } from '../services/api';
import { AiOutlinePlus, AiOutlineClose } from 'react-icons/ai';

const StoriesBar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewedStories, setViewedStories] = useState(new Set());

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    // Debounce story fetches to prevent rate limiting
    const now = Date.now();
    const lastFetch = localStorage.getItem('lastStoriesFetch');
    
    // Only fetch if it's been more than 30 seconds since last fetch
    if (!lastFetch || now - parseInt(lastFetch) > 30000) {
      try {
        localStorage.setItem('lastStoriesFetch', now.toString());
        const response = await storyAPI.getsubscribedStories();
        setStories(response.data.data || []);
      } catch (error) {
        console.error('Failed to load stories:', error);
        setStories([]); // Set to empty array on error
      } finally {
        setLoading(false);
      }
    } else {
      // If we're not fetching new data, we should still set loading to false
      setLoading(false);
    }
  };

  const handleStoryClick = (authorId) => {
    // Mark story as viewed
    setViewedStories(prev => new Set(prev).add(authorId));
    navigate(`/stories/${authorId}`);
  };

  if (loading) {
    return (
      <div className="flex space-x-4 p-4 overflow-x-auto hide-scrollbar">
        {/* My Story Loading */}
        <div className="flex flex-col items-center">
          <div className="flex-shrink-0 w-16 h-24 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="w-12 h-3 bg-gray-200 dark:bg-gray-700 rounded mt-2 animate-pulse" />
        </div>
        
        {/* Other Stories Loading */}
        {[...Array(4)].map((_, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className="flex-shrink-0 w-16 h-24 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="w-12 h-3 bg-gray-200 dark:bg-gray-700 rounded mt-2 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex space-x-3 sm:space-x-4 p-3 sm:p-4 overflow-x-auto hide-scrollbar border-b border-gray-200 dark:border-gray-800">
      {/* Create Story Button */}
      <div className="flex flex-col items-center">
        <button
          onClick={() => navigate('/stories/create')}
          className="flex-shrink-0 relative w-14 h-20 sm:w-16 sm:h-24 rounded-xl bg-gradient-to-tr from-purple-500 to-amber-500 p-0.5 hover:scale-105 transition-transform"
        >
          <div className="bg-white dark:bg-gray-900 rounded-[12px] sm:rounded-[14px] w-full h-full flex items-center justify-center">
            <AiOutlinePlus className="text-gray-800 dark:text-white" size={20} />
          </div>
        </button>
        <p className="text-xs mt-1 text-gray-600 dark:text-gray-400 truncate w-14 sm:w-16 text-center">My Story</p>
      </div>

      {/* Stories */}
      {stories.map((storyGroup) => {
        const isViewed = viewedStories.has(storyGroup.author._id);
        const hasUnseen = storyGroup.stories.some(story => !story.seen);
        
        return (
          <div key={storyGroup.author._id} className="flex flex-col items-center">
            <button
              onClick={() => handleStoryClick(storyGroup.author._id)}
              className="flex-shrink-0 relative w-14 h-20 sm:w-16 sm:h-24 rounded-xl p-0.5 hover:scale-105 transition-transform"
              style={{
                background: hasUnseen 
                  ? 'linear-gradient(45deg, #ff6b6b, #ffa502, #ff6b6b)' 
                  : isViewed 
                    ? 'transparent' 
                    : 'linear-gradient(45deg, #a8a29e, #78716c)'
              }}
            >
              <div className="bg-white dark:bg-gray-900 rounded-[12px] sm:rounded-[14px] w-full h-full p-0.5">
                <img
                  src={storyGroup.author.avatar}
                  alt={storyGroup.author.username}
                  className="w-full h-full rounded-[10px] sm:rounded-[12px] object-cover"
                  onError={(e) => {
                    e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(storyGroup.author.username) + '&background=random&size=200';
                  }}
                />
                {storyGroup.stories.length > 1 && (
                  <div className="absolute -bottom-1 -right-1 bg-primary text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-semibold border-2 border-white dark:border-gray-900 text-[10px] sm:text-xs">
                    {storyGroup.stories.length}
                  </div>
                )}
              </div>
            </button>
            <p className="text-xs mt-1 text-gray-900 dark:text-white truncate w-14 sm:w-16 text-center">{storyGroup.author.username}</p>
          </div>
        );
      })}

      {/* Empty State */}
      {stories.length === 0 && (
        <div className="flex flex-col items-center">
          <div className="flex-shrink-0 w-14 h-20 sm:w-16 sm:h-24 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <AiOutlineClose className="text-gray-400" size={20} />
          </div>
          <p className="text-xs mt-1 text-gray-600 dark:text-gray-400 truncate w-14 sm:w-16 text-center">No Stories</p>
        </div>
      )}
    </div>
  );
};

export default StoriesBar;