import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { exploreAPI } from '../services/api';
import { 
  AiOutlineFire, 
  AiOutlineTrophy
} from 'react-icons/ai';
import { 
  FiTrendingUp, 
  FiHeart,
  FiMenu
} from 'react-icons/fi';
import { 
  BsGrid3X3,
  BsMusicNoteBeamed,
  BsController,
  BsBook
} from 'react-icons/bs';
import { toast } from 'react-hot-toast';

const Explore = () => {
  const navigate = useNavigate();
  const [explorePosts, setExplorePosts] = useState([]);
  const [trendingTags, setTrendingTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts'); // posts, tags
  const [categoryFilter, setCategoryFilter] = useState('videos'); // Changed default to 'videos'
  const [timeFilter, setTimeFilter] = useState('today'); // today, week, month

  useEffect(() => {
    fetchExploreData();
  }, []);

  const fetchExploreData = async () => {
    try {
      const [postsRes, tagsRes] = await Promise.all([
        exploreAPI.getExplorePosts(),
        exploreAPI.getTrendingHashtags()
      ]);
      
      setExplorePosts(postsRes.data.data || []);
      setTrendingTags(tagsRes.data.data || []);
    } catch (error) {
      console.error('Failed to load explore data:', error);
      toast.error('Failed to load explore data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="flex flex-col md:flex-row max-w-7xl mx-auto">
      
      <div className="flex-1 min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 dark:from-dark-bg dark:via-dark-bg dark:to-dark-bg pb-20 md:pb-8">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header with Gradient */}
          <div className="bg-gradient-primary text-white rounded-3xl p-6 md:p-8 mb-8 shadow-glow">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-4xl font-bold mb-2 flex items-center">
                  <AiOutlineFire className="mr-2 md:mr-3" />
                  Explore
                </h1>
                <p className="text-purple-100 text-sm md:text-base">Discover trending content & people</p>
              </div>
              <div className="hidden md:block">
                <div className="bg-white/20 backdrop-blur-lg rounded-full px-4 md:px-6 py-2 md:py-3 text-lg md:text-2xl font-bold">
                  🔥 Trending
                </div>
              </div>
            </div>
          </div>

          {/* Time Filters */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { key: 'today', label: 'Today' },
              { key: 'week', label: 'This Week' },
              { key: 'month', label: 'This Month' },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  timeFilter === key
                    ? 'bg-gradient-primary text-white shadow-glow'
                    : 'bg-white dark:bg-dark-card text-gray-700 dark:text-gray-300'
                }`}
                onClick={() => setTimeFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex space-x-2 md:space-x-4 mb-8">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-2 md:py-3 rounded-2xl font-semibold transition-all text-sm md:text-base ${
                activeTab === 'posts'
                  ? 'bg-gradient-primary text-white shadow-glow'
                  : 'bg-white dark:bg-dark-card text-gray-700 dark:text-gray-300'
              }`}
            >
              📸 Posts
            </button>
            <button
              onClick={() => setActiveTab('tags')}
              className={`flex-1 py-2 md:py-3 rounded-2xl font-semibold transition-all text-sm md:text-base ${
                activeTab === 'tags'
                  ? 'bg-gradient-primary text-white shadow-glow'
                  : 'bg-white dark:bg-dark-card text-gray-700 dark:text-gray-300'
              }`}
            >
              #️⃣ Hashtags
            </button>
          </div>

          {/* Content */}
          {activeTab === 'posts' ? (
            // Posts Grid
            <>
              {/* Trending Reels Shelf */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm md:text-base flex items-center gap-2">
                    <FiTrendingUp className="text-purple-500" />
                    Trending Reels
                  </h3>
                </div>
                <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {(explorePosts || []).filter(p => p.category==='short').slice(0,12).map((p) => (
                    <div key={p._id} className="relative min-w-[140px] md:min-w-[180px] h-72 md:h-96 rounded-2xl overflow-hidden bg-black cursor-pointer" onClick={() => navigate(`/reels/${p._id}`)}>
                      <video src={p.media?.[0]?.url || p.mediaUrl} className="w-full h-full object-cover" muted playsInline />
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                        {typeof p.durationSec==='number' ? `${Math.floor(p.durationSec/60)}:${String(p.durationSec%60).padStart(2,'0')}` : 'Short'}
                      </div>
                      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <FiHeart className="w-3 h-3" />
                        {formatNumber((p.likes || []).length)}
                      </div>
                    </div>
                  ))}
                  {(explorePosts || []).filter(p => p.category==='short').length === 0 && (
                    <div className="text-sm text-gray-500">No trending reels yet.</div>
                  )}
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                {[
                  { key: 'videos', label: 'Videos', icon: null }, // Changed default to 'videos'
                  { key: 'images', label: 'Photos', icon: '📷' },
                  { key: 'long', label: 'Long Videos', icon: '🎥' },
                  { key: 'shorts', label: 'Shorts', icon: '🎬' }, // Changed from 'short' to 'shorts'
                  { key: 'music', label: 'Music', icon: <BsMusicNoteBeamed /> },
                  { key: 'gaming', label: 'Gaming', icon: <BsController /> },
                  { key: 'education', label: 'Learning', icon: <BsBook /> },
                ].map(({ key, label, icon }) => (
                  <button 
                    key={key}
                    className={`btn-outline whitespace-nowrap text-xs md:text-sm flex items-center gap-1 ${
                      categoryFilter === key ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setCategoryFilter(key)}
                  >
                    {icon && <span>{typeof icon === 'string' ? icon : icon}</span>}
                    {label}
                  </button>
                ))}
              </div>

              {/* Posts Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {(explorePosts || []).filter(p => {
                  // By default, show only videos (both long and short)
                  if (categoryFilter === 'videos') return p.category === 'long' || p.category === 'short';
                  if (categoryFilter === 'images') return p.category === 'image';
                  if (categoryFilter === 'long') return p.category === 'long';
                  if (categoryFilter === 'shorts') return p.category === 'short'; // Changed from 'short' to 'shorts'
                  if (categoryFilter === 'music') return (p.tags || []).includes('music') || p.category === 'music';
                  if (categoryFilter === 'gaming') return (p.tags || []).includes('gaming') || p.category === 'gaming';
                  if (categoryFilter === 'education') return (p.tags || []).includes('education') || p.category === 'education';
                  return p.category === 'long' || p.category === 'short'; // Default to videos only
                }).map((post) => (
                  <div
                    key={post._id}
                    onClick={() => navigate(`/post/${post._id}`)}
                    className="group relative aspect-square cursor-pointer rounded-2xl md:rounded-3xl overflow-hidden shadow-lg hover:shadow-glow transition-all duration-300 hover:scale-105"
                  >
                    <img
                      src={post.media?.[0]?.url || post.mediaUrl}
                      alt="Post"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = 'https://placehold.co/400x400/FF6B9D/FFFFFF?text=No+Image';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute bottom-2 left-2 right-2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex justify-between items-center text-xs">
                        <span className="bg-black/50 px-2 py-1 rounded-full flex items-center gap-1">
                          <FiHeart className="w-3 h-3" />
                          {formatNumber((post.likes || []).length)}
                        </span>
                        <span className="bg-black/50 px-2 py-1 rounded-full">
                          {post.category === 'short' ? 'Short' : 'Long'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            // Hashtags Grid
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(trendingTags || []).slice(0, 12).map((tag) => (
                  <Link 
                    key={tag._id} 
                    to={`/explore/tags/${tag.name}`}
                    className="group"
                  >
                    <div className="bg-white dark:bg-dark-card rounded-2xl p-4 md:p-6 shadow-card hover:shadow-card-hover transition-all duration-300 border border-gray-100 dark:border-dark-border group-hover:-translate-y-1">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-lg">
                          #
                        </div>
                        <AiOutlineTrophy className="text-yellow-500 w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-lg mb-1 dark:text-white group-hover:text-primary transition-colors">
                        #{tag.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {formatNumber(tag.postCount || 0)} posts
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              
              {/* All Hashtags */}
              <div className="bg-white dark:bg-dark-card rounded-2xl p-4 md:p-6 shadow-card">
                <h3 className="font-bold text-lg mb-4 dark:text-white">All Trending Hashtags</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {(trendingTags || []).map((tag) => (
                    <Link 
                      key={tag._id} 
                      to={`/explore/tags/${tag.name}`}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-border transition-colors group"
                    >
                      <span className="font-medium dark:text-white group-hover:text-primary transition-colors">
                        #{tag.name}
                      </span>
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm">
                        <FiHeart className="w-3 h-3" />
                        {formatNumber(tag.postCount || 0)}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 md:h-16 w-12 md:w-16 border-t-4 border-b-4 border-purple-500"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Explore;