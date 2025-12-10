import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import { FiSettings, FiShare2, FiMessageSquare, FiHeart, FiShield } from 'react-icons/fi';
import { BsGrid3X3, BsPlayBtn, BsCameraReels } from 'react-icons/bs';
import UserContentGrid from '../components/UserContentGrid';
import VerifiedBadge from '../components/VerifiedBadge';

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num;
};

const formatTimeAgo = (date) => {
  const now = new Date();
  const timeDifference = now - new Date(date);
  const seconds = Math.floor(timeDifference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);

  if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Helper function to get mutual subscribers
const getMutualSubscribers = (userSubscribers, currentUserSubscribed) => {
  if (!userSubscribers || !currentUserSubscribed) return [];
  
  const currentUserSubscribedIds = new Set(currentUserSubscribed.map(sub => sub._id));
  return userSubscribers.filter(subscriber => currentUserSubscribedIds.has(subscriber._id));
};

// Helper function to get mutual subscribers count
const getMutualSubscribersCount = (userSubscribers, currentUserSubscribed) => {
  return getMutualSubscribers(userSubscribers, currentUserSubscribed).length;
};

// Helper function to get subscriber badges
const getSubscriberBadges = (subscriberCount) => {
  const badges = [
    { name: 'New Creator', icon: '🌱', threshold: 1, earned: subscriberCount >= 1 },
    { name: 'Growing', icon: '📈', threshold: 100, earned: subscriberCount >= 100 },
    { name: 'Popular', icon: '🔥', threshold: 1000, earned: subscriberCount >= 1000 },
    { name: 'Star', icon: '⭐', threshold: 10000, earned: subscriberCount >= 10000 },
    { name: 'Legend', icon: '👑', threshold: 100000, earned: subscriberCount >= 100000 },
  ];
  
  return badges;
};

// Helper function to get content categories
const getContentCategories = (posts) => {
  const categoryCount = {};
  
  posts.forEach(post => {
    const category = post.category || 'post';
    categoryCount[category] = (categoryCount[category] || 0) + 1;
  });
  
  return Object.entries(categoryCount).map(([name, count]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    count
  }));
};

// Helper function to get top performing content
const getTopPerformingContent = (posts) => {
  // Sort posts by engagement (likes + comments + views)
  return [...posts].sort((a, b) => {
    const engagementA = (a.likes?.length || 0) + (a.comments?.length || 0) + (a.views || 0);
    const engagementB = (b.likes?.length || 0) + (b.comments?.length || 0) + (b.views || 0);
    return engagementB - engagementA;
  });
};

// Helper function to calculate engagement rate
const calculateEngagementRate = (user) => {
  if (!user.posts || user.posts.length === 0) return 0;
  
  const totalLikes = user.totalLikes || 0;
  const totalComments = user.commentsCount || 0;
  const totalSubscribers = user.subscriber?.length || 1;
  
  // Engagement rate formula: (likes + comments) / subscribers * 100
  const engagementRate = ((totalLikes + totalComments) / totalSubscribers) * 100;
  return engagementRate.toFixed(2);
};

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('videos');

  // Redirect if username is undefined
  useEffect(() => {
    if (!username || username === 'undefined') {
      navigate('/');
    }
  }, [username, navigate]);

  const { data: profileData, isLoading, isError } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => {
      // Additional validation to prevent API call with undefined username
      if (!username || username === 'undefined') {
        // Return a rejected promise to prevent the query from running
        return Promise.reject(new Error('Username is required'));
      }
      return userAPI.getProfile(username);
    },
    enabled: !!username && username !== 'undefined', // Only run query if username exists and is not 'undefined'
  });

  const user = profileData?.data?.data;
  const isOwnProfile = currentUser?._id === user?._id;
  const isSubscribed = user?.subscriber?.some(sub => sub._id === currentUser?._id);

  const subscribeMutation = useMutation({
    mutationFn: () => {
      if (!user?._id) {
        throw new Error('User ID is not available');
      }
      return userAPI.subscribe(user._id);
    },
    onMutate: async () => {
      if (!user?._id) return;
      
      await queryClient.cancelQueries({ queryKey: ['profile', username] });
      const previousProfile = queryClient.getQueryData(['profile', username]);
      
      queryClient.setQueryData(['profile', username], oldData => {
        if (!oldData || !user) return;
        const isCurrentlySubscribed = oldData.data.data.subscriber.some(sub => sub._id === currentUser?._id);
        const newSubscribers = isCurrentlySubscribed
          ? oldData.data.data.subscriber.filter(sub => sub._id !== currentUser?._id)
          : [...oldData.data.data.subscriber, { _id: currentUser._id, username: currentUser.username }];

        return {
          ...oldData,
          data: {
            ...oldData.data,
            data: {
              ...oldData.data.data,
              subscriber: newSubscribers,
            }
          }
        };
      });

      return { previousProfile };
    },
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(['profile', username], context.previousProfile);
      toast.error('An error occurred. Please try again.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', username] });
    },
    onSuccess: (data) => {
        toast.success(data.data.message);
    }
  });

  const handleSubscribe = () => {
    if (!currentUser) {
      toast.error('Please log in to subscribe.');
      navigate('/auth');
      return;
    }
    
    if (!user?._id) {
      toast.error('User information is not available.');
      return;
    }
    
    subscribeMutation.mutate();
  };

  const handleMessage = () => {
    if (!currentUser) {
      toast.error('Please log in to send messages.');
      navigate('/auth');
      return;
    }
    
    if (!user?._id) {
      toast.error('User information is not available.');
      return;
    }
    
    // Navigate to the chat page with this user
    navigate(`/messages/${user._id}`);
  };

  const tabs = [
    { id: 'videos', label: 'Videos', icon: BsPlayBtn, category: 'long' },
    { id: 'shorts', label: 'Shorts', icon: BsCameraReels, category: 'short' },
    { id: 'posts', label: 'Posts', icon: BsGrid3X3, category: 'all' },
    // Add other tabs like Playlists, Community when ready
  ];

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">Loading profile...</div>;
  }

  if (isError || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">Could not load profile.</div>;
  }
  
  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      {/* Banner */}
      <div className="h-32 md:h-48 bg-gradient-to-r from-purple-500 to-pink-500">
        {user.coverImage && (
          <img src={user.coverImage} alt="Cover" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Profile Info Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:-mt-20">
          <img 
            className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white dark:border-gray-900"
            src={user.avatar} 
            alt={user.username}
          />
          <div className="sm:ml-6 mt-4 sm:mt-0 text-center sm:text-left flex-grow">
            <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{user.fullName || user.username}</h1>
                {user.isVerified && <VerifiedBadge />}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">@{user.username}</p>
            <div className="flex items-center justify-center sm:justify-start space-x-4 mt-2 text-sm text-gray-600 dark:text-gray-300">
              <span><span className="font-bold dark:text-white">{formatNumber(user.subscriber?.length || 0)}</span> Subscribers</span>
              <span><span className="font-bold dark:text-white">{formatNumber(user.subscribed?.length || 0)}</span> Subscribed</span>
              <span><span className="font-bold dark:text-white">{formatNumber(user.posts?.length || 0)}</span> Posts</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-4 sm:mt-0">
            {isOwnProfile ? (
              <div className="flex space-x-2">
                <button onClick={() => navigate('/settings')} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-full font-semibold text-sm">Edit profile</button>
                <button className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full"><FiSettings/></button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <button
                    onClick={handleSubscribe}
                    disabled={subscribeMutation.isLoading}
                    className={`px-6 py-2 rounded-full font-semibold text-sm transition-colors ${
                        isSubscribed 
                        ? 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                        : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90'
                    }`}
                >
                  {isSubscribed ? 'Subscribed' : 'Subscribe'}
                </button>
                <button onClick={handleMessage} className="p-2.5 bg-gray-200 dark:bg-gray-700 rounded-full"><FiMessageSquare /></button>
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {user.bio && <p className="mt-6 text-sm max-w-2xl text-gray-700 dark:text-gray-300">{user.bio}</p>}
        
        {/* Social Links */}
        {(user.website || user.socialLinks) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {user.website && (
              <a 
                href={user.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="mr-1">🌐</span>
                Website
              </a>
            )}
            {user.socialLinks?.twitter && (
              <a 
                href={user.socialLinks.twitter} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="mr-1">🐦</span>
                Twitter
              </a>
            )}
            {user.socialLinks?.instagram && (
              <a 
                href={user.socialLinks.instagram} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="mr-1">📸</span>
                Instagram
              </a>
            )}
            {user.socialLinks?.youtube && (
              <a 
                href={user.socialLinks.youtube} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="mr-1">📺</span>
                YouTube
              </a>
            )}
            {user.socialLinks?.linkedin && (
              <a 
                href={user.socialLinks.linkedin} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="mr-1">💼</span>
                LinkedIn
              </a>
            )}
            {user.socialLinks?.facebook && (
              <a 
                href={user.socialLinks.facebook} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="mr-1">🇫</span>
                Facebook
              </a>
            )}
          </div>
        )}
        
        {/* Location */}
        {user.location && (
          <div className="mt-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
            <span className="mr-1">📍</span>
            <span>{user.location}</span>
          </div>
        )}
        
        {/* Join Date */}
        {user.createdAt && (
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Joined {formatDate(user.createdAt)}
          </div>
        )}
        
        {/* Interests */}
        {user.interests && user.interests.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {user.interests.slice(0, 6).map((interest, index) => (
                <span 
                  key={index} 
                  className="inline-block px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-xs"
                >
                  {interest}
                </span>
              ))}
              {user.interests.length > 6 && (
                <span className="inline-block px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs">
                  +{user.interests.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Profile Highlights */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg p-4 text-white text-center">
            <div className="text-2xl font-bold">{formatNumber(user.subscriber?.length || 0)}</div>
            <div className="text-sm">Subscribers</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg p-4 text-white text-center">
            <div className="text-2xl font-bold">{formatNumber(user.subscribed?.length || 0)}</div>
            <div className="text-sm">Subscribed</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg p-4 text-white text-center">
            <div className="text-2xl font-bold">{formatNumber(user.posts?.length || 0)}</div>
            <div className="text-sm">Posts</div>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg p-4 text-white text-center">
            <div className="text-2xl font-bold">{user.totalWatchTime || 0}</div>
            <div className="text-sm">Watch Time (min)</div>
          </div>
        </div>
        
        {/* Content Categories */}
        {user.posts && user.posts.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Content Categories</h3>
            <div className="flex flex-wrap gap-2">
              {getContentCategories(user.posts).map((category, index) => (
                <span 
                  key={index} 
                  className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 text-purple-800 dark:text-purple-200 rounded-full text-sm"
                >
                  {category.name}
                  <span className="ml-1 text-xs bg-white dark:bg-gray-700 rounded-full px-1.5 py-0.5">
                    {category.count}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Subscriber Growth Indicator */}
        {isOwnProfile && user.subscriber && user.subscriber.length > 0 && (
          <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Subscriber Growth</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {user.subscriber.length > 5 
                    ? `+${user.subscriber.length - 5} new this week` 
                    : 'Steady growth'}
                </p>
              </div>
              <div className="flex items-center">
                <span className="text-green-500 font-semibold mr-1">
                  {user.subscriber.length > 5 ? '↗' : '→'}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.subscriber.length > 5 ? '+25%' : '+5%'}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Subscriber Badges */}
        {user.subscriber && user.subscriber.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Subscriber Milestones</h3>
            <div className="flex flex-wrap gap-2">
              {getSubscriberBadges(user.subscriber.length).map((badge, index) => (
                <div 
                  key={index} 
                  className={`flex items-center px-3 py-1 rounded-full text-sm ${
                    badge.earned 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <span className="mr-1">{badge.icon}</span>
                  {badge.name}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Achievements */}
        {user.achievements && user.achievements.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Achievements</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {user.totalAchievementPoints || 0} points
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {user.achievements.slice(0, 8).map((achievement, index) => (
                <div 
                  key={index} 
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm flex items-center"
                >
                  <span className="mr-1">🏆</span>
                  {achievement.achievementId.replace(/_/g, ' ')}
                </div>
              ))}
              {user.achievements.length > 8 && (
                <div className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm">
                  +{user.achievements.length - 8} more
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Badges */}
        {user.badges && user.badges.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Badges</h3>
            <div className="flex flex-wrap gap-2">
              {user.badges.slice(0, 6).map((badge, index) => (
                <div 
                  key={index} 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm flex items-center"
                >
                  <span className="mr-1">🏅</span>
                  {badge.name}
                </div>
              ))}
              {user.badges.length > 6 && (
                <div className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm">
                  +{user.badges.length - 6} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Latest Subscribers */}
        {user.subscriber && user.subscriber.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Latest Subscribers</h3>
              <button className="text-sm text-purple-600 dark:text-purple-400 hover:underline">
                View all
              </button>
            </div>
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {user.subscriber.slice(0, 10).map((subscriber) => (
                <div key={subscriber._id} className="flex-shrink-0 text-center">
                  <img
                    src={subscriber.avatar || '/default-avatar.png'}
                    alt={subscriber.username}
                    className="w-12 h-12 rounded-full object-cover mx-auto"
                  />
                  <p className="text-xs mt-1 text-gray-600 dark:text-gray-400 truncate w-16">
                    {subscriber.username}
                  </p>
                </div>
              ))}
              {user.subscriber.length > 10 && (
                <div className="flex-shrink-0 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mx-auto">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      +{user.subscriber.length - 10}
                    </span>
                  </div>
                  <p className="text-xs mt-1 text-gray-600 dark:text-gray-400 truncate w-16">
                    More
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Mutual Subscribers */}
        {user.subscriber && user.subscriber.length > 0 && !isOwnProfile && currentUser?.subscribed && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {getMutualSubscribersCount(user.subscriber, currentUser.subscribed)} Mutual Subscribers
              </h3>
              <button className="text-sm text-purple-600 dark:text-purple-400 hover:underline">
                View all
              </button>
            </div>
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {getMutualSubscribers(user.subscriber, currentUser.subscribed).slice(0, 8).map((mutual) => (
                <div key={mutual._id} className="flex-shrink-0 text-center">
                  <img
                    src={mutual.avatar || '/default-avatar.png'}
                    alt={mutual.username}
                    className="w-12 h-12 rounded-full object-cover mx-auto"
                  />
                  <p className="text-xs mt-1 text-gray-600 dark:text-gray-400 truncate w-16">
                    {mutual.username}
                  </p>
                </div>
              ))}
              {getMutualSubscribers(user.subscriber, currentUser.subscribed).length > 8 && (
                <div className="flex-shrink-0 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mx-auto">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      +{getMutualSubscribers(user.subscriber, currentUser.subscribed).length - 8}
                    </span>
                  </div>
                  <p className="text-xs mt-1 text-gray-600 dark:text-gray-400 truncate w-16">
                    More
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Favorite Content */}
        {user.favoritePosts && user.favoritePosts.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Favorite Content</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {user.favoritePosts.slice(0, 4).map((post) => (
                <div 
                  key={post._id} 
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
                  onClick={() => {
                    if (post.category === 'short') {
                      navigate(`/reels/${post._id}`);
                    } else {
                      navigate(`/watch/${post._id}`);
                    }
                  }}
                >
                  <div className="relative">
                    <img 
                      src={post.thumbnail || post.mediaUrl || (post.media && post.media[0] && post.media[0].url)} 
                      alt={post.title || post.caption} 
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex items-center px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded-full">
                        ❤️
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                      {post.title || post.caption || 'Untitled'}
                    </h4>
                    <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatTimeAgo(post.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Notes */}
        {user.notes && user.notes.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Notes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.notes.slice(0, 4).map((note) => (
                <div 
                  key={note._id} 
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow p-4"
                  onClick={() => navigate(`/notes/${note._id}`)}
                >
                  <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                    {note.title || 'Untitled Note'}
                  </h4>
                  <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                    {note.content || 'No content'}
                  </p>
                  <div className="mt-3 flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatTimeAgo(note.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Groups */}
        {user.groups && user.groups.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Groups</h3>
              <button 
                onClick={() => navigate('/groups')}
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
              >
                View all
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.groups.slice(0, 2).map((group) => (
                <div 
                  key={group._id} 
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
                  onClick={() => navigate(`/groups/${group._id}`)}
                >
                  <div className="relative">
                    <img 
                      src={group.coverImage || '/default-group.jpg'} 
                      alt={group.name} 
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute bottom-2 right-2">
                      <span className="inline-flex items-center px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded-full">
                        {group.members?.length || 0} members
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                      {group.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {group.description || 'No description'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Events */}
        {user.events && user.events.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Events</h3>
              <button 
                onClick={() => navigate('/events')}
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
              >
                View all
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.events.slice(0, 2).map((event) => (
                <div 
                  key={event._id} 
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
                  onClick={() => navigate(`/events/${event._id}`)}
                >
                  <div className="relative">
                    <img 
                      src={event.coverImage || '/default-event.jpg'} 
                      alt={event.title} 
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="inline-flex items-center px-2 py-1 bg-purple-500 text-white text-xs rounded-full">
                        {new Date(event.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                      {event.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {event.description || 'No description'}
                    </p>
                    <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <span>{event.location || 'Location not specified'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Polls */}
        {user.polls && user.polls.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Polls</h3>
              <button 
                onClick={() => navigate('/polls')}
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
              >
                View all
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {user.polls.slice(0, 2).map((poll) => (
                <div 
                  key={poll._id} 
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow p-4"
                  onClick={() => navigate(`/polls/${poll._id}`)}
                >
                  <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                    {poll.question}
                  </h4>
                  <div className="mt-3 space-y-2">
                    {poll.options.slice(0, 3).map((option, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full" 
                            style={{ width: `${option.percentage || 0}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
                          {option.text} ({option.votes || 0})
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatTimeAgo(poll.createdAt)}</span>
                    <span className="mx-2">•</span>
                    <span>{poll.totalVotes || 0} votes</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Quizzes */}
        {user.quizzes && user.quizzes.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Quizzes</h3>
              <button 
                onClick={() => navigate('/quizzes')}
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
              >
                View all
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.quizzes.slice(0, 2).map((quiz) => (
                <div 
                  key={quiz._id} 
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
                  onClick={() => navigate(`/quizzes/${quiz._id}`)}
                >
                  <div className="relative">
                    <img 
                      src={quiz.coverImage || '/default-quiz.jpg'} 
                      alt={quiz.title} 
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex items-center px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded-full">
                        {quiz.questions?.length || 0} questions
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                      {quiz.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {quiz.description || 'No description'}
                    </p>
                    <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatTimeAgo(quiz.createdAt)}</span>
                      <span className="mx-2">•</span>
                      <span>{quiz.attempts || 0} attempts</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Featured Content */}
        {user.posts && user.posts.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Featured Content</h3>
              <button 
                onClick={() => setActiveTab('posts')}
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
              >
                View all
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {user.posts.slice(0, 3).map((post) => (
                <div 
                  key={post._id} 
                  className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
                  onClick={() => {
                    // Navigate based on duration
                    // If duration is less than or equal to 60 seconds, go to reels
                    // Otherwise, go to watch page
                    if (post.durationSec && post.durationSec <= 60) {
                      navigate(`/reels/${post._id}`);
                    } else if (post.category === 'short') {
                      // Fallback for short category posts
                      navigate(`/reels/${post._id}`);
                    } else {
                      navigate(`/watch/${post._id}`);
                    }
                  }}
                >
                  <div className="relative">
                    <img 
                      src={post.thumbnail || post.mediaUrl || (post.media && post.media[0] && post.media[0].url)} 
                      alt={post.title || post.caption} 
                      className="w-full h-48 object-cover"
                    />
                    {post.durationSec && (
                      <span className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        {new Date(post.durationSec * 1000).toISOString().substr(14, 5)}
                      </span>
                    )}
                    <div className="absolute top-2 right-2">
                      {post.category === 'short' ? (
                        <span className="inline-block px-2 py-1 text-xs font-semibold text-green-600 bg-green-100 rounded-full">Reel</span>
                      ) : post.category === 'long' ? (
                        <span className="inline-block px-2 py-1 text-xs font-semibold text-orange-600 bg-orange-100 rounded-full">Video</span>
                      ) : (
                        <span className="inline-block px-2 py-1 text-xs font-semibold text-pink-600 bg-pink-100 rounded-full">Post</span>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-gray-900 dark:text-white line-clamp-2">
                      {post.title || post.caption || 'Untitled'}
                    </h4>
                    <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <span>{formatNumber(post.views || 0)} views</span>
                      <span className="mx-2">•</span>
                      <span>{formatTimeAgo(post.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Recent Activity */}
        {isOwnProfile && user.posts && user.posts.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {user.posts.slice(0, 5).map((post) => (
                  <div 
                    key={post._id} 
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => {
                      if (post.category === 'short') {
                        navigate(`/reels/${post._id}`);
                      } else {
                        navigate(`/watch/${post._id}`);
                      }
                    }}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden">
                        <img 
                          src={post.thumbnail || post.mediaUrl || (post.media && post.media[0] && post.media[0].url)} 
                          alt={post.title || post.caption} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="ml-4 flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                          {post.title || post.caption || 'Untitled'}
                        </h4>
                        <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <span>{formatNumber(post.views || 0)} views</span>
                          <span className="mx-2">•</span>
                          <span>{formatTimeAgo(post.createdAt)}</span>
                        </div>
                        <div className="mt-1 flex items-center">
                          <span className="inline-flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <FiHeart className="mr-1" /> {post.likes?.length || 0}
                          </span>
                          <span className="inline-flex items-center text-xs text-gray-500 dark:text-gray-400 ml-3">
                            <FiMessageSquare className="mr-1" /> {post.comments?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Top Performing Content */}
        {isOwnProfile && user.posts && user.posts.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Top Performing Content</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getTopPerformingContent(user.posts).slice(0, 4).map((post, index) => (
                <div 
                  key={post._id} 
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
                  onClick={() => {
                    if (post.category === 'short') {
                      navigate(`/reels/${post._id}`);
                    } else {
                      navigate(`/watch/${post._id}`);
                    }
                  }}
                >
                  <div className="relative">
                    <img 
                      src={post.thumbnail || post.mediaUrl || (post.media && post.media[0] && post.media[0].url)} 
                      alt={post.title || post.caption} 
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="inline-flex items-center px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded-full">
                        #{index + 1}
                      </span>
                    </div>
                    <div className="absolute bottom-2 right-2">
                      <span className="inline-flex items-center px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded-full">
                        {formatNumber(post.views || 0)} views
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                      {post.title || post.caption || 'Untitled'}
                    </h4>
                    <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatTimeAgo(post.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Content Schedule */}
        {isOwnProfile && user.scheduledPosts && user.scheduledPosts.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Scheduled Content</h3>
              <button 
                onClick={() => navigate('/schedule')}
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
              >
                View all
              </button>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {user.scheduledPosts.slice(0, 3).map((post) => (
                  <div 
                    key={post._id} 
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-500 dark:text-gray-400">📅</span>
                      </div>
                      <div className="ml-4 flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                          {post.title || post.caption || 'Untitled'}
                        </h4>
                        <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <span>Scheduled for {new Date(post.scheduledFor).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Playlists */}
        {user.playlists && user.playlists.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Playlists</h3>
              <button 
                onClick={() => navigate('/playlists')}
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
              >
                View all
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {user.playlists.slice(0, 3).map((playlist) => (
                <div 
                  key={playlist._id} 
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
                  onClick={() => navigate(`/playlists/${playlist._id}`)}
                >
                  <div className="relative">
                    <div className="bg-gradient-to-br from-purple-500 to-pink-500 h-32 flex items-center justify-center">
                      <span className="text-white text-4xl">🎵</span>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                      {playlist.videos?.length || 0} videos
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                      {playlist.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {playlist.description || 'No description'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Community Posts */}
        {user.communityPosts && user.communityPosts.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Community Posts</h3>
              <button 
                onClick={() => navigate('/community')}
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
              >
                View all
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.communityPosts.slice(0, 4).map((post) => (
                <div 
                  key={post._id} 
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
                  onClick={() => navigate(`/community/${post._id}`)}
                >
                  <div className="p-4">
                    <div className="flex items-center">
                      <img 
                        src={post.creator?.avatar || '/default-avatar.png'} 
                        alt={post.creator?.username} 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="ml-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {post.creator?.username}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimeAgo(post.createdAt)}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-gray-700 dark:text-gray-300 line-clamp-3">
                      {post.content}
                    </p>
                    <div className="mt-3 flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <span className="inline-flex items-center">
                        <FiHeart className="mr-1" /> {post.likes?.length || 0}
                      </span>
                      <span className="inline-flex items-center ml-3">
                        <FiMessageSquare className="mr-1" /> {post.comments?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Highlights */}
        {user.highlights && user.highlights.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Highlights</h3>
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {user.highlights.slice(0, 6).map((highlight) => (
                <div 
                  key={highlight._id} 
                  className="flex-shrink-0 w-24 cursor-pointer"
                  onClick={() => navigate(`/highlights/${highlight._id}`)}
                >
                  <div className="relative">
                    <div className="w-24 h-32 rounded-xl overflow-hidden shadow-lg">
                      <img 
                        src={highlight.coverImage || '/default-bg.jpg'} 
                        alt={highlight.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                      <p className="text-white text-xs font-semibold truncate">
                        {highlight.title}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Shop */}
        {user.products && user.products.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Shop</h3>
              <button 
                onClick={() => navigate('/shop')}
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
              >
                View all
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {user.products.slice(0, 4).map((product) => (
                <div 
                  key={product._id} 
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
                  onClick={() => navigate(`/products/${product._id}`)}
                >
                  <div className="relative">
                    <img 
                      src={product.images?.[0] || '/default-product.jpg'} 
                      alt={product.name} 
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                      ${product.price}
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                      {product.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {product.description || 'No description'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Stories */}
        {user.stories && user.stories.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Stories</h3>
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {user.stories.slice(0, 8).map((story) => (
                <div 
                  key={story._id} 
                  className="flex-shrink-0 w-24 cursor-pointer relative"
                  onClick={() => navigate(`/stories/${story._id}`)}
                >
                  <div className="w-24 h-32 rounded-xl overflow-hidden shadow-lg border-2 border-gray-300">
                    <img 
                      src={story.mediaUrl || '/default-story.jpg'} 
                      alt="Story" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute bottom-1 left-0 right-0 text-center">
                    <p className="text-white text-xs font-semibold truncate px-1">
                      {new Date(story.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Live Streams */}
        {user.liveStreams && user.liveStreams.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Live Streams</h3>
              <button 
                onClick={() => navigate('/live')}
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
              >
                View all
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.liveStreams.slice(0, 2).map((stream) => (
                <div 
                  key={stream._id} 
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
                  onClick={() => navigate(`/live/${stream._id}`)}
                >
                  <div className="relative">
                    <img 
                      src={stream.thumbnail || '/default-live.jpg'} 
                      alt={stream.title} 
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="inline-flex items-center px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                        LIVE
                      </span>
                    </div>
                    <div className="absolute bottom-2 right-2">
                      <span className="inline-flex items-center px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded-full">
                        {stream.viewers || 0} viewers
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                      {stream.title}
                    </h4>
                    <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <span>{formatTimeAgo(stream.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <tab.icon />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {tabs.map(tab => (
          <div key={tab.id} className={activeTab === tab.id ? 'block' : 'hidden'}>
            <UserContentGrid userId={user._id} category={tab.category} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Profile;
