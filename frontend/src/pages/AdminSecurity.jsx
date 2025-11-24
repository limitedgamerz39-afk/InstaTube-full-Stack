import { useState, useEffect } from 'react';
import { adminAPI } from '../services/adminAPI';
import toast from 'react-hot-toast';
import { FiShield, FiActivity, FiAlertTriangle, FiCheckCircle, FiXCircle, FiSearch } from 'react-icons/fi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const AdminSecurity = () => {
  const [securityEvents, setSecurityEvents] = useState([]);
  const [loginActivities, setLoginActivities] = useState([]);
  const [suspiciousActivities, setSuspiciousActivities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('events');
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  // Fetch security data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch security events
        const eventsResponse = await adminAPI.getSecurityEvents();
        setSecurityEvents(eventsResponse.data.data.events);
        
        // Fetch login activities
        const loginResponse = await adminAPI.getLoginActivities();
        setLoginActivities(loginResponse.data.data.activities);
        
        // Fetch suspicious activities
        const suspiciousResponse = await adminAPI.getSuspiciousActivities();
        setSuspiciousActivities(suspiciousResponse.data.data);
        
        // Fetch stats
        const statsResponse = await adminAPI.getSecurityStats();
        setStats(statsResponse.data.data);
      } catch (error) {
        toast.error('Failed to fetch security data');
        console.error('Error fetching security data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
      case 'critical':
        return 'text-red-500 bg-red-100 dark:bg-red-900/30';
      case 'high':
        return 'text-orange-500 bg-orange-100 dark:bg-orange-900/30';
      case 'medium':
        return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30';
      case 'low':
        return 'text-green-500 bg-green-100 dark:bg-green-900/30';
      default:
        return 'text-gray-500 bg-gray-100 dark:bg-gray-700';
    }
  };

  // Get severity badge
  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'critical':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Critical</span>;
      case 'high':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">High</span>;
      case 'medium':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Medium</span>;
      case 'low':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Low</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Unknown</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Security Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Monitor and manage security events across the platform
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Events</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.eventTypeStats.reduce((sum, item) => sum + item.count, 0)}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FiShield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Successful Logins</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.loginStats.successful}</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <FiCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Failed Logins</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.loginStats.failed}</p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <FiXCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.loginStats.uniqueUsers}</p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <FiActivity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex flex-wrap">
              <button
                onClick={() => setActiveTab('events')}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors duration-200 ${
                  activeTab === 'events'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Security Events
              </button>
              <button
                onClick={() => setActiveTab('logins')}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors duration-200 ${
                  activeTab === 'logins'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Login Activities
              </button>
              <button
                onClick={() => setActiveTab('suspicious')}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors duration-200 ${
                  activeTab === 'suspicious'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Suspicious Activity
              </button>
            </nav>
          </div>

          {/* Search and Filters */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex flex-wrap gap-3">
                {activeTab === 'events' && (
                  <>
                    <select
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={eventTypeFilter}
                      onChange={(e) => setEventTypeFilter(e.target.value)}
                    >
                      <option value="">All Event Types</option>
                      <option value="suspicious_login">Suspicious Login</option>
                      <option value="failed_login">Failed Login</option>
                      <option value="successful_login">Successful Login</option>
                      <option value="password_reset">Password Reset</option>
                      <option value="email_verification">Email Verification</option>
                      <option value="2fa_enabled">2FA Enabled</option>
                      <option value="2fa_disabled">2FA Disabled</option>
                      <option value="suspicious_file_upload">Suspicious File Upload</option>
                      <option value="malicious_content_detected">Malicious Content</option>
                    </select>
                    
                    <select
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value)}
                    >
                      <option value="">All Severities</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <AiOutlineLoading3Quarters className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : activeTab === 'events' ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Event
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        User
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        IP Address
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Severity
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {securityEvents.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                          No security events found
                        </td>
                      </tr>
                    ) : (
                      securityEvents.map((event) => (
                        <tr key={event._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {event.eventType}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {event.description}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {event.userId ? (
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <img
                                    className="h-10 w-10 rounded-full object-cover"
                                    src={event.userId.avatar || '/default-avatar.png'}
                                    alt=""
                                  />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {event.userId.username}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {event.userId.email}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500 dark:text-gray-400">System</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {event.ipAddress}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getSeverityBadge(event.severity)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(event.createdAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : activeTab === 'logins' ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        User
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        IP Address
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Device
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Location
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {loginActivities.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                          No login activities found
                        </td>
                      </tr>
                    ) : (
                      loginActivities.map((activity) => (
                        <tr key={activity._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            {activity.user ? (
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <img
                                    className="h-10 w-10 rounded-full object-cover"
                                    src={activity.user.avatar || '/default-avatar.png'}
                                    alt=""
                                  />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {activity.user.username}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {activity.user.email}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500 dark:text-gray-400">Unknown User</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {activity.ipAddress}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            <div className="flex items-center">
                              <span className="text-xl mr-2">{getDeviceIcon(activity.deviceType)}</span>
                              <span>{activity.deviceType}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {activity.location?.city || activity.location?.country || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {activity.success ? (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Success
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                Failed
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(activity.timestamp)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-6">
                {/* High Severity Events */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">High Severity Events</h3>
                  {suspiciousActivities.highSeverityEvents?.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <FiCheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No high severity events detected</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {suspiciousActivities.highSeverityEvents?.map((event) => (
                        <div
                          key={event._id}
                          className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <div className="text-2xl">
                                {getDeviceIcon(event.details?.deviceType)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {event.eventType}
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(event.severity)}`}>
                                    {event.severity?.toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                  {event.description}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {event.ipAddress} • {formatDate(event.createdAt)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <FiAlertTriangle className="w-5 h-5 text-red-500" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Failed Logins */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Failed Logins</h3>
                  {suspiciousActivities.failedLogins?.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <FiCheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No failed login attempts detected</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {suspiciousActivities.failedLogins?.map((activity) => (
                        <div
                          key={activity._id}
                          className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl"
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
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor('high')}`}>
                                    FAILED
                                  </span>
                                </div>
                                {activity.user && (
                                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                    User: {activity.user.username} ({activity.user.email})
                                  </p>
                                )}
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {activity.location?.city || activity.location?.country || 'Unknown location'} • {formatDate(activity.timestamp)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <FiXCircle className="w-5 h-5 text-orange-500" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Users with Multiple Failed Logins */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Users with Multiple Failed Login Attempts</h3>
                  {suspiciousActivities.usersWithMultipleFailedLogins?.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <FiCheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No users with multiple failed login attempts</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              User
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Failed Attempts
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Last Attempt
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {suspiciousActivities.usersWithMultipleFailedLogins?.map((item) => (
                            <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                {item.user ? (
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10">
                                      <img
                                        className="h-10 w-10 rounded-full object-cover"
                                        src={item.user.avatar || '/default-avatar.png'}
                                        alt=""
                                      />
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        {item.user.username}
                                      </div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {item.user.email}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-500 dark:text-gray-400">Unknown User</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {item.count}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(item.lastAttempt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSecurity;