import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { communityAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiHeart, FiMessageCircle, FiMoreVertical, FiImage, FiBarChart } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import Loader from '../components/Loader';

function Community() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPost, setNewPost] = useState({ content: '', type: 'text' });
  const { userId } = useParams();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchCommunityPosts();
  }, [userId]);

  const fetchCommunityPosts = async () => {
    try {
      setLoading(true);
      const response = await communityAPI.getUserCommunityPosts(userId || currentUser._id);
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('Error fetching community posts:', error);
      toast.error('Failed to load community posts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.content.trim()) {
      toast.error('Content is required');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('content', newPost.content);
      formData.append('type', newPost.type);

      await communityAPI.createCommunityPost(formData);
      toast.success('Community post created!');
      setShowCreateModal(false);
      setNewPost({ content: '', type: 'text' });
      fetchCommunityPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    }
  };

  const handleLike = async (postId) => {
    try {
      await communityAPI.likeCommunityPost(postId);
      setPosts(posts.map(p => 
        p._id === postId 
          ? { ...p, likes: p.likes.includes(currentUser._id) 
              ? p.likes.filter(id => id !== currentUser._id)
              : [...p.likes, currentUser._id]
            }
          : p
      ));
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await communityAPI.deleteCommunityPost(postId);
      setPosts(posts.filter(p => p._id !== postId));
      toast.success('Post deleted');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-6 pb-20">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Community</h1>
          {(!userId || userId === currentUser._id) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:opacity-90"
            >
              Create Post
            </button>
          )}
        </div>

        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400 text-lg">No community posts yet</p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post._id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={post.creator.profilePicture || '/default-avatar.png'}
                      alt={post.creator.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {post.creator.fullName || post.creator.username}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {post.creator._id === currentUser._id && (
                    <button
                      onClick={() => handleDeletePost(post._id)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <FiMoreVertical />
                    </button>
                  )}
                </div>

                <p className="text-gray-900 dark:text-white whitespace-pre-wrap mb-4">
                  {post.content}
                </p>

                {post.media && (
                  <div className="mb-4">
                    {post.media.type === 'image' ? (
                      <img
                        src={post.media.url}
                        alt="Post media"
                        className="w-full rounded-lg max-h-96 object-cover"
                      />
                    ) : (
                      <video
                        src={post.media.url}
                        controls
                        className="w-full rounded-lg max-h-96"
                      />
                    )}
                  </div>
                )}

                {post.type === 'poll' && post.poll && (
                  <div className="mb-4 space-y-2">
                    <p className="font-semibold text-gray-900 dark:text-white">{post.poll.question}</p>
                    {post.poll.options.map((option, index) => {
                      const totalVotes = post.poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);
                      const percentage = totalVotes > 0 ? (option.votes.length / totalVotes) * 100 : 0;
                      return (
                        <div key={index} className="relative">
                          <div
                            className="absolute inset-0 bg-purple-100 dark:bg-purple-900/20 rounded"
                            style={{ width: `${percentage}%` }}
                          />
                          <div className="relative px-4 py-2 flex justify-between">
                            <span className="text-gray-900 dark:text-white">{option.text}</span>
                            <span className="text-gray-600 dark:text-gray-400">{Math.round(percentage)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center gap-6 text-gray-500">
                  <button
                    onClick={() => handleLike(post._id)}
                    className={`flex items-center gap-2 ${
                      post.likes.includes(currentUser._id) ? 'text-red-500' : 'hover:text-red-500'
                    }`}
                  >
                    <FiHeart className={post.likes.includes(currentUser._id) ? 'fill-current' : ''} />
                    <span>{post.likes.length}</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <FiMessageCircle />
                    <span>{post.comments.length}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Create Community Post</h2>
            <form onSubmit={handleCreatePost}>
              <textarea
                placeholder="What's on your mind?"
                className="w-full p-3 border rounded-lg mb-3 dark:bg-gray-700 dark:text-white"
                rows="5"
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              />
              <div className="flex gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setNewPost({ ...newPost, type: 'text' })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    newPost.type === 'text' ? 'bg-purple-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  Text
                </button>
                <button
                  type="button"
                  onClick={() => setNewPost({ ...newPost, type: 'poll' })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    newPost.type === 'poll' ? 'bg-purple-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <FiBarChart /> Poll
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg"
                >
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

export default Community;
