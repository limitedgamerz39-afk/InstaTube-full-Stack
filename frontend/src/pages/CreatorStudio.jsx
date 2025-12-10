import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { FiSettings, FiBarChart2, FiVideo, FiUpload, FiDollarSign, FiHeart, FiMessageSquare, FiShare2, FiTrendingUp } from 'react-icons/fi';

const CreatorStudio = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Check if user has creator role
  if (user?.role !== 'creator' && user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md">
          <FiVideo className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500" />
          <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">Creator Access Required</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            You need to be a creator to access this page.
          </p>
          <Link 
            to="/settings" 
            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upgrade to Creator
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Creator Studio</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your content, analytics, and monetization
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('content')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'content'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Content
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('earnings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'earnings'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Earnings
              </button>
              <button
                onClick={() => setActiveTab('monetization')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'monetization'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Monetization
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
                  <div className="flex items-center">
                    <FiVideo className="h-8 w-8" />
                    <h3 className="ml-3 text-lg font-medium">Total Views</h3>
                  </div>
                  <p className="mt-2 text-3xl font-bold">12.5K</p>
                  <p className="mt-1 text-blue-100">+12% from last month</p>
                </div>
                
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
                  <div className="flex items-center">
                    <FiDollarSign className="h-8 w-8" />
                    <h3 className="ml-3 text-lg font-medium">Earnings</h3>
                  </div>
                  <p className="mt-2 text-3xl font-bold">$1,248</p>
                  <p className="mt-1 text-green-100">+8% from last month</p>
                </div>
                
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-6 text-white">
                  <div className="flex items-center">
                    <FiBarChart2 className="h-8 w-8" />
                    <h3 className="ml-3 text-lg font-medium">Subscribers</h3>
                  </div>
                  <p className="mt-2 text-3xl font-bold">3.2K</p>
                  <p className="mt-1 text-purple-100">+5% from last month</p>
                </div>
              </div>
            )}

            {activeTab === 'content' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Content</h2>
                  <Link 
                    to="/upload" 
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FiUpload className="mr-2" />
                    Upload New
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div key={item} className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <div className="bg-gray-200 dark:bg-gray-600 h-48 w-full"></div>
                      <div className="p-4">
                        <h3 className="font-medium text-gray-900 dark:text-white">Video Title {item}</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">2.4K views • 2 days ago</p>
                        <div className="mt-3 flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Likes: 142</span>
                          <span className="text-gray-500 dark:text-gray-400">Comments: 24</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Performance Analytics</h2>
                
                {/* Analytics Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg mr-4">
                        <FiBarChart2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Total Views</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">45.2K</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                      <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg mr-4">
                        <FiHeart className="w-6 h-6 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Total Likes</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">12.8K</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                      <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg mr-4">
                        <FiMessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Comments</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">3.4K</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                      <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg mr-4">
                        <FiShare2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Shares</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">1.2K</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Engagement Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Engagement Overview</h3>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg">7D</button>
                      <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg">1M</button>
                      <button className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg">3M</button>
                      <button className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg">1Y</button>
                    </div>
                  </div>
                  <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">Engagement chart visualization would appear here</p>
                  </div>
                </div>
                
                {/* Top Performing Content */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Top Performing Content</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Content</th>
                          <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Views</th>
                          <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Likes</th>
                          <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Comments</th>
                          <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Engagement Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <td className="py-3 px-4 text-gray-900 dark:text-white">How to Master React Hooks</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">12.5K</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">3.2K</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">420</td>
                          <td className="py-3 px-4 text-green-600 font-medium">8.7%</td>
                        </tr>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <td className="py-3 px-4 text-gray-900 dark:text-white">Building a Full-Stack App</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">9.8K</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">2.8K</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">310</td>
                          <td className="py-3 px-4 text-green-600 font-medium">7.2%</td>
                        </tr>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <td className="py-3 px-4 text-gray-900 dark:text-white">CSS Grid vs Flexbox</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">7.6K</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">1.9K</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">250</td>
                          <td className="py-3 px-4 text-green-600 font-medium">6.1%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'earnings' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Earnings Dashboard</h2>
                
                {/* Earnings Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                      <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg mr-4">
                        <FiDollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Total Earnings</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">$2,450.75</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg mr-4">
                        <FiTrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">This Month</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">$845.20</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                      <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg mr-4">
                        <FiBarChart2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Subscribers</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">1,248</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                      <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg mr-4">
                        <FiSettings className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Payout Status</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">Processing</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Earnings Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Earnings Overview</h3>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg">7D</button>
                      <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg">1M</button>
                      <button className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg">3M</button>
                      <button className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg">1Y</button>
                    </div>
                  </div>
                  <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">Earnings chart visualization would appear here</p>
                  </div>
                </div>
                
                {/* Recent Transactions */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Recent Transactions</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Date</th>
                          <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Description</th>
                          <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Type</th>
                          <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Amount</th>
                          <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <td className="py-3 px-4 text-gray-900 dark:text-white">Nov 15, 2023</td>
                          <td className="py-3 px-4 text-gray-900 dark:text-white">Video Ad Revenue</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Ad Revenue</td>
                          <td className="py-3 px-4 text-green-600 font-medium">+$125.50</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs">Completed</span>
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <td className="py-3 px-4 text-gray-900 dark:text-white">Nov 12, 2023</td>
                          <td className="py-3 px-4 text-gray-900 dark:text-white">Subscription Revenue</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Subscriptions</td>
                          <td className="py-3 px-4 text-green-600 font-medium">+$87.25</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs">Completed</span>
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <td className="py-3 px-4 text-gray-900 dark:text-white">Nov 10, 2023</td>
                          <td className="py-3 px-4 text-gray-900 dark:text-white">Sponsored Post</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Sponsorship</td>
                          <td className="py-3 px-4 text-green-600 font-medium">+$500.00</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs">Completed</span>
                          </td>
                        </tr>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <td className="py-3 px-4 text-gray-900 dark:text-white">Nov 5, 2023</td>
                          <td className="py-3 px-4 text-gray-900 dark:text-white">Video Ad Revenue</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Ad Revenue</td>
                          <td className="py-3 px-4 text-green-600 font-medium">+$98.75</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs">Completed</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'monetization' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Monetization</h2>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Ad Revenue</h3>
                      <p className="mt-1 text-gray-500 dark:text-gray-400">Earn money from ads on your videos</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">$1,248</p>
                      <p className="text-sm text-green-600 dark:text-green-400">+8% this month</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Channel Memberships</h3>
                        <p className="mt-1 text-gray-500 dark:text-gray-400">Recurring income from subscribers</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">$420</p>
                        <p className="text-sm text-green-600 dark:text-green-400">+3% this month</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Super Chat & Super Stickers</h3>
                        <p className="mt-1 text-gray-500 dark:text-gray-400">One-time payments from fans</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">$185</p>
                        <p className="text-sm text-green-600 dark:text-green-400">+12% this month</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorStudio;