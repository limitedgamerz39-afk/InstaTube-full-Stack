import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import premiumAPI from '../services/premiumAPI';
import toast from 'react-hot-toast';
import { AiOutlineCheck, AiOutlineCrown, AiOutlinePlayCircle, AiOutlineDownload, AiOutlineThunderbolt } from 'react-icons/ai';

const Premium = () => {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  useEffect(() => {
    fetchPlans();
    fetchSubscriptionStatus();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await premiumAPI.getPlans();
      setPlans(response.data.data);
    } catch (error) {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await premiumAPI.getSubscriptionStatus();
      setSubscriptionStatus(response.data.data);
    } catch (error) {
      console.error('Failed to load subscription status');
    }
  };

  const handleSubscribe = async (planId) => {
    setSubscribing(true);
    try {
      await premiumAPI.subscribe(planId);
      toast.success('🎉 Welcome to Premium! Enjoy ad-free experience.');
      await refreshUser();
      await fetchSubscriptionStatus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to subscribe');
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your premium subscription?')) return;
    
    try {
      const response = await premiumAPI.cancelSubscription();
      toast.success(response.data.message);
      await fetchSubscriptionStatus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel subscription');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <AiOutlineCrown size={64} className="text-yellow-500" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            InstaTube Premium
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Unlock the best experience with Premium features
          </p>
        </div>

        {/* Current Status */}
        {user?.isPremium && subscriptionStatus && (
          <div className="max-w-2xl mx-auto mb-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">You are Premium</p>
                <p className="text-2xl font-bold capitalize">{subscriptionStatus.plan} Plan</p>
                <p className="text-sm mt-2">
                  {subscriptionStatus.expiresAt 
                    ? `Valid until ${new Date(subscriptionStatus.expiresAt).toLocaleDateString()}`
                    : 'Active'}
                </p>
              </div>
              <AiOutlineCrown size={48} className="opacity-75" />
            </div>
            <button
              onClick={handleCancelSubscription}
              className="mt-4 w-full bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition"
            >
              Cancel Subscription
            </button>
          </div>
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            {
              icon: <AiOutlineThunderbolt size={32} />,
              title: 'Ad-Free',
              description: 'Watch without interruptions',
              color: 'text-yellow-500',
            },
            {
              icon: <AiOutlinePlayCircle size={32} />,
              title: 'Background Play',
              description: 'Listen while using other apps',
              color: 'text-blue-500',
            },
            {
              icon: <AiOutlineDownload size={32} />,
              title: 'Offline Downloads',
              description: 'Save videos for offline viewing',
              color: 'text-green-500',
            },
            {
              icon: <AiOutlineCrown size={32} />,
              title: 'Premium Badge',
              description: 'Stand out with exclusive badge',
              color: 'text-purple-500',
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition transform hover:-translate-y-1"
            >
              <div className={`${feature.color} mb-3`}>{feature.icon}</div>
              <h3 className="text-lg font-bold mb-2 dark:text-white">{feature.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Pricing Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl ${
                plan.id === 'yearly' 
                  ? 'ring-4 ring-purple-500 transform scale-105' 
                  : ''
              } relative`}
            >
              {plan.id === 'yearly' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Best Value
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold dark:text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold dark:text-white">${plan.price}</span>
                  <span className="text-gray-500 ml-2">/{plan.id === 'monthly' ? 'month' : 'year'}</span>
                </div>
                {plan.savings && (
                  <p className="text-green-600 font-semibold mt-2">Save {plan.savings}%</p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <AiOutlineCheck className="text-green-500 mr-2 mt-1 flex-shrink-0" size={20} />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={subscribing || user?.isPremium}
                className={`w-full py-3 rounded-xl font-semibold transition ${
                  plan.id === 'yearly'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 dark:text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {user?.isPremium 
                  ? subscriptionStatus?.plan === plan.id 
                    ? 'Current Plan' 
                    : 'Switch Plan'
                  : subscribing 
                    ? 'Processing...' 
                    : 'Get Premium'
                }
              </button>
            </div>
          ))}
        </div>

        {/* Demo Note */}
        <div className="mt-12 max-w-2xl mx-auto bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Demo Mode:</strong> This is a demonstration of the premium subscription system. 
            No actual payment is processed. In production, integrate with Stripe, PayPal, or Razorpay for real payments.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Premium;
