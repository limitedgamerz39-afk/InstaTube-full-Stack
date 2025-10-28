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
} from 'react-icons/fi';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDashboardStats();
      setStats(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch dashboard stats');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: FiUsers,
      color: 'blue',
      link: '/admin/users',
    },
    {
      title: 'Total Posts',
      value: stats?.totalPosts || 0,
      icon: FiImage,
      color: 'purple',
      link: '/admin/posts',
    },
    {
      title: 'Total Messages',
      value: stats?.totalMessages || 0,
      icon: FiMessageSquare,
      color: 'green',
      link: null,
    },
    {
      title: 'Total Stories',
      value: stats?.totalStories || 0,
      icon: FiFileText,
      color: 'orange',
      link: null,
    },
    {
      title: 'Active Users (24h)',
      value: stats?.activeUsers || 0,
      icon: FiActivity,
      color: 'teal',
      link: null,
    },
    {
      title: 'New Users Today',
      value: stats?.newUsersToday || 0,
      icon: FiUserPlus,
      color: 'indigo',
      link: null,
    },
    {
      title: 'New Posts Today',
      value: stats?.newPostsToday || 0,
      icon: FiTrendingUp,
      color: 'pink',
      link: null,
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    teal: 'bg-teal-500',
    indigo: 'bg-indigo-500',
    pink: 'bg-pink-500',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Manage your application from here
              </p>
            </div>
            <Link
              to="/"
              className="w-full sm:w-auto text-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm"
            >
              Back to App
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            const CardWrapper = stat.link ? Link : 'div';
            const cardProps = stat.link ? { to: stat.link } : {};

            return (
              <CardWrapper
                key={index}
                {...cardProps}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${
                  stat.link ? 'hover:shadow-lg transition cursor-pointer' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                      {stat.title}
                    </p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1 sm:mt-2">
                      {stat.value.toLocaleString()}
                    </p>
                  </div>
                  <div
                    className={`${
                      colorClasses[stat.color]
                    } p-2 sm:p-3 rounded-full text-white flex-shrink-0 ml-2`}
                  >
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>
              </CardWrapper>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 sm:mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Link
              to="/admin/users"
              className="flex items-center p-3 sm:p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition"
            >
              <FiUsers className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mr-2 sm:mr-3 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                  Manage Users
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  View and manage all users
                </p>
              </div>
            </Link>

            <Link
              to="/admin/posts"
              className="flex items-center p-3 sm:p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-500 transition"
            >
              <FiImage className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 mr-2 sm:mr-3 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                  Manage Posts
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  View and moderate posts
                </p>
              </div>
            </Link>

            <Link
              to="/admin/reports"
              className="flex items-center p-3 sm:p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-red-500 dark:hover:border-red-500 transition"
            >
              <FiActivity className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 mr-2 sm:mr-3 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                  View Reports
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Check reported content
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
