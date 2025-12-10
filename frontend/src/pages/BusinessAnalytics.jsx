import React from 'react';
import { useAuth } from '../context/AuthContext';

const BusinessAnalytics = () => {
  const { user } = useAuth();

  // Check if user has proper role
  const hasAccess = user?.role === 'business' || user?.role === 'admin';
  
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You need to be a business user or admin to access business analytics.
          </p>
          <button 
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Business Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track your business performance and customer engagement
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg mr-4">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">$12,450.75</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg mr-4">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Products Sold</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">1,248</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg mr-4">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Customers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">3,421</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg mr-4">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">4.8%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Revenue Overview</h2>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg">7D</button>
                <button className="px-3 py-1 text-sm bg-purple-600 text-white rounded-lg">1M</button>
                <button className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg">3M</button>
                <button className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg">1Y</button>
              </div>
            </div>
            <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">Revenue chart visualization would appear here</p>
            </div>
          </div>

          {/* Customer Engagement */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Customer Engagement</h2>
            <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">Engagement chart visualization would appear here</p>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Top Selling Products</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Product</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Category</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Sales</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Revenue</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Growth</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-3 px-4 text-gray-900 dark:text-white">Premium Headphones</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Electronics</td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">342</td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">$17,100</td>
                  <td className="py-3 px-4 text-green-600 font-medium">+12.4%</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-3 px-4 text-gray-900 dark:text-white">Wireless Charger</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Accessories</td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">298</td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">$5,960</td>
                  <td className="py-3 px-4 text-green-600 font-medium">+8.2%</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-3 px-4 text-gray-900 dark:text-white">Smart Watch</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Wearables</td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">187</td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">$13,090</td>
                  <td className="py-3 px-4 text-red-600 font-medium">-2.1%</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-3 px-4 text-gray-900 dark:text-white">Bluetooth Speaker</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Audio</td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">156</td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">$4,680</td>
                  <td className="py-3 px-4 text-green-600 font-medium">+5.7%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Recent Orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Order ID</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Customer</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Amount</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-3 px-4 text-gray-900 dark:text-white">#ORD-7842</td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">John Smith</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Nov 15, 2023</td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">$245.99</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs">Delivered</span>
                  </td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-3 px-4 text-gray-900 dark:text-white">#ORD-7841</td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">Sarah Johnson</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Nov 14, 2023</td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">$129.50</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">Processing</span>
                  </td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-3 px-4 text-gray-900 dark:text-white">#ORD-7840</td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">Michael Brown</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Nov 14, 2023</td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">$87.25</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs">Delivered</span>
                  </td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-3 px-4 text-gray-900 dark:text-white">#ORD-7839</td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">Emily Davis</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Nov 13, 2023</td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">$312.75</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-xs">Shipped</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessAnalytics;