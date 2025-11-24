import Achievement from '../models/Achievement.js';
import User from '../models/User.js';
import redisClient from '../config/redis.js';

// Define achievement criteria
const ACHIEVEMENT_CRITERIA = {
  // Post-related achievements
  FIRST_POST: {
    id: 'first_post',
    name: 'First Post',
    description: 'Created your first post',
    points: 10,
    rarity: 'common'
  },
  CONTENT_CREATOR: {
    id: 'content_creator',
    name: 'Content Creator',
    description: 'Posted 10 times',
    points: 25,
    rarity: 'common'
  },
  VIDEO_STAR: {
    id: 'video_star',
    name: 'Video Star',
    description: 'Posted 5 videos',
    points: 50,
    rarity: 'uncommon'
  },
  PRODUCER: {
    id: 'producer',
    name: 'Producer',
    description: 'Posted 25 videos',
    points: 100,
    rarity: 'rare'
  },
  
  // Follower-related achievements
  POPULAR: {
    id: 'popular',
    name: 'Popular',
    description: 'Reached 100 followers',
    points: 75,
    rarity: 'uncommon'
  },
  SUPERSTAR: {
    id: 'superstar',
    name: 'Superstar',
    description: 'Reached 1000 followers',
    points: 150,
    rarity: 'rare'
  },
  INFLUENCER: {
    id: 'influencer',
    name: 'Influencer',
    description: 'Reached 10000 followers',
    points: 300,
    rarity: 'epic'
  },
  
  // Engagement-related achievements
  HEART_THROB: {
    id: 'heart_throb',
    name: 'Heart Throb',
    description: 'Received 500 likes',
    points: 100,
    rarity: 'rare'
  },
  LOVEABLE: {
    id: 'loveable',
    name: 'Loveable',
    description: 'Received 2500 likes',
    points: 200,
    rarity: 'epic'
  },
  
  // Social-related achievements
  SOCIAL_BUTTERFLY: {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Subscribed to 50 users',
    points: 30,
    rarity: 'uncommon'
  },
  NETWORKER: {
    id: 'networker',
    name: 'Networker',
    description: 'Subscribed to 200 users',
    points: 75,
    rarity: 'rare'
  },
  
  // Consistency achievements
  CONSISTENT: {
    id: 'consistent',
    name: 'Consistent',
    description: 'Posted for 7 consecutive days',
    points: 80,
    rarity: 'rare'
  },
  STREAK_MASTER: {
    id: 'streak_master',
    name: 'Streak Master',
    description: 'Posted for 30 consecutive days',
    points: 200,
    rarity: 'epic'
  },
  
  // Champion achievement
  CHAMPION: {
    id: 'champion',
    name: 'Champion',
    description: 'Earned 5 different badges',
    points: 200,
    rarity: 'epic'
  },
  
  // Comment-related achievements
  COMMENTATOR: {
    id: 'commentator',
    name: 'Commentator',
    description: 'Commented on 50 posts',
    points: 40,
    rarity: 'uncommon'
  },
  
  // Sharing achievements
  SHARER: {
    id: 'sharer',
    name: 'Sharer',
    description: 'Shared 20 posts',
    points: 35,
    rarity: 'uncommon'
  },
  
  // Viewing achievements
  VIEWER: {
    id: 'viewer',
    name: 'Viewer',
    description: 'Watched 100 videos',
    points: 20,
    rarity: 'common'
  },
  
  // Like achievements
  LIKE_MASTER: {
    id: 'like_master',
    name: 'Like Master',
    description: 'Liked 200 posts',
    points: 45,
    rarity: 'uncommon'
  },
  
  // Early adopter
  EARLY_BIRD: {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Joined in the first 1000 users',
    points: 300,
    rarity: 'legendary'
  },
  
  // Long-term user
  VETERAN: {
    id: 'veteran',
    name: 'Veteran',
    description: 'Used the app for 365 days',
    points: 150,
    rarity: 'rare'
  },
  
  // Gem collector
  GEM_COLLECTOR: {
    id: 'gem_collector',
    name: 'Gem Collector',
    description: 'Earned 1000 points',
    points: 0, // No points for this badge as it's based on points
    rarity: 'epic'
  }
};

// Check and award achievements based on user activity
export const checkAndAwardAchievements = async (userId, action, metadata = {}) => {
  try {
    const user = await User.findById(userId).populate('posts');
    if (!user) return [];
    
    const newAchievements = [];
    
    switch (action) {
      case 'post_created':
        newAchievements.push(...await checkPostAchievements(user));
        break;
      case 'follower_gained':
        newAchievements.push(...await checkFollowerAchievements(user));
        break;
      case 'like_received':
        newAchievements.push(...await checkLikeAchievements(user));
        break;
      case 'subscribed':
        newAchievements.push(...await checkSubscriptionAchievements(user));
        break;
      case 'commented':
        newAchievements.push(...await checkCommentAchievements(user));
        break;
      case 'shared':
        newAchievements.push(...await checkShareAchievements(user));
        break;
      case 'video_watched':
        newAchievements.push(...await checkViewAchievements(user));
        break;
      case 'liked':
        newAchievements.push(...await checkLikeGivenAchievements(user));
        break;
    }
    
    // Check champion achievement (based on total badges)
    newAchievements.push(...await checkChampionAchievement(user));
    
    // Check gem collector achievement (based on points)
    newAchievements.push(...await checkGemCollectorAchievement(user));
    
    // Award all new achievements
    const awardedAchievements = [];
    for (const achievement of newAchievements) {
      const awarded = await awardAchievementToUser(user._id, achievement, metadata);
      if (awarded) {
        awardedAchievements.push(awarded);
      }
    }
    
    // Update user's total achievement points
    if (awardedAchievements.length > 0) {
      const totalPoints = awardedAchievements.reduce((sum, ach) => sum + ach.points, 0);
      await User.findByIdAndUpdate(userId, {
        $inc: { totalAchievementPoints: totalPoints }
      });
      
      // Clear cache for this user
      try {
        await redisClient.del(`achievements:user:${userId}`);
        await redisClient.del(`achievements:stats:${userId}`);
      } catch (cacheError) {
        console.error('Cache clear error:', cacheError);
      }
    }
    
    return awardedAchievements;
  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
};

// Check post-related achievements
const checkPostAchievements = async (user) => {
  const achievements = [];
  
  // First post
  if (user.posts.length >= 1) {
    achievements.push(ACHIEVEMENT_CRITERIA.FIRST_POST);
  }
  
  // Content creator (10 posts)
  if (user.posts.length >= 10) {
    achievements.push(ACHIEVEMENT_CRITERIA.CONTENT_CREATOR);
  }
  
  // Video achievements
  const videoPosts = user.posts.filter(post => 
    post.category === 'short' || post.category === 'long'
  );
  
  // Video star (5 videos)
  if (videoPosts.length >= 5) {
    achievements.push(ACHIEVEMENT_CRITERIA.VIDEO_STAR);
  }
  
  // Producer (25 videos)
  if (videoPosts.length >= 25) {
    achievements.push(ACHIEVEMENT_CRITERIA.PRODUCER);
  }
  
  return achievements;
};

// Check follower-related achievements
const checkFollowerAchievements = async (user) => {
  const achievements = [];
  
  // Popular (100 followers)
  if (user.subscriber.length >= 100) {
    achievements.push(ACHIEVEMENT_CRITERIA.POPULAR);
  }
  
  // Superstar (1000 followers)
  if (user.subscriber.length >= 1000) {
    achievements.push(ACHIEVEMENT_CRITERIA.SUPERSTAR);
  }
  
  // Influencer (10000 followers)
  if (user.subscriber.length >= 10000) {
    achievements.push(ACHIEVEMENT_CRITERIA.INFLUENCER);
  }
  
  return achievements;
};

// Check like received achievements
const checkLikeAchievements = async (user) => {
  const achievements = [];
  
  // Calculate total likes received
  const totalLikes = user.posts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
  
  // Heart throb (500 likes)
  if (totalLikes >= 500) {
    achievements.push(ACHIEVEMENT_CRITERIA.HEART_THROB);
  }
  
  // Loveable (2500 likes)
  if (totalLikes >= 2500) {
    achievements.push(ACHIEVEMENT_CRITERIA.LOVEABLE);
  }
  
  return achievements;
};

// Check subscription achievements
const checkSubscriptionAchievements = async (user) => {
  const achievements = [];
  
  // Social butterfly (50 subscriptions)
  if (user.subscribed.length >= 50) {
    achievements.push(ACHIEVEMENT_CRITERIA.SOCIAL_BUTTERFLY);
  }
  
  // Networker (200 subscriptions)
  if (user.subscribed.length >= 200) {
    achievements.push(ACHIEVEMENT_CRITERIA.NETWORKER);
  }
  
  return achievements;
};

// Check comment achievements
const checkCommentAchievements = async (user) => {
  const achievements = [];
  
  // Check if user has commented on 50 posts
  if (user.commentsCount >= 50) {
    achievements.push(ACHIEVEMENT_CRITERIA.COMMENTATOR);
  }
  
  return achievements;
};

// Check share achievements
const checkShareAchievements = async (user) => {
  const achievements = [];
  
  // Check if user has shared 20 posts
  if (user.sharesCount >= 20) {
    achievements.push(ACHIEVEMENT_CRITERIA.SHARER);
  }
  
  return achievements;
};

// Check view achievements
const checkViewAchievements = async (user) => {
  const achievements = [];
  
  // Check if user has watched 100 videos
  if (user.viewsCount >= 100) {
    achievements.push(ACHIEVEMENT_CRITERIA.VIEWER);
  }
  
  return achievements;
};

// Check like given achievements
const checkLikeGivenAchievements = async (user) => {
  const achievements = [];
  
  // Check if user has liked 200 posts
  if (user.likesGivenCount >= 200) {
    achievements.push(ACHIEVEMENT_CRITERIA.LIKE_MASTER);
  }
  
  return achievements;
};

// Check champion achievement
const checkChampionAchievement = async (user) => {
  const achievements = [];
  
  // Get user's achievements from the database
  const userAchievements = await Achievement.find({ userId: user._id });
  const uniqueAchievements = [...new Set(userAchievements.map(a => a.achievementId))];
  
  // Champion (5 different badges)
  if (uniqueAchievements.length >= 5) {
    achievements.push(ACHIEVEMENT_CRITERIA.CHAMPION);
  }
  
  return achievements;
};

// Check gem collector achievement
const checkGemCollectorAchievement = async (user) => {
  const achievements = [];
  
  // Gem collector (1000 points)
  if (user.totalAchievementPoints >= 1000) {
    achievements.push(ACHIEVEMENT_CRITERIA.GEM_COLLECTOR);
  }
  
  return achievements;
};

// Award achievement to user
const awardAchievementToUser = async (userId, achievement, metadata = {}) => {
  try {
    // Check if user already has this achievement
    const existingAchievement = await Achievement.findOne({
      userId,
      achievementId: achievement.id
    });
    
    if (existingAchievement) {
      return null; // User already has this achievement
    }
    
    // Create new achievement
    const newAchievement = new Achievement({
      userId,
      achievementId: achievement.id,
      name: achievement.name,
      description: achievement.description,
      icon: 'achievement',
      rarity: achievement.rarity,
      points: achievement.points,
      metadata
    });
    
    const savedAchievement = await newAchievement.save();
    
    // Add achievement to user's achievements array
    await User.findByIdAndUpdate(userId, {
      $push: {
        achievements: {
          achievementId: achievement.id,
          earnedAt: new Date(),
          metadata
        }
      }
    });
    
    return savedAchievement;
  } catch (error) {
    console.error('Error awarding achievement:', error);
    return null;
  }
};

// Get all achievements
export const getAllAchievements = () => {
  return Object.values(ACHIEVEMENT_CRITERIA);
};

// Get achievement by ID
export const getAchievementById = (id) => {
  return ACHIEVEMENT_CRITERIA[id] || null;
};

export default {
  checkAndAwardAchievements,
  getAllAchievements,
  getAchievementById
};