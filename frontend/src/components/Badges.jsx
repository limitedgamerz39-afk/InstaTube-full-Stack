import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
  AiOutlineFire, 
  AiOutlineStar, 
  AiOutlineHeart, 
  AiOutlineCheckCircle,
  AiOutlineTrophy,
  AiOutlineCamera,
  AiOutlineVideoCamera,
  AiOutlineUsergroupAdd,
  AiOutlineGift,
  AiOutlineComment,
  AiOutlineShareAlt,
  AiOutlineEye,
  AiOutlineLike,
  AiOutlineDislike,
  AiOutlineUpload,
  AiOutlinePlayCircle
} from 'react-icons/ai';
import { BsLightning, BsFillAwardFill, BsClock } from 'react-icons/bs';
import { FaRegCalendarAlt, FaRegSmile, FaRegGem } from 'react-icons/fa';

const Badges = ({ user }) => {
  const { currentUser } = useAuth();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showcaseBadge, setShowcaseBadge] = useState(null);
  const [points, setPoints] = useState(0);

  // Define badge criteria with rarity and points
  const badgeCriteria = [
    {
      id: 'first_post',
      name: 'First Post',
      description: 'Made your first post',
      icon: <AiOutlineCheckCircle className="text-2xl" />,
      condition: (user) => user.posts && user.posts.length >= 1,
      color: 'text-blue-500',
      rarity: 'common',
      points: 10
    },
    {
      id: 'content_creator',
      name: 'Content Creator',
      description: 'Posted 10 times',
      icon: <AiOutlineCamera className="text-2xl" />,
      condition: (user) => user.posts && user.posts.length >= 10,
      color: 'text-green-500',
      rarity: 'common',
      points: 25
    },
    {
      id: 'video_star',
      name: 'Video Star',
      description: 'Posted 5 videos',
      icon: <AiOutlineVideoCamera className="text-2xl" />,
      condition: (user) => user.posts && Array.isArray(user.posts) && user.posts.filter(p => p.category === 'short' || p.category === 'long').length >= 5,
      color: 'text-purple-500',
      rarity: 'uncommon',
      points: 50
    },
    {
      id: 'popular',
      name: 'Popular',
      description: 'Reached 100 subscribers',
      icon: <AiOutlineFire className="text-2xl" />,
      condition: (user) => user.subscriber && user.subscriber.length >= 100,
      color: 'text-red-500',
      rarity: 'uncommon',
      points: 75
    },
    {
      id: 'superstar',
      name: 'Superstar',
      description: 'Reached 1000 subscribers',
      icon: <AiOutlineStar className="text-2xl" />,
      condition: (user) => user.subscriber && user.subscriber.length >= 1000,
      color: 'text-yellow-500',
      rarity: 'rare',
      points: 150
    },
    {
      id: 'heart_throb',
      name: 'Heart Throb',
      description: 'Received 500 likes',
      icon: <AiOutlineHeart className="text-2xl" />,
      condition: (user) => {
        if (!user.posts) return false;
        const totalLikes = user.posts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
        return totalLikes >= 500;
      },
      color: 'text-pink-500',
      rarity: 'rare',
      points: 100
    },
    {
      id: 'social_butterfly',
      name: 'Social Butterfly',
      description: 'Subscribed to 50 users',
      icon: <AiOutlineUsergroupAdd className="text-2xl" />,
      condition: (user) => user.subscribed && user.subscribed.length >= 50,
      color: 'text-indigo-500',
      rarity: 'uncommon',
      points: 30
    },
    {
      id: 'consistent',
      name: 'Consistent',
      description: 'Posted for 7 consecutive days',
      icon: <BsLightning className="text-2xl" />,
      condition: (user) => {
        // This would require tracking consecutive posting days
        // For now, we'll check if they have at least 7 posts
        return user.posts && user.posts.length >= 7;
      },
      color: 'text-orange-500',
      rarity: 'rare',
      points: 80
    },
    {
      id: 'champion',
      name: 'Champion',
      description: 'Earned 5 different badges',
      icon: <AiOutlineTrophy className="text-2xl" />,
      condition: (user) => {
        // Count how many badges the user has earned
        const earnedBadges = badgeCriteria.filter(criterion => criterion.condition(user)).length;
        return earnedBadges >= 5;
      },
      color: 'text-purple-600',
      rarity: 'epic',
      points: 200
    },
    // Additional badges
    {
      id: 'commentator',
      name: 'Commentator',
      description: 'Commented on 50 posts',
      icon: <AiOutlineComment className="text-2xl" />,
      condition: (user) => user.comments && user.comments.length >= 50,
      color: 'text-teal-500',
      rarity: 'uncommon',
      points: 40
    },
    {
      id: 'sharer',
      name: 'Sharer',
      description: 'Shared 20 posts',
      icon: <AiOutlineShareAlt className="text-2xl" />,
      condition: (user) => user.shared && user.shared.length >= 20,
      color: 'text-cyan-500',
      rarity: 'uncommon',
      points: 35
    },
    {
      id: 'viewer',
      name: 'Viewer',
      description: 'Watched 100 videos',
      icon: <AiOutlineEye className="text-2xl" />,
      condition: (user) => user.watched && user.watched.length >= 100,
      color: 'text-emerald-500',
      rarity: 'common',
      points: 20
    },
    {
      id: 'like_master',
      name: 'Like Master',
      description: 'Liked 200 posts',
      icon: <AiOutlineLike className="text-2xl" />,
      condition: (user) => user.liked && user.liked.length >= 200,
      color: 'text-rose-500',
      rarity: 'uncommon',
      points: 45
    },
    {
      id: 'early_bird',
      name: 'Early Bird',
      description: 'Joined in the first 1000 users',
      icon: <FaRegCalendarAlt className="text-2xl" />,
      condition: (user) => user.joinedEarly === true,
      color: 'text-amber-500',
      rarity: 'legendary',
      points: 300
    },
    {
      id: 'happy_user',
      name: 'Happy User',
      description: 'Used the app for 30 days',
      icon: <FaRegSmile className="text-2xl" />,
      condition: (user) => user.daysActive >= 30,
      color: 'text-lime-500',
      rarity: 'rare',
      points: 120
    },
    {
      id: 'gem_collector',
      name: 'Gem Collector',
      description: 'Earned 1000 points',
      icon: <FaRegGem className="text-2xl" />,
      condition: (user) => points >= 1000,
      color: 'text-violet-500',
      rarity: 'epic',
      points: 0 // No points for this badge as it's based on points
    }
  ];

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
        const earnedBadges = badgeCriteria.filter(criterion => criterion.condition(user)).length;
        return Math.min(100, (earnedBadges / 5) * 100);
      case 'commentator':
        return user.comments ? Math.min(100, (user.comments.length / 50) * 100) : 0;
      case 'sharer':
        return user.shared ? Math.min(100, (user.shared.length / 20) * 100) : 0;
      case 'viewer':
        return user.watched ? Math.min(100, (user.watched.length / 100) * 100) : 0;
      case 'like_master':
        return user.liked ? Math.min(100, (user.liked.length / 200) * 100) : 0;
      case 'happy_user':
        return user.daysActive ? Math.min(100, (user.daysActive / 30) * 100) : 0;
      case 'gem_collector':
        return Math.min(100, (points / 1000) * 100);
      default:
        return 0;
    }
  };

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

  useEffect(() => {
    if (user) {
      const earnedBadges = badgeCriteria.filter(criterion => criterion.condition(user));
      setBadges(earnedBadges);
      
      // Calculate total points
      const totalPoints = earnedBadges.reduce((sum, badge) => sum + badge.points, 0);
      setPoints(totalPoints);
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold dark:text-white">Achievements</h3>
        <div className="flex items-center space-x-2">
          <BsFillAwardFill className="text-yellow-500" />
          <span className="text-sm font-medium dark:text-white">{points} pts</span>
        </div>
      </div>
      
      {badges.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {badges.map((badge) => {
            const progress = calculateProgress(badge);
            const isEarned = badge.condition(user);
            
            return (
              <div 
                key={badge.id}
                className={`relative rounded-xl p-3 shadow-sm border ${getRarityColor(badge.rarity)} ${getRarityBackground(badge.rarity)} cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-md`}
                onClick={() => setShowcaseBadge(badge)}
                title={`${badge.name}: ${badge.description}`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`${badge.color} mb-2`}>
                    {badge.icon}
                  </div>
                  <h4 className="text-xs font-bold dark:text-white truncate w-full">{badge.name}</h4>
                  <span className="text-[8px] font-semibold uppercase tracking-wider mt-1 opacity-75">
                    {getRarityText(badge.rarity)}
                  </span>
                </div>
                
                {/* Progress bar for unearned badges */}
                {!isEarned && progress > 0 && (
                  <div className="absolute bottom-1 left-1 right-1 h-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                )}
                
                {/* Points badge */}
                <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-[8px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {badge.points}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <BsFillAwardFill className="text-3xl mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
            No badges earned yet
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs">
            Keep posting and engaging to earn achievements!
          </p>
        </div>
      )}
      
      {/* Badge Showcase Modal */}
      {showcaseBadge && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={() => setShowcaseBadge(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center mb-4">
              <div className={`text-4xl mb-3 ${showcaseBadge.color}`}>
                {showcaseBadge.icon}
              </div>
              <h3 className="text-2xl font-bold dark:text-white mb-1">{showcaseBadge.name}</h3>
              <span className={`text-sm font-semibold px-2 py-1 rounded-full ${getRarityBackground(showcaseBadge.rarity)} ${getRarityColor(showcaseBadge.rarity)}`}>
                {getRarityText(showcaseBadge.rarity)}
              </span>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-4 text-center">
              {showcaseBadge.description}
            </p>
            
            <div className="flex justify-between items-center mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-500">{showcaseBadge.points}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Points</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">✓</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Earned</p>
              </div>
            </div>
            
            <button 
              className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
              onClick={() => setShowcaseBadge(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Badges;