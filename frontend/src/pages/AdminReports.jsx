import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { adminAPI } from '../services/adminAPI';
import toast from 'react-hot-toast';
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiFlag,
} from 'react-icons/fi';

const AdminReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getReports();
      setReports(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch reports');
      console.error(error);
    } finally {
      setLoading(false);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                to="/admin"
                className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <FiArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                  <FiFlag className="mr-2" />
                  Reported Content
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Review and manage reported content
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <FiAlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Reports Yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              All reported content will appear here. The reports feature is coming soon!
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            {/* Reports list will be displayed here when implemented */}
            <p className="p-6 text-gray-500 dark:text-gray-400 text-center">
              Reports feature will be available soon
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
