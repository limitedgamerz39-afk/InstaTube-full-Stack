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
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 safe-bottom pointer-events-none">
      <div className="card-glass backdrop-blur-3xl border-2 border-white/30 dark:border-white/10 rounded-[2rem] shadow-2xl pointer-events-auto overflow-hidden">
        {/* Gradient Background Effect */}
        <div className="absolute inset-0 bg-gradient-mesh opacity-50"></div>
        
        <div className="relative flex items-center justify-around h-16 px-2">
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
                <div className="relative bg-gradient-primary p-2.5 rounded-2xl shadow-glow-primary">
                  <AiFillHome size={22} className="text-white" />
                </div>
              </div>
            ) : (
              <AiOutlineHome size={26} className="text-gray-600 dark:text-gray-400" />
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
                <div className="relative bg-gradient-secondary p-2.5 rounded-2xl shadow-glow-secondary">
                  <BsCompassFill size={20} className="text-white" />
                </div>
              </div>
            ) : (
              <BsCompass size={24} className="text-gray-600 dark:text-gray-400" />
            )}
          </Link>

          {/* Upload - Center Button */}
          <Link
            to="/upload"
            className="flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 -mt-4"
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-sunset blur-xl opacity-80 rounded-full animate-pulse-slow"></div>
              <div className="relative bg-gradient-sunset p-4 rounded-[1.5rem] shadow-glow-lg group-hover:scale-110 transition-transform duration-300">
                <AiOutlinePlusSquare size={26} className="text-white" />
              </div>
            </div>
          </Link>

          {/* Notifications */}
          <Link
            to="/notifications"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 relative ${
              isActive('/notifications') ? 'scale-110' : 'scale-100'
            }`}
          >
            {isActive('/notifications') ? (
              <div className="relative">
                <div className="absolute inset-0 bg-danger-400 blur-xl opacity-60 rounded-full"></div>
                <div className="relative bg-gradient-to-r from-danger-400 to-danger-600 p-2.5 rounded-2xl shadow-glow">
                  <AiFillHeart size={22} className="text-white" />
                </div>
              </div>
            ) : (
              <AiOutlineHeart size={26} className="text-gray-600 dark:text-gray-400" />
            )}
            {unreadNotifications > 0 && (
              <span className="absolute top-0 right-2 bg-danger-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold shadow-lg border-2 border-white dark:border-dark-bg animate-pulse-slow">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
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
                <div className="relative bg-gradient-ocean p-2.5 rounded-2xl shadow-glow-accent">
                  <AiFillMessage size={22} className="text-white" />
                </div>
              </div>
            ) : (
              <AiOutlineMessage size={26} className="text-gray-600 dark:text-gray-400" />
            )}
            {unreadMessages > 0 && (
              <span className="absolute top-0 right-2 bg-info-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold shadow-lg border-2 border-white dark:border-dark-bg animate-pulse-slow">
                {unreadMessages > 9 ? '9+' : unreadMessages}
              </span>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
