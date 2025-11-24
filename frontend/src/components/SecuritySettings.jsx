import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiShield, FiKey, FiActivity, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const SecuritySettings = () => {
  const { user } = useAuth();
  const [loginActivities, setLoginActivities] = useState([]);
  const [suspiciousActivities, setSuspiciousActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('recent');

  // Fetch login activities
  useEffect(() => {
    const fetchLoginActivities = async () => {
      setLoading(true);
      try {
        const response = await authAPI.getLoginActivities(1, 10);
        setLoginActivities(response.data.data.activities);
      } catch (error) {
        toast.error('Failed to fetch login activities');
        console.error('Error fetching login activities:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchSuspiciousActivities = async () => {
      try {
        const response = await authAPI.getSuspiciousLoginActivities();
        setSuspiciousActivities(response.data.data.suspiciousActivities);
      } catch (error) {
        toast.error('Failed to fetch suspicious activities');
        console.error('Error fetching suspicious activities:', error);
      }
    };

    fetchLoginActivities();
    fetchSuspiciousActivities();
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get device icon based on device type
  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'mobile':
        return '📱';
      case 'tablet':
        return '📱';
      case 'desktop':
        return '💻';
      default:
        return '🖥️';
    }
  };

  // Get risk color based on risk level
  const getRiskColor = (risk) => {
    switch (risk) {
      case 'high':
        return 'text-red-500 bg-red-100 dark:bg-red-900/30';
      case 'medium':
        return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30';
      case 'low':
        return 'text-green-500 bg-green-100 dark:bg-green-900/30';
      default:
        return 'text-gray-500 bg-gray-100 dark:bg-gray-700';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <FiShield className="text-blue-600 dark:text-blue-400 w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Security Settings</h2>
            <p className="text-gray-600 dark:text-gray-400">Manage your account security and review login activities</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex">
          <button
            onClick={() => setActiveTab('recent')}
            className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors duration-200 ${
              activeTab === 'recent'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <FiActivity className="w-4 h-4" />
              Recent Activity
            </div>
          </button>
          <button
            onClick={() => setActiveTab('suspicious')}
            className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors duration-200 ${
              activeTab === 'suspicious'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <FiAlertTriangle className="w-4 h-4" />
              Suspicious Activity
            </div>
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <AiOutlineLoading3Quarters className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : activeTab === 'recent' ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Login Activities</h3>
            {loginActivities.length === 0 ? (
              <div className="text-center py-8">
                <FiActivity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No login activities found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {loginActivities.map((activity) => (
                  <div
                    key={activity._id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">
                        {getDeviceIcon(activity.deviceType)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {activity.ipAddress}
                          </span>
                          {activity.success ? (
                            <FiCheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <FiAlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {activity.location?.city || activity.location?.country || 'Unknown location'} • {activity.browser || 'Unknown browser'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(activity.timestamp)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.success ? 'Success' : 'Failed'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Suspicious Activities</h3>
            {suspiciousActivities.length === 0 ? (
              <div className="text-center py-8">
                <FiCheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No suspicious activities detected</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Your account appears to be secure
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {suspiciousActivities.map((activity, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="text-2xl">
                          {getDeviceIcon(activity.deviceType)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {activity.ipAddress}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(activity.risk)}`}>
                              {activity.risk?.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {activity.reason}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {activity.location?.city || activity.location?.country || 'Unknown location'} • {formatDate(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {activity.success ? (
                          <FiCheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <FiAlertTriangle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SecuritySettings;