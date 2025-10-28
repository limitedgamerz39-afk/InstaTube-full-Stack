import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { messageAPI } from '../services/api';
import socketService from '../services/socket';
import Loader from '../components/Loader';
import { timeAgo } from '../utils/timeAgo';
import toast from 'react-hot-toast';
import { 
  AiOutlineMessage, 
  AiOutlineSearch, 
  AiOutlineFilter,
  AiOutlinePlus,
  AiOutlineCheck,
  AiOutlineStar,
  AiOutlineMore
} from 'react-icons/ai';
import { FiUsers, FiArchive } from 'react-icons/fi';

const Messages = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all'); // all, unread, online, starred
  const [showFilters, setShowFilters] = useState(false);

  // Filter conversations based on search query and active filter
  useEffect(() => {
    let filtered = [...conversations];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(conversation =>
        conversation.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conversation.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conversation.lastMessage.text.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    switch (activeFilter) {
      case 'unread':
        filtered = filtered.filter(conversation => conversation.unreadCount > 0);
        break;
      case 'online':
        filtered = filtered.filter(conversation => onlineUsers.has(conversation.user._id));
        break;
      case 'starred':
        filtered = filtered.filter(conversation => conversation.isStarred);
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    setFilteredConversations(filtered);
  }, [conversations, searchQuery, activeFilter, onlineUsers]);

  useEffect(() => {
    fetchConversations();

    const handleNewMessage = (message) => {
      console.log('📨 New message in conversation list:', message);
      fetchConversations();
    };

    const handleUserOnline = (userId) => {
      console.log('✅ User online:', userId);
      setOnlineUsers((prev) => new Set([...prev, userId]));
    };

    const handleUserOffline = (userId) => {
      console.log('❌ User offline:', userId);
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    };

    // Listen for events
    socketService.on('newMessage', handleNewMessage);
    socketService.on('userOnline', handleUserOnline);
    socketService.on('userOffline', handleUserOffline);
    
    // Listen for typing
    socketService.on('typing', (userId) => {
      setTypingUsers(prev => new Set([...prev, userId]));
    });
    
    socketService.on('stopTyping', (userId) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    // Live message search debounce
    const id = setTimeout(async () => {
      if (searchQuery.trim().length > 2) {
        try {
          const res = await messageAPI.searchMessages(searchQuery);
          setSearchResults(res.data.data);
        } catch {}
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => {
      socketService.off('newMessage', handleNewMessage);
      socketService.off('userOnline', handleUserOnline);
      socketService.off('userOffline', handleUserOffline);
      socketService.off('typing');
      socketService.off('stopTyping');
      clearTimeout(id);
    };
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await messageAPI.getConversations();
      setConversations(response.data.data);
      
      // Emit event to reset message count in navbar/bottomnav
      window.dispatchEvent(new CustomEvent('messagesViewed'));
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (conversationId) => {
    try {
      await messageAPI.markConversationAsRead(conversationId);
      fetchConversations();
      toast.success('Conversation marked as read');
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const handleToggleStar = async (conversationId) => {
    try {
      const response = await messageAPI.toggleStarConversation(conversationId);
      fetchConversations();
      toast.success(response.data.data.message);
    } catch (error) {
      console.error('Failed to toggle star:', error);
      toast.error('Failed to toggle star');
    }
  };

  const handleArchiveConversation = async (conversationId) => {
    try {
      const response = await messageAPI.toggleArchiveConversation(conversationId);
      fetchConversations();
      toast.success(response.data.data.message);
    } catch (error) {
      console.error('Failed to archive conversation:', error);
      toast.error('Failed to archive conversation');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await messageAPI.markAllConversationsAsRead();
      fetchConversations();
      toast.success('All conversations marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-20 md:pb-8">
      {/* Header with Title and Actions */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Messages</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleMarkAllAsRead}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition"
            title="Mark all as read"
          >
            <AiOutlineCheck size={20} />
          </button>
          <button
            onClick={() => navigate('/groups')}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition"
            title="View groups"
          >
            <FiUsers size={20} />
          </button>
          {/* Removed New Message shortcut to avoid duplicate search controls */}

        </div>
      </div>

      {/* Search Conversations - Keep this one since it searches within messages */}
      <div className="mb-4">
        <div className="relative">
          <AiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:text-white"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-4">
        <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {[
            { key: 'all', label: 'All', icon: AiOutlineMessage },
            { key: 'unread', label: 'Unread', icon: AiOutlineCheck },
            { key: 'online', label: 'Online', icon: FiUsers },
            { key: 'starred', label: 'Starred', icon: AiOutlineStar }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                activeFilter === key
                  ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary'
              }`}
            >
              <Icon size={16} />
              <span>{label}</span>
              {key === 'unread' && conversations.filter(c => c.unreadCount > 0).length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {conversations.filter(c => c.unreadCount > 0).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Search Results */}
      {searchQuery.trim().length > 2 && (
        <div className="card dark:bg-gray-800 dark:border-gray-700 mb-6">
          <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold dark:text-white">Messages matching "{searchQuery}"</h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">{searchResults.length} found</span>
          </div>
          {searchResults.length === 0 ? (
            <div className="p-4 text-sm text-gray-500 dark:text-gray-400">No matches</div>
          ) : (
            <div className="divide-y dark:divide-gray-700">
              {searchResults.map((msg) => (
                <div key={msg._id} className="p-4 flex items-center gap-3">
                  <img src={msg.sender._id === msg.receiver._id ? msg.sender.avatar : msg.sender.avatar} alt={msg.sender.username} className="h-8 w-8 rounded-full" />
                  <div className="flex-1">
                    <div className="text-sm dark:text-white">
                      <span className="font-semibold">{msg.sender.username}</span>
                      <span className="text-gray-500 dark:text-gray-400"> → </span>
                      <span className="font-semibold">{msg.receiver.username}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{timeAgo(msg.createdAt)}</span>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 break-words">
                      {msg.text || msg.fileName || '[attachment]'}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/messages/${msg.sender.username}`)}
                    className="px-3 py-1 text-xs bg-primary text-white rounded"
                  >
                    Open
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
        {filteredConversations.length === 0 ? (
          <div className="p-12 text-center">
            <AiOutlineMessage size={64} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery || activeFilter !== 'all' 
                ? 'No conversations match your search' 
                : 'No messages yet'
              }
            </p>
            {!searchQuery && activeFilter === 'all' && (
              <Link to="/search" className="btn-primary">
                Find People to Message
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.user._id}
                className="flex items-center space-x-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition relative group"
              >
                {/* Main conversation link */}
                <Link
                  to={`/messages/${conversation.user.username}`}
                  className="flex items-center space-x-4 flex-1 min-w-0"
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={conversation.user.avatar}
                      alt={conversation.user.username}
                      className="h-14 w-14 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                    />
                    {/* Online Status */}
                    {onlineUsers.has(conversation.user._id) && (
                      <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full z-10"></span>
                    )}
                    {/* Unread Badge */}
                    {conversation.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold z-10">
                        {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                      </div>
                    )}
                    {/* Starred indicator */}
                    {conversation.isStarred && (
                      <div className="absolute -top-1 -left-1 bg-yellow-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center z-10">
                        <AiOutlineStar size={12} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold dark:text-white truncate">
                        {conversation.user.username}
                      </p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {timeAgo(conversation.lastMessage.createdAt)}
                      </span>
                    </div>
                    <p
                      className={`text-sm truncate ${
                        conversation.unreadCount > 0
                          ? 'font-semibold text-black dark:text-white'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {typingUsers.has(conversation.user._id) ? (
                        <span className="text-primary italic animate-pulse">typing...</span>
                      ) : (
                        conversation.lastMessage.text
                      )}
                    </p>
                  </div>
                </Link>

                {/* Action buttons */}
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {conversation.unreadCount > 0 && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleMarkAsRead(conversation.user._id);
                      }}
                      className="p-2 text-gray-400 hover:text-green-500 transition"
                      title="Mark as read"
                    >
                      <AiOutlineCheck size={16} />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleToggleStar(conversation.user._id);
                    }}
                    className={`p-2 transition ${
                      conversation.isStarred 
                        ? 'text-yellow-500' 
                        : 'text-gray-400 hover:text-yellow-500'
                    }`}
                    title={conversation.isStarred ? "Remove from starred" : "Add to starred"}
                  >
                    <AiOutlineStar size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleArchiveConversation(conversation.user._id);
                    }}
                    className="p-2 text-gray-400 hover:text-orange-500 transition"
                    title="Archive conversation"
                  >
                    <FiArchive size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
};

export default Messages;
