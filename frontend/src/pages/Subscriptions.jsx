import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { userAPI } from '../services/api';

const Subscriptions = () => {
  const { user } = useAuth();
  const [subscribers, setSubscribers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('subscribers'); // subscribers, subscriptions

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Validate user before making API calls
        if (!user || !user.username) {
          throw new Error('User data is incomplete');
        }
        
        // Store username in a local variable to avoid issues with changing user state
        const currentUsername = user.username;
        
        // Fetch user's subscribers (people who subscribe to the current user)
        const subscribersResponse = await userAPI.getUserSubscribers(currentUsername);
        setSubscribers(Array.isArray(subscribersResponse.data.data) ? subscribersResponse.data.data : []);
        
        // Fetch user's subscriptions (people the current user subscribes to)
        const subscriptionsResponse = await userAPI.getUserSubscriptions(currentUsername);
        setSubscriptions(Array.isArray(subscriptionsResponse.data.data) ? subscriptionsResponse.data.data : []);
      } catch (err) {
        console.error('Error fetching subscription data:', err);
        setError('Failed to load subscription data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (user && user.username) {
      fetchData();
    } else {
      // If user data is not available, set loading to false and show appropriate message
      setLoading(false);
    }
  }, [user]);

  // Reset data when user changes or becomes invalid
  useEffect(() => {
    if (!user || !user.username) {
      setSubscribers([]);
      setSubscriptions([]);
    }
  }, [user]);

  const handleSubscribe = async (userId) => {
    try {
      const response = await userAPI.followUser(userId);
      const { isSubscribed } = response.data;
      
      // Update the UI optimistically
      if (isSubscribed) {
        // User subscribed
        setSubscribers(prev => prev.map(sub => 
          sub._id === userId ? {...sub, isSubscribed: true} : sub
        ));
        setSubscriptions(prev => {
          const existing = prev.find(sub => sub._id === userId);
          if (existing) {
            return prev;
          }
          return [...prev, {_id: userId, isSubscribed: true}];
        });
      } else {
        // User unsubscribed
        setSubscribers(prev => prev.map(sub => 
          sub._id === userId ? {...sub, isSubscribed: false} : sub
        ));
        setSubscriptions(prev => prev.filter(sub => sub._id !== userId));
      }
    } catch (err) {
      console.error('Error toggling subscription:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="flex space-x-4 mb-6">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">Error</h2>
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Subscriptions</h1>
        {!user || !user.username ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Authentication Required</h2>
            <p className="text-yellow-700 dark:text-yellow-300">Please log in to view subscription data.</p>
          </div>
        ) : null}
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab('subscribers')}
            className={`py-3 px-6 font-medium text-sm rounded-t-lg ${
              activeTab === 'subscribers'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Your Subscribers ({Array.isArray(subscribers) ? subscribers.length : 0})
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`py-3 px-6 font-medium text-sm rounded-t-lg ${
              activeTab === 'subscriptions'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Your Subscriptions ({Array.isArray(subscriptions) ? subscriptions.length : 0})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'subscribers' && (
          <div>
            {!Array.isArray(subscribers) || subscribers.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  You don't have any subscribers yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subscribers.map((subscriber) => (
                  <div 
                    key={subscriber._id} 
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center space-x-4"
                  >
                    <img 
                      src={subscriber.avatar || '/default-avatar.png'} 
                      alt={subscriber.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {subscriber.fullName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        @{subscriber.username}
                      </p>
                    </div>
                    <button
                      onClick={() => handleSubscribe(subscriber._id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium ${
                        subscriber.isSubscribed
                          ? 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
                          : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                      }`}
                    >
                      {subscriber.isSubscribed ? 'Subscribed' : 'Subscribe'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div>
            {!Array.isArray(subscriptions) || subscriptions.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  You haven't subscribed to anyone yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subscriptions.map((subscription) => (
                  <div 
                    key={subscription._id} 
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center space-x-4"
                  >
                    <img 
                      src={subscription.avatar || '/default-avatar.png'} 
                      alt={subscription.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {subscription.fullName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        @{subscription.username}
                      </p>
                    </div>
                    <button
                      onClick={() => handleSubscribe(subscription._id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium ${
                        subscription.isSubscribed
                          ? 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
                          : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                      }`}
                    >
                      {subscription.isSubscribed ? 'Subscribed' : 'Subscribe'}
                    </button>
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

export default Subscriptions;