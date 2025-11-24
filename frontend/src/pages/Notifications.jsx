import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notificationAPI } from '../services/api';
import socketService from '../services/socket';
import toast from 'react-hot-toast';
import { timeAgo } from '../utils/timeAgo';
import Loader from '../components/Loader';
import { AiOutlineHeart, AiOutlineComment, AiOutlineUserAdd, AiOutlineFilter, AiOutlineClose } from 'react-icons/ai';
import { FiClock, FiCheckCircle } from 'react-icons/fi';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [groupBy, setGroupBy] = useState('time'); // time, type

  useEffect(() => {
    fetchNotifications();

    // Listen for real-time notifications
    socketService.on('notification', (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    return () => {
      socketService.off('notification');
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getNotifications();
      setNotifications(response.data.data);
      
      // Emit event to reset notification count in navbar/bottomnav
      window.dispatchEvent(new CustomEvent('notificationsViewed'));
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <AiOutlineHeart className="text-red-500" size={24} />;
      case 'comment':
        return <AiOutlineComment className="text-blue-500" size={24} />;
      case 'follow':
        return <AiOutlineUserAdd className="text-green-500" size={24} />;
      default:
        return null;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'like':
        return 'bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-800/30';
      case 'comment':
        return 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/30';
      case 'follow':
        return 'bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-800/30';
      default:
        return 'bg-gray-50 border-gray-100 dark:bg-gray-800 dark:border-gray-700';
    }
  };

  // Group notifications by time (today, yesterday, earlier)
  const groupNotificationsByTime = (notifs) => {
    const today = [];
    const yesterday = [];
    const earlier = [];
    
    const now = new Date();
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    
    notifs.forEach(notif => {
      const notifDate = new Date(notif.createdAt);
      const notifDay = new Date(notifDate.getFullYear(), notifDate.getMonth(), notifDate.getDate());
      
      if (notifDay.getTime() === todayDate.getTime()) {
        today.push(notif);
      } else if (notifDay.getTime() === yesterdayDate.getTime()) {
        yesterday.push(notif);
      } else {
        earlier.push(notif);
      }
    });
    
    return { today, yesterday, earlier };
  };

  // Group notifications by type
  const groupNotificationsByType = (notifs) => {
    const likes = notifs.filter(n => n.type === 'like');
    const comments = notifs.filter(n => n.type === 'comment');
    const follows = notifs.filter(n => n.type === 'follow');
    const others = notifs.filter(n => !['like', 'comment', 'follow'].includes(n.type));
    
    return { likes, comments, follows, others };
  };

  // Filter notifications based on selected filter
  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.read;
    if (filter === 'read') return notif.read;
    return true; // all
  });

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <h1 className="text-xl md:text-2xl font-bold">Notifications</h1>
        <div className="flex items-center space-x-2">
          {notifications.some((n) => !n.read) && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-primary text-sm font-semibold hover:text-blue-700 dark:hover:text-blue-400"
            >
              Mark all as read
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <AiOutlineFilter className="text-gray-600 dark:text-gray-400" size={20} />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="card dark:bg-dark-card mb-6 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold dark:text-white">Filters</h3>
            <button 
              onClick={() => setShowFilters(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <AiOutlineClose size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Filter by Read Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Read Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    filter === 'all' 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 dark:bg-dark-card-hover text-gray-700 dark:text-gray-300'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('unread')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center ${
                    filter === 'unread' 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 dark:bg-dark-card-hover text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <FiClock className="mr-1" /> Unread
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('read')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center ${
                    filter === 'read' 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 dark:bg-dark-card-hover text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <FiCheckCircle className="mr-1" /> Read
                </button>
              </div>
            </div>

            {/* Group By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Group By
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGroupBy('time')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    groupBy === 'time' 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 dark:bg-dark-card-hover text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Time
                </button>
                <button
                  type="button"
                  onClick={() => setGroupBy('type')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    groupBy === 'type' 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 dark:bg-dark-card-hover text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Type
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card dark:bg-dark-card">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No notifications found
          </div>
        ) : groupBy === 'time' ? (
          // Group by time
          (() => {
            const { today, yesterday, earlier } = groupNotificationsByTime(filteredNotifications);
            
            return (
              <div className="divide-y divide-gray-200 dark:divide-dark-border">
                {today.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-gray-50 dark:bg-dark-card-hover text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Today
                    </div>
                    {today.map((notification) => (
                      <NotificationItem 
                        key={notification._id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        getNotificationIcon={getNotificationIcon}
                        getNotificationColor={getNotificationColor}
                      />
                    ))}
                  </div>
                )}
                
                {yesterday.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-gray-50 dark:bg-dark-card-hover text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Yesterday
                    </div>
                    {yesterday.map((notification) => (
                      <NotificationItem 
                        key={notification._id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        getNotificationIcon={getNotificationIcon}
                        getNotificationColor={getNotificationColor}
                      />
                    ))}
                  </div>
                )}
                
                {earlier.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-gray-50 dark:bg-dark-card-hover text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Earlier
                    </div>
                    {earlier.map((notification) => (
                      <NotificationItem 
                        key={notification._id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        getNotificationIcon={getNotificationIcon}
                        getNotificationColor={getNotificationColor}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })()
        ) : (
          // Group by type
          (() => {
            const { likes, comments, follows, others } = groupNotificationsByType(filteredNotifications);
            
            return (
              <div className="divide-y divide-gray-200 dark:divide-dark-border">
                {likes.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center">
                      <AiOutlineHeart className="mr-1" /> Likes
                    </div>
                    {likes.map((notification) => (
                      <NotificationItem 
                        key={notification._id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        getNotificationIcon={getNotificationIcon}
                        getNotificationColor={getNotificationColor}
                      />
                    ))}
                  </div>
                )}
                
                {comments.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center">
                      <AiOutlineComment className="mr-1" /> Comments
                    </div>
                    {comments.map((notification) => (
                      <NotificationItem 
                        key={notification._id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        getNotificationIcon={getNotificationIcon}
                        getNotificationColor={getNotificationColor}
                      />
                    ))}
                  </div>
                )}
                
                {follows.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider flex items-center">
                      <AiOutlineUserAdd className="mr-1" /> Follows
                    </div>
                    {follows.map((notification) => (
                      <NotificationItem 
                        key={notification._id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        getNotificationIcon={getNotificationIcon}
                        getNotificationColor={getNotificationColor}
                      />
                    ))}
                  </div>
                )}
                
                {others.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Other
                    </div>
                    {others.map((notification) => (
                      <NotificationItem 
                        key={notification._id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        getNotificationIcon={getNotificationIcon}
                        getNotificationColor={getNotificationColor}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
};

// Notification Item Component
const NotificationItem = ({ notification, onMarkAsRead, getNotificationIcon, getNotificationColor }) => {
  return (
    <div
      onClick={() => !notification.read && onMarkAsRead(notification._id)}
      className={`flex items-start space-x-3 md:space-x-4 p-3 md:p-4 hover:bg-gray-50 dark:hover:bg-dark-border/30 transition cursor-pointer border-l-4 ${getNotificationColor(notification.type)} ${
        !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
      }`}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-1">
        {getNotificationIcon(notification.type)}
      </div>

      {/* Sender Avatar */}
      <Link to={`/profile/${notification.sender.username}`}>
        <img
          src={notification.sender.avatar}
          alt={notification.sender.username}
          className="h-10 w-10 rounded-full object-cover"
        />
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <Link
            to={`/profile/${notification.sender.username}`}
            className="font-semibold hover:underline"
          >
            {notification.sender.username}
          </Link>{' '}
          <span className="break-words">{notification.message.replace(notification.sender.username, '').trim()}</span>
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {timeAgo(notification.createdAt)}
        </p>
      </div>

      {/* Post Thumbnail */}
      {notification.post && (
        <Link to={`/post/${notification.post._id}`}>
          <img
            src={notification.post.mediaUrl}
            alt="Post"
            className="h-10 w-10 md:h-12 md:w-12 object-cover rounded"
          />
        </Link>
      )}

      {/* Unread Indicator */}
      {!notification.read && (
        <div className="flex-shrink-0">
          <div className="h-2 w-2 bg-primary rounded-full"></div>
        </div>
      )}
    </div>
  );
};

export default Notifications;