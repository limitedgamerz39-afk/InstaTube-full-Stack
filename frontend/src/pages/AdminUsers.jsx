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
} from 'react-icons/fi';

const AdminUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [roleRequests, setRoleRequests] = useState([]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
      fetchRoleRequests();
    }
  }, [user, currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllUsers(currentPage, 20);
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

  const handleChangeRole = async (userId, currentRole, username) => {
    const roles = ['user', 'creator', 'business', 'admin'];
    const newRole = prompt(
      `Change role for @${username}\nCurrent role: ${currentRole}\nEnter new role (user/creator/business/admin):`,
      currentRole
    );

    if (!newRole || !roles.includes(newRole.toLowerCase()) || newRole === currentRole) {
      return;
    }

    try {
      await adminAPI.changeUserRole(userId, newRole.toLowerCase());
      toast.success(`Role updated to ${newRole} for @${username}`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to change user role');
      console.error(error);
    }
  };

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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

          {/* Search Bar */}
          <div className="mt-4 sm:mt-6">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 sm:px-6 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex-shrink-0"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Role Requests Panel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Role Upgrade Requests</h3>
            <span className="text-sm text-gray-500">{roleRequests.length} pending</span>
          </div>
          {roleRequests.length === 0 ? (
            <p className="text-sm text-gray-500">No pending requests</p>
          ) : (
            <div className="space-y-3">
              {roleRequests.map((u) => (
                <div key={u._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={u.avatar} alt={u.username} className="w-8 h-8 rounded-full" />
                    <div>
                      <p className="text-sm font-semibold">@{u.username}</p>
                      {u.roleUpgradeReason && (
                        <p className="text-xs text-gray-500">Reason: {u.roleUpgradeReason}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApproveRequest(u._id)} className="px-3 py-1 bg-green-100 text-green-700 rounded">Approve</button>
                    <button onClick={() => handleDeclineRequest(u._id)} className="px-3 py-1 bg-red-100 text-red-700 rounded">Decline</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Email
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
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                @{userData.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {userData.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              userData.role === 'admin'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : userData.role === 'creator'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                : userData.role === 'business'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }`}
                          >
                            {userData.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            <div>Posts: {userData.posts?.length || 0}</div>
                            <div>Followers: {userData.followers?.length || 0}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {userData.isBanned ? (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              Banned
                            </span>
                          ) : (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
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
                            <button
                              onClick={() => handleChangeRole(userData._id, userData.role, userData.username)}
                              className="p-2 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition"
                              title="Change role"
                            >
                              <FiShield className="w-4 h-4" />
                            </button>
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
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        @{userData.username}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                        {userData.email}
                      </p>
                    </div>
                  </div>

                  {/* Stats and Status */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Role</p>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full ${
                          userData.role === 'admin'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : userData.role === 'creator'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            : userData.role === 'business'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                        }`}
                      >
                        {userData.role}
                      </span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full ${
                          userData.isBanned
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}
                      >
                        {userData.isBanned ? 'Banned' : 'Active'}
                      </span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Posts</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {userData.posts?.length || 0}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Followers</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {userData.followers?.length || 0}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
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
                    <button
                      onClick={() => handleChangeRole(userData._id, userData.role, userData.username)}
                      className="flex-1 min-w-[80px] px-3 py-2 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 rounded-lg transition text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <FiShield className="w-3 h-3" />
                      Role
                    </button>
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
    </div>
  );
};

export default AdminUsers;
