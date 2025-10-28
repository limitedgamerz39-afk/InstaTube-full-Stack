import { useState, useEffect } from 'react';
import { postAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';
import { BsArchive } from 'react-icons/bs';
import { AiOutlineEye } from 'react-icons/ai';

const Archive = () => {
  const navigate = useNavigate();
  const [archivedPosts, setArchivedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArchivedPosts();
  }, []);

  const fetchArchivedPosts = async () => {
    try {
      // This will fetch user's own posts and filter archived ones
      const response = await postAPI.getFeed();
      const archived = response.data.data.filter(post => post.isArchived);
      setArchivedPosts(archived);
    } catch (error) {
      console.error('Failed to load archived posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchive = async (postId) => {
    try {
      await postAPI.archivePost(postId);
      setArchivedPosts(archivedPosts.filter(post => post._id !== postId));
      toast.success('Post unarchived');
    } catch (error) {
      toast.error('Failed to unarchive post');
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-20 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold dark:text-white flex items-center">
          <BsArchive className="mr-2" />
          Archive
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Only you can see this
        </p>
      </div>

      {archivedPosts.length === 0 ? (
        <div className="card p-12 text-center">
          <BsArchive size={64} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No archived posts
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Posts you archive will appear here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 md:gap-4">
          {archivedPosts.map((post) => (
            <div
              key={post._id}
              className="aspect-square cursor-pointer relative group"
            >
              <img
                src={post.media?.[0]?.url || post.mediaUrl}
                alt="Archived post"
                className="w-full h-full object-cover rounded"
              />
              
              {/* Multiple images indicator */}
              {post.media && post.media.length > 1 && (
                <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  📷 {post.media.length}
                </div>
              )}

              {/* Hover overlay with unarchive button */}
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white p-2">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center">
                    ❤️ {post.likes.length}
                  </div>
                  <div className="flex items-center">
                    💬 {post.comments.length}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnarchive(post._id);
                  }}
                  className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-100 flex items-center space-x-2 text-sm font-semibold"
                >
                  <AiOutlineEye size={18} />
                  <span>Unarchive</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 card p-6">
        <h3 className="font-semibold mb-2 dark:text-white">About Archive</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          When you archive a post, it will be hidden from your profile.
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Only you can see your archived posts. You can unarchive them anytime.
        </p>
      </div>
    </div>
  );
};

export default Archive;
