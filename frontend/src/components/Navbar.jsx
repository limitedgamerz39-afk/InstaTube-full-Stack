import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  AiOutlineHome,
  AiFillHome,
  AiOutlineSearch,
  AiOutlinePlusSquare,
  AiOutlineHeart,
  AiFillHeart,
  AiOutlineMessage,
  AiFillMessage,
} from 'react-icons/ai';
import { BsSun, BsMoon, BsCompass, BsFilm } from 'react-icons/bs';
import { FiShield, FiLogOut, FiSettings, FiBookmark, FiUser } from 'react-icons/fi';
import { notificationAPI, messageAPI } from '../services/api';
import socketService from '../services/socket';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const showSearch = !location.pathname.startsWith('/messages');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {
    fetchUnreadCount();
    fetchMessageCount();

    const handleNotification = () => {
      setUnreadCount((prev) => prev + 1);
    };

    const handleNewMessage = (message) => {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/messages')) {
        setMessageCount((prev) => prev + 1);
      }
    };

    const handleMessagesViewed = () => {
      setMessageCount(0);
    };

    socketService.on('notification', handleNotification);
    socketService.on('newMessage', handleNewMessage);
    window.addEventListener('messagesViewed', handleMessagesViewed);

    const handleCallInvite = (payload) => {
      setIncomingCall(payload);
    };
    const handleCallDecline = () => {
      setIncomingCall(null);
    };
    socketService.on('call:invite', handleCallInvite);
    socketService.on('call:decline', handleCallDecline);

    return () => {
      socketService.off('notification', handleNotification);
      socketService.off('newMessage', handleNewMessage);
      window.removeEventListener('messagesViewed', handleMessagesViewed);
      socketService.off('call:invite', handleCallInvite);
      socketService.off('call:decline', handleCallDecline);
    };
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getNotifications();
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchMessageCount = async () => {
    try {
      const response = await messageAPI.getUnreadCount();
      setMessageCount(response.data.data.count);
    } catch (error) {
      console.error('Error fetching message count:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${searchQuery}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white/90 dark:bg-dark-bg/90 border-b border-gray-200/50 dark:border-dark-border/50 sticky top-0 z-50 backdrop-blur-2xl shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-sunset rounded-2xl blur-lg opacity-70 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-gradient-sunset p-2.5 rounded-2xl shadow-glow">
                <span className="text-2xl font-black text-white">IT</span>
              </div>
            </div>
            <span className="text-2xl font-black gradient-text hidden md:block">InstaTube</span>
          </Link>

          {/* Search Bar - Desktop */}
          {showSearch && (
            <form onSubmit={handleSearch} className="hidden md:block flex-1 max-w-md mx-8">
              <div className="relative">
                <AiOutlineSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search InstaTube..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-dark-card/80 text-gray-900 dark:text-white border-2 border-transparent rounded-2xl focus:outline-none focus:border-primary-400 focus:bg-white dark:focus:bg-dark-card-hover focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30 transition-all duration-200 placeholder:text-gray-400"
                />
              </div>
            </form>
          )}

          {/* Navigation Icons - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            {/* Home */}
            <Link 
              to="/" 
              className={`p-3 rounded-xl transition-all duration-200 ${
                isActive('/') 
                  ? 'bg-gradient-primary text-white shadow-glow-primary' 
                  : 'hover:bg-gray-100 dark:hover:bg-dark-card text-gray-600 dark:text-gray-400 hover:scale-110'
              }`}
            >
              {isActive('/') ? <AiFillHome size={24} /> : <AiOutlineHome size={24} />}
            </Link>

            {/* Explore */}
            <Link 
              to="/explore" 
              className={`p-3 rounded-xl transition-all duration-200 ${
                isActive('/explore') 
                  ? 'bg-gradient-secondary text-white shadow-glow-secondary' 
                  : 'hover:bg-gray-100 dark:hover:bg-dark-card text-gray-600 dark:text-gray-400 hover:scale-110'
              }`}
            >
              <BsCompass size={22} />
            </Link>

            {/* Reels */}
            <Link 
              to="/reels" 
              className={`p-3 rounded-xl transition-all duration-200 ${
                isActive('/reels') 
                  ? 'bg-gradient-sunset text-white shadow-glow' 
                  : 'hover:bg-gray-100 dark:hover:bg-dark-card text-gray-600 dark:text-gray-400 hover:scale-110'
              }`}
            >
              <BsFilm size={22} />
            </Link>

            {/* Messages */}
            <Link 
              to="/messages" 
              className={`p-3 rounded-xl transition-all duration-200 relative ${
                isActive('/messages') 
                  ? 'bg-gradient-ocean text-white shadow-glow-accent' 
                  : 'hover:bg-gray-100 dark:hover:bg-dark-card text-gray-600 dark:text-gray-400 hover:scale-110'
              }`}
            >
              {isActive('/messages') ? <AiFillMessage size={24} /> : <AiOutlineMessage size={24} />}
              {messageCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-info-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center font-bold shadow-lg border-2 border-white dark:border-dark-bg animate-pulse-slow">
                  {messageCount > 9 ? '9+' : messageCount}
                </span>
              )}
            </Link>

            {/* Upload */}
            <Link 
              to="/upload" 
              className="p-3 rounded-xl bg-gradient-primary hover:bg-gradient-sunset text-white shadow-glow-primary hover:shadow-glow transition-all duration-200 hover:scale-110"
            >
              <AiOutlinePlusSquare size={24} />
            </Link>

            {/* Notifications */}
            <Link 
              to="/notifications" 
              className={`p-3 rounded-xl transition-all duration-200 relative ${
                isActive('/notifications') 
                  ? 'bg-gradient-to-r from-danger-400 to-danger-600 text-white shadow-glow' 
                  : 'hover:bg-gray-100 dark:hover:bg-dark-card text-gray-600 dark:text-gray-400 hover:scale-110'
              }`}
            >
              {isActive('/notifications') ? <AiFillHeart size={24} /> : <AiOutlineHeart size={24} />}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-danger-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center font-bold shadow-lg border-2 border-white dark:border-dark-bg animate-pulse-slow">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-card text-gray-600 dark:text-gray-400 transition-all duration-200 hover:scale-110"
              aria-label="Toggle theme"
            >
              {isDark ? <BsSun size={22} className="text-warning-400" /> : <BsMoon size={22} />}
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="focus:outline-none group"
              >
                <div className="relative">
                  <img
                    src={user?.avatar}
                    alt={user?.username}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-gray-200 dark:ring-dark-border group-hover:ring-primary-400 transition-all duration-200"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-success-500 rounded-full border-2 border-white dark:border-dark-bg"></div>
                </div>
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}></div>
                  <div className="absolute right-0 mt-3 w-64 card p-2 z-50 animate-scale-in">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-dark-border">
                      <p className="font-bold text-gray-900 dark:text-white">{user?.fullName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">@{user?.username}</p>
                    </div>
                    
                    <div className="py-2 space-y-1">
                      <Link
                        to={`/profile/${user?.username}`}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-card-hover text-gray-700 dark:text-gray-300 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <FiUser className="w-5 h-5" />
                        <span className="font-medium">Profile</span>
                      </Link>
                      <Link
                        to="/saved"
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-card-hover text-gray-700 dark:text-gray-300 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <FiBookmark className="w-5 h-5" />
                        <span className="font-medium">Saved</span>
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-card-hover text-gray-700 dark:text-gray-300 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <FiSettings className="w-5 h-5" />
                        <span className="font-medium">Settings</span>
                      </Link>
                      
                      {user?.role === 'admin' && (
                        <>
                          <div className="my-2 border-t border-gray-200 dark:border-dark-border"></div>
                          <Link
                            to="/admin"
                            className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 hover:from-primary-100 hover:to-accent-100 dark:hover:from-primary-900/30 dark:hover:to-accent-900/30 transition-all"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <FiShield className="w-5 h-5 text-primary-500" />
                            <span className="font-bold gradient-text">Admin Panel</span>
                          </Link>
                        </>
                      )}
                    </div>

                    <div className="pt-2 mt-2 border-t border-gray-200 dark:border-dark-border">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl hover:bg-danger-50 dark:hover:bg-danger-900/20 text-danger-500 transition-colors"
                      >
                        <FiLogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar - Mobile */}
        {showSearch && (
          <form onSubmit={handleSearch} className="md:hidden pb-4">
            <div className="relative">
              <AiOutlineSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search InstaTube..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-dark-card text-gray-900 dark:text-white border-2 border-transparent rounded-2xl focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30 transition-all duration-200 placeholder:text-gray-400"
              />
            </div>
          </form>
        )}
      </div>

      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="card max-w-sm w-full p-6 space-y-4 animate-scale-in">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-sunset rounded-full flex items-center justify-center mx-auto mb-4 animate-glow-pulse">
                <span className="text-3xl">📞</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Incoming {incomingCall.type || 'call'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">From: {incomingCall.from}</p>
            </div>
            <div className="flex gap-3">
              <button
                className="flex-1 btn-outline"
                onClick={() => {
                  socketService.emit('call:decline', { to: incomingCall.from, roomId: incomingCall.roomId });
                  setIncomingCall(null);
                }}
              >
                Decline
              </button>
              <button
                className="flex-1 btn-gradient"
                onClick={() => {
                  const roomId = incomingCall.roomId;
                  setIncomingCall(null);
                  navigate(`/audio-call/${roomId}`);
                }}
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
