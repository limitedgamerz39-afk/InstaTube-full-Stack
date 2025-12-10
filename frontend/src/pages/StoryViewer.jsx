import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { storyAPI } from '../services/api';
import toast from 'react-hot-toast';
import { AiOutlineClose, AiOutlineHeart, AiOutlineSend } from 'react-icons/ai';
import { BsThreeDots } from 'react-icons/bs';
import { timeAgo } from '../utils/timeAgo';
import { PollSticker, QuizSticker, SliderSticker, QuestionSticker } from '../components/StoryStickers';

const StoryViewer = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [storyGroups, setStoryGroups] = useState([]);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const progressInterval = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const savedState = JSON.parse(sessionStorage.getItem('storyViewerState'));
    if (savedState) {
      fetchStories(savedState);
    } else {
      fetchStories();
    }
  }, [userId]);

  useEffect(() => {
    if (storyGroups.length > 0) {
      sessionStorage.setItem('storyViewerState', JSON.stringify({ currentUserIndex, currentStoryIndex }));
      viewCurrentStory();
      setProgress(0); // Reset progress for new story
    }
    return () => clearProgress();
  }, [currentUserIndex, currentStoryIndex, storyGroups]);
  
  useEffect(() => {
    if (storyGroups.length > 0 && progress === 0 && !isPaused) {
        startProgress();
    }
  }, [progress, storyGroups, currentUserIndex, currentStoryIndex, isPaused]);

  const fetchStories = async (savedState = null) => {
    try {
      const response = await storyAPI.getsubscribedStories();
      const fetchedStoryGroups = response.data.data;
      setStoryGroups(fetchedStoryGroups);

      if (savedState) {
        setCurrentUserIndex(savedState.currentUserIndex);
        setCurrentStoryIndex(savedState.currentStoryIndex);
      } else if (userId) {
        const initialUserIndex = fetchedStoryGroups.findIndex(group => group.author._id === userId);
        if (initialUserIndex !== -1) {
          setCurrentUserIndex(initialUserIndex);
          setCurrentStoryIndex(0);
        }
      }
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load stories');
      navigate('/');
    }
  };

  const viewCurrentStory = async () => {
    if (storyGroups[currentUserIndex]?.stories[currentStoryIndex]) {
      try {
        await storyAPI.viewStory(storyGroups[currentUserIndex].stories[currentStoryIndex]._id);
      } catch (error) {
        console.error('Failed to mark story as viewed');
      }
    }
  };

  const startProgress = () => {
    clearProgress(); // Always clear previous timer
    
    // Don't start progress if paused
    if (isPaused) return;
    
    // Use video's actual duration if available, otherwise default.
    const duration = storyGroups[currentUserIndex]?.stories[currentStoryIndex]?.mediaType === 'video' 
      ? (videoRef.current?.duration * 1000 || 15000) 
      : 5000;
      
    const interval = 50;
    const increment = (interval / duration) * 100;

    progressInterval.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextStory();
          return 0;
        }
        return prev + increment;
      });
    }, interval);
  };

  const clearProgress = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
  };
  
  // Handlers for pausing and resuming
  const handlePause = () => {
    setIsPaused(true);
    clearProgress();
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const handleResume = () => {
    setIsPaused(false);
    startProgress();
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const nextStory = useCallback(() => {
    if (currentStoryIndex < storyGroups[currentUserIndex]?.stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else if (currentUserIndex < storyGroups.length - 1) {
      setCurrentUserIndex(currentUserIndex + 1);
      setCurrentStoryIndex(0);
    } else {
      sessionStorage.removeItem('storyViewerState');
      navigate('/');
    }
  }, [currentStoryIndex, currentUserIndex, storyGroups, navigate]);

  const previousStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else if (currentUserIndex > 0) {
      const prevUserIndex = currentUserIndex - 1;
      setCurrentUserIndex(prevUserIndex);
      setCurrentStoryIndex(storyGroups[prevUserIndex].stories.length - 1);
    }
  }, [currentStoryIndex, currentUserIndex, storyGroups]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      // Pause the story when replying
      handlePause();
      
      await storyAPI.replyToStory(storyGroups[currentUserIndex].stories[currentStoryIndex]._id, replyText);
      toast.success('Reply sent');
      setReplyText('');
      
      // Resume the story after sending reply
      handleResume();
    } catch (error) {
      toast.error('Failed to send reply');
      // Resume even if there's an error
      handleResume();
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this story?')) {
      try {
        await storyAPI.deleteStory(storyGroups[currentUserIndex].stories[currentStoryIndex]._id);
        toast.success('Story deleted');
        
        const newStoryGroups = [...storyGroups];
        newStoryGroups[currentUserIndex].stories.splice(currentStoryIndex, 1);

        if (newStoryGroups[currentUserIndex].stories.length === 0) {
          newStoryGroups.splice(currentUserIndex, 1);
          if (newStoryGroups.length === 0) {
            sessionStorage.removeItem('storyViewerState');
            navigate('/');
            return;
          }
          if (currentUserIndex >= newStoryGroups.length) {
            setCurrentUserIndex(newStoryGroups.length - 1);
          }
          setCurrentStoryIndex(0);
        } else if (currentStoryIndex >= newStoryGroups[currentUserIndex].stories.length) {
          setCurrentStoryIndex(newStoryGroups[currentUserIndex].stories.length - 1);
        }

        setStoryGroups(newStoryGroups);
      } catch (error) {
        toast.error('Failed to delete story');
      }
    }
  };

  if (loading || storyGroups.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  const currentStory = storyGroups[currentUserIndex].stories[currentStoryIndex];
  const isOwnStory = storyGroups[currentUserIndex].author._id === user?._id;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      {/* Story Container */}
      <div className="relative w-full max-w-md h-screen">
        {/* Progress Bars */}
        <div className="absolute top-0 left-0 right-0 flex space-x-1 p-2 z-20">
          {storyGroups[currentUserIndex].stories.map((_, index) => (
            <div
              key={index}
              className="flex-1 h-0.5 bg-gray-600 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white transition-all duration-50"
                style={{
                  width:
                    index < currentStoryIndex
                      ? '100%'
                      : index === currentStoryIndex
                      ? `${progress}%`
                      : '0%',
                }}
              ></div>
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4 z-20">
          <div className="flex items-center space-x-2">
            <img
              src={storyGroups[currentUserIndex].author.avatar}
              alt={storyGroups[currentUserIndex].author.username}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
            />
            <div>
              <p className="text-white font-semibold">
                {storyGroups[currentUserIndex].author.username}
              </p>
              <p className="text-white text-xs">{timeAgo(currentStory.createdAt)}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isOwnStory && (
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-white hover:bg-gray-800/50 p-2 rounded-full"
              >
                <BsThreeDots size={20} />
              </button>
            )}
            <button
              onClick={() => {
                sessionStorage.removeItem('storyViewerState');
                navigate('/');
              }}
              className="text-white hover:bg-gray-800/50 p-2 rounded-full"
            >
              <AiOutlineClose size={24} />
            </button>
          </div>

          {/* Menu */}
          {showMenu && isOwnStory && (
            <div className="absolute top-12 right-4 bg-gray-900 rounded-lg shadow-lg py-2 w-40 z-30">
              <button
                onClick={handleDelete}
                className="block w-full text-left px-4 py-2 text-red-500 hover:bg-gray-800"
              >
                Delete Story
              </button>
            </div>
          )}
        </div>

        {/* Story Media */}
        <div
          className="absolute inset-0 flex items-center justify-center z-10"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            if (x < rect.width / 2) {
              previousStory();
            } else {
              nextStory();
            }
          }}
          onMouseDown={handlePause}
          onMouseUp={handleResume}
          onTouchStart={handlePause}
          onTouchEnd={handleResume}
        >
          {currentStory.mediaType === 'video' ? (
            <video
              ref={videoRef}
              src={currentStory.mediaUrl}
              className="w-full h-full object-contain"
              autoPlay
              playsInline
              onLoadedData={startProgress} // Start progress after video metadata is loaded
              onEnded={nextStory}
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              alt="Story"
              className="w-full h-full object-contain"
            />
          )}

          {/* Stickers */}
          {currentStory.stickers && currentStory.stickers.map((sticker, index) => {
            const stickerStyle = {
              position: 'absolute',
              left: `${sticker.x}%`,
              top: `${sticker.y}%`,
              transform: 'translate(-50%, -50%)',
            };

            switch (sticker.type) {
              case 'poll':
                return (
                  <div key={index} style={stickerStyle}>
                    <PollSticker 
                      poll={sticker.data} 
                      onVote={(optionIndex) => console.log('Poll voted:', optionIndex)}
                      hasVoted={false}
                    />
                  </div>
                );
              case 'quiz':
                return (
                  <div key={index} style={stickerStyle}>
                    <QuizSticker 
                      quiz={sticker.data} 
                      onAnswer={(answerIndex) => console.log('Quiz answered:', answerIndex)}
                      hasAnswered={false}
                    />
                  </div>
                );
              case 'slider':
                return (
                  <div key={index} style={stickerStyle}>
                    <SliderSticker 
                      slider={sticker.data} 
                      onSlide={(value) => console.log('Slider value:', value)}
                      hasSlid={false}
                    />
                  </div>
                );
              case 'question':
                return (
                  <div key={index} style={stickerStyle}>
                    <QuestionSticker 
                      onSubmit={(answer) => console.log('Question answered:', answer)}
                    />
                  </div>
                );
              default:
                return null;
            }
          })}

          {/* Caption */}
          {currentStory.caption && (
            <div className="absolute bottom-20 left-0 right-0 px-4">
              <p className="text-white text-center bg-black/50 py-2 px-4 rounded-lg">
                {currentStory.caption}
              </p>
            </div>
          )}
        </div>

        {/* Reply Input */}
        {!isOwnStory && (
          <form
            onSubmit={handleReply}
            className="absolute bottom-0 left-0 right-0 p-4 z-20"
          >
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to ${storyGroups[currentUserIndex].author.username}...`}
                className="flex-1 px-4 py-3 bg-transparent border-2 border-white text-white rounded-full focus:outline-none"
                onFocus={handlePause}
                onBlur={handleResume}
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                className={`p-3 rounded-full ${
                  replyText.trim()
                    ? 'text-primary'
                    : 'text-gray-500 cursor-not-allowed'
                }`}
              >
                <AiOutlineSend size={24} />
              </button>
            </div>
          </form>
        )}

        {/* Story Views (for own stories) */}
        {isOwnStory && (
          <div className="absolute bottom-4 left-4 z-20">
            <div className="flex items-center space-x-1 text-white">
              <AiOutlineHeart size={20} />
              <span>{currentStory.views.length} views</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryViewer;