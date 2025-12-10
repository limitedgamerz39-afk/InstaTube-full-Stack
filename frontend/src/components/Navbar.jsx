import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useVideo } from '../context/VideoContext';
import { useUserSuggestions } from '../services/queryClient';
import {
  AiOutlineHome,
  AiFillHome,
  AiOutlineSearch,
  AiOutlinePlusSquare,
  AiOutlineHeart,
  AiFillHeart,
  AiOutlineMessage,
  AiFillMessage,
  AiOutlineMenu,
  AiOutlineUserAdd,
  AiOutlineBook,
  AiOutlineCompass,
  AiOutlinePlaySquare,
  AiOutlineGroup,
  AiOutlineSetting,
  AiOutlineLogout,
  AiOutlineUser,
  AiOutlineCheckCircle
} from 'react-icons/ai';
import { 
  BsSun, 
  BsMoon, 
  BsCompass, 
  BsFilm, 
  BsCameraReelsFill,
  BsBookmark,
  BsHeart,
  BsClock,
  BsPlayBtn,
  BsPeople,
  BsGrid3X2Gap
} from 'react-icons/bs';
import { FiShield, FiLogOut, FiSettings, FiBookmark, FiUser, FiX } from 'react-icons/fi';
import { IoMdClose, IoMdHome, IoMdSearch } from 'react-icons/io';
import { notificationAPI, messageAPI } from '../services/api';
import socketService from '../services/socket';
import OptimizedImage from './OptimizedImage';
import RoleBasedMenu from './RoleBasedMenu';

export default function Navbar({ setMobileSidebarOpen }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { isVideoPlaying } = useVideo();
  const { data: suggestionsData } = useUserSuggestions();
  const suggestions = suggestionsData?.data?.data || [];
  const navigate = useNavigate();
  const location = useLocation();
  const showSearch = !location.pathname.startsWith('/messages') && location.pathname !== '/search';
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  
  // Ensure counts are always valid numbers
  const validUnreadCount = !isNaN(unreadCount) && isFinite(unreadCount) ? Math.max(0, parseInt(unreadCount, 10)) : 0;
  const validMessageCount = !isNaN(messageCount) && isFinite(messageCount) ? Math.max(0, parseInt(messageCount, 10)) : 0;
  const [incomingCall, setIncomingCall] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const prevScrollPos = useRef(window.scrollY);
  const userMenuRef = useRef(null);
  
  // Handle click outside to close user menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle menu item clicks with proper event handling
  const handleMenuItemClick = (e) => {
    // Prevent the menu from closing immediately
    e.stopPropagation();
    // Close the menu after a short delay to allow navigation
    setTimeout(() => setShowUserMenu(false), 100);
  };

  // Handle scroll to hide/show navbar
  useEffect(() => {
    const handleScroll = () => {
      // If a video is playing, keep navbar visible
      if (isVideoPlaying) {
        setIsVisible(true);
        return;
      }
      
      const currentScrollPos = window.scrollY;
      const isScrollingDown = currentScrollPos > prevScrollPos.current;
      
      // Only hide when scrolling down and past a certain threshold
      if (currentScrollPos > 100) {
        setIsVisible(!isScrollingDown);
      } else {
        // Always show navbar when near top of page
        setIsVisible(true);
      }
      
      prevScrollPos.current = currentScrollPos;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isVideoPlaying]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only trigger if not in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      // Alt key combinations for navigation
      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'h':
            e.preventDefault();
            navigate('/');
            break;
          case 'e':
            e.preventDefault();
            navigate('/explore');
            break;
          case 'r':
            e.preventDefault();
            navigate('/reels');
            break;
          case 's':
            e.preventDefault();
            if (showSearch) {
              navigate('/search');
            }
            break;
          case 'n':
            e.preventDefault();
            navigate('/upload');
            break;
          case 'm':
            e.preventDefault();
            navigate('/messages');
            break;
          case 'p':
            e.preventDefault();
            navigate(`/profile/${user?.username}`);
            break;
          case 'g':
            e.preventDefault();
            navigate('/groups');
            break;
          default:
            break;
        }
      }
      
      // Escape key to close user menu
      if (e.key === 'Escape') {
        setShowUserMenu(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, showSearch, user?.username]);

  // Fetch notification and message counts
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      // Ensure we have a valid number, default to 0 if not
      const count = parseInt(response?.data?.data?.count, 10);
      const validCount = isNaN(count) || count < 0 ? 0 : count;
      setUnreadCount(validCount);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      // Set to 0 on error to prevent NaN
      setUnreadCount(0);
    }
  }, []);

  const fetchMessageCount = useCallback(async () => {
    try {
      const response = await messageAPI.getUnreadCount();
      // Ensure we have a valid number, default to 0 if not
      const count = parseInt(response?.data?.data?.count, 10);
      const validCount = isNaN(count) || count < 0 ? 0 : count;
      setMessageCount(validCount);
    } catch (error) {
      console.error('Failed to fetch message count:', error);
      // Set to 0 on error to prevent NaN
      setMessageCount(0);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    fetchMessageCount();

    const handleNotification = () => {
      setUnreadCount((prev) => {
        const current = parseInt(prev, 10) || 0;
        return (isNaN(current) || current < 0) ? 1 : current + 1;
      });
    };

    const handleNewMessage = (message) => {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/messages')) {
        setMessageCount((prev) => {
          const current = parseInt(prev, 10) || 0;
          return (isNaN(current) || current < 0) ? 1 : current + 1;
        });
      }
    };

    const handleMessagesViewed = () => {
      setMessageCount(0);
    };

    const handleNotificationsViewed = () => {
      setUnreadCount(0);
    };

    socketService.on('notification', handleNotification);
    socketService.on('newMessage', handleNewMessage);
    window.addEventListener('messagesViewed', handleMessagesViewed);
    window.addEventListener('notificationsViewed', handleNotificationsViewed);

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
      window.removeEventListener('notificationsViewed', handleNotificationsViewed);
      socketService.off('call:invite', handleCallInvite);
      socketService.off('call:decline', handleCallDecline);
    };
  }, [fetchUnreadCount, fetchMessageCount]);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const isActive = (path) => location.pathname === path;

  // Close dropdown when navigating to a new page
  useEffect(() => {
    setShowUserMenu(false);
  }, [location.pathname]);

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="hidden md:flex items-center justify-between px-4 py-3 bg-white dark:bg-dark-bg shadow-sm sticky top-0 z-50">
        <div className="flex items-center space-x-6 lg:space-x-10">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0" aria-label="D4D HUB home">
            <div className="bg-gradient-to-r from-primary-500 to-secondary-600 p-2 rounded-xl">
              <img src="/logo_icon.png" alt="D4D HUB Logo" className="w-6 h-6" />
            </div>
            <span className="text-lg font-black gradient-text hidden lg:block">D4D HUB</span>
          </Link>
        </div>

        {/* Search Bar - Desktop */}
        {showSearch && (
          <div className="hidden md:block flex-1 max-w-xs lg:max-w-md mx-4">
            <div className="relative">
              <AiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 lg:w-5 lg:h-5" />
              <input
                type="text"
                placeholder="Search D4D HUB..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (searchQuery.trim()) {
                      navigate(`/search?q=${searchQuery}`);
                    }
                  }
                }}
                className="w-full pl-10 pr-4 py-2 lg:py-3 bg-gray-100 dark:bg-dark-card/80 text-gray-900 dark:text-white border-2 border-transparent rounded-2xl focus:outline-none focus:border-primary-400 focus:bg-white dark:focus:bg-dark-card-hover focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30 transition-all duration-200 placeholder:text-gray-400 text-sm lg:text-base"
                aria-label="Search D4D HUB"
              />
            </div>
          </div>
        )}

        {/* Right Side Icons */}
        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Show Home and other navigation buttons for non-business users */}
          {user?.role !== 'business' && (
            <>
              {/* Home */}
              <Link 
                to="/" 
                className={`p-2 lg:p-3 rounded-xl transition-all duration-200 ${
                  isActive('/') 
                    ? 'bg-gradient-to-r from-primary-500 to-secondary-600 text-white shadow-glow-primary' 
                    : 'hover:bg-gray-100 dark:hover:bg-dark-card text-gray-600 dark:text-gray-400 hover:scale-110'
                }`}
                title="Home (Alt+H)"
                aria-label="Home"
              >
                {isActive('/') ? <AiFillHome size={20} className="lg:w-6 lg:h-6" /> : <AiOutlineHome size={20} className="lg:w-6 lg:h-6" />}
              </Link>

              {/* Messages */}
              <Link 
                to="/messages" 
                className={`p-2 lg:p-3 rounded-xl transition-all duration-200 relative ${
                  isActive('/messages') 
                    ? 'bg-gradient-to-r from-primary-500 to-secondary-600 text-white shadow-glow-primary' 
                    : 'hover:bg-gray-100 dark:hover:bg-dark-card text-gray-600 dark:text-gray-400 hover:scale-110'
                }`}
                title="Messages (Alt+M)"
                aria-label={`Messages${messageCount > 0 ? `, ${messageCount} unread` : ''}`}
              >
                {messageCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 lg:h-5 lg:w-5 flex items-center justify-center" aria-label={`${messageCount} unread messages`}>
                    {messageCount > 9 ? '9+' : (isNaN(messageCount) || messageCount < 0 || !isFinite(messageCount) ? 0 : messageCount)}
                  </span>
                )}
                {isActive('/messages') ? <AiFillMessage size={20} className="lg:w-6 lg:h-6" /> : <AiOutlineMessage size={20} className="lg:w-6 lg:h-6" />}
              </Link>

              {/* Create Post */}
              <Link 
                to="/upload" 
                className="p-2 lg:p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-card text-gray-600 dark:text-gray-400 hover:scale-110 transition-all duration-200"
                title="Create Post (Alt+N)"
                aria-label="Create Post"
              >
                <AiOutlinePlusSquare size={20} className="lg:w-6 lg:h-6" />
              </Link>
            </>
          )}

          {/* Notifications - Show for all users */}
          <Link 
            to="/notifications" 
            className={`p-2 lg:p-3 rounded-xl transition-all duration-200 relative ${
              isActive('/notifications') 
                ? 'bg-gradient-to-r from-primary-500 to-secondary-600 text-white shadow-glow-primary' 
                : 'hover:bg-gray-100 dark:hover:bg-dark-card text-gray-600 dark:text-gray-400 hover:scale-110'
            }`}
            title="Notifications"
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          >
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 lg:h-5 lg:w-5 flex items-center justify-center" aria-label={`${unreadCount} unread notifications`}>
                {unreadCount > 9 ? '9+' : (isNaN(unreadCount) || unreadCount < 0 || !isFinite(unreadCount) ? 0 : unreadCount)}
              </span>
            )}
            {isActive('/notifications') ? <AiFillHeart size={20} className="lg:w-6 lg:h-6" /> : <AiOutlineHeart size={20} className="lg:w-6 lg:h-6" />}
          </Link>

          {/* User Profile */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 rounded-full overflow-hidden hover:scale-110 transition-transform duration-200"
              title="Profile (Alt+P)"
              aria-label="User profile menu"
              aria-expanded={showUserMenu}
              aria-haspopup="true"
            >
              <OptimizedImage
                src={user?.avatar || '/default-avatar.png'}
                alt={user?.username}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.username || 'U') + '&background=random&size=200';
                }}
              />
            </button>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 animate-fadeIn">
                {/* User Profile Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-gray-700 dark:to-gray-800 rounded-t-2xl">
                  <div className="flex items-center space-x-3">
                    <OptimizedImage
                      src={user?.avatar || '/default-avatar.png'}
                      alt={user?.username}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-primary-500"
                      onError={(e) => {
                        // First try ui-avatars
                        const fallbackSrc = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.username || 'U') + '&background=random&size=200';
                        e.target.src = fallbackSrc;
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <Link 
                        to={`/profile/${user?.username}`}
                        onClick={() => setShowUserMenu(false)}
                        className="font-bold text-gray-900 dark:text-white truncate hover:underline text-lg"
                      >
                        {user?.fullName || user?.username}
                      </Link>
                      <Link 
                        to={`/profile/${user?.username}`}
                        onClick={() => setShowUserMenu(false)}
                        className="text-sm text-gray-600 dark:text-gray-300 truncate hover:underline"
                      >
                        @{user?.username}
                      </Link>
                      <div className="flex items-center mt-1 space-x-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          user?.role === 'admin' 
                            ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200' 
                            : user?.role === 'creator' 
                            ? 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-200' 
                            : user?.role === 'business' 
                            ? 'bg-accent-100 text-accent-800 dark:bg-accent-900 dark:text-accent-200' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                        </span>
                        {user?.isVerified && (
                          <AiOutlineCheckCircle className="text-blue-500 dark:text-blue-400" title="Verified Account" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Quick Actions - Only for non-business users */}
                {user?.role !== 'business' && (
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                    <div className="grid grid-cols-3 gap-2">
                      <Link 
                        to="/upload"
                        onClick={() => setShowUserMenu(false)}
                        className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <AiOutlinePlusSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        <span className="text-xs mt-1 text-gray-700 dark:text-gray-300">Create</span>
                      </Link>
                      <Link 
                        to="/messages"
                        onClick={() => setShowUserMenu(false)}
                        className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <AiOutlineMessage className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                        <span className="text-xs mt-1 text-gray-700 dark:text-gray-300">Messages</span>
                      </Link>
                      <button 
                        onClick={() => {
                          toggleTheme();
                          setShowUserMenu(false);
                        }}
                        className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        {isDark ? (
                          <BsSun className="w-5 h-5 text-yellow-500" />
                        ) : (
                          <BsMoon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        )}
                        <span className="text-xs mt-1 text-gray-700 dark:text-gray-300">{isDark ? 'Light' : 'Dark'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Role-based Menu Items */}
                <RoleBasedMenu onClose={() => setShowUserMenu(false)} isActive={isActive} />

                {/* Subscriptions Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 py-2">
                  <h3 className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 flex items-center justify-between">
                    <span>SUBSCRIPTIONS</span>
                    <Link 
                      to="/subscriptions" 
                      onClick={() => setShowUserMenu(false)}
                      className="text-xs font-normal text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      View All
                    </Link>
                  </h3>
                  <div className="px-2">
                    {suggestions.slice(0, 3).map((suggestionUser) => (
                      <Link
                        key={suggestionUser._id}
                        to={`/profile/${suggestionUser.username}`}
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center space-x-3 px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors rounded-lg mx-2"
                      >
                        <img
                          src={suggestionUser.avatar}
                          alt={suggestionUser.username}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-600"
                          onError={(e) => {
                            e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(suggestionUser.username) + '&background=random&size=200';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium text-sm">{suggestionUser.username}</p>
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {(suggestionUser.subscriber?.length && !isNaN(suggestionUser.subscriber.length)) ? suggestionUser.subscriber.length : 0} subscribers
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Navbar */}
      <nav className={`md:hidden flex items-center justify-between px-4 py-5 bg-white dark:bg-dark-bg shadow-sm sticky top-0 z-50 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-3" aria-label="D4D HUB home">
          <div className="bg-gradient-to-r from-primary-500 to-secondary-600 p-1.5 rounded-lg">
            <img src="/logo_icon.png" alt="D4D HUB Logo" className="w-5 h-5" />
          </div>
          <span className="text-lg font-black gradient-text">D4D HUB</span>
        </Link>

       
        {/* Right Side Icons - Mobile */}
        <div className="flex items-center space-x-3">
          {/* Search Icon - Mobile */}
          {showSearch && (
            <button
              onClick={() => navigate('/search')}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-card text-gray-600 dark:text-gray-400"
              aria-label="Search"
            >
              <AiOutlineSearch size={24} />
            </button>
          )}

          {/* Show Notifications for all users */}
          <Link 
            to="/notifications" 
            className={`p-2 rounded-xl transition-all duration-200 relative ${
              isActive('/notifications') 
                ? 'bg-gradient-to-r from-primary-500 to-secondary-600 text-white shadow-glow-primary' 
                : 'hover:bg-gray-100 dark:hover:bg-dark-card text-gray-600 dark:text-gray-400'
            }`}
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          >
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center" aria-label={`${unreadCount} unread notifications`}>
                {unreadCount > 9 ? '9+' : (isNaN(unreadCount) || unreadCount < 0 || !isFinite(unreadCount) ? 0 : unreadCount)}
              </span>
            )}
            {isActive('/notifications') ? <AiFillHeart size={24} /> : <AiOutlineHeart size={24} />}
          </Link>

          {/* User Profile Menu - Mobile */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden hover:scale-110 transition-transform duration-200"
              aria-label="User profile menu"
              aria-expanded={showUserMenu}
              aria-haspopup="true"
            >
              <OptimizedImage
                src={user?.avatar || '/default-avatar.png'}
                alt={user?.username}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.username || 'U') + '&background=random&size=200';
                }}
              />
            </button>

            {/* User Menu Dropdown - Mobile */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-[9999] animate-fadeIn">
                {/* User Profile Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-gray-700 dark:to-gray-800 rounded-t-2xl">
                  <div className="flex items-center space-x-3">
                    <OptimizedImage
                      src={user?.avatar || '/default-avatar.png'}
                      alt={user?.username}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-primary-500"
                      onError={(e) => {
                        // First try ui-avatars
                        const fallbackSrc = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.username || 'U') + '&background=random&size=200';
                        e.target.src = fallbackSrc;
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white truncate text-lg">
                        {user?.fullName || user?.username}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                        @{user?.username}
                      </p>
                      <div className="flex items-center mt-1 space-x-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          user?.role === 'admin' 
                            ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200' 
                            : user?.role === 'creator' 
                            ? 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-200' 
                            : user?.role === 'business' 
                            ? 'bg-accent-100 text-accent-800 dark:bg-accent-900 dark:text-accent-200' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                        </span>
                        {user?.isVerified && (
                          <AiOutlineCheckCircle className="text-blue-500 dark:text-blue-400" title="Verified Account" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
        
                {/* Quick Actions - Only for non-business users */}
                {user?.role !== 'business' && (
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                    <div className="grid grid-cols-3 gap-2">
                      <Link 
                        to="/upload"
                        onClick={() => setShowUserMenu(false)}
                        className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <AiOutlinePlusSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        <span className="text-xs mt-1 text-gray-700 dark:text-gray-300">Create</span>
                      </Link>
                      <Link 
                        to="/messages"
                        onClick={() => setShowUserMenu(false)}
                        className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <AiOutlineMessage className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                        <span className="text-xs mt-1 text-gray-700 dark:text-gray-300">Messages</span>
                      </Link>
                      <button 
                        onClick={() => {
                          toggleTheme();
                          setShowUserMenu(false);
                        }}
                        className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        {isDark ? (
                          <BsSun className="w-5 h-5 text-yellow-500" />
                        ) : (
                          <BsMoon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        )}
                        <span className="text-xs mt-1 text-gray-700 dark:text-gray-300">{isDark ? 'Light' : 'Dark'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Role-based Menu Items */}
                <RoleBasedMenu onClose={() => setShowUserMenu(false)} isActive={isActive} />

                {/* Subscriptions Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 py-2">
                  <h3 className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 flex items-center justify-between">
                    <span>SUBSCRIPTIONS</span>
                    <Link 
                      to="/subscriptions" 
                      onClick={() => setShowUserMenu(false)}
                      className="text-xs font-normal text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      View All
                    </Link>
                  </h3>
                  <div className="px-2">
                    {suggestions.slice(0, 3).map((suggestionUser) => (
                      <Link
                        key={suggestionUser._id}
                        to={`/profile/${suggestionUser.username}`}
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center space-x-3 px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors rounded-lg mx-2"
                      >
                        <img
                          src={suggestionUser.avatar}
                          alt={suggestionUser.username}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-600"
                          onError={(e) => {
                            e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(suggestionUser.username) + '&background=random&size=200';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium text-sm">{suggestionUser.username}</p>
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {(suggestionUser.subscriber?.length && !isNaN(suggestionUser.subscriber.length)) ? suggestionUser.subscriber.length : 0} subscribers
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}