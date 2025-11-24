import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationAPI, messageAPI } from '../services/api';
import socketService from '../services/socket';
import {
  AiOutlineHome,
  AiFillHome,
  AiOutlinePlusSquare,
  AiOutlineHeart,
  AiFillHeart,
  AiOutlineMessage,
  AiFillMessage,
} from 'react-icons/ai';
import { BsCompass, BsCompassFill, BsFilm } from 'react-icons/bs';
import { FiSearch } from 'react-icons/fi';

const BottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    fetchCounts();

    const handleNotification = () => {
      setUnreadNotifications(prev => prev + 1);
    };

    const handleNewMessage = (message) => {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/messages')) {
        setUnreadMessages(prev => prev + 1);
      }
    };

    const handleMessagesViewed = () => {
      setUnreadMessages(0);
    };

    const handleNotificationsViewed = () => {
      setUnreadNotifications(0);
    };

    socketService.on('notification', handleNotification);
    socketService.on('newMessage', handleNewMessage);
    window.addEventListener('messagesViewed', handleMessagesViewed);
    window.addEventListener('notificationsViewed', handleNotificationsViewed);

    return () => {
      socketService.off('notification', handleNotification);
      socketService.off('newMessage', handleNewMessage);
      window.removeEventListener('messagesViewed', handleMessagesViewed);
      window.removeEventListener('notificationsViewed', handleNotificationsViewed);
    };
  }, []);

  const fetchCounts = async () => {
    // Debounce notification and message count fetches to prevent rate limiting
    const now = Date.now();
    const lastFetch = localStorage.getItem('lastBottomNavFetch');
    
    // Only fetch if it's been more than 30 seconds since last fetch
    if (!lastFetch || now - parseInt(lastFetch) > 30000) {
      try {
        localStorage.setItem('lastBottomNavFetch', now.toString());
        const [notifResponse, messageResponse] = await Promise.all([
          notificationAPI.getNotifications(),
          messageAPI.getUnreadCount()
        ]);
        setUnreadNotifications(notifResponse.data.unreadCount || 0);
        setUnreadMessages(messageResponse.data.data.count || 0);
      } catch (error) {
        console.error('Failed to fetch counts:', error);
      }
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-2 sm:px-4 pb-4 sm:pb-6 safe-bottom">
      <div className="card-glass backdrop-blur-3xl border-2 border-white/30 dark:border-white/10 rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl overflow-hidden">
        {/* Gradient Background Effect */}
        <div className="absolute inset-0 bg-gradient-mesh opacity-50"></div>
        
        <div className="relative flex items-center justify-around h-14 sm:h-16 px-1 sm:px-2">
          {/* Home */}
          <Link
            to="/"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 relative ${
              isActive('/') ? 'scale-110' : 'scale-100'
            }`}
          >
            {isActive('/') ? (
              <div className="relative">
                <div className="absolute inset-0 bg-primary-400 blur-xl opacity-60 rounded-full"></div>
                <div className="relative bg-gradient-primary p-2 rounded-xl sm:p-2.5 shadow-glow-primary">
                  <AiFillHome size={18} className="text-white sm:w-5 sm:h-5" />
                </div>
              </div>
            ) : (
              <AiOutlineHome size={20} className="text-gray-600 dark:text-gray-400 sm:w-6 sm:h-6" />
            )}
          </Link>

          {/* Explore */}
          <Link
            to="/explore"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 relative ${
              isActive('/explore') ? 'scale-110' : 'scale-100'
            }`}
          >
            {isActive('/explore') ? (
              <div className="relative">
                <div className="absolute inset-0 bg-accent-400 blur-xl opacity-60 rounded-full"></div>
                <div className="relative bg-gradient-secondary p-2 rounded-xl sm:p-2.5 shadow-glow-secondary">
                  <BsCompassFill size={16} className="text-white sm:w-5 sm:h-5" />
                </div>
              </div>
            ) : (
              <BsCompass size={20} className="text-gray-600 dark:text-gray-400 sm:w-6 sm:h-6" />
            )}
          </Link>

          {/* Upload */}
          <Link
            to="/upload"
            className="flex flex-col items-center justify-center flex-1 h-full"
          >
            <div className="bg-gradient-primary p-1.5 sm:p-2 rounded-xl sm:rounded-2xl shadow-glow-primary hover:shadow-glow-lg transition-all duration-300 hover:scale-110">
              <AiOutlinePlusSquare size={20} className="text-white sm:w-6 sm:h-6" />
            </div>
          </Link>

          {/* Messages */}
          <Link
            to="/messages"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 relative ${
              isActive('/messages') ? 'scale-110' : 'scale-100'
            }`}
          >
            {isActive('/messages') ? (
              <div className="relative">
                <div className="absolute inset-0 bg-info-400 blur-xl opacity-60 rounded-full"></div>
                <div className="relative bg-gradient-info p-2 rounded-xl sm:p-2.5 shadow-glow-info">
                  <AiFillMessage size={18} className="text-white sm:w-5 sm:h-5" />
                </div>
              </div>
            ) : (
              <AiOutlineMessage size={20} className="text-gray-600 dark:text-gray-400 sm:w-6 sm:h-6" />
            )}
            {unreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] sm:text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center">
                {unreadMessages > 99 ? '99+' : unreadMessages}
              </span>
            )}
          </Link>

          {/* Reels */}
          <Link
            to="/reels"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 relative ${
              isActive('/reels') ? 'scale-110' : 'scale-100'
            }`}
          >
            {isActive('/reels') ? (
              <div className="relative">
                <div className="absolute inset-0 bg-sunset-400 blur-xl opacity-60 rounded-full"></div>
                <div className="relative bg-gradient-sunset p-2 rounded-xl sm:p-2.5 shadow-glow">
                  <BsFilm size={16} className="text-white sm:w-5 sm:h-5" />
                </div>
              </div>
            ) : (
              <BsFilm size={20} className="text-gray-600 dark:text-gray-400 sm:w-6 sm:h-6" />
            )}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BottomNav;