import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import premiumAPI from '../services/premiumAPI';
import toast from 'react-hot-toast';
import {
  AiOutlineDollar,
  AiOutlineEye,
  AiOutlineHeart,
  AiOutlineClockCircle,
  AiOutlineRise,
  AiOutlineTrophy,
} from 'react-icons/ai';
import { Link } from 'react-router-dom';

const CreatorDashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [analyticsRes, earningsRes] = await Promise.all([
        premiumAPI.getAnalytics(),
        premiumAPI.getEarnings(),
      ]);
      setAnalytics(analyticsRes.data.data);
      setEarnings(earningsRes.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableMonetization = async () => {
    try {
      await premiumAPI.enableMonetization();
      toast.success('Monetization enabled successfully!');
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to enable monetization');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary"></div>
      </div>
    );
  }

  // Monetization not enabled
  if (!user?.monetizationApproved) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl text-center">
            <AiOutlineDollar size={80} className="mx-auto text-green-500 mb-6" />
            <h1 className="text-3xl font-bold mb-4 dark:text-white">Start Earning from Your Content</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Turn your passion into income! Enable monetization to earn from ads, Super Chats, and more.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                <h3 className="font-semibold mb-2 dark:text-white">Requirements</h3>
                <ul className="text-left text-sm text-gray-600 dark:text-gray-300 space-y-2">
                  <li className="flex items-center">
                    <AiOutlineHeart className="mr-2 text-pink-500" />
                    1,000+ followers
                  </li>
                  <li className="flex items-center">
                    <AiOutlineClockCircle className="mr-2 text-blue-500" />
                    4,000 minutes watch time
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                <h3 className="font-semibold mb-2 dark:text-white">Your Progress</h3>
                <div className="text-left text-sm space-y-2">
                  <div>
                    <p className="text-gray-600 dark:text-gray-300">
                      Followers: <span className="font-bold dark:text-white">{user?.followers?.length || 0}</span> / 1,000
                    </p>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                      <div
                        className="bg-pink-500 h-2 rounded-full"
                        style={{ width: `${Math.min((user?.followers?.length || 0) / 10, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-300">
                      Watch Time: <span className="font-bold dark:text-white">{user?.totalWatchTime || 0}</span> / 4,000 min
                    </p>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${Math.min((user?.totalWatchTime || 0) / 40, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleEnableMonetization}
              className="btn-primary text-lg px-8 py-3"
              disabled={user?.followers?.length < 1000 || user?.totalWatchTime < 4000}
            >
              Enable Monetization
            </button>

            {(user?.followers?.length < 1000 || user?.totalWatchTime < 4000) && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                Keep creating! You'll be eligible once you meet the requirements.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold dark:text-white mb-2">Creator Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your earnings and performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <AiOutlineDollar size={32} className="text-green-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Total</span>
            </div>
            <p className="text-3xl font-bold dark:text-white mb-1">
              ${analytics?.overview?.totalEarnings?.toFixed(2) || '0.00'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Earnings</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <AiOutlineRise size={32} className="text-blue-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Pending</span>
            </div>
            <p className="text-3xl font-bold dark:text-white mb-1">
              ${analytics?.overview?.pendingPayout?.toFixed(2) || '0.00'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending Payout</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <AiOutlineHeart size={32} className="text-pink-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Audience</span>
            </div>
            <p className="text-3xl font-bold dark:text-white mb-1">
              {analytics?.overview?.subscribers || 0}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Subscribers</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <AiOutlineClockCircle size={32} className="text-purple-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Hours</span>
            </div>
            <p className="text-3xl font-bold dark:text-white mb-1">
              {Math.floor((analytics?.overview?.totalWatchTime || 0) / 60)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Watch Hours</p>
          </div>
        </div>

        {/* Revenue by Source */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-bold dark:text-white mb-4">Revenue by Source</h3>
            <div className="space-y-3">
              {analytics?.revenueBySource?.map((source) => (
                <div key={source._id} className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300 capitalize">
                    {source._id.replace(/_/g, ' ')}
                  </span>
                  <span className="font-bold dark:text-white">${source.total.toFixed(2)}</span>
                </div>
              ))}
              {(!analytics?.revenueBySource || analytics.revenueBySource.length === 0) && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No revenue data yet. Keep creating!
                </p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-bold dark:text-white mb-4">Top Performing Videos</h3>
            <div className="space-y-3">
              {analytics?.topPosts?.slice(0, 5).map((post) => (
                <Link
                  key={post._id}
                  to={post.category === 'long' ? `/videos?watch=${post._id}` : `/reels`}
                  className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition"
                >
                  <div className="w-20 h-12 bg-black rounded overflow-hidden flex-shrink-0">
                    {post.media?.[0]?.url && (
                      <img src={post.media[0].url} alt={post.title} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm dark:text-white truncate">{post.title || 'Untitled'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {post.views || 0} views • {post.likes?.length || 0} likes
                    </p>
                  </div>
                </Link>
              ))}
              {(!analytics?.topPosts || analytics.topPosts.length === 0) && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No posts yet. Start creating!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Earnings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-bold dark:text-white mb-4">Recent Earnings</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold dark:text-white">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold dark:text-white">Source</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold dark:text-white">Description</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold dark:text-white">Amount</th>
                </tr>
              </thead>
              <tbody>
                {earnings?.recentEarnings?.slice(0, 10).map((earning) => (
                  <tr key={earning._id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                      {new Date(earning.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300 capitalize">
                      {earning.source.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                      {earning.description || earning.post?.title || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-right dark:text-white">
                      ${earning.amount.toFixed(3)}
                    </td>
                  </tr>
                ))}
                {(!earnings?.recentEarnings || earnings.recentEarnings.length === 0) && (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500 dark:text-gray-400">
                      No earnings yet. Views and engagement will generate revenue!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
          <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">💡 Maximize Your Earnings</h4>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <li>• Create longer videos (&gt;5 min) to enable mid-roll ads</li>
            <li>• Encourage viewers to watch till the end for better revenue</li>
            <li>• Engage with your audience through comments and live streams</li>
            <li>• Enable Super Chat during live streams for direct support</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreatorDashboard;
