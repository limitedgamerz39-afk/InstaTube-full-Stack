import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { storyAPI } from '../services/api';
import toast from 'react-hot-toast';
import { AiOutlineClose, AiOutlineHeart, AiOutlineSend } from 'react-icons/ai';
import { BsThreeDots } from 'react-icons/bs';
import { timeAgo } from '../utils/timeAgo';

const StoryViewer = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const progressInterval = useRef(null);

  useEffect(() => {
    fetchStories();
  }, [userId]);

  useEffect(() => {
    if (stories.length > 0) {
      viewCurrentStory();
      startProgress();
    }
    return () => clearProgress();
  }, [currentIndex, stories]);

  const fetchStories = async () => {
    try {
      const response = await storyAPI.getUserStories(userId);
      setStories(response.data.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load stories');
      navigate('/');
    }
  };

  const viewCurrentStory = async () => {
    if (stories[currentIndex]) {
      try {
        await storyAPI.viewStory(stories[currentIndex]._id);
      } catch (error) {
        console.error('Failed to mark story as viewed');
      }
    }
  };

  const startProgress = () => {
    clearProgress();
    setProgress(0);
    
    const duration = stories[currentIndex]?.mediaType === 'video' ? 15000 : 5000;
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

  const nextStory = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigate('/');
    }
  };

  const previousStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    
    if (!replyText.trim()) return;

    try {
      await storyAPI.replyToStory(stories[currentIndex]._id, replyText);
      toast.success('Reply sent');
      setReplyText('');
    } catch (error) {
      toast.error('Failed to send reply');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this story?')) {
      try {
        await storyAPI.deleteStory(stories[currentIndex]._id);
        toast.success('Story deleted');
        const newStories = stories.filter((_, i) => i !== currentIndex);
        if (newStories.length === 0) {
          navigate('/');
        } else {
          setStories(newStories);
          if (currentIndex >= newStories.length) {
            setCurrentIndex(newStories.length - 1);
          }
        }
      } catch (error) {
        toast.error('Failed to delete story');
      }
    }
  };

  if (loading || stories.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  const currentStory = stories[currentIndex];
  const isOwnStory = currentStory.author._id === user?._id;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      {/* Story Container */}
      <div className="relative w-full max-w-md h-screen">
        {/* Progress Bars */}
        <div className="absolute top-0 left-0 right-0 flex space-x-1 p-2 z-20">
          {stories.map((_, index) => (
            <div
              key={index}
              className="flex-1 h-0.5 bg-gray-600 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white transition-all"
                style={{
                  width:
                    index < currentIndex
                      ? '100%'
                      : index === currentIndex
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
              src={currentStory.author.avatar}
              alt={currentStory.author.username}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
            />
            <div>
              <p className="text-white font-semibold">
                {currentStory.author.username}
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
              onClick={() => navigate('/')}
              className="text-white hover:bg-gray-800/50 p-2 rounded-full"
            >
              <AiOutlineClose size={24} />
            </button>
          </div>

          {/* Menu */}
          {showMenu && isOwnStory && (
            <div className="absolute top-12 right-4 bg-gray-900 rounded-lg shadow-lg py-2 w-40">
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
          className="absolute inset-0 flex items-center justify-center"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            if (x < rect.width / 2) {
              previousStory();
            } else {
              nextStory();
            }
          }}
        >
          {currentStory.mediaType === 'video' ? (
            <video
              src={currentStory.mediaUrl}
              className="w-full h-full object-contain"
              autoPlay
              onEnded={nextStory}
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              alt="Story"
              className="w-full h-full object-contain"
            />
          )}

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
                placeholder={`Reply to ${currentStory.author.username}...`}
                className="flex-1 px-4 py-3 bg-transparent border-2 border-white text-white rounded-full focus:outline-none"
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
