import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingBag, FiBarChart2, FiSettings, FiUsers, FiDollarSign } from 'react-icons/fi';
import { businessAPI } from '../services/businessAPI';
import toast from 'react-hot-toast';

const BusinessDashboard = () => {
  const [businessProfile, setBusinessProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, analyticsRes, productsRes] = await Promise.all([
          businessAPI.getBusinessProfile(),
          businessAPI.getBusinessAnalytics(),
          businessAPI.getBusinessProducts(),
        ]);

        setBusinessProfile(profileRes.data.data);
        setAnalytics(analyticsRes.data.data);
        setProducts(productsRes.data);
      } catch (error) {
        toast.error('Failed to load business data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading business dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Business Dashboard</h1>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                Manage your business profile and track performance
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                to="/business/products"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition flex items-center gap-2"
              >
                <FiShoppingBag className="w-4 h-4" />
                <span>Products</span>
              </Link>
              <Link
                to="/business/analytics"
                className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-dark transition flex items-center gap-2"
              >
                <FiBarChart2 className="w-4 h-4" />
                <span>Analytics</span>
              </Link>
              <Link
                to="/business/profile"
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center gap-2"
              >
                <FiSettings className="w-4 h-4" />
                <span>Profile Settings</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FiShoppingBag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Products</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics?.overview?.totalProducts || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <FiDollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${analytics?.overview?.totalRevenue?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <FiBarChart2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${analytics?.overview?.totalSales?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <FiUsers className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Products</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Array.isArray(products) ? products.filter(p => p.isActive).length : 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Monthly Sales Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Sales</h3>
            <div className="h-64">
              {analytics?.monthlySales && Object.keys(analytics.monthlySales).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(analytics.monthlySales)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .slice(0, 6)
                    .map(([month, sales]) => (
                      <div key={month} className="flex items-center">
                        <div className="w-20 text-sm text-gray-600 dark:text-gray-400">{month}</div>
                        <div className="flex-1 ml-2">
                          <div
                            className="h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded"
                            style={{ width: `${Math.min((sales / (analytics.overview?.totalSales || 1)) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <div className="w-20 text-right text-sm font-medium text-gray-900 dark:text-white">
                          ${sales.toFixed(2)}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  No sales data available
                </div>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Selling Products</h3>
            <div className="h-64 overflow-y-auto">
              {analytics?.productSales && Object.keys(analytics.productSales).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(analytics.productSales)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
                    .map(([productName, sales]) => (
                      <div key={productName} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {productName}
                          </p>
                        </div>
                        <div className="ml-4 text-sm font-medium text-gray-900 dark:text-white">
                          ${sales.toFixed(2)}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  No product sales data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Products */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Products</h3>
            <Link
              to="/shopping/create"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition text-sm"
            >
              Add Product
            </Link>
          </div>
          
          {Array.isArray(products) && products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.slice(0, 6).map((product) => (
                <div key={product._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0].url}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <FiShoppingBag className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="ml-4 flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white line-clamp-1">
                        {product.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        ${product.price.toFixed(2)}
                      </p>
                      <div className="flex items-center mt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FiShoppingBag className="w-12 h-12 text-gray-400 mx-auto" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No products yet</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Get started by creating your first product.
              </p>
              <Link
                to="/shopping/create"
                className="mt-4 inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
              >
                Create Product
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;