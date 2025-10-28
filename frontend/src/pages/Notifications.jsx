import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notificationAPI } from '../services/api';
import socketService from '../services/socket';
import toast from 'react-hot-toast';
import { timeAgo } from '../utils/timeAgo';
import Loader from '../components/Loader';
import { AiOutlineHeart, AiOutlineComment, AiOutlineUserAdd } from 'react-icons/ai';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {notifications.some((n) => !n.read) && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-primary text-sm font-semibold hover:text-blue-700"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="card">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No notifications yet
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                onClick={() => !notification.read && handleMarkAsRead(notification._id)}
                className={`flex items-start space-x-4 p-4 hover:bg-gray-50 transition cursor-pointer ${
                  !notification.read ? 'bg-blue-50' : ''
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
                    {notification.message.replace(notification.sender.username, '').trim()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {timeAgo(notification.createdAt)}
                  </p>
                </div>

                {/* Post Thumbnail */}
                {notification.post && (
                  <Link to={`/post/${notification.post._id}`}>
                    <img
                      src={notification.post.mediaUrl}
                      alt="Post"
                      className="h-12 w-12 object-cover rounded"
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
