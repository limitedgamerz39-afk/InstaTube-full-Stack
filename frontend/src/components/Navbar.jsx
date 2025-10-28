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
import { BsSun, BsMoon } from 'react-icons/bs';
import { FiShield } from 'react-icons/fi';
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

    // Listen for new notifications
    const handleNotification = () => {
      setUnreadCount((prev) => prev + 1);
    };

    // Listen for new messages
    const handleNewMessage = (message) => {
      // Only increment if not on messages or chat page
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/messages')) {
        setMessageCount((prev) => prev + 1);
      }
    };

    // Listen for messages viewed event
    const handleMessagesViewed = () => {
      setMessageCount(0);
    };

    socketService.on('notification', handleNotification);
    socketService.on('newMessage', handleNewMessage);
    window.addEventListener('messagesViewed', handleMessagesViewed);

    // Incoming call invite
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

  return (
    <nav className="bg-gray-900/95 border-b border-gray-700 sticky top-0 z-50 transition-colors backdrop-blur-lg shadow-lg">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Full Image (Icon + Text) */}
          <Link to="/" className="flex items-center">
            <img 
              src="/logo-full.png" 
              alt="InstaTube" 
              className="h-8 md:h-10 object-contain"
              onError={(e) => {
                // Fallback to text logo if image not found
                e.target.style.display = 'none';
              }}
            />
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent md:hidden">
           
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          {showSearch && (
          <form onSubmit={handleSearch} className="hidden md:block">
            <div className="relative">
              <AiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                              <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-800 text-white border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 w-64"
                />
            </div>
          </form>
          )}

          {/* Navigation Icons */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="hover:scale-110 transition text-gray-300 hover:text-white relative group">
              <AiFillHome size={28} className="group-hover:text-purple-400 transition-colors" />
            </Link>

            <Link to="/explore" className="hover:scale-110 transition text-gray-300 hover:text-white relative group">
              <svg className="w-7 h-7 group-hover:text-pink-400 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z"/>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5z" clipRule="evenodd"/>
              </svg>
            </Link>

            <Link to="/reels" className="hover:scale-110 transition text-gray-300 hover:text-white relative group">
              <svg className="w-7 h-7 group-hover:text-orange-400 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
              </svg>
            </Link>

            <Link to="/messages" className="relative hover:scale-110 transition text-gray-300 hover:text-white">
              <AiOutlineMessage size={28} />
              {messageCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {messageCount > 9 ? '9+' : messageCount}
                </span>
              )}
            </Link>

            <Link to="/upload" className="hover:scale-110 transition text-gray-300 hover:text-white">
              <AiOutlinePlusSquare size={28} />
            </Link>

            <Link to="/notifications" className="relative hover:scale-110 transition text-gray-300 hover:text-white">
              <AiOutlineHeart size={28} />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="hover:scale-110 transition text-gray-300 hover:text-white"
              aria-label="Toggle theme"
            >
              {isDark ? <BsSun size={24} /> : <BsMoon size={24} />}
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="focus:outline-none"
              >
                <img
                  src={user?.avatar}
                  alt={user?.username}
                  className="h-8 w-8 rounded-full object-cover border-2 border-gray-300 hover:border-primary transition"
                />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg py-2 border border-gray-700 animate-fadeIn">
                  <Link
                    to={`/profile/${user?.username}`}
                    className="block px-4 py-2 hover:bg-gray-700 text-white"
                    onClick={() => setShowUserMenu(false)}
                  >
                    👤 Profile
                  </Link>
                  <Link
                    to="/saved"
                    className="block px-4 py-2 hover:bg-gray-700 text-white"
                    onClick={() => setShowUserMenu(false)}
                  >
                    🔖 Saved
                  </Link>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 hover:bg-gray-700 text-white"
                    onClick={() => setShowUserMenu(false)}
                  >
                    ⚙️ Settings
                  </Link>
                  {user?.role === 'admin' && (
                    <>
                      <hr className="my-2 border-gray-700" />
                      <Link
                        to="/admin"
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 text-purple-400 hover:text-white font-semibold transition-all"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <FiShield className="w-4 h-4" />
                        Admin Panel
                      </Link>
                    </>
                  )}
                  <hr className="my-2 border-gray-700" />
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-700 text-red-400"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar - Mobile */}
        {showSearch && (
        <form onSubmit={handleSearch} className="md:hidden pb-3">
          <div className="relative">
            <AiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-800 text-white border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
              />
          </div>
        </form>
        )}
      </div>

      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-80 border dark:border-gray-700">
            <h3 className="text-lg font-semibold dark:text-white mb-2">Incoming {incomingCall.type || 'call'}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">From: {incomingCall.from}</p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 border rounded dark:border-gray-600 dark:text-white"
                onClick={() => {
                  socketService.emit('call:decline', { to: incomingCall.from, roomId: incomingCall.roomId });
                  setIncomingCall(null);
                }}
              >
                Decline
              </button>
              <button
                className="px-4 py-2 bg-primary text-white rounded"
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
