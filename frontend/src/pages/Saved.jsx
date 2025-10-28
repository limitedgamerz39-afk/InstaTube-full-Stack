import { useState, useEffect } from 'react';
import { postAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import { BsBookmark } from 'react-icons/bs';

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
        <div className="grid grid-cols-3 gap-1 md:gap-4">
          {savedPosts.map((post) => (
            <div
              key={post._id}
              onClick={() => navigate(`/post/${post._id}`)}
              className="aspect-square cursor-pointer hover:opacity-75 transition relative group"
            >
              <img
                src={post.media?.[0]?.url || post.mediaUrl}
                alt="Saved post"
                className="w-full h-full object-cover rounded"
              />
              
              {/* Multiple images indicator */}
              {post.media && post.media.length > 1 && (
                <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  📷 {post.media.length}
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center space-x-4 text-white">
                <div className="flex items-center">
                  ❤️ {post.likes.length}
                </div>
                <div className="flex items-center">
                  💬 {post.comments.length}
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
