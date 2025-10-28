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
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
      <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
        {/* Add Story */}
        <div
          onClick={() => navigate('/stories/create')}
          className="flex-shrink-0 cursor-pointer"
        >
          <div className="relative">
            <img
              src={user?.avatar}
              alt={user?.username}
              className="h-16 w-16 rounded-full object-cover ring-2 ring-gray-300 dark:ring-gray-600"
            />
            <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1">
              <AiOutlinePlus size={16} />
            </div>
          </div>
          <p className="text-xs text-center mt-1 dark:text-white">Your Story</p>
        </div>

        {/* Stories from Following */}
        {stories.map((storyGroup) => (
          <div
            key={storyGroup.author._id}
            onClick={() => handleStoryClick(storyGroup.author._id)}
            className="flex-shrink-0 cursor-pointer"
          >
            <div
              className={`h-16 w-16 rounded-full p-0.5 ${
                storyGroup.hasViewed
                  ? 'ring-2 ring-gray-300 dark:ring-gray-600'
                  : 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500'
              }`}
            >
              <img
                src={storyGroup.author.avatar}
                alt={storyGroup.author.username}
                className="h-full w-full rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
              />
            </div>
            <p className="text-xs text-center mt-1 truncate w-16 dark:text-white">
              {storyGroup.author.username}
            </p>
          </div>
        ))}

        {loading && (
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex-shrink-0">
                <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded mt-1 animate-pulse"></div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default StoriesBar;
