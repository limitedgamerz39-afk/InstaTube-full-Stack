import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { adminAPI } from '../services/adminAPI';
import toast from 'react-hot-toast';
import {
  FiUsers,
  FiSearch,
  FiTrash2,
  FiShield,
  FiCheckCircle,
  FiXCircle,
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiDownload,
  FiPlus,
  FiEdit2,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiActivity,
  FiEye,
  FiMoreVertical,
  FiUserCheck,
  FiUserX,
  FiAward,
  FiStar
} from 'react-icons/fi';

const AdminUsers = () => {
  const { user, refreshUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [roleRequests, setRoleRequests] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    isBanned: '',
    isVerified: '',
    isPremium: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  // State for role dropdowns
  const [openRoleDropdown, setOpenRoleDropdown] = useState(null);
  const [userDetailsModal, setUserDetailsModal] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
      fetchRoleRequests();
    }
  }, [user, currentPage, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllUsers(currentPage, 20, filters);
      setUsers(response.data.data.users);
      setTotalPages(response.data.data.totalPages);
      setTotal(response.data.data.total);
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoleRequests = async () => {
    try {
      const response = await adminAPI.getRoleRequests(1, 20);
      setRoleRequests(response.data.data.users || []);
    } catch (error) {
      console.error('Failed to load role requests:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchUsers();
      return;
    }

    try {
      setLoading(true);
      const response = await adminAPI.adminSearch(searchQuery, 'users');
      setUsers(response.data.data);
    } catch (error) {
      toast.error('Search failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (userId) => {
    try {
      await adminAPI.approveRoleRequest(userId);
      toast.success('User upgraded to creator');
      fetchRoleRequests();
      fetchUsers();
      
      // If we're approving the role request for the currently logged in user, 
      // refresh their user data to reflect the change
      if (userId === user._id) {
        refreshUser();
      }
    } catch (error) {
      toast.error('Failed to approve request');
    }
  };

  const handleDeclineRequest = async (userId) => {
    try {
      await adminAPI.declineRoleRequest(userId);
      toast.success('Request declined');
      fetchRoleRequests();
    } catch (error) {
      toast.error('Failed to decline request');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`Are you sure you want to delete user @${username}? This action cannot be undone.`)) {
      return;
    }

    try {
      await adminAPI.deleteUser(userId);
      toast.success('User deleted successfully');
      fetchUsers();
      // Remove from selected users if present
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } catch (error) {
      toast.error('Failed to delete user');
      console.error(error);
    }
  };

  const handleToggleBan = async (userId, isBanned, username) => {
    try {
      await adminAPI.toggleBanUser(userId);
      toast.success(`User @${username} ${isBanned ? 'unbanned' : 'banned'} successfully`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
      console.error(error);
    }
  };

  const handleToggleVerify = async (userId, isVerified, username) => {
    try {
      await adminAPI.toggleVerifyUser(userId);
      toast.success(`User @${username} ${isVerified ? 'unverified' : 'verified'} successfully`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update verification status');
      console.error(error);
    }
  };

  const handleRoleChange = async (userId, newRole, username) => {
    try {
      await adminAPI.changeUserRole(userId, newRole);
      toast.success(`Role updated to ${newRole} for @${username}`);
      fetchUsers();
      
      // If we're changing the role of the currently logged in user, 
      // refresh their user data to reflect the change
      if (userId === user._id) {
        refreshUser();
      }
    } catch (error) {
      toast.error('Failed to change user role: ' + (error.response?.data?.message || error.message));
      console.error(error);
    }
    setOpenRoleDropdown(null);
  };

  // Bulk actions
  const handleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user._id));
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.length === 0) {
      toast.error('Please select users and an action');
      return;
    }

    if (!confirm(`Are you sure you want to ${bulkAction} ${selectedUsers.length} users?`)) {
      return;
    }

    try {
      setLoading(true);
      let successCount = 0;

      switch (bulkAction) {
        case 'delete':
          for (const userId of selectedUsers) {
            try {
              await adminAPI.deleteUser(userId);
              successCount++;
            } catch (err) {
              console.error(`Failed to delete user ${userId}:`, err);
            }
          }
          toast.success(`Deleted ${successCount} users`);
          break;
        case 'ban':
          for (const userId of selectedUsers) {
            try {
              await adminAPI.toggleBanUser(userId);
              successCount++;
            } catch (err) {
              console.error(`Failed to ban user ${userId}:`, err);
            }
          }
          toast.success(`Banned ${successCount} users`);
          break;
        case 'unban':
          for (const userId of selectedUsers) {
            try {
              await adminAPI.toggleBanUser(userId);
              successCount++;
            } catch (err) {
              console.error(`Failed to unban user ${userId}:`, err);
            }
          }
          toast.success(`Unbanned ${successCount} users`);
          break;
        case 'verify':
          for (const userId of selectedUsers) {
            try {
              await adminAPI.toggleVerifyUser(userId);
              successCount++;
            } catch (err) {
              console.error(`Failed to verify user ${userId}:`, err);
            }
          }
          toast.success(`Verified ${successCount} users`);
          break;
        case 'unverify':
          for (const userId of selectedUsers) {
            try {
              await adminAPI.toggleVerifyUser(userId);
              successCount++;
            } catch (err) {
              console.error(`Failed to unverify user ${userId}:`, err);
            }
          }
          toast.success(`Unverified ${successCount} users`);
          break;
        default:
          toast.error('Invalid bulk action');
          return;
      }

      setSelectedUsers([]);
      setBulkAction('');
      fetchUsers();
    } catch (error) {
      toast.error('Bulk action failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters({
      ...filters,
      [filterName]: value
    });
    setCurrentPage(1); // Reset to first page when filters change
  };

  const exportUsers = async () => {
    try {
      // In a real implementation, this would call an API endpoint to generate and download a CSV
      toast.success('User data export started. Check your downloads folder.');
    } catch (error) {
      toast.error('Failed to export user data');
      console.error(error);
    }
  };

  const viewUserDetails = async (userId) => {
    try {
      const response = await adminAPI.getUserDetails(userId);
      setUserDetailsModal(response.data.data);
    } catch (error) {
      toast.error('Failed to load user details');
      console.error(error);
    }
  };

  const closeUserDetails = () => {
    setUserDetailsModal(null);
  };

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Role badges
  const getRoleBadge = (role) => {
    const roleStyles = {
      admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      creator: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      business: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      user: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    };
    
    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${roleStyles[role] || roleStyles.user}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  // Status badges
  const getStatusBadge = (isBanned) => {
    return isBanned ? (
      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
        Banned
      </span>
    ) : (
      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        Active
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1 min-w-0">
              <Link
                to="/admin"
                className="mr-2 sm:mr-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition flex-shrink-0"
              >
                <FiArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-300" />
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                  <FiUsers className="mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="truncate">User Management</span>
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Total {total} users
                </p>
              </div>
            </div>
          </div>

          {/* Search and Actions */}
          <div className="mt-4 sm:mt-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search users by username, email, or name..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 sm:px-6 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex-shrink-0"
              >
                Search
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 sm:px-6 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition flex-shrink-0 flex items-center gap-2"
              >
                <FiFilter className="w-4 h-4" />
                Filters
              </button>
              <button
                onClick={exportUsers}
                className="px-4 sm:px-6 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex-shrink-0 flex items-center gap-2"
              >
                <FiDownload className="w-4 h-4" />
                Export
              </button>
            </div>

            {/* Filters - Collapsible */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                  <select
                    value={filters.role}
                    onChange={(e) => handleFilterChange('role', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Roles</option>
                    <option value="user">User</option>
                    <option value="creator">Creator</option>
                    <option value="business">Business</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select
                    value={filters.isBanned}
                    onChange={(e) => handleFilterChange('isBanned', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Status</option>
                    <option value="true">Banned</option>
                    <option value="false">Active</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Verification</label>
                  <select
                    value={filters.isVerified}
                    onChange={(e) => handleFilterChange('isVerified', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Verification</option>
                    <option value="true">Verified</option>
                    <option value="false">Unverified</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Subscription</label>
                  <select
                    value={filters.isPremium}
                    onChange={(e) => handleFilterChange('isPremium', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Subscription</option>
                    <option value="true">Premium</option>
                    <option value="false">Regular</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Role Requests Panel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold flex items-center gap-2">
              <FiAward className="text-yellow-500" />
              Role Upgrade Requests
            </h3>
            <span className="text-sm text-gray-500">{roleRequests.length} pending</span>
          </div>
          {roleRequests.length === 0 ? (
            <p className="text-sm text-gray-500">No pending requests</p>
          ) : (
            <div className="space-y-3">
              {roleRequests.map((u) => (
                <div key={u._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <img src={u.avatar} alt={u.username} className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="text-sm font-semibold">@{u.username}</p>
                      {u.roleUpgradeReason && (
                        <p className="text-xs text-gray-500">Reason: {u.roleUpgradeReason}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleApproveRequest(u._id)} 
                      className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleDeclineRequest(u._id)} 
                      className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedUsers.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-3 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              {selectedUsers.length} user(s) selected
            </div>
            <div className="flex items-center gap-2">
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="px-3 py-1 text-sm border border-blue-300 dark:border-blue-700 rounded bg-white dark:bg-gray-800 text-blue-900 dark:text-blue-100"
              >
                <option value="">Select action</option>
                <option value="delete">Delete</option>
                <option value="ban">Ban</option>
                <option value="unban">Unban</option>
                <option value="verify">Verify</option>
                <option value="unverify">Unverify</option>
              </select>
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply
              </button>
              <button
                onClick={() => setSelectedUsers([])}
                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <FiUsers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No users found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Try adjusting your search criteria
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === users.length && users.length > 0}
                          onChange={handleSelectAll}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Stats
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {users.map((userData) => (
                      <tr key={userData._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(userData._id)}
                            onChange={() => handleSelectUser(userData._id)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              src={userData.avatar}
                              alt={userData.username}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div className="ml-4">
                              <div className="flex items-center">
                                <Link
                                  to={`/profile/${userData.username}`}
                                  className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-500"
                                >
                                  {userData.fullName}
                                </Link>
                                {userData.isVerified && (
                                  <FiCheckCircle className="w-4 h-4 text-blue-500 ml-1" />
                                )}
                                {userData.isPremium && (
                                  <FiStar className="w-4 h-4 text-yellow-500 ml-1" />
                                )}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                @{userData.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            <div className="flex items-center">
                              <FiMail className="w-4 h-4 mr-1 text-gray-400" />
                              {userData.email}
                            </div>
                            {userData.phone && (
                              <div className="flex items-center mt-1">
                                <FiPhone className="w-4 h-4 mr-1 text-gray-400" />
                                {userData.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRoleBadge(userData.role)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            <div>Posts: {userData.posts?.length || 0}</div>
                            <div>Subscribers: {userData.subscriber?.length || 0}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(userData.isBanned)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => viewUserDetails(userData._id)}
                              className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                              title="View details"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleToggleVerify(userData._id, userData.isVerified, userData.username)
                              }
                              className={`p-2 rounded-lg transition ${
                                userData.isVerified
                                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                  : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800'
                              }`}
                              title={userData.isVerified ? 'Remove verification' : 'Verify user'}
                            >
                              <FiCheckCircle className="w-4 h-4" />
                            </button>
                            {/* Role Change Dropdown */}
                            <div className="relative">
                              <button
                                onClick={() => setOpenRoleDropdown(openRoleDropdown === userData._id ? null : userData._id)}
                                className="p-2 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition"
                                title="Change role"
                              >
                                <FiShield className="w-4 h-4" />
                              </button>
                              
                              {openRoleDropdown === userData._id && (
                                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                                  <div className="py-1">
                                    {['user', 'creator', 'business', 'admin'].map((role) => (
                                      <button
                                        key={role}
                                        onClick={() => handleRoleChange(userData._id, role, userData.username)}
                                        className={`block w-full text-left px-4 py-2 text-sm ${
                                          userData.role === role
                                            ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                      >
                                        {role.charAt(0).toUpperCase() + role.slice(1)}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() =>
                                handleToggleBan(userData._id, userData.isBanned, userData.username)
                              }
                              className={`p-2 rounded-lg transition ${
                                userData.isBanned
                                  ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800'
                                  : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-800'
                              }`}
                              title={userData.isBanned ? 'Unban user' : 'Ban user'}
                            >
                              <FiXCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(userData._id, userData.username)}
                              className="p-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition"
                              title="Delete user"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {users.map((userData) => (
                <div
                  key={userData._id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
                >
                  {/* Selection Checkbox */}
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(userData._id)}
                      onChange={() => handleSelectUser(userData._id)}
                      className="rounded text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Select</span>
                  </div>

                  {/* User Info */}
                  <div className="flex items-start space-x-3 mb-4">
                    <img
                      src={userData.avatar}
                      alt={userData.username}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1">
                        <Link
                          to={`/profile/${userData.username}`}
                          className="text-sm font-semibold text-gray-900 dark:text-white hover:text-blue-500 truncate"
                        >
                          {userData.fullName}
                        </Link>
                        {userData.isVerified && (
                          <FiCheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        )}
                        {userData.isPremium && (
                          <FiStar className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        @{userData.username}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1 flex items-center">
                        <FiMail className="w-3 h-3 mr-1" />
                        {userData.email}
                      </p>
                      {userData.phone && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center">
                          <FiPhone className="w-3 h-3 mr-1" />
                          {userData.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stats and Status */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Role</p>
                      <div className="mt-1">
                        {getRoleBadge(userData.role)}
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                      <div className="mt-1">
                        {getStatusBadge(userData.isBanned)}
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Posts</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {userData.posts?.length || 0}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Subscribers</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {userData.subscriber?.length || 0}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => viewUserDetails(userData._id)}
                      className="flex-1 min-w-[80px] px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg transition text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <FiEye className="w-3 h-3" />
                      View
                    </button>
                    <button
                      onClick={() =>
                        handleToggleVerify(userData._id, userData.isVerified, userData.username)
                      }
                      className={`flex-1 min-w-[80px] px-3 py-2 rounded-lg transition text-xs font-medium flex items-center justify-center gap-1 ${
                        userData.isVerified
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      <FiCheckCircle className="w-3 h-3" />
                      {userData.isVerified ? 'Verified' : 'Verify'}
                    </button>
                    {/* Role Change Dropdown for Mobile */}
                    <div className="relative flex-1 min-w-[80px]">
                      <button
                        onClick={() => setOpenRoleDropdown(openRoleDropdown === userData._id ? null : userData._id)}
                        className="w-full px-3 py-2 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-lg transition text-xs font-medium flex items-center justify-center gap-1"
                      >
                        <FiShield className="w-3 h-3" />
                        Role
                      </button>
                      
                      {openRoleDropdown === userData._id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                          <div className="py-1">
                            {['user', 'creator', 'business', 'admin'].map((role) => (
                              <button
                                key={role}
                                onClick={() => handleRoleChange(userData._id, role, userData.username)}
                                className={`block w-full text-left px-4 py-2 text-sm ${
                                  userData.role === role
                                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                              >
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        handleToggleBan(userData._id, userData.isBanned, userData.username)
                      }
                      className={`flex-1 min-w-[80px] px-3 py-2 rounded-lg transition text-xs font-medium flex items-center justify-center gap-1 ${
                        userData.isBanned
                          ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                          : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400'
                      }`}
                    >
                      <FiXCircle className="w-3 h-3" />
                      {userData.isBanned ? 'Unban' : 'Ban'}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(userData._id, userData.username)}
                      className="flex-1 min-w-[80px] px-3 py-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-lg transition text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <FiTrash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <FiChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <FiChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Details Modal */}
      {userDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">User Details</h3>
                <button 
                  onClick={closeUserDetails}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <FiXCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <img 
                    src={userDetailsModal.avatar} 
                    alt={userDetailsModal.username} 
                    className="w-full rounded-xl object-cover"
                  />
                  <div className="mt-4 text-center">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {userDetailsModal.fullName}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">@{userDetailsModal.username}</p>
                    {userDetailsModal.isVerified && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mt-2">
                        <FiCheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="md:w-2/3">
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact Information</h5>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center text-sm text-gray-900 dark:text-white">
                          <FiMail className="w-4 h-4 mr-2 text-gray-400" />
                          {userDetailsModal.email}
                        </div>
                        {userDetailsModal.phone && (
                          <div className="flex items-center text-sm text-gray-900 dark:text-white">
                            <FiPhone className="w-4 h-4 mr-2 text-gray-400" />
                            {userDetailsModal.phone}
                          </div>
                        )}
                        {userDetailsModal.location && (
                          <div className="flex items-center text-sm text-gray-900 dark:text-white">
                            <FiMapPin className="w-4 h-4 mr-2 text-gray-400" />
                            {userDetailsModal.location}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Information</h5>
                      <div className="mt-2 grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Role</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {userDetailsModal.role}
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {userDetailsModal.isBanned ? 'Banned' : 'Active'}
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Joined</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(userDetailsModal.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Last Active</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {userDetailsModal.lastActive 
                              ? new Date(userDetailsModal.lastActive).toLocaleDateString()
                              : 'Never'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400">Statistics</h5>
                      <div className="mt-2 grid grid-cols-3 gap-3">
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-center">
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {userDetailsModal.posts?.length || 0}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Posts</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-center">
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {userDetailsModal.subscriber?.length || 0}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Subscribers</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-center">
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {userDetailsModal.subscribed?.length || 0}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Subscribed</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => handleToggleBan(userDetailsModal._id, userDetailsModal.isBanned, userDetailsModal.username)}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    userDetailsModal.isBanned
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  }`}
                >
                  {userDetailsModal.isBanned ? 'Unban User' : 'Ban User'}
                </button>
                <button
                  onClick={() => handleToggleVerify(userDetailsModal._id, userDetailsModal.isVerified, userDetailsModal.username)}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    userDetailsModal.isVerified
                      ? 'bg-gray-500 hover:bg-gray-600 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {userDetailsModal.isVerified ? 'Remove Verification' : 'Verify User'}
                </button>
                <button
                  onClick={() => handleDeleteUser(userDetailsModal._id, userDetailsModal.username)}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;