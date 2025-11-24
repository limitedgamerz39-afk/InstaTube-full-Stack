import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { highlightAPI } from '../services/api';
import { AiOutlineArrowLeft, AiOutlineClose } from 'react-icons/ai';

const StoryHighlights = () => {
  const navigate = useNavigate();
  const { highlightId } = useParams();
  const [highlight, setHighlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

  useEffect(() => {
    fetchHighlight();
  }, [highlightId]);

  const fetchHighlight = async () => {
    try {
      setLoading(true);
      const response = await highlightAPI.getHighlight(highlightId);
      setHighlight(response.data.highlight);
      setCurrentStoryIndex(0);
    } catch (error) {
      console.error('Error fetching highlight:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleNextStory = () => {
    if (highlight && currentStoryIndex < highlight.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    }
  };

  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      handleNextStory();
    } else if (e.key === 'ArrowLeft') {
      handlePrevStory();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentStoryIndex, highlight]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!highlight) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white">Highlight not found</div>
      </div>
    );
  }

  const currentStory = highlight.stories[currentStoryIndex];

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="text-white p-2 rounded-full hover:bg-white/20"
        >
          <AiOutlineArrowLeft size={24} />
        </button>
        
        <div className="text-white font-semibold">
          {highlight.title}
        </div>
        
        <button 
          onClick={() => navigate('/')}
          className="text-white p-2 rounded-full hover:bg-white/20"
        >
          <AiOutlineClose size={24} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="absolute top-16 left-0 right-0 z-10 flex gap-1 px-4">
        {highlight.stories.map((_, index) => (
          <div 
            key={index}
            className={`flex-1 h-1 rounded-full ${
              index === currentStoryIndex ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Story Content */}
      <div className="h-full flex items-center justify-center">
        {currentStory.mediaType === 'video' ? (
          <video
            src={currentStory.mediaUrl}
            autoPlay
            loop
            controls={false}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <img
            src={currentStory.mediaUrl}
            alt="Story"
            className="max-h-full max-w-full object-contain"
          />
        )}
      </div>

      {/* Navigation */}
      <div 
        className="absolute inset-0 flex"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          if (x < rect.width / 2) {
            handlePrevStory();
          } else {
            handleNextStory();
          }
        }}
      >
        <div className="flex-1 cursor-pointer"></div>
        <div className="flex-1 cursor-pointer"></div>
      </div>

      {/* Story Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden">
            {currentStory.author?.avatar ? (
              <img 
                src={currentStory.author.avatar} 
                alt={currentStory.author.username} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="bg-gray-400 w-full h-full flex items-center justify-center">
                <span className="text-white font-bold">
                  {currentStory.author?.username?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
          </div>
          <div className="text-white">
            <div className="font-semibold">{currentStory.author?.username || 'Unknown'}</div>
            {currentStory.caption && (
              <div className="text-sm">{currentStory.caption}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryHighlights;