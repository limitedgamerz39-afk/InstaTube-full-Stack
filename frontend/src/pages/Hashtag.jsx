import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Hashtag = () => {
  const { tag } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [trend, setTrend] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const [postsRes, trendingRes] = await Promise.all([
          axios.get(`${API_URL}/explore/tags/${tag}`),
          axios.get(`${API_URL}/explore/hashtags`),
        ]);
        setPosts(postsRes.data.data || []);
        const currentTrend = (trendingRes.data.data || []).find(t => t.tag === tag);
        setTrend(currentTrend || null);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tag]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 dark:from-dark-bg dark:via-dark-bg dark:to-dark-bg pb-20 md:pb-8">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold dark:text-white">#{tag}</h1>
          {trend && (
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${trend.growthPct > 0 ? 'bg-green-100 text-green-700' : trend.growthPct < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
              <span className="mr-1">{trend.growthPct > 0 ? '▲' : trend.growthPct < 0 ? '▼' : '■'}</span>
              {Math.abs(trend.growthPct)}%
              <span className="ml-2 text-gray-500">vs prev 24h</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-sm text-gray-500">No posts for #{tag} yet.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {posts.map((post) => (
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
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                  #{tag}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Hashtag;
