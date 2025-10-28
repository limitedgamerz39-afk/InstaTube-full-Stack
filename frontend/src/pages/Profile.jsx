import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI, postAPI } from '../services/api';
import socketService from '../services/socket';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';
import { AiOutlineSetting, AiOutlineMessage } from 'react-icons/ai';
import { BsGrid3X3, BsBookmark, BsGear, BsArchive, BsGraphUp, BsCameraVideo } from 'react-icons/bs';
import Highlights from '../components/Highlights';
import VerifiedBadge from '../components/VerifiedBadge';
import { BiLogOut } from 'react-icons/bi';

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchUserProfile();

    // Listen for online status
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
      setIsFollowing(response.data.data.followers.some(
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
    setFollowLoading(true);
    try {
      const response = await userAPI.followUser(user._id);
      setIsFollowing(response.data.isFollowing);
      
      // Update follower count
      setUser((prev) => ({
        ...prev,
        followers: response.data.isFollowing
          ? [...prev.followers, currentUser]
          : prev.followers.filter((f) => f._id !== currentUser._id),
      }));
      
      toast.success(response.data.message);
    } catch (error) {
      toast.error('Failed to follow/unfollow');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  const isOwnProfile = currentUser?._id === user._id;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Cover Image */}
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-purple-400 via-pink-400 to-amber-400 overflow-hidden">
        <img
          src={user.coverImage || '/default-bg.jpg'}
          alt="Cover"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&h=400&fit=crop';
          }}
        />
      </div>
      
      <div className="px-4 pb-8">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-12 mb-12 -mt-16 md:-mt-20">
        {/* Avatar */}
        <div className="relative">
          <img
            src={user.avatar || '/default-avatar.png'}
            alt={user.username}
            className="h-32 w-32 md:h-40 md:w-40 rounded-full object-cover border-4 border-white dark:border-gray-900 shadow-xl"
            onError={(e) => {
              e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.username) + '&background=random&size=200';
            }}
          />
          {/* Online Status - Only for other users */}
          {!isOwnProfile && isOnline && (
            <span className="absolute bottom-2 right-2 w-6 h-6 md:w-8 md:h-8 bg-green-500 border-4 border-white dark:border-gray-900 rounded-full"></span>
          )}
        </div>

        {/* Profile Info */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 mb-4">
            <h1 className="text-2xl font-light dark:text-white">{user.username}</h1>
            
            {isOwnProfile ? (
              <div className="relative">
                <button
                  onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                  className="btn-outline flex items-center space-x-2"
                >
                  <AiOutlineSetting />
                  <span>Settings</span>
                </button>

                {/* Settings Dropdown Menu */}
                {showSettingsMenu && (
                  <div className="absolute top-12 left-0 md:left-auto md:right-0 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-2 border border-gray-200 dark:border-gray-700 z-50 animate-fadeIn">
                    <Link
                      to="/settings"
                      className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white transition"
                      onClick={() => setShowSettingsMenu(false)}
                    >
                      <BsGear size={20} />
                      <div>
                        <p className="font-semibold">Edit Profile</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Change your info</p>
                      </div>
                    </Link>

                    <Link
                      to="/analytics"
                      className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white transition"
                      onClick={() => setShowSettingsMenu(false)}
                    >
                      <BsGraphUp size={20} />
                      <div>
                        <p className="font-semibold">Analytics</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">View insights</p>
                      </div>
                    </Link>

                    <Link
                      to="/saved"
                      className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white transition"
                      onClick={() => setShowSettingsMenu(false)}
                    >
                      <BsBookmark size={20} />
                      <div>
                        <p className="font-semibold">Saved Posts</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">View saved items</p>
                      </div>
                    </Link>

                    <Link
                      to="/archive"
                      className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white transition"
                      onClick={() => setShowSettingsMenu(false)}
                    >
                      <BsArchive size={20} />
                      <div>
                        <p className="font-semibold">Archive</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Hidden posts</p>
                      </div>
                    </Link>

                    <hr className="my-2 border-gray-200 dark:border-gray-700" />

                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500 w-full transition"
                    >
                      <BiLogOut size={20} />
                      <div className="text-left">
                        <p className="font-semibold">Logout</p>
                        <p className="text-xs">Sign out of InstaTube</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`px-8 py-1.5 rounded-lg font-semibold ${
                    isFollowing
                      ? 'btn-secondary'
                      : 'btn-primary'
                  }`}
                >
                  {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                </button>
                <button
                  onClick={() => navigate(`/messages/${user.username}`)}
                  className="px-6 py-1.5 bg-gray-200 dark:bg-dark-border rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center space-x-2"
                >
                  <AiOutlineMessage size={18} />
                  <span>Message</span>
                </button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex justify-center md:justify-start space-x-8 mb-4 dark:text-white">
            <div>
              <span className="font-semibold bg-gradient-primary bg-clip-text text-transparent dark:bg-none dark:text-white">
                {user.posts.length}
              </span>{' '}
              posts
            </div>
            <div>
              <span className="font-semibold bg-gradient-primary bg-clip-text text-transparent dark:bg-none dark:text-white">
                {user.followers.length}
              </span>{' '}
              followers
            </div>
            <div>
              <span className="font-semibold bg-gradient-primary bg-clip-text text-transparent dark:bg-none dark:text-white">
                {user.following.length}
              </span>{' '}
              following
            </div>
          </div>

          {/* Bio */}
          <div>
            <p className="font-semibold flex items-center dark:text-white">
              {user.fullName}
              {user.isVerified && <VerifiedBadge className="ml-2" />}
            </p>
            {user.bio && <p className="text-gray-700 dark:text-gray-300 mt-1">{user.bio}</p>}
            {user.gender && user.gender !== 'prefer_not_to_say' && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Gender: {user.gender}</p>
            )}
          </div>
        </div>
      </div>

      {/* Story Highlights */}
      {isOwnProfile && (
        <div className="border-t border-gray-300 dark:border-dark-border pt-6">
          <Highlights
            highlights={[]}
            onCreateHighlight={() => console.log('Create highlight')}
            onViewHighlight={(h) => console.log('View highlight', h)}
          />
        </div>
      )}

      {/* Posts Grid */}
      <div className="border-t border-gray-300 dark:border-dark-border pt-8">
        <div className="flex items-center justify-center space-x-2 mb-8 text-sm font-semibold text-gray-600">
          <BsGrid3X3 />
          <span>POSTS</span>
        </div>

        {/* Category Tabs */}
        <div className="flex justify-center gap-2 mb-6">
          <button type="button" className={`btn-outline ${selectedCategory==='all'?'ring-2 ring-primary':''}`} onClick={()=>setSelectedCategory('all')}>All</button>
          <button type="button" className={`btn-outline ${selectedCategory==='image'?'ring-2 ring-primary':''}`} onClick={()=>setSelectedCategory('image')}>Images</button>
          <button type="button" className={`btn-outline ${selectedCategory==='short'?'ring-2 ring-primary':''}`} onClick={()=>setSelectedCategory('short')}>Shorts</button>
          <button type="button" className={`btn-outline ${selectedCategory==='long'?'ring-2 ring-primary':''}`} onClick={()=>setSelectedCategory('long')}>Long</button>
        </div>

        {user.posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-xl mb-2">No Posts Yet</p>
            {isOwnProfile && (
              <button
                onClick={() => navigate('/upload')}
                className="btn-primary mt-4"
              >
                Create Your First Post
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 md:gap-4">
            {(user.posts || [])
              .filter((p)=> selectedCategory==='all' ? true : (p.category||p.mediaType)===selectedCategory)
              .map((post) => {
                const isVideo = (post.media && post.media[0]?.type === 'video') || post.mediaType === 'video' || post.category === 'short' || post.category === 'long';
                const durationSec = post.durationSec || 0;
                return (
                  <div
                    key={post._id}
                    onClick={() => navigate(`/post/${post._id}`)}
                    className="aspect-square cursor-pointer group relative overflow-hidden rounded-md"
                  >
                    {isVideo ? (
                      <div className="w-full h-full bg-black flex items-center justify-center">
                        <BsCameraVideo className="text-white opacity-80" size={32} />
                        {durationSec > 0 && (
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                            {Math.floor(durationSec/60)}:{String(durationSec%60).padStart(2,'0')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <img
                        src={post.media?.[0]?.url || post.mediaUrl}
                        alt="Post"
                        className="w-full h-full object-cover"
                      />
                    )}
                    {/* Category Badge */}
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                      {(post.category || (isVideo ? (durationSec>60? 'long':'short') : 'image'))}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default Profile;
