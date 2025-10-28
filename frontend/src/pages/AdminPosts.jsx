import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { adminAPI } from '../services/adminAPI';
import toast from 'react-hot-toast';
import {
  FiImage,
  FiSearch,
  FiTrash2,
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiHeart,
  FiMessageCircle,
  FiEye,
} from 'react-icons/fi';

const AdminPosts = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchPosts();
    }
  }, [user, currentPage]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllPosts(currentPage, 20);
      setPosts(response.data.data.posts);
      setTotalPages(response.data.data.totalPages);
      setTotal(response.data.data.total);
    } catch (error) {
      toast.error('Failed to fetch posts');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchPosts();
      return;
    }

    try {
      setLoading(true);
      const response = await adminAPI.adminSearch(searchQuery, 'posts');
      setPosts(response.data.data);
    } catch (error) {
      toast.error('Search failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      await adminAPI.deletePost(postId);
      toast.success('Post deleted successfully');
      fetchPosts();
      setSelectedPost(null);
    } catch (error) {
      toast.error('Failed to delete post');
      console.error(error);
    }
  };

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1 min-w-0">
              <Link
                to="/admin"
                className="mr-2 sm:mr-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition flex-shrink-0"
              >
                <FiArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-300" />
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                  <FiImage className="mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="truncate">Post Management</span>
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Total {total} posts
                </p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-4 sm:mt-6">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search posts..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 sm:px-6 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex-shrink-0"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <FiImage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No posts found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Try adjusting your search criteria
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
              {posts.map((post) => (
                <div
                  key={post._id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-lg transition cursor-pointer"
                  onClick={() => setSelectedPost(post)}
                >
                  {/* Post Image */}
                  <div className="relative aspect-square bg-gray-100 dark:bg-gray-700">
                    {post.media && post.media.length > 0 ? (
                      post.media[0].type === 'video' ? (
                        <video
                          src={post.media[0].url}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={post.media[0].url}
                          alt="Post"
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <FiImage className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                      {post.media?.length || 0} media
                    </div>
                  </div>

                  {/* Post Info */}
                  <div className="p-2 sm:p-3 lg:p-4">
                    <div className="flex items-center mb-2">
                      <img
                        src={post.user?.avatar}
                        alt={post.user?.username}
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="ml-1 sm:ml-2 min-w-0 flex-1">
                        <Link
                          to={`/profile/${post.user?.username}`}
                          className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white hover:text-blue-500 truncate block"
                          onClick={(e) => e.stopPropagation()}
                        >
                          @{post.user?.username}
                        </Link>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2 hidden sm:block">
                      {post.caption || 'No caption'}
                    </p>

                    <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <FiHeart className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
                        {post.likes?.length || 0}
                      </div>
                      <div className="flex items-center">
                        <FiMessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
                        {post.comments?.length || 0}
                      </div>
                    </div>

                    <div className="mt-2 sm:mt-3 text-xs text-gray-400 hidden sm:block">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <FiChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <FiChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                Post Details
              </h3>
              <button
                onClick={() => setSelectedPost(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-xl"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Media */}
                <div className="md:order-1">
                  {selectedPost.media && selectedPost.media.length > 0 && (
                    <div className="space-y-3 sm:space-y-4">
                      {selectedPost.media.map((item, index) => (
                        <div key={index} className="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                          {item.type === 'video' ? (
                            <video src={item.url} controls className="w-full" />
                          ) : (
                            <img src={item.url} alt="Post media" className="w-full" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="md:order-2">
                  <div className="flex items-center mb-3 sm:mb-4">
                    <img
                      src={selectedPost.user?.avatar}
                      alt={selectedPost.user?.username}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="ml-2 sm:ml-3 min-w-0 flex-1">
                      <Link
                        to={`/profile/${selectedPost.user?.username}`}
                        className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white hover:text-blue-500 truncate block"
                      >
                        {selectedPost.user?.fullName}
                      </Link>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                        @{selectedPost.user?.username}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3 sm:mb-4">
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2">
                      Caption
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedPost.caption || 'No caption'}
                    </p>
                  </div>

                  <div className="mb-3 sm:mb-4">
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2">
                      Statistics
                    </h4>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="bg-gray-50 dark:bg-gray-700 p-2 sm:p-3 rounded-lg">
                        <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
                          <FiHeart className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Likes
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                          {selectedPost.likes?.length || 0}
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-2 sm:p-3 rounded-lg">
                        <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
                          <FiMessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Comments
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                          {selectedPost.comments?.length || 0}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3 sm:mb-4">
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-2">
                      Post Information
                    </h4>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between gap-2">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">Posted:</span>
                        <span className="text-gray-900 dark:text-white text-right">
                          {new Date(selectedPost.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">Post ID:</span>
                        <span className="text-gray-900 dark:text-white font-mono text-xs truncate">
                          {selectedPost._id}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleDeletePost(selectedPost._id)}
                      className="w-full px-4 py-2 sm:py-3 text-sm sm:text-base bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center justify-center font-medium"
                    >
                      <FiTrash2 className="mr-2" />
                      Delete Post
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPosts;
