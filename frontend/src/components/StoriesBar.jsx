import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { storyAPI } from '../services/api';
import { AiOutlinePlus } from 'react-icons/ai';

const StoriesBar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const response = await storyAPI.getFollowingStories();
      setStories(response.data.data);
    } catch (error) {
      console.error('Failed to load stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStoryClick = (authorId) => {
    navigate(`/stories/${authorId}`);
  };

  return (
    <div className="card p-5 mb-6 animate-slide-up">
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
        {/* Add Your Story */}
        <div
          onClick={() => navigate('/stories/create')}
          className="flex-shrink-0 cursor-pointer group"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-sunset rounded-full blur-md opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>
            <div className="relative">
              <img
                src={user?.avatar}
                alt={user?.username}
                className="h-16 w-16 rounded-full object-cover ring-4 ring-gray-200 dark:ring-dark-border group-hover:ring-primary-400 transition-all duration-300"
              />
              <div className="absolute bottom-0 right-0 bg-gradient-primary rounded-full p-1.5 shadow-lg ring-4 ring-white dark:ring-dark-card group-hover:scale-110 transition-transform duration-300">
                <AiOutlinePlus size={14} className="text-white" />
              </div>
            </div>
          </div>
          <p className="text-xs text-center mt-2 font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-500 transition-colors">
            Your Story
          </p>
        </div>

        {/* Stories from Following */}
        {stories.map((storyGroup) => (
          <div
            key={storyGroup.author._id}
            onClick={() => handleStoryClick(storyGroup.author._id)}
            className="flex-shrink-0 cursor-pointer group"
          >
            <div className="relative">
              {!storyGroup.hasViewed && (
                <div className="absolute inset-0 bg-gradient-sunset rounded-full blur-md opacity-70 group-hover:opacity-100 transition-opacity duration-300"></div>
              )}
              <div
                className={`relative h-16 w-16 rounded-full p-0.5 ${
                  storyGroup.hasViewed
                    ? 'ring-4 ring-gray-300 dark:ring-dark-border'
                    : 'bg-gradient-sunset shadow-glow'
                }`}
              >
                <img
                  src={storyGroup.author.avatar}
                  alt={storyGroup.author.username}
                  className="h-full w-full rounded-full object-cover ring-4 ring-white dark:ring-dark-card group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
            <p className={`text-xs text-center mt-2 truncate w-16 font-medium transition-colors ${
              storyGroup.hasViewed
                ? 'text-gray-500 dark:text-gray-400'
                : 'text-gray-900 dark:text-white group-hover:text-primary-500'
            }`}>
              {storyGroup.author.username}
            </p>
          </div>
        ))}

        {/* Loading Skeletons */}
        {loading && (
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex-shrink-0 animate-pulse">
                <div className="h-16 w-16 rounded-full skeleton"></div>
                <div className="h-3 w-16 skeleton rounded-full mt-2"></div>
              </div>
            ))}
          </>
        )}

        {/* Empty State */}
        {!loading && stories.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
            <span className="text-4xl mb-2">📱</span>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              No stories yet. Be the first to share!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoriesBar;
