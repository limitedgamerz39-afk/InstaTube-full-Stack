import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { exploreAPI } from '../services/api';
import { FiHeart, FiMessageSquare, FiShare } from 'react-icons/fi';

const Hashtag = () => {
  const { tag } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [trend, setTrend] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postsRes, trendingRes] = await Promise.all([
          exploreAPI.getPostsByHashtag(tag),
          exploreAPI.getTrendingHashtags(),
        ]);
        setPosts(postsRes.data.data || []);
        const currentTrend = (trendingRes.data.data || []).find(t => t.tag === tag);
        setTrend(currentTrend || null);
      } catch (e) {
        console.error('Error fetching hashtag data:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tag]);

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 dark:from-dark-bg dark:via-dark-bg dark:to-dark-bg pb-20 md:pb-8">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header with Gradient */}
        <div className="bg-gradient-primary text-white rounded-3xl p-6 md:p-8 mb-8 shadow-glow">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold mb-2 flex items-center">
                #{tag}
              </h1>
              <p className="text-purple-100 text-sm md:text-base">{posts.length} posts</p>
            </div>
            {trend && (
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${trend.growthPct > 0 ? 'bg-green-100 text-green-700' : trend.growthPct < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                <span className="mr-1">{trend.growthPct > 0 ? '▲' : trend.growthPct < 0 ? '▼' : '■'}</span>
                {Math.abs(trend.growthPct)}%
                <span className="ml-2 text-gray-500">vs prev 24h</span>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No posts found</h3>
            <p className="text-gray-600 dark:text-gray-400">No posts have been tagged with #{tag} yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {posts.map((post) => (
              <div
                key={post._id}
                onClick={() => navigate(`/post/${post._id}`)}
                className="group relative aspect-square cursor-pointer rounded-2xl md:rounded-3xl overflow-hidden shadow-lg hover:shadow-glow transition-all duration-300 hover:scale-105"
              >
                <img
                  src={post.media?.[0]?.url || post.mediaUrl}
                  alt={`Post with #${tag}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 md:space-x-3">
                        <span className="flex items-center text-xs md:text-sm">
                          <FiHeart className="mr-1" /> {formatNumber((post.likes || []).length)}
                        </span>
                        <span className="flex items-center text-xs md:text-sm">
                          <FiMessageSquare className="mr-1" /> {formatNumber((post.comments || []).length)}
                        </span>
                      </div>
                      <button className="text-xs bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                        <FiShare />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Hashtag Badge */}
                <div className="absolute top-2 md:top-3 left-2 md:left-3 bg-black/70 text-white px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs font-semibold">
                  #{tag}
                </div>
                
                {/* Category Badge */}
                {post.category && (
                  <div className="absolute top-2 md:top-3 right-2 md:right-3 bg-black/70 text-white px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs font-semibold">
                    {post.category === 'image' ? 'Image' : post.category === 'short' ? 'Short' : 'Long'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Hashtag;