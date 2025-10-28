import { useState, useEffect } from 'react';
import { postAPI, userAPI } from '../services/api';
import { Link } from 'react-router-dom';
import PostCard from '../components/PostCard';
import StoriesBar from '../components/StoriesBar';
import PullToRefresh from '../components/PullToRefresh';
import { PostSkeleton } from '../components/SkeletonLoader';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState('all'); // all, images, shorts, long

  useEffect(() => {
    fetchFeed();
    fetchSuggestions();
  }, []);

  const fetchFeed = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const response = await postAPI.getFeed(page);
      setPosts(response.data.data);
      setHasMore(response.data.pagination.page < response.data.pagination.pages);
    } catch (error) {
      toast.error('Failed to load feed');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setPage(1);
    await fetchFeed(false);
    toast.success('Feed refreshed!');
  };

  const fetchSuggestions = async () => {
    try {
      const response = await userAPI.getSuggestions();
      setSuggestions(response.data.data);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  };

  const loadMorePosts = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const response = await postAPI.getFeed(page + 1);
      setPosts([...posts, ...response.data.data]);
      setPage(page + 1);
      setHasMore(response.data.pagination.page < response.data.pagination.pages);
    } catch (error) {
      toast.error('Failed to load more posts');
    } finally {
      setLoadingMore(false);
    }
  };

  const handlePostDelete = (postId) => {
    setPosts(posts.filter((post) => post._id !== postId));
  };

  const handleFollow = async (userId) => {
    try {
      await userAPI.followUser(userId);
      setSuggestions(suggestions.filter((user) => user._id !== userId));
      toast.success('User followed');
    } catch (error) {
      toast.error('Failed to follow user');
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Stories Bar */}
        <div className="lg:col-span-2 mb-6">
          <StoriesBar />
        </div>

        {/* Reels Shelf */}
        <div className="lg:col-span-2 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Reels</h3>
            <Link to="/reels" className="text-primary text-sm">View all</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {posts.filter(p => p.category==='short').slice(0,12).map((p) => (
              <div key={p._id} className="relative min-w-[140px] h-72 rounded-xl overflow-hidden bg-black cursor-pointer" onClick={() => window.location.href='/reels'}>
                <video src={p.media?.[0]?.url || p.mediaUrl} className="w-full h-full object-cover" muted playsInline />
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                  {typeof p.durationSec==='number' ? `${Math.floor(p.durationSec/60)}:${String(p.durationSec%60).padStart(2,'0')}` : 'Short'}
                </div>
              </div>
            ))}
            {posts.filter(p => p.category==='short').length === 0 && (
              <div className="text-sm text-gray-500">No reels from people you follow.</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Feed Section */}
          <div className="lg:col-span-2">
            {/* Category Filter */}
            <div className="flex gap-2 mb-4">
              <button className={`btn-outline ${filter==='all'?'ring-2 ring-primary':''}`} onClick={() => setFilter('all')}>All</button>
              <button className={`btn-outline ${filter==='images'?'ring-2 ring-primary':''}`} onClick={() => setFilter('images')}>Images</button>
              <button className={`btn-outline ${filter==='shorts'?'ring-2 ring-primary':''}`} onClick={() => setFilter('shorts')}>Shorts</button>
              <button className={`btn-outline ${filter==='long'?'ring-2 ring-primary':''}`} onClick={() => setFilter('long')}>Long</button>
            </div>
            {loading && posts.length === 0 ? (
              <>
                <PostSkeleton />
                <PostSkeleton />
              </>
            ) : posts.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gray-600 mb-4">
                No posts yet. Start following people to see their posts!
              </p>
              <Link to="/search" className="btn-primary">
                Find People
              </Link>
            </div>
          ) : (
            <>
              {posts.filter(p => {
                if (filter==='all') return true;
                const cat = p.category;
                const primaryType = (p.media?.[0]?.type) || p.mediaType;
                if (filter==='images') return cat ? cat==='image' : primaryType==='image';
                if (filter==='shorts') return cat==='short';
                if (filter==='long') return cat==='long';
                return true;
              }).map((post) => (
                <PostCard key={post._id} post={post} onDelete={handlePostDelete} />
              ))}

              {hasMore && (
                <div className="text-center mt-4">
                  <button
                    onClick={loadMorePosts}
                    disabled={loadingMore}
                    className="btn-secondary"
                  >
                    {loadingMore ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar - Suggestions */}
        <div className="hidden lg:block">
          <div className="sticky top-20">
            <h3 className="font-semibold text-gray-600 mb-4">
              Suggestions For You
            </h3>

            {suggestions.length === 0 ? (
              <p className="text-sm text-gray-500">No suggestions available</p>
            ) : (
              <div className="space-y-4">
                {suggestions.map((user) => (
                  <div key={user._id} className="flex items-center justify-between">
                    <Link
                      to={`/profile/${user.username}`}
                      className="flex items-center space-x-3 flex-1"
                    >
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {user.username}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.fullName}
                        </p>
                      </div>
                    </Link>
                    <button
                      onClick={() => handleFollow(user._id)}
                      className="text-primary text-sm font-semibold hover:text-blue-700"
                    >
                      Follow
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </PullToRefresh>
  );
};

export default Feed;
