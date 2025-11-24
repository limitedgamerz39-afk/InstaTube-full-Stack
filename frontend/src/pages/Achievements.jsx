import { useState, useEffect } from 'react';
import { FiAward, FiStar, FiHeart, FiEye, FiUsers, FiTrendingUp, FiGift, FiCamera, FiVideo, FiShare2 } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';

function Achievements() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('badges');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  
  // Enhanced achievements data with rarity and points
  const badges = [
    {
      id: 'first_post',
      title: 'First Post',
      description: 'Created your first post',
      icon: <FiStar className="w-6 h-6" />,
      earned: false,
      date: null,
      rarity: 'common',
      points: 10
    },
    {
      id: 'content_creator',
      title: 'Content Creator',
      description: 'Posted 10 times',
      icon: <FiCamera className="w-6 h-6" />,
      earned: false,
      date: null,
      rarity: 'common',
      points: 25
    },
    {
      id: 'video_star',
      title: 'Video Star',
      description: 'Posted 5 videos',
      icon: <FiVideo className="w-6 h-6" />,
      earned: false,
      date: null,
      rarity: 'uncommon',
      points: 50
    },
    {
      id: 'popular',
      title: 'Popular',
      description: 'Reached 100 followers',
      icon: <FiUsers className="w-6 h-6" />,
      earned: false,
      date: null,
      rarity: 'uncommon',
      points: 75
    },
    {
      id: 'superstar',
      title: 'Superstar',
      description: 'Reached 1000 followers',
      icon: <FiUsers className="w-6 h-6" />,
      earned: false,
      date: null,
      rarity: 'rare',
      points: 150
    },
    {
      id: 'heart_throb',
      title: 'Heart Throb',
      description: 'Received 500 likes',
      icon: <FiHeart className="w-6 h-6" />,
      earned: false,
      date: null,
      rarity: 'rare',
      points: 100
    },
    {
      id: 'social_butterfly',
      title: 'Social Butterfly',
      description: 'Subscribed to 50 users',
      icon: <FiUsers className="w-6 h-6" />,
      earned: false,
      date: null,
      rarity: 'uncommon',
      points: 30
    },
    {
      id: 'consistent',
      title: 'Consistent',
      description: 'Posted for 7 consecutive days',
      icon: <FiGift className="w-6 h-6" />,
      earned: false,
      date: null,
      rarity: 'rare',
      points: 80
    },
    {
      id: 'champion',
      title: 'Champion',
      description: 'Earned 5 different badges',
      icon: <FiAward className="w-6 h-6" />,
      earned: false,
      date: null,
      rarity: 'epic',
      points: 200
    },
    {
      id: 'sharer',
      title: 'Sharer',
      description: 'Shared 20 posts',
      icon: <FiShare2 className="w-6 h-6" />,
      earned: false,
      date: null,
      rarity: 'uncommon',
      points: 35
    }
  ];

  const stats = [
    { label: 'Total Posts', value: 0 },
    { label: 'Followers', value: '0' },
    { label: 'Following', value: 0 },
    { label: 'Total Views', value: '0' },
    { label: 'Likes Received', value: '0' },
    { label: 'Badges Earned', value: 0 }
  ];

  // Get rarity color
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'border-gray-300';
      case 'uncommon': return 'border-green-300';
      case 'rare': return 'border-blue-300';
      case 'epic': return 'border-purple-300';
      case 'legendary': return 'border-yellow-300';
      default: return 'border-gray-300';
    }
  };

  // Get rarity background
  const getRarityBackground = (rarity) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 dark:bg-gray-700';
      case 'uncommon': return 'bg-green-100 dark:bg-green-900';
      case 'rare': return 'bg-blue-100 dark:bg-blue-900';
      case 'epic': return 'bg-purple-100 dark:bg-purple-900';
      case 'legendary': return 'bg-yellow-100 dark:bg-yellow-900';
      default: return 'bg-gray-100 dark:bg-gray-700';
    }
  };

  // Get rarity text
  const getRarityText = (rarity) => {
    switch (rarity) {
      case 'common': return 'Common';
      case 'uncommon': return 'Uncommon';
      case 'rare': return 'Rare';
      case 'epic': return 'Epic';
      case 'legendary': return 'Legendary';
      default: return 'Common';
    }
  };

  // Calculate progress for a specific badge
  const calculateProgress = (badge) => {
    if (!user) return 0;
    
    switch (badge.id) {
      case 'first_post':
      case 'content_creator':
        return user.posts ? Math.min(100, (user.posts.length / 10) * 100) : 0;
      case 'video_star':
        const videoCount = user.posts && Array.isArray(user.posts) ? 
          user.posts.filter(p => p.category === 'short' || p.category === 'long').length : 0;
        return Math.min(100, (videoCount / 5) * 100);
      case 'popular':
        return user.subscriber ? Math.min(100, (user.subscriber.length / 100) * 100) : 0;
      case 'superstar':
        return user.subscriber ? Math.min(100, (user.subscriber.length / 1000) * 100) : 0;
      case 'heart_throb':
        if (!user.posts) return 0;
        const totalLikes = user.posts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
        return Math.min(100, (totalLikes / 500) * 100);
      case 'social_butterfly':
        return user.subscribed ? Math.min(100, (user.subscribed.length / 50) * 100) : 0;
      case 'consistent':
        return user.posts ? Math.min(100, (user.posts.length / 7) * 100) : 0;
      case 'champion':
        const earnedBadges = badges.filter(criterion => criterion.earned).length;
        return Math.min(100, (earnedBadges / 5) * 100);
      case 'sharer':
        return user.shared ? Math.min(100, (user.shared.length / 20) * 100) : 0;
      default:
        return 0;
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        // In a real app, you would fetch the current user's data
        // For now, we'll simulate with sample data
        const sampleUser = {
          posts: Array(15).fill().map((_, i) => ({ id: i, category: i % 3 === 0 ? 'short' : 'long' })),
          subscriber: Array(150).fill().map((_, i) => ({ id: i })),
          subscribed: Array(30).fill().map((_, i) => ({ id: i })),
          shared: Array(12).fill().map((_, i) => ({ id: i })),
          likes: Array(200).fill().map((_, i) => ({ id: i }))
        };
        
        setUser(sampleUser);
        
        // Update badge earned status
        const updatedBadges = badges.map(badge => {
          let earned = false;
          switch (badge.id) {
            case 'first_post':
              earned = sampleUser.posts && sampleUser.posts.length >= 1;
              break;
            case 'content_creator':
              earned = sampleUser.posts && sampleUser.posts.length >= 10;
              break;
            case 'video_star':
              const videoCount = sampleUser.posts && Array.isArray(sampleUser.posts) ? 
                sampleUser.posts.filter(p => p.category === 'short' || p.category === 'long').length : 0;
              earned = videoCount >= 5;
              break;
            case 'popular':
              earned = sampleUser.subscriber && sampleUser.subscriber.length >= 100;
              break;
            case 'superstar':
              earned = sampleUser.subscriber && sampleUser.subscriber.length >= 1000;
              break;
            case 'social_butterfly':
              earned = sampleUser.subscribed && sampleUser.subscribed.length >= 50;
              break;
            case 'sharer':
              earned = sampleUser.shared && sampleUser.shared.length >= 20;
              break;
            default:
              earned = false;
          }
          return { ...badge, earned };
        });
        
        // Update stats
        stats[0].value = sampleUser.posts ? sampleUser.posts.length : 0;
        stats[1].value = sampleUser.subscriber ? `${Math.floor(sampleUser.subscriber.length / 1000) || sampleUser.subscriber.length}` : '0';
        stats[2].value = sampleUser.subscribed ? sampleUser.subscribed.length : 0;
        stats[5].value = updatedBadges.filter(b => b.earned).length;
        
        // Calculate points
        const totalPoints = updatedBadges.filter(b => b.earned).reduce((sum, badge) => sum + badge.points, 0);
        setPoints(totalPoints);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load achievements');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <FiAward className="w-8 h-8 text-yellow-500" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Achievements</h1>
          <div className="ml-auto flex items-center space-x-2 bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full">
            <FiGift className="text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-bold text-yellow-800 dark:text-yellow-200">{points} pts</span>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('badges')}
            className={`px-6 py-2 rounded-lg whitespace-nowrap ${
              activeTab === 'badges'
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <FiAward className="inline mr-2" />
            Badges
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-6 py-2 rounded-lg whitespace-nowrap ${
              activeTab === 'progress'
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <FiTrendingUp className="inline mr-2" />
            Progress
          </button>
        </div>

        {/* Badges Content */}
        {activeTab === 'badges' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {badges.map((badge) => {
              const progress = calculateProgress(badge);
              
              return (
                <div
                  key={badge.id}
                  className={`relative bg-white dark:bg-gray-800 rounded-xl p-5 shadow transition-all duration-200 hover:shadow-lg ${getRarityColor(badge.rarity)} ${badge.earned ? 'border-2' : 'opacity-80'} ${badge.earned ? 'transform hover:scale-105' : ''}`}
                >
                  <div className="flex flex-col items-center text-center mb-3">
                    <div className={`p-3 rounded-full mb-3 ${
                      badge.earned
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                    }`}>
                      {badge.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm">{badge.title}</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {badge.description}
                      </p>
                      <div className="mt-2">
                        <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${getRarityBackground(badge.rarity)} ${getRarityColor(badge.rarity)}`}>
                          {getRarityText(badge.rarity)}
                        </span>
                      </div>
                      {badge.earned && badge.date && (
                        <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-2">
                          Earned on {new Date(badge.date).toLocaleDateString()}
                        </p>
                      )}
                      {!badge.earned && (
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full" 
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-1">
                            {Math.floor(progress)}% complete
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="absolute top-2 right-2 flex items-center space-x-1">
                      {badge.earned && (
                        <div className="text-yellow-500">
                          <FiAward className="w-4 h-4" />
                        </div>
                      )}
                      <div className="bg-yellow-500 text-white text-[8px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                        {badge.points}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Progress Content */}
        {activeTab === 'progress' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Your Progress</h2>
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-xl p-5 border border-blue-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Profile Completion</h3>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">85%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Complete your profile to unlock special features</p>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-gray-700 dark:to-gray-800 rounded-xl p-5 border border-green-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Content Engagement</h3>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">72%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div className="bg-gradient-to-r from-green-500 to-teal-500 h-2.5 rounded-full" style={{ width: '72%' }}></div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Engage with content to build your community</p>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-700 dark:to-gray-800 rounded-xl p-5 border border-purple-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Community Participation</h3>
                  <span className="text-sm font-bold text-purple-600 dark:text-purple-400">60%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full" style={{ width: '60%' }}></div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Participate in discussions and events</p>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-gray-700 dark:to-gray-800 rounded-xl p-5 border border-yellow-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Creator Milestones</h3>
                  <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">45%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Reach milestones to become a verified creator</p>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Next Milestones</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center mb-2">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg mr-3">
                      <FiUsers className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">1K Followers</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Reach 1,000 followers</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">65% complete</p>
                </div>
                
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center mb-2">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg mr-3">
                      <FiStar className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">100 Likes</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Get 100 likes on a post</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">40% complete</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Achievements;