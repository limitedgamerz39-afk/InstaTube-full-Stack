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
import ThemeSwitcher from './ThemeSwitcher';

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

  const fetchUnreadCount = useCallback(async () => {
    // Debounce notification fetches to prevent rate limiting
    const now = Date.now();
    const lastFetch = localStorage.getItem('lastNotificationFetch');
    
    // Only fetch if it's been more than 30 seconds since last fetch
    if (!lastFetch || now - parseInt(lastFetch) > 30000) {
      try {
        const response = await notificationAPI.getNotifications();
        setUnreadCount(response.data.unreadCount);
        localStorage.setItem('lastNotificationFetch', now.toString());
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    }
  }, []);

  const fetchMessageCount = useCallback(async () => {
    // Debounce message count fetches to prevent rate limiting
    const now = Date.now();
    const lastFetch = localStorage.getItem('lastMessageCountFetch');
    
    // Only fetch if it's been more than 30 seconds since last fetch
    if (!lastFetch || now - parseInt(lastFetch) > 30000) {
      try {
        const response = await messageAPI.getUnreadCount();
        setMessageCount(response.data.data.count);
        localStorage.setItem('lastMessageCountFetch', now.toString());
      } catch (error) {
        console.error('Error fetching message count:', error);
      }
    }
  }, []);

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
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  // Close dropdown when navigating to a new page
  useEffect(() => {
    setShowUserMenu(false);
  }, [location.pathname]);

  // Menu items for the user dropdown
  const menuItems = [
    { icon: AiOutlineHome, label: 'Home', path: '/' },
    { icon: AiOutlineCompass, label: 'Explore', path: '/explore' },
    { icon: BsFilm, label: 'Reels', path: '/reels' },
    { icon: AiOutlinePlaySquare, label: 'Long Videos', path: '/long-videos' },
    { icon: AiOutlineGroup, label: 'Groups', path: '/groups' },
    { divider: true },
    { icon: AiOutlineUser, label: 'Subscriptions', path: '/subscriptions' },
    { icon: BsBookmark, label: 'Library', path: '/library' },
    { icon: BsClock, label: 'History', path: '/history' },
    { icon: BsClock, label: 'Watch Later', path: '/watch-later' },
    { icon: BsHeart, label: 'Liked Videos', path: '/liked-videos' },
    { divider: true },
    { icon: AiOutlineSetting, label: 'Settings', path: '/settings' },
    { icon: FiShield, label: 'Admin Panel', path: '/admin', adminOnly: true },
    { icon: AiOutlineLogout, label: 'Logout', action: handleLogout }
  ];

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="hidden md:flex items-center justify-between px-4 py-3 bg-white dark:bg-dark-bg shadow-sm sticky top-0 z-50">
        <div className="flex items-center space-x-6 lg:space-x-10">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0" aria-label="D4D HUB home">
            <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-2 rounded-xl">
              <BsCameraReelsFill className="text-white w-6 h-6" />
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
          {/* Messages */}
          <Link 
            to="/messages" 
            className={`p-2 lg:p-3 rounded-xl transition-all duration-200 relative ${
              isActive('/messages') 
                ? 'bg-gradient-info text-white shadow-glow-info' 
                : 'hover:bg-gray-100 dark:hover:bg-dark-card text-gray-600 dark:text-gray-400 hover:scale-110'
            }`}
            title="Messages (Alt+M)"
            aria-label={`Messages${messageCount > 0 ? `, ${messageCount} unread` : ''}`}
          >
            {messageCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 lg:h-5 lg:w-5 flex items-center justify-center" aria-label={`${messageCount} unread messages`}>
                {messageCount > 9 ? '9+' : messageCount}
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

          {/* Notifications */}
          <Link 
            to="/notifications" 
            className={`p-2 lg:p-3 rounded-xl transition-all duration-200 relative ${
              isActive('/notifications') 
                ? 'bg-gradient-warning text-white shadow-glow-warning' 
                : 'hover:bg-gray-100 dark:hover:bg-dark-card text-gray-600 dark:text-gray-400 hover:scale-110'
            }`}
            title="Notifications"
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          >
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 lg:h-5 lg:w-5 flex items-center justify-center" aria-label={`${unreadCount} unread notifications`}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            {isActive('/notifications') ? <AiFillHeart size={20} className="lg:w-6 lg:h-6" /> : <AiOutlineHeart size={20} className="lg:w-6 lg:h-6" />}
          </Link>

          {/* Theme Switcher */}
          <ThemeSwitcher />

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
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <OptimizedImage
                      src={user?.avatar || '/default-avatar.png'}
                      alt={user?.username}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.username || 'U') + '&background=random&size=200';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {user?.fullName || user?.username}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        @{user?.username}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2 max-h-96 overflow-y-auto">
                  {menuItems.map((item, index) => {
                    // Skip admin items if user is not admin
                    if (item.adminOnly && user?.role !== 'admin') return null;
                    
                    if (item.divider) {
                      return <div key={index} className="border-t border-gray-200 dark:border-gray-700 my-2"></div>;
                    }
                    
                    if (item.action) {
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            item.action();
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                        >
                          <item.icon className="w-5 h-5" />
                          <span>{item.label}</span>
                        </button>
                      );
                    }
                    
                    return (
                      <Link
                        key={index}
                        to={item.path}
                        onClick={() => setShowUserMenu(false)}
                        className={`flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                          isActive(item.path)
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* Subscriptions Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 py-2">
                  <h3 className="px-4 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400">SUBSCRIPTIONS</h3>
                  {suggestions.slice(0, 5).map((suggestionUser) => (
                    <Link
                      key={suggestionUser._id}
                      to={`/profile/${suggestionUser.username}`}
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      <img
                        src={suggestionUser.avatar}
                        alt={suggestionUser.username}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(suggestionUser.username) + '&background=random&size=200';
                        }}
                      />
                      <span className="truncate">{suggestionUser.username}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Navbar */}
      <nav className={`md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-dark-bg shadow-sm sticky top-0 z-50 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2" aria-label="D4D HUB home">
          <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-1.5 rounded-lg">
            <BsCameraReelsFill className="text-white w-5 h-5" />
          </div>
          <span className="text-lg font-black gradient-text">D4D HUB</span>
        </Link>

        {/* Icons */}
        <div className="flex items-center space-x-4">
          {/* Search Toggle */}
          {showSearch && (
            <button
              onClick={() => navigate('/search')}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-card text-gray-600 dark:text-gray-400"
              aria-label="Toggle search"
            >
              <AiOutlineSearch size={24} />
            </button>
          )}

          {/* Notifications */}
          <Link 
            to="/notifications" 
            className={`p-2 rounded-xl transition-all duration-200 relative ${
              isActive('/notifications') 
                ? 'bg-gradient-warning text-white shadow-glow-warning' 
                : 'hover:bg-gray-100 dark:hover:bg-dark-card text-gray-600 dark:text-gray-400'
            }`}
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          >
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center" aria-label={`${unreadCount} unread notifications`}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            {isActive('/notifications') ? <AiFillHeart size={24} /> : <AiOutlineHeart size={24} />}
          </Link>

          {/* Theme Switcher */}
          <ThemeSwitcher />

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
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 animate-fadeIn">
                {/* User Profile Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <OptimizedImage
                      src={user?.avatar || '/default-avatar.png'}
                      alt={user?.username}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.username || 'U') + '&background=random&size=200';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {user?.fullName || user?.username}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        @{user?.username}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2 max-h-96 overflow-y-auto">
                  {menuItems.map((item, index) => {
                    // Skip admin items if user is not admin
                    if (item.adminOnly && user?.role !== 'admin') return null;
                    
                    if (item.divider) {
                      return <div key={index} className="border-t border-gray-200 dark:border-gray-700 my-2"></div>;
                    }
                    
                    if (item.action) {
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            item.action();
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                        >
                          <item.icon className="w-5 h-5" />
                          <span>{item.label}</span>
                        </button>
                      );
                    }
                    
                    return (
                      <Link
                        key={index}
                        to={item.path}
                        onClick={() => setShowUserMenu(false)}
                        className={`flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                          isActive(item.path)
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* Subscriptions Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 py-2">
                  <h3 className="px-4 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400">SUBSCRIPTIONS</h3>
                  {suggestions.slice(0, 5).map((suggestionUser) => (
                    <Link
                      key={suggestionUser._id}
                      to={`/profile/${suggestionUser.username}`}
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      <img
                        src={suggestionUser.avatar}
                        alt={suggestionUser.username}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(suggestionUser.username) + '&background=random&size=200';
                        }}
                      />
                      <span className="truncate">{suggestionUser.username}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}