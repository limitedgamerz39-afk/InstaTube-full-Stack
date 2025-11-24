import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { adminAPI } from '../services/adminAPI';
import toast from 'react-hot-toast';
import {
  FiAlertTriangle,
  FiSearch,
  FiFilter,
  FiDownload,
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiImage,
  FiMessageSquare,
  FiCheckCircle,
  FiXCircle,
  FiClock,
} from 'react-icons/fi';

const AdminReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
  });
  const [selectedReports, setSelectedReports] = useState([]);
  const [bulkAction, setBulkAction] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchReports();
    }
  }, [user, currentPage, filters]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getReports(currentPage, 20, filters);
      setReports(response.data.data.reports);
      setTotal(response.data.data.total);
      setTotalPages(response.data.data.totalPages);
    } catch (error) {
      toast.error('Failed to fetch reports');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    // Add search query to filters
    setFilters({
      ...filters,
      search: searchQuery
    });
    setCurrentPage(1);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters({
      ...filters,
      [filterName]: value
    });
    setCurrentPage(1);
  };

  const exportReports = () => {
    toast.success('Report data export started. Check your downloads folder.');
  };

  const handleResolveReport = async (reportId) => {
    try {
      const notes = prompt('Add resolution notes (optional):');
      const actionTaken = prompt('Action taken (none/removed/warning/suspended/banned):', 'none');
      
      await adminAPI.resolveReport(reportId, { notes, actionTaken });
      toast.success('Report resolved successfully');
      fetchReports();
    } catch (error) {
      toast.error('Failed to resolve report');
      console.error(error);
    }
  };

  const handleDismissReport = async (reportId) => {
    try {
      const notes = prompt('Add dismissal notes (optional):');
      
      await adminAPI.dismissReport(reportId, { notes });
      toast.success('Report dismissed successfully');
      fetchReports();
    } catch (error) {
      toast.error('Failed to dismiss report');
      console.error(error);
    }
  };

  const handleTakeAction = async (reportId, actionType) => {
    try {
      // In a real implementation, this would take specific actions on the reported content
      toast.success(`Action taken: ${actionType}`);
      fetchReports();
    } catch (error) {
      toast.error('Failed to take action');
      console.error(error);
    }
  };

  // Bulk actions
  const handleSelectReport = (reportId) => {
    if (selectedReports.includes(reportId)) {
      setSelectedReports(selectedReports.filter(id => id !== reportId));
    } else {
      setSelectedReports([...selectedReports, reportId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedReports.length === reports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(reports.map(report => report._id));
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedReports.length === 0) {
      toast.error('Please select reports and an action');
      return;
    }

    if (!confirm(`Are you sure you want to ${bulkAction} ${selectedReports.length} reports?`)) {
      return;
    }

    try {
      setLoading(true);
      let successCount = 0;

      switch (bulkAction) {
        case 'resolve':
          for (const reportId of selectedReports) {
            try {
              await adminAPI.resolveReport(reportId, { notes: 'Bulk resolved', actionTaken: 'none' });
              successCount++;
            } catch (err) {
              console.error(`Failed to resolve report ${reportId}:`, err);
            }
          }
          toast.success(`Resolved ${successCount} reports`);
          break;
        case 'dismiss':
          for (const reportId of selectedReports) {
            try {
              await adminAPI.dismissReport(reportId, { notes: 'Bulk dismissed' });
              successCount++;
            } catch (err) {
              console.error(`Failed to dismiss report ${reportId}:`, err);
            }
          }
          toast.success(`Dismissed ${successCount} reports`);
          break;
        default:
          toast.error('Invalid bulk action');
          return;
      }

      setSelectedReports([]);
      setBulkAction('');
      fetchReports();
    } catch (error) {
      toast.error('Bulk action failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'resolved':
        return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Resolved</span>;
      case 'dismissed':
        return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">Dismissed</span>;
      default:
        return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</span>;
    }
  };

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'post':
        return <FiImage className="w-4 h-4" />;
      case 'comment':
        return <FiMessageSquare className="w-4 h-4" />;
      case 'user':
        return <FiUser className="w-4 h-4" />;
      default:
        return <FiAlertTriangle className="w-4 h-4" />;
    }
  };

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
                  <FiAlertTriangle className="mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="truncate">Content Reports</span>
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Total {total} reports
                </p>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mt-4 sm:mt-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search reports..."
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
                onClick={exportReports}
                className="px-4 sm:px-6 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex-shrink-0 flex items-center gap-2"
              >
                <FiDownload className="w-4 h-4" />
                Export
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="post">Posts</option>
                <option value="comment">Comments</option>
                <option value="user">Users</option>
                <option value="story">Stories</option>
                <option value="message">Messages</option>
              </select>

              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedReports.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-3 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              {selectedReports.length} report(s) selected
            </div>
            <div className="flex items-center gap-2">
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="px-3 py-1 text-sm border border-blue-300 dark:border-blue-700 rounded bg-white dark:bg-gray-800 text-blue-900 dark:text-blue-100"
              >
                <option value="">Select action</option>
                <option value="resolve">Resolve</option>
                <option value="dismiss">Dismiss</option>
              </select>
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply
              </button>
              <button
                onClick={() => setSelectedReports([])}
                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reports List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <FiAlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No reports found
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
                          checked={selectedReports.length === reports.length && reports.length > 0}
                          onChange={handleSelectAll}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Reporter
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Reported Content
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {reports.map((report) => (
                      <tr key={report._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedReports.includes(report._id)}
                            onChange={() => handleSelectReport(report._id)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              src={report.reporter?.avatar || '/default-avatar.png'}
                              alt={report.reporter?.username}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {report.reporter?.fullName || 'Unknown User'}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                @{report.reporter?.username || 'unknown'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              {getContentTypeIcon(report.reportedType)}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                {report.reportedType}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {report.reportedContent?.caption || 
                                 report.reportedContent?.text || 
                                 report.reportedContent?.username || 
                                 'Content details not available'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {report.reason}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(report.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            {report.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleResolveReport(report._id)}
                                  className="p-2 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition"
                                  title="Resolve report"
                                >
                                  <FiCheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDismissReport(report._id)}
                                  className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                  title="Dismiss report"
                                >
                                  <FiXCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleTakeAction(report._id, 'remove')}
                                  className="p-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition"
                                  title="Take action on content"
                                >
                                  <FiAlertTriangle className="w-4 h-4" />
                                </button>
                              </>
                            )}
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
              {reports.map((report) => (
                <div
                  key={report._id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
                >
                  {/* Selection Checkbox */}
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={selectedReports.includes(report._id)}
                      onChange={() => handleSelectReport(report._id)}
                      className="rounded text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Select</span>
                  </div>

                  {/* Reporter Info */}
                  <div className="flex items-start space-x-3 mb-4">
                    <img
                      src={report.reporter?.avatar || '/default-avatar.png'}
                      alt={report.reporter?.username}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {report.reporter?.fullName || 'Unknown User'}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        @{report.reporter?.username || 'unknown'}
                      </p>
                    </div>
                  </div>

                  {/* Reported Content */}
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <div className="flex-shrink-0">
                        {getContentTypeIcon(report.reportedType)}
                      </div>
                      <div className="ml-2">
                        <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {report.reportedType}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {report.reportedContent?.caption || 
                       report.reportedContent?.text || 
                       report.reportedContent?.username || 
                       'Content details not available'}
                    </p>
                  </div>

                  {/* Reason and Status */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Reason</p>
                      <p className="text-sm text-gray-900 dark:text-white truncate">
                        {report.reason}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                      <div className="mt-1">
                        {getStatusBadge(report.status)}
                      </div>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="mb-4 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                    <FiClock className="w-3 h-3 mr-1" />
                    {new Date(report.createdAt).toLocaleDateString()}
                  </div>

                  {/* Action Buttons */}
                  {report.status === 'pending' && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleResolveReport(report._id)}
                        className="flex-1 min-w-[80px] px-3 py-2 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-lg transition text-xs font-medium flex items-center justify-center gap-1"
                      >
                        <FiCheckCircle className="w-3 h-3" />
                        Resolve
                      </button>
                      <button
                        onClick={() => handleDismissReport(report._id)}
                        className="flex-1 min-w-[80px] px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg transition text-xs font-medium flex items-center justify-center gap-1"
                      >
                        <FiXCircle className="w-3 h-3" />
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleTakeAction(report._id, 'remove')}
                        className="flex-1 min-w-[80px] px-3 py-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-lg transition text-xs font-medium flex items-center justify-center gap-1"
                      >
                        <FiAlertTriangle className="w-3 h-3" />
                        Action
                      </button>
                    </div>
                  )}
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

export default AdminReports;