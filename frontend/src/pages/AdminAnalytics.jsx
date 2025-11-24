import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { adminAPI } from '../services/adminAPI';
import toast from 'react-hot-toast';
import {
  FiBarChart2,
  FiUsers,
  FiImage,
  FiDollarSign,
  FiRefreshCw,
  FiArrowLeft,
} from 'react-icons/fi';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const AdminAnalytics = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [contentAnalytics, setContentAnalytics] = useState(null);
  const [monetizationAnalytics, setMonetizationAnalytics] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAnalyticsData();
    }
  }, [user, activeTab, timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      switch (activeTab) {
        case 'users':
          const userRes = await adminAPI.getAdvancedUserAnalytics(timeRange);
          setUserAnalytics(userRes.data.data);
          break;
        case 'content':
          const contentRes = await adminAPI.getContentAnalytics(timeRange);
          setContentAnalytics(contentRes.data.data);
          break;
        case 'monetization':
          const monetizationRes = await adminAPI.getMonetizationAnalytics();
          setMonetizationAnalytics(monetizationRes.data.data);
          break;
        case 'system':
          const systemRes = await adminAPI.getSystemHealth();
          setSystemHealth(systemRes.data.data);
          break;
        default:
          break;
      }
    } catch (error) {
      toast.error('Failed to fetch analytics data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchAnalyticsData();
  };

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Format data for charts
  const registrationData = userAnalytics?.registrationTrends?.map(item => ({
    date: item._id,
    registrations: item.count,
  })) || [];

  const activityData = userAnalytics?.activityTrends?.map(item => ({
    date: item._id,
    activeUsers: item.count,
  })) || [];

  const roleEngagementData = userAnalytics?.roleEngagement?.map(item => ({
    name: item._id || 'Unknown',
    users: item.userCount,
    posts: item.totalPosts,
    comments: item.totalComments,
  })) || [];

  const topCreatorsData = userAnalytics?.topCreators?.map(creator => ({
    name: creator.username,
    subscribers: creator.subscribersCount,
  })) || [];

  const postData = contentAnalytics?.postCreation?.map(item => ({
    date: item._id,
    posts: item.count,
  })) || [];

  const categoryData = contentAnalytics?.categoryDistribution?.map(item => ({
    name: item._id || 'Uncategorized',
    count: item.count,
  })) || [];

  const monetizationData = [
    { name: 'Premium Users', value: monetizationAnalytics?.premiumUsers || 0 },
    { name: 'Monetized Creators', value: monetizationAnalytics?.monetizedCreators || 0 },
  ];

  const premiumPlanData = monetizationAnalytics?.premiumUsersByPlan?.map(item => ({
    name: item._id,
    count: item.count,
  })) || [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const tabs = [
    { id: 'users', label: 'User Analytics', icon: FiUsers },
    { id: 'content', label: 'Content Analytics', icon: FiImage },
    { id: 'monetization', label: 'Monetization', icon: FiDollarSign },
    { id: 'system', label: 'System Health', icon: FiBarChart2 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link to="/admin" className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
                <FiArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  Analytics Dashboard
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Detailed platform analytics and insights
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
              <button
                onClick={refreshData}
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {activeTab === 'users' && (
              <div className="space-y-6">
                {/* User Registration Trend */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    User Registration Trend
                  </h3>
                  <div className="h-80">
                    {registrationData && registrationData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={registrationData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="registrations"
                            stroke="#8884d8"
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No data available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* User Activity Trend */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    User Activity Trend
                  </h3>
                  <div className="h-80">
                    {activityData && activityData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={activityData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="activeUsers"
                            stroke="#82ca9d"
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No data available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Role Engagement */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    User Engagement by Role
                  </h3>
                  <div className="h-80">
                    {roleEngagementData && roleEngagementData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={roleEngagementData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="users" fill="#8884d8" name="Users" />
                          <Bar dataKey="posts" fill="#82ca9d" name="Posts" />
                          <Bar dataKey="comments" fill="#ffc658" name="Comments" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No data available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Creators */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Top Creators by Subscribers
                  </h3>
                  <div className="h-80">
                    {topCreatorsData && topCreatorsData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topCreatorsData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="subscribers" fill="#ff7300" name="Subscribers" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'content' && (
              <div className="space-y-6">
                {/* Post Creation Trend */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Post Creation Trend
                  </h3>
                  <div className="h-80">
                    {postData && postData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={postData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="posts" fill="#82ca9d" name="Posts" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No data available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Category Distribution */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Content Category Distribution
                  </h3>
                  <div className="h-80">
                    {categoryData && categoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'monetization' && (
              <div className="space-y-6">
                {/* Monetization Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Monetization Overview
                    </h3>
                    <div className="h-80">
                      {monetizationData && monetizationData.some(item => item.value > 0) ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={monetizationData}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {monetizationData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-gray-500">No data available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Premium Users by Plan
                    </h3>
                    <div className="h-80">
                      {premiumPlanData && premiumPlanData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={premiumPlanData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#0088FE" name="Users" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-gray-500">No data available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Revenue Stats */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Revenue Statistics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {monetizationAnalytics?.totalRevenue?.totalAmount?.toFixed(2) || '0.00'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Total Revenue
                      </div>
                    </div>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {monetizationAnalytics?.totalRevenue?.count || 0}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Revenue Transactions
                      </div>
                    </div>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {monetizationAnalytics?.subscriptionStats?.reduce((acc, stat) => acc + stat.count, 0) || 0}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Total Subscriptions
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="space-y-6">
                {/* Database Stats */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Database Statistics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {systemHealth?.dbStats?.collections || 0}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Collections
                      </div>
                    </div>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {systemHealth?.dbStats?.objects || 0}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Objects
                      </div>
                    </div>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {(systemHealth?.dbStats?.dataSize / (1024 * 1024)).toFixed(2) || 0} MB
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Data Size
                      </div>
                    </div>
                  </div>
                </div>

                {/* Collection Stats */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Collection Statistics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {systemHealth?.collectionStats?.users || 0}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Users
                      </div>
                    </div>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {systemHealth?.collectionStats?.posts || 0}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Posts
                      </div>
                    </div>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {systemHealth?.collectionStats?.comments || 0}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Comments
                      </div>
                    </div>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {systemHealth?.collectionStats?.messages || 0}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Messages
                      </div>
                    </div>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {systemHealth?.collectionStats?.stories || 0}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Stories
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;