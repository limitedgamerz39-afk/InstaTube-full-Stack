import { useState, useEffect } from 'react';
import { postAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import { BsBookmark } from 'react-icons/bs';
import { FiPlay } from 'react-icons/fi';

const Saved = () => {
  const navigate = useNavigate();
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedPosts();
  }, []);

  const fetchSavedPosts = async () => {
    try {
      const response = await postAPI.getSavedPosts();
      setSavedPosts(response.data.data);
    } catch (error) {
      console.error('Failed to load saved posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-20 md:pb-8">
      <h1 className="text-2xl font-bold mb-6 dark:text-white flex items-center">
        <BsBookmark className="mr-2" />
        Saved Posts
      </h1>

      {savedPosts.length === 0 ? (
        <div className="card p-12 text-center">
          <BsBookmark size={64} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No saved posts yet
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Save posts by tapping the bookmark icon
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedPosts.map((post) => (
            <div
              key={post._id}
              onClick={() => {
                // Navigate based on duration
                // If duration is less than or equal to 60 seconds, go to reels
                // Otherwise, go to watch page
                if (post.durationSec && post.durationSec <= 60) {
                  navigate(`/reels/${post._id}`);
                } else if (post.category === 'short') {
                  // Fallback for short category posts
                  navigate(`/reels/${post._id}`);
                } else {
                  navigate(`/watch/${post._id}`);
                }
              }}
              className="cursor-pointer hover:opacity-90 transition rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow"
            >
              <div className="relative aspect-video">
                {post.category === 'long' || post.category === 'short' ? (
                  // Video post
                  <video
                    src={post.media?.[0]?.url || post.mediaUrl}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                ) : (
                  // Image post
                  <img
                    src={post.media?.[0]?.url || post.mediaUrl}
                    alt="Saved post"
                    className="w-full h-full object-cover"
                  />
                )}
                
                {/* Category indicator */}
                {post.category === 'long' && (
                  <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs">
                    Video
                  </div>
                )}
                
                {post.category === 'short' && (
                  <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded text-xs">
                    Reel
                  </div>
                )}
                
                {/* Play icon for videos */}
                {(post.category === 'long' || post.category === 'short') && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/50 rounded-full p-3">
                      <FiPlay className="text-white text-xl" />
                    </div>
                  </div>
                )}
                
                {/* Duration for videos */}
                {(post.category === 'long' || post.category === 'short') && post.durationSec && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    {formatDuration(post.durationSec)}
                  </div>
                )}
                
                {/* Multiple media indicator */}
                {post.media && post.media.length > 1 && (
                  <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    📷 {post.media.length}
                  </div>
                )}
              </div>
              
              <div className="p-3">
                <h3 className="font-semibold text-sm line-clamp-2 dark:text-white mb-1">
                  {post.title || 'Untitled'}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {post.author?.username || 'Unknown'}
                </p>
                <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{post.likes?.length || 0} likes</span>
                  <span className="mx-2">•</span>
                  <span>{post.comments?.length || 0} comments</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Saved;