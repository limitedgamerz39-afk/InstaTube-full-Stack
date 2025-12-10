import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { adminAPI } from '../services/adminAPI';
import toast from 'react-hot-toast';
import {
  FiUsers,
  FiImage,
  FiMessageSquare,
  FiActivity,
  FiUserPlus,
  FiTrendingUp,
  FiFileText,
  FiDollarSign,
  FiBarChart2,
  FiShield,
  FiSettings,
  FiRefreshCw,
  FiBell,
  FiDatabase,
  FiServer,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiCalendar,
  FiMapPin,
  FiGlobe
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
  AreaChart,
  Area
} from 'recharts';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [contentAnalytics, setContentAnalytics] = useState(null);
  const [monetizationAnalytics, setMonetizationAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState(30);
  const [systemHealth, setSystemHealth] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAllData();
    }
  }, [user, timeRange]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [statsRes, userRes, contentRes, monetizationRes, systemRes, activitiesRes] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getAdvancedUserAnalytics(timeRange),
        adminAPI.getContentAnalytics(timeRange),
        adminAPI.getMonetizationAnalytics(),
        adminAPI.getSystemHealth(),
        adminAPI.getRecentAdminActivities(10)
      ]);
      
      setStats(statsRes.data.data);
      setUserAnalytics(userRes.data.data);
      setContentAnalytics(contentRes.data.data);
      setMonetizationAnalytics(monetizationRes.data.data);
      setSystemHealth(systemRes.data.data);
      setRecentActivities(activitiesRes.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchAllData();
  };

  // Format data for charts
  const registrationData = userAnalytics?.registrationTrends?.map(item => ({
    date: item._id,
    registrations: item.count,
  })) || [];

  const activityData = userAnalytics?.activityTrends?.map(item => ({
    date: item._id,
    activeUsers: item.count,
  })) || [];

  const postData = contentAnalytics?.postCreation?.map(item => ({
    date: item._id,
    posts: item.count,
  })) || [];

  const monetizationData = [
    { name: 'Premium Users', value: monetizationAnalytics?.premiumUsers || 0 },
    { name: 'Monetized Creators', value: monetizationAnalytics?.monetizedCreators || 0 },
    { name: 'Free Users', value: (stats?.totalUsers || 0) - (monetizationAnalytics?.premiumUsers || 0) }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Stat cards data
  const statCards = [
    { title: 'Total Users', value: stats?.totals?.totalUsers || 0, icon: FiUsers, color: 'bg-blue-500', change: '+12%' },
    { title: 'Active Users', value: stats?.growth?.activeUsers || 0, icon: FiActivity, color: 'bg-green-500', change: '+8%' },
    { title: 'Total Posts', value: stats?.totals?.totalPosts || 0, icon: FiImage, color: 'bg-purple-500', change: '+5%' },
    { title: 'Reports', value: stats?.pendingReports || 0, icon: FiAlertCircle, color: 'bg-red-500', change: '-3%' },
    { title: 'Revenue', value: `$${monetizationAnalytics?.totalRevenue?.totalAmount?.toFixed(2) || '0.00'}`, icon: FiDollarSign, color: 'bg-yellow-500', change: '+15%' },
    { title: 'Online Now', value: stats?.onlineUsers || 0, icon: FiGlobe, color: 'bg-indigo-500', change: '+2%' }
  ];

  // Quick action cards
  const quickActions = [
    { icon: FiUsers, label: 'Manage Users', path: '/admin/users', color: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' },
    { icon: FiImage, label: 'Manage Posts', path: '/admin/posts', color: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400' },
    { icon: FiAlertCircle, label: 'Reports', path: '/admin/reports', color: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400' },
    { icon: FiBarChart2, label: 'Analytics', path: '/admin/analytics', color: 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400' },
    { icon: FiShield, label: 'Security', path: '/admin/security', color: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400' },
    { icon: FiActivity, label: 'Audit Log', path: '/admin/audit-log', color: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' },
    { icon: FiSettings, label: 'Settings', path: '/settings', color: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Welcome back, {user?.fullName || user?.username}. Here's what's happening today.
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <div className="relative">
              <FiBell className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
            </div>
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
              disabled={loading}
              className="p-2 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition disabled:opacity-50"
            >
              <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              to="/"
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition"
            >
              Back to App
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                    <p className="text-xs text-green-500 mt-1 flex items-center">
                      <FiTrendingUp className="w-3 h-3 mr-1" />
                      {stat.change}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                    <Icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link 
                  key={index} 
                  to={action.path}
                  className={`${action.color} rounded-xl p-4 flex flex-col items-center justify-center transition-transform hover:scale-105`}
                >
                  <Icon className="w-8 h-8 mb-2" />
                  <span className="text-sm font-medium text-center">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Recent Activity */}
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity._id} className="flex items-start">
                  <div className={`flex-shrink-0 mt-1 w-3 h-3 rounded-full ${
                    activity.severity === 'critical' ? 'bg-red-500' :
                    activity.severity === 'high' ? 'bg-orange-500' :
                    activity.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.userId?.username || 'System'} • {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Health */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">System Health</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center">
                  <FiDatabase className="w-5 h-5 text-blue-500 mr-2" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Database</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {systemHealth?.dbStats?.objects || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Objects</p>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center">
                  <FiServer className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Uptime</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  99.9%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Last 30 days</p>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center">
                  <FiClock className="w-5 h-5 text-purple-500 mr-2" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Response Time</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  125ms
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Average</p>
              </div>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={registrationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="registrations" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* User Registration Trend */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">User Growth</h2>
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
                      strokeWidth={2}
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

          {/* Content Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Content Distribution</h2>
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
                      nameKey="name"
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
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">User Activity</h2>
            <div className="h-80">
              {activityData && activityData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="activeUsers" fill="#82ca9d" name="Active Users" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Content Creation */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Content Creation</h2>
            <div className="h-80">
              {postData && postData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={postData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="posts" fill="#ffc658" name="Posts" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Metrics */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Platform Metrics</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <FiUsers className="w-5 h-5 text-blue-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Total Users</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">All registered accounts</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">{stats?.totals?.totalUsers || 0}</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <FiImage className="w-5 h-5 text-purple-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Total Posts</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Photos, videos, reels</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">{stats?.totals?.totalPosts || 0}</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <FiMessageSquare className="w-5 h-5 text-green-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Total Comments</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">User interactions</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">{stats?.totalComments || 0}</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <FiDollarSign className="w-5 h-5 text-yellow-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Revenue</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total earnings</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  ${monetizationAnalytics?.totalRevenue?.totalAmount?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;