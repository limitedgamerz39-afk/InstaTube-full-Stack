import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationAPI, messageAPI } from '../services/api';
import socketService from '../services/socket';
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

const BottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    fetchCounts();

    // Listen for new notifications
    const handleNotification = () => {
      setUnreadNotifications(prev => prev + 1);
    };

    // Listen for new messages
    const handleNewMessage = (message) => {
      // Only increment if not on messages or chat page
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/messages')) {
        setUnreadMessages(prev => prev + 1);
      }
    };

    // Listen for messages viewed event
    const handleMessagesViewed = () => {
      setUnreadMessages(0);
    };

    // Listen for notifications viewed event
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
    try {
      const [notifResponse, messageResponse] = await Promise.all([
        notificationAPI.getNotifications(),
        messageAPI.getUnreadCount()
      ]);
      setUnreadNotifications(notifResponse.data.unreadCount || 0);
      setUnreadMessages(messageResponse.data.data.count || 0);
    } catch (error) {
      console.error('Failed to fetch counts:', error);
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-lg border-t border-gray-200 dark:border-dark-border z-50 safe-bottom shadow-lg">
      <div className="flex items-center justify-around h-16 px-2">
        {/* Home */}
        <Link
          to="/"
          className="flex flex-col items-center justify-center flex-1 h-full transition-colors relative"
        >
          {isActive('/') ? (
            <>
              <AiFillHome size={28} className="text-primary" />
              <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full"></div>
            </>
          ) : (
            <AiOutlineHome size={28} className="text-gray-600 dark:text-gray-400" />
          )}
        </Link>

        {/* Explore */}
        <Link
          to="/explore"
          className="flex flex-col items-center justify-center flex-1 h-full transition-colors relative"
        >
          <svg
            className={`w-7 h-7 ${
              isActive('/explore') ? 'text-secondary' : 'text-gray-600 dark:text-gray-400'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z" />
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5z"
              clipRule="evenodd"
            />
          </svg>
          {isActive('/explore') && (
            <div className="absolute -bottom-1 w-1 h-1 bg-secondary rounded-full"></div>
          )}
        </Link>

        {/* Reels */}
        <Link
          to="/reels"
          className="flex flex-col items-center justify-center flex-1 h-full transition-colors relative"
        >
          <svg
            className={`w-7 h-7 ${
              isActive('/reels') ? 'text-accent' : 'text-gray-600 dark:text-gray-400'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          </svg>
          {isActive('/reels') && (
            <div className="absolute -bottom-1 w-1 h-1 bg-accent rounded-full"></div>
          )}
        </Link>

        {/* Videos */}
        <Link
          to="/videos"
          className="flex flex-col items-center justify-center flex-1 h-full transition-colors relative"
        >
          <svg
            className={`w-7 h-7 ${
              isActive('/videos') ? 'text-purple-500' : 'text-gray-600 dark:text-gray-400'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm2 0v8h12V6H4z" />
            <path d="M8 7l5 3-5 3V7z" />
          </svg>
          {isActive('/videos') && (
            <div className="absolute -bottom-1 w-1 h-1 bg-purple-500 rounded-full"></div>
          )}
        </Link>



        {/* Upload - Center with Special Style */}
        <Link
          to="/upload"
          className="flex flex-col items-center justify-center flex-1 h-full transition-colors relative"
        >
          <div
            className={
              isActive('/upload')
                ? 'bg-gradient-primary p-3 rounded-2xl shadow-glow'
                : 'bg-gray-200 dark:bg-dark-card p-3 rounded-2xl'
            }
          >
            <AiOutlinePlusSquare
              size={24}
              className={isActive('/upload') ? 'text-white' : 'text-gray-600 dark:text-gray-400'}
            />
          </div>
        </Link>

        {/* Notifications */}
        <Link
          to="/notifications"
          className="flex flex-col items-center justify-center flex-1 h-full transition-colors relative"
        >
          {isActive('/notifications') ? (
            <>
              <AiFillHeart size={28} className="text-danger" />
              <div className="absolute -bottom-1 w-1 h-1 bg-danger rounded-full"></div>
            </>
          ) : (
            <AiOutlineHeart size={28} className="text-gray-600 dark:text-gray-400" />
          )}
          {unreadNotifications > 0 && (
            <span className="absolute top-0 right-2 bg-red-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold shadow-lg border-2 border-white dark:border-dark-bg">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
        </Link>

        {/* Messages */}
        <Link
          to="/messages"
          className="flex flex-col items-center justify-center flex-1 h-full transition-colors relative"
        >
          {isActive('/messages') ? (
            <>
              <AiFillMessage size={28} className="text-info" />
              <div className="absolute -bottom-1 w-1 h-1 bg-info rounded-full"></div>
            </>
          ) : (
            <AiOutlineMessage size={28} className="text-gray-600 dark:text-gray-400" />
          )}
          {unreadMessages > 0 && (
            <span className="absolute top-0 right-2 bg-blue-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold shadow-lg border-2 border-white dark:border-dark-bg">
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
        </Link>

        {/* Profile */}
        <Link
          to={`/profile/${user?.username}`}
          className="flex flex-col items-center justify-center flex-1 h-full transition-colors"
        >
          <img
            src={user?.avatar}
            alt={user?.username}
            className={`h-7 w-7 rounded-full object-cover ${
              isActive(`/profile/${user?.username}`)
                ? 'ring-2 ring-black dark:ring-white'
                : 'ring-1 ring-gray-300 dark:ring-gray-600'
            }`}
          />
        </Link>
      </div>
    </div>
  );
};

export default BottomNav;
