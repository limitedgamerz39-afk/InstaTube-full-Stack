import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI, postAPI } from '../services/api';
import socketService from '../services/socket';
import { toast } from 'react-hot-toast';
import Loader from '../components/Loader';
import { 
  AiOutlineUserAdd, 
  AiOutlineMessage, 
  AiOutlineShareAlt,
  AiOutlineEllipsis,
  AiFillHeart
} from 'react-icons/ai';
import { 
  IoMdPhotos,
  IoMdHeartEmpty,
  IoIosVideocam
} from 'react-icons/io';
import { 
  BsGear,
  BsThreeDots,
  BsGrid3X3,
  BsCameraVideo,
  BsPlayCircle,
  BsChat,
  BsBookmark
} from 'react-icons/bs';
import Highlights from '../components/Highlights';
import VerifiedBadge from '../components/VerifiedBadge';

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [issubscribed, setIssubscribed] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    fetchUserProfile();

    socketService.on('userOnline', (userId) => {
      if (userId === user?._id) {
        setIsOnline(true);
      }
    });

    socketService.on('userOffline', (userId) => {
      if (userId === user?._id) {
        setIsOnline(false);
      }
    });

    return () => {
      socketService.off('userOnline');
      socketService.off('userOffline');
    };
  }, [username, user]);

  const fetchUserProfile = async () => {
    try {
      const response = await userAPI.getProfile(username);
      setUser(response.data.data);
      setIssubscribed(response.data.data.subscriber.some(
        (follower) => follower._id === currentUser?._id
      ));
    } catch (error) {
      toast.error('Failed to load profile');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      toast.error('Please login to subscribe');
      navigate('/login');
      return;
    }
    
    setFollowLoading(true);
    try {
      const response = await userAPI.followUser(user._id);
      setIssubscribed(response.data.issubscribed);
      
      setUser((prev) => ({
        ...prev,
        subscriber: response.data.issubscribed
          ? [...prev.subscriber, currentUser]
          : prev.subscriber.filter((f) => f._id !== currentUser._id),
      }));
      
      toast.success(response.data.message);
    } catch (error) {
      toast.error('Failed to subscribe/unsubscribe');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShareProfile = async () => {
    const profileUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out ${user?.username}'s profile`,
          text: `View ${user?.username}'s profile on our platform`,
          url: profileUrl,
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          await navigator.clipboard.writeText(profileUrl);
          toast.success('Profile link copied to clipboard!');
        }
      }
    } else {
      await navigator.clipboard.writeText(profileUrl);
      toast.success('Profile link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  const isOwnProfile = currentUser?._id === user?._id;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Enhanced filtering for different content types
  const filteredPosts = user?.posts?.filter(post => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'videos') return post.category === 'long';
    if (selectedCategory === 'shorts') return post.category === 'short';
    if (selectedCategory === 'saved') return post.saved; // Assuming saved posts have this property
    return false;
  }) || [];

  // Separate videos and shorts
  const videos = user?.posts?.filter(post => post.category === 'long') || [];
  const shorts = user?.posts?.filter(post => post.category === 'short') || [];
  const allPosts = user?.posts || [];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between p-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Go back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h1 className="text-lg font-semibold truncate max-w-[60%]">
            {user?.username}
          </h1>
          
          <button 
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="More options"
          >
            <BsThreeDots className="w-6 h-6" />
          </button>
        </div>
        
        {/* Mobile settings menu */}
        {showSettingsMenu && (
          <div className="absolute right-4 top-16 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 w-48">
            <button 
              onClick={handleShareProfile}
              className="flex items-center w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
            >
              <AiOutlineShareAlt className="w-5 h-5 mr-2" />
              Share Profile
            </button>
            
            {isOwnProfile ? (
              <>
                <Link 
                  to="/settings" 
                  className="flex items-center w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <BsGear className="w-5 h-5 mr-2" />
                  Settings
                </Link>
                <button 
                  onClick={handleLogout}
                  className="flex items-center w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg text-red-500"
                >
                  <AiOutlineLogout className="w-5 h-5 mr-2" />
                  Logout
                </button>
              </>
            ) : (
              <button 
                onClick={handleFollow}
                disabled={followLoading}
                className={`flex items-center w-full p-3 text-left rounded-b-lg ${
                  issubscribed 
                    ? 'hover:bg-gray-100 dark:hover:bg-gray-700' 
                    : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                }`}
              >
                {followLoading ? (
                  <>
                    <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </>
                ) : issubscribed ? (
                  <>
                    <AiOutlineUserAdd className="w-5 h-5 mr-2" />
                    Unsubscribe
                  </>
                ) : (
                  <>
                    <AiOutlineUserAdd className="w-5 h-5 mr-2" />
                    Subscribe
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
      
      <div className="max-w-4xl mx-auto">
        {/* Enhanced Cover Section */}
        <div className="relative">
          {/* Cover Image with Gradient Overlay */}
          <div className="relative h-40 md:h-56 lg:h-72 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 overflow-hidden">
            <img
              src={user?.coverImage || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&h=400&fit=crop'}
              alt="Cover"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&h=400&fit=crop';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>

          {/* Profile Content */}
          <div className="relative px-4 md:px-6 lg:px-8 -mt-16 md:-mt-20">
            <div className="max-w-4xl mx-auto w-full">
              {/* Profile Header */}
              <div className="flex flex-col md:flex-row items-center md:items-end space-y-6 md:space-y-0 md:space-x-8 mb-8 w-full">
                {/* Enhanced Avatar with Status */}
                <div className="relative">
                  <div className="relative">
                    <img
                      src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=random&size=200`}
                      alt={user?.username}
                      className="h-28 w-28 md:h-36 md:w-36 lg:h-44 lg:w-44 rounded-full object-cover border-4 border-white dark:border-gray-900 shadow-2xl hover:shadow-3xl transition-all duration-300 cursor-pointer"
                      onClick={() => isOwnProfile && navigate('/settings')}
                    />
                    
                    {/* Online Status Badge */}
                    {!isOwnProfile && isOnline && (
                      <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                    )}
                  </div>
                </div>
                
                {/* Profile Info */}
                <div className="flex-1 w-full">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center space-x-3 mb-4 md:mb-0">
                      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                        {user?.username}
                      </h1>
                      {user?.isVerified && (
                        <span className="text-blue-500">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>
                    
                    {/* Desktop Action Buttons - hidden on mobile */}
                    <div className="hidden md:flex items-center space-x-3">
                      {isOwnProfile ? (
                        <>
                          <Link 
                            to="/settings" 
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            Edit Profile
                          </Link>
                          <button 
                            onClick={handleShareProfile}
                            className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Share profile"
                          >
                            <AiOutlineShareAlt className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={handleFollow}
                            disabled={followLoading}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                              issubscribed
                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                                : 'bg-red-500 text-white hover:bg-red-600'
                            }`}
                          >
                            {followLoading ? (
                              <svg className="animate-spin w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : issubscribed ? (
                              'Subscribed'
                            ) : (
                              'Subscribe'
                            )}
                          </button>
                          <Link 
                            to={`/messages/${user?.username}`}
                            className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Send message"
                          >
                            <AiOutlineMessage className="w-5 h-5" />
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* User Stats */}
                  <div className="mt-4 flex space-x-6">
                    <div className="text-center">
                      <div className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                        {user?.posts?.length || 0}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                        {user?.subscriber?.length || 0}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Subscribers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                        {user?.subscribed?.length || 0}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Subscribed</div>
                    </div>
                  </div>
                  
                  {/* User Bio */}
                  <div className="mt-4">
                    <p className="text-gray-900 dark:text-white font-medium">
                      {user?.fullName}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 mt-1">
                      {user?.bio || 'No bio yet'}
                    </p>
                    {user?.website && (
                      <a 
                        href={user.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline mt-1 inline-block"
                      >
                        {user.website}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile Action Buttons - only visible on mobile */}
        <div className="md:hidden px-4 py-3 border-t border-gray-200 dark:border-gray-800">
          <div className="flex space-x-2">
            {isOwnProfile ? (
              <Link 
                to="/settings" 
                className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Edit Profile
              </Link>
            ) : (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`flex-1 py-2 rounded-lg transition-colors ${
                  issubscribed
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {followLoading ? (
                  <svg className="animate-spin w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : issubscribed ? (
                  'Subscribed'
                ) : (
                  'Subscribe'
                )}
              </button>
            )}
            <Link 
              to={isOwnProfile ? "/messages" : `/messages/${user?.username}`}
              className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Send message"
            >
              <AiOutlineMessage className="w-5 h-5" />
            </Link>
          </div>
        </div>
        
        {/* Content Tabs */}
        <div className="border-t border-gray-200 dark:border-gray-800 mt-4">
          <div className="flex overflow-x-auto hide-scrollbar px-4">
            {[
              { id: 'all', label: 'All Posts', icon: BsGrid3X3 },
              { id: 'videos', label: 'Videos', icon: IoIosVideocam },
              { id: 'shorts', label: 'Shorts', icon: BsPlayCircle },
              { id: 'saved', label: 'Saved', icon: BsBookmark }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`flex items-center px-4 py-3 whitespace-nowrap border-b-2 font-medium text-sm ${
                  selectedCategory === tab.id
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Content Grid */}
        <div className="p-4">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-10">
              <div className="mx-auto w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <BsGrid3X3 className="w-8 h-8 text-gray-400" />
              </div>
              <p className="mt-4 text-gray-500 dark:text-gray-400">
                {isOwnProfile ? 'You haven\'t posted anything yet' : 'No posts yet'}
              </p>
              {isOwnProfile && (
                <Link 
                  to="/upload" 
                  className="mt-4 inline-block px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Create Post
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 sm:gap-2">
              {filteredPosts.map((post) => (
                <div 
                  key={post._id} 
                  className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden relative cursor-pointer"
                  onClick={() => navigate(`/post/${post._id}`)}
                >
                  <img 
                    src={post.thumbnailUrl || post.mediaUrl} 
                    alt="Post"
                    className="w-full h-full object-cover"
                  />
                  {post.category === 'short' && (
                    <div className="absolute bottom-1 right-1 bg-black/50 text-white rounded px-1 py-0.5 text-xs">
                      <BsPlayCircle className="w-3 h-3" />
                    </div>
                  )}
                  {(post.likes?.length > 0 || post.comments?.length > 0) && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-2">
                      <div className="flex items-center text-white text-xs space-x-2">
                        <div className="flex items-center">
                          <AiFillHeart className="w-3 h-3 mr-1" />
                          <span>{post.likes?.length || 0}</span>
                        </div>
                        <div className="flex items-center">
                          <BsChat className="w-3 h-3 mr-1" />
                          <span>{post.comments?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;