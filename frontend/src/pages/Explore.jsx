import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AiOutlineFire, AiOutlineSearch } from 'react-icons/ai';
import { BsHash } from 'react-icons/bs';

const Explore = () => {
  const navigate = useNavigate();
  const [explorePosts, setExplorePosts] = useState([]);
  const [trendingTags, setTrendingTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts'); // posts, tags
  const [categoryFilter, setCategoryFilter] = useState('all'); // all, images, shorts, long

  useEffect(() => {
    fetchExploreData();
  }, []);

  const fetchExploreData = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const [postsRes, tagsRes] = await Promise.all([
        axios.get(`${API_URL}/explore/posts`),
        axios.get(`${API_URL}/explore/hashtags`),
      ]);
      
      setExplorePosts(postsRes.data.data);
      setTrendingTags(tagsRes.data.data);
    } catch (error) {
      console.error('Failed to load explore data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 dark:from-dark-bg dark:via-dark-bg dark:to-dark-bg pb-20 md:pb-8">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header with Gradient */}
        <div className="bg-gradient-primary text-white rounded-3xl p-8 mb-8 shadow-glow">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center">
                <AiOutlineFire className="mr-3" />
                Explore
              </h1>
              <p className="text-purple-100">Discover trending content & people</p>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/20 backdrop-blur-lg rounded-full px-6 py-3 text-2xl font-bold">
                🔥 Trending
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-3 rounded-2xl font-semibold transition-all ${
              activeTab === 'posts'
                ? 'bg-gradient-primary text-white shadow-glow'
                : 'bg-white dark:bg-dark-card text-gray-700 dark:text-gray-300'
            }`}
          >
            📸 Posts
          </button>
          <button
            onClick={() => setActiveTab('tags')}
            className={`flex-1 py-3 rounded-2xl font-semibold transition-all ${
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
                <h3 className="font-semibold">Trending Reels</h3>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {explorePosts.filter(p => p.category==='short').slice(0,12).map((p) => (
                  <div key={p._id} className="relative min-w-[180px] h-96 rounded-2xl overflow-hidden bg-black cursor-pointer" onClick={() => navigate('/reels')}>
                    <video src={p.media?.[0]?.url || p.mediaUrl} className="w-full h-full object-cover" muted playsInline />
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                      {typeof p.durationSec==='number' ? `${Math.floor(p.durationSec/60)}:${String(p.durationSec%60).padStart(2,'0')}` : 'Short'}
                    </div>
                  </div>
                ))}
                {explorePosts.filter(p => p.category==='short').length === 0 && (
                  <div className="text-sm text-gray-500">No trending reels yet.</div>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 mb-4">
              <button className={`btn-outline ${categoryFilter==='all'?'ring-2 ring-primary':''}`} onClick={() => setCategoryFilter('all')}>All</button>
              <button className={`btn-outline ${categoryFilter==='images'?'ring-2 ring-primary':''}`} onClick={() => setCategoryFilter('images')}>Images</button>
              <button className={`btn-outline ${categoryFilter==='shorts'?'ring-2 ring-primary':''}`} onClick={() => setCategoryFilter('shorts')}>Shorts</button>
              <button className={`btn-outline ${categoryFilter==='long'?'ring-2 ring-primary':''}`} onClick={() => setCategoryFilter('long')}>Long</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {explorePosts.filter(p => {
              if (categoryFilter==='all') return true;
              const cat = p.category;
              const primaryType = (p.media?.[0]?.type) || p.mediaType;
              if (categoryFilter==='images') return cat ? cat==='image' : primaryType==='image';
              if (categoryFilter==='shorts') return cat==='short';
              if (categoryFilter==='long') return cat==='long';
              return true;
            }).map((post) => (
              <div
                key={post._id}
                onClick={() => navigate(`/post/${post._id}`)}
                className="group relative aspect-square cursor-pointer rounded-3xl overflow-hidden shadow-lg hover:shadow-glow transition-all duration-300 hover:scale-105"
              >
                <img
                  src={post.media?.[0]?.url || post.mediaUrl}
                  alt="Post"
                  className="w-full h-full object-cover"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center">
                          ❤️ {post.likes.length}
                        </span>
                        <span className="flex items-center">
                          💬 {post.comments.length}
                        </span>
                      </div>
                      <div className="text-xs bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                        🔥 {post.engagementScore}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category Badge */}
                {post.category && (
                  <div className="absolute top-3 left-3 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    {post.category === 'image' ? 'Image' : post.category === 'short' ? `Short ${typeof post.durationSec==='number' ? `${Math.floor(post.durationSec/60)}:${String(post.durationSec%60).padStart(2,'0')}` : ''}` : `Long ${typeof post.durationSec==='number' ? `${Math.floor(post.durationSec/60)}:${String(post.durationSec%60).padStart(2,'0')}` : ''}`}
                  </div>
                )}

                {/* Multiple Images Indicator */}
                {post.media && post.media.length > 1 && (
                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold">
                    📷 {post.media.length}
                  </div>
                )}
              </div>
            ))}
            </div>
          </>
        ) : (
          // Trending Hashtags
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingTags.map((tagData, index) => (
              <Link
                key={tagData.tag}
                to={`/explore/tags/${tagData.tag}`}
                className="group bg-white dark:bg-dark-card rounded-3xl p-6 shadow-lg hover:shadow-glow-pink transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center text-2xl">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🔥'}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                        #{tagData.tag}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {tagData.count} posts
                      </p>
                    </div>
                  </div>
                  <div className="text-3xl group-hover:scale-110 transition-transform">
                    →
                  </div>
                </div>
                
                {/* Trending Indicator */}
                {index < 3 && (
                  <div className="bg-gradient-primary text-white text-xs px-3 py-1 rounded-full inline-flex items-center">
                    <AiOutlineFire className="mr-1" />
                    Trending
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;
