import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { messageAPI, userAPI } from '../services/api';
import socketService from '../services/socket';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';
import { timeAgo } from '../utils/timeAgo';
import { AiOutlineSend, AiOutlineArrowLeft, AiOutlinePhone, AiOutlineVideoCamera } from 'react-icons/ai';
import { BsThreeDotsVertical } from 'react-icons/bs';

const Chat = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactions, setShowReactions] = useState(null);
  const [typingEnabled, setTypingEnabled] = useState(true);
  const [readReceiptsEnabled, setReadReceiptsEnabled] = useState(true);
  const [expiryHours, setExpiryHours] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const recorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  
  const reactions = ['👍', '❤️', '🔥', '😂', '😢', '😡'];

  useEffect(() => {
    // Reset state when switching conversations
    setMessages([]);
    setLoading(true);
    fetchUserAndMessages();
    
    // Cleanup function
    return () => {
      setMessages([]);
      setShowMenu(false);
    };
  }, [username]);

  useEffect(() => {
    if (!otherUser) return;

    const handleNewMessage = (message) => {
      console.log('📨 New message received:', message);
      
      // Check if message belongs to current conversation
      const isFromOtherUser = message.sender._id === otherUser._id;
      const isToOtherUser = message.receiver._id === otherUser._id;
      const isFromCurrentUser = message.sender._id === currentUser._id;
      const isToCurrentUser = message.receiver._id === currentUser._id;

      // Only add message if it's from the OTHER user to current user
      // Don't add if it's from current user (already handled by optimistic update)
      if (isFromOtherUser && isToCurrentUser) {
        setMessages((prev) => {
          // Avoid duplicates
          const exists = prev.some(msg => msg._id === message._id);
          if (exists) {
            console.log('⚠️ Duplicate message detected, ignoring');
            return prev;
          }
          console.log('✅ Adding new message from other user');
          return [...prev, message];
        });
        scrollToBottom();
      }
    };

    const handleUserOnline = (userId) => {
      if (userId === otherUser._id) {
        setIsOnline(true);
      }
    };

    const handleUserOffline = (userId) => {
      if (userId === otherUser._id) {
        setIsOnline(false);
      }
    };

    // Listen for events
    socketService.on('newMessage', handleNewMessage);
    socketService.on('userOnline', handleUserOnline);
    socketService.on('userOffline', handleUserOffline);
    
    // Listen for typing status
    socketService.on('typing', (userId) => {
      if (userId === otherUser._id) {
        setIsTyping(true);
      }
    });

    socketService.on('stopTyping', (userId) => {
      if (userId === otherUser._id) {
        setIsTyping(false);
      }
    });
    
    // Listen for message reactions
    socketService.on('messageReaction', (updatedMessage) => {
      console.log('Reaction received:', updatedMessage);
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === updatedMessage._id ? updatedMessage : msg
        )
      );
    });

    return () => {
      socketService.off('newMessage', handleNewMessage);
      socketService.off('userOnline', handleUserOnline);
      socketService.off('userOffline', handleUserOffline);
      socketService.off('typing');
      socketService.off('stopTyping');
      socketService.off('messageReaction');
    };
  }, [otherUser, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest('.menu-container')) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const fetchUserAndMessages = async () => {
    try {
      // Get other user profile
      const userResponse = await userAPI.getProfile(username);
      setOtherUser(userResponse.data.data);

      // Get conversation
      const messagesResponse = await messageAPI.getConversation(userResponse.data.data._id);
      setMessages(messagesResponse.data.data);

      // Get per-thread metadata
      const metaRes = await messageAPI.getConversationMetadata(userResponse.data.data._id);
      const meta = metaRes.data.data || {};
      setTypingEnabled(meta.typingIndicatorEnabled ?? true);
      setReadReceiptsEnabled(meta.readReceiptsEnabled ?? true);
      setExpiryHours(meta.messageExpiryHours ?? null);
    } catch (error) {
      toast.error('Failed to load conversation');
      navigate('/messages');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTyping = () => {
    if (!typingEnabled) return;
    // Emit typing event
    socketService.emit('typing', { receiverId: otherUser._id });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socketService.emit('stopTyping', { receiverId: otherUser._id });
    }, 2000);
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    try {
      const response = await messageAPI.sendAttachment(otherUser._id, file);
      const msg = response.data.data;
      setMessages(prev => [...prev, msg]);
      scrollToBottom();
    } catch (e) {
      toast.error('Failed to send attachment');
    }
  };
  
  const handleAddReaction = async (messageId, emoji) => {
    try {
      await messageAPI.addReaction(messageId, emoji);
      setShowReactions(null);
      // Socket will update the message automatically
    } catch (error) {
      toast.error('Failed to add reaction');
    }
  };

  const startRecording = async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await sendVoiceMessage(blob);
        chunksRef.current = [];
      };
      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch (err) {
      toast.error('Mic permission denied');
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    try { recorderRef.current?.stop(); } catch {}
    setIsRecording(false);
    if (recordTimerRef.current) { clearInterval(recordTimerRef.current); recordTimerRef.current = null; }
    if (mediaStreamRef.current) { mediaStreamRef.current.getTracks().forEach(t => t.stop()); mediaStreamRef.current = null; }
  };

  const sendVoiceMessage = async (blob) => {
    if (!otherUser?._id) return;
    setSending(true);
    try {
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
      const response = await messageAPI.sendVoiceMessage(otherUser._id, file);
      const msg = response.data.data;
      setMessages(prev => [...prev, msg]);
      scrollToBottom();
    } catch (e) {
      toast.error('Failed to send voice message');
    } finally {
      setSending(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || sending) return;

    const messageText = newMessage;
    const tempId = `temp-${Date.now()}`;
    
    // Optimistic UI update
    const tempMessage = {
      _id: tempId,
      text: messageText,
      sender: {
        _id: currentUser._id,
        username: currentUser.username,
        avatar: currentUser.avatar,
      },
      receiver: {
        _id: otherUser._id,
      },
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage(''); // Clear input immediately
    
    // Stop typing indicator
    socketService.emit('stopTyping', { receiverId: otherUser._id });
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    scrollToBottom();
    setSending(true);
    
    try {
      const response = await messageAPI.sendMessage(otherUser._id, messageText);
      const sentMessage = response.data.data;
      
      // Replace temp message with real message
      setMessages((prev) => 
        prev.map(msg => msg._id === tempId ? sentMessage : msg)
      );
      scrollToBottom();
    } catch (error) {
      // Remove temp message on error
      setMessages((prev) => prev.filter(msg => msg._id !== tempId));
      toast.error('Failed to send message');
      setNewMessage(messageText); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {/* Chat Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/messages')}
              className="md:hidden hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full transition"
            >
              <AiOutlineArrowLeft size={24} className="dark:text-white" />
            </button>

            {/* Avatar - Clickable */}
            <div 
              className="relative cursor-pointer"
              onClick={() => navigate(`/profile/${otherUser.username}`)}
            >
              <img
                src={otherUser.avatar}
                alt={otherUser.username}
                className="h-12 w-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 hover:opacity-80 transition"
              />
              {/* Online Status Indicator */}
              {isOnline && (
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
              )}
            </div>

            {/* User Info - Clickable */}
            <div 
              className="flex-1 cursor-pointer"
              onClick={() => navigate(`/profile/${otherUser.username}`)}
            >
              <p className="font-semibold dark:text-white hover:underline">{otherUser.username}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isTyping ? (
                  <span className="text-primary font-medium animate-pulse">typing...</span>
                ) : isOnline ? (
                  <span className="text-green-500 font-medium">● Online</span>
                ) : (
                  otherUser.fullName
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate(`/video-call/${otherUser._id}`)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
              title="Video Call"
            >
              <AiOutlineVideoCamera size={24} className="text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={() => { socketService.emit('call:invite', { to: otherUser._id, roomId: otherUser._id, type: 'audio', from: currentUser._id }); navigate(`/audio-call/${otherUser._id}?initiator=1`); }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
              title="Audio Call"
            >
              <AiOutlinePhone size={24} className="text-gray-600 dark:text-gray-300" />
            </button>
            
            {/* Three Dots Menu */}
            <div className="relative menu-container">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                title="More Options"
              >
                <BsThreeDotsVertical size={20} className="text-gray-600 dark:text-gray-300" />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 top-12 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-2 border border-gray-200 dark:border-gray-700 z-50 animate-fadeIn">
                  {/* View Profile */}
                  <button
                    onClick={() => {
                      navigate(`/profile/${otherUser.username}`);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-left transition"
                  >
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div>
                      <p className="font-semibold dark:text-white">View Profile</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">See user profile</p>
                    </div>
                  </button>

                  {/* Mute Notifications */}
                  <button
                    onClick={() => {
                      setIsMuted(!isMuted);
                      toast.success(isMuted ? 'Notifications unmuted' : 'Notifications muted');
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-left transition"
                  >
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {isMuted ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clip-rule="evenodd" />
                      )}
                      {isMuted && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                      )}
                    </svg>
                    <div>
                      <p className="font-semibold dark:text-white">{isMuted ? 'Unmute' : 'Mute'} Notifications</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {isMuted ? 'Turn on notifications' : 'Turn off notifications'}
                      </p>
                    </div>
                  </button>

                  {/* Media Visibility */}
                  <button
                    onClick={() => {
                      toast('Media settings coming soon!');
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-left transition"
                  >
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="font-semibold dark:text-white">Media Visibility</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Control media downloads</p>
                    </div>
                  </button>

                  {/* Read Receipts Toggle */}
                  <button
                    onClick={async () => {
                      try {
                        const res = await messageAPI.updateConversationSettings(otherUser._id, { readReceiptsEnabled: !readReceiptsEnabled });
                        setReadReceiptsEnabled(res.data.data.readReceiptsEnabled);
                        toast.success(res.data.message || 'Updated');
                      } catch { toast.error('Failed to update'); }
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-left transition"
                  >
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7 20h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v11a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="font-semibold dark:text-white">Read Receipts: {readReceiptsEnabled ? 'On' : 'Off'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Show when messages are read</p>
                    </div>
                  </button>

                  {/* Disappearing Messages Toggle */}
                  <div className="px-4 py-2">
                    <label className="text-xs text-gray-500 dark:text-gray-400">Disappearing messages</label>
                    <div className="mt-2 flex items-center gap-2">
                      <select
                        value={expiryHours ?? ''}
                        onChange={async (e) => {
                          const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                          try {
                            const res = await messageAPI.updateConversationExpiry(otherUser._id, val);
                            setExpiryHours(res.data.data.messageExpiryHours ?? null);
                            toast.success(res.data.message || 'Updated');
                          } catch { toast.error('Failed to update'); }
                        }}
                        className="border dark:border-gray-700 rounded px-2 py-1 text-sm dark:bg-gray-800 dark:text-white"
                      >
                        <option value="">Off</option>
                        <option value="1">1 hour</option>
                        <option value="24">24 hours</option>
                        <option value="168">7 days</option>
                      </select>
                    </div>
                    {expiryHours ? (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Messages will auto-delete after {expiryHours}h.</p>
                    ) : null}
                  </div>

                  {/* Clear Chat */}
                  <button
                    onClick={() => {
                      if (confirm('Clear all messages in this chat?')) {
                        setMessages([]);
                        toast.success('Chat cleared');
                      }
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-left transition"
                  >
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <div>
                      <p className="font-semibold dark:text-white">Clear Chat</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Delete all messages</p>
                    </div>
                  </button>

                  <hr className="my-2 border-gray-200 dark:border-gray-700" />

                  {/* Block User */}
                  <button
                    onClick={() => {
                      if (confirm(`${isBlocked ? 'Unblock' : 'Block'} ${otherUser.username}?`)) {
                        setIsBlocked(!isBlocked);
                        toast.success(isBlocked ? `${otherUser.username} unblocked` : `${otherUser.username} blocked`);
                      }
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-left transition"
                  >
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    <div>
                      <p className="font-semibold text-red-500">{isBlocked ? 'Unblock' : 'Block'} {otherUser.username}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {isBlocked ? 'Allow messages again' : 'Stop receiving messages'}
                      </p>
                    </div>
                  </button>

                  {/* Report User */}
                  <button
                    onClick={() => {
                      toast.error('Report feature coming soon!');
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-left transition"
                  >
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-red-500">Report User</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Report inappropriate content</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20 md:pb-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">
              No messages yet. Say hi! 👋
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwnMessage = message.sender._id === currentUser._id;
              // Show avatar only if:
              // 1. It's the last message overall, OR
              // 2. Next message is from different sender
              const nextMessage = messages[index + 1];
              const showAvatar = !nextMessage || nextMessage.sender._id !== message.sender._id;
              
              return (
                <div
                  key={message._id}
                  className={`flex items-end ${
                    isOwnMessage ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {/* Left side - for received messages */}
                  {!isOwnMessage && (
                    <div className="flex items-end space-x-2">
                      {/* Avatar - only show for last message in group */}
                      {showAvatar ? (
                        <img
                          src={otherUser.avatar}
                          alt={otherUser.username}
                          className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 flex-shrink-0"></div>
                      )}
                      
                      {/* Message Bubble */}
                      <div className="relative group">
                        <div 
                          className="max-w-xs md:max-w-md px-4 py-2 rounded-2xl shadow-sm bg-gray-200 dark:bg-gray-700 text-black dark:text-white rounded-bl-sm cursor-pointer"
                          onDoubleClick={() => setShowReactions(message._id)}
                        >
                          {message.image ? (
                            <img src={message.image} alt="Image" className="max-w-xs md:max-w-md rounded-md" />
                          ) : message.video ? (
                            <video src={message.video} controls className="w-64" />
                          ) : message.audio ? (
                            <audio src={message.audio} controls className="w-48" />
                          ) : message.fileUrl ? (
                            <a href={message.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline break-words">{message.fileName || 'Download file'}</a>
                          ) : (
                            <p className="break-words">{message.text}</p>
                          )}
                          <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                            {timeAgo(message.createdAt)}
                          </p>
                        </div>
                        
                        {/* Reaction Button (appears on hover) */}
                        <button
                          onClick={() => setShowReactions(showReactions === message._id ? null : message._id)}
                          className="absolute -bottom-2 right-2 hidden group-hover:block bg-white dark:bg-gray-800 rounded-full p-1 shadow-lg"
                        >
                          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        
                        {/* Reactions Popup */}
                        {showReactions === message._id && (
                          <div className="absolute -bottom-12 left-0 bg-white dark:bg-gray-800 rounded-full shadow-xl px-3 py-2 flex space-x-2 z-50 animate-fadeIn">
                            {reactions.map((emoji, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleAddReaction(message._id, emoji)}
                                className="text-2xl hover:scale-125 transition-transform"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* Display Reactions */}
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="absolute -bottom-5 left-2 flex space-x-1">
                            {message.reactions.map((reaction, idx) => (
                              <span
                                key={idx}
                                className="bg-white dark:bg-gray-800 rounded-full px-2 py-0.5 text-sm shadow-md border border-gray-200 dark:border-gray-700"
                                title={reaction.user?.username}
                              >
                                {reaction.emoji}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Right side - for sent messages */}
                  {isOwnMessage && (
                    <div className="flex items-end space-x-2">
                      {/* Message Bubble */}
                      <div className="relative group">
                        <div 
                          className="max-w-xs md:max-w-md px-4 py-2 rounded-2xl shadow-sm bg-gradient-primary text-white rounded-br-sm cursor-pointer"
                          onDoubleClick={() => setShowReactions(message._id)}
                        >
                          {message.image ? (
                          <img src={message.image} alt="Image" className="max-w-xs md:max-w-md rounded-md" />
                          ) : message.video ? (
                          <video src={message.video} controls className="w-64" />
                          ) : message.audio ? (
                          <audio src={message.audio} controls className="w-48" />
                          ) : message.fileUrl ? (
                          <a href={message.fileUrl} target="_blank" rel="noreferrer" className="text-white underline break-words">{message.fileName || 'Download file'}</a>
                          ) : (
                          <p className="break-words">{message.text}</p>
                          )}
                          <p className="text-xs mt-1 text-purple-100">
                            {timeAgo(message.createdAt)}
                          </p>
                        </div>
                        
                        {/* Reaction Button (appears on hover) */}
                        <button
                          onClick={() => setShowReactions(showReactions === message._id ? null : message._id)}
                          className="absolute -bottom-2 left-2 hidden group-hover:block bg-white dark:bg-gray-800 rounded-full p-1 shadow-lg"
                        >
                          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        
                        {/* Reactions Popup */}
                        {showReactions === message._id && (
                          <div className="absolute -bottom-12 right-0 bg-white dark:bg-gray-800 rounded-full shadow-xl px-3 py-2 flex space-x-2 z-50 animate-fadeIn">
                            {reactions.map((emoji, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleAddReaction(message._id, emoji)}
                                className="text-2xl hover:scale-125 transition-transform"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* Display Reactions */}
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="absolute -bottom-5 right-2 flex space-x-1">
                            {message.reactions.map((reaction, idx) => (
                              <span
                                key={idx}
                                className="bg-white dark:bg-gray-800 rounded-full px-2 py-0.5 text-sm shadow-md border border-gray-200 dark:border-gray-700"
                                title={reaction.user?.username}
                              >
                                {reaction.emoji}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Avatar - only show for last message in group */}
                      {showAvatar ? (
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.username}
                          className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 flex-shrink-0"></div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="card dark:bg-gray-800 dark:border-gray-700 rounded-none border-t sticky bottom-0 md:bottom-0 safe-bottom">
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="p-4 border-b dark:border-gray-700">
            <div className="grid grid-cols-8 gap-2">
              {['😀', '😂', '😍', '🥰', '😎', '🤔', '😢', '😭', '😡', '🤯', '🥳', '😇', '🤗', '🙏', '👍', '👎', '👏', '🙌', '💪', '❤️', '💔', '🔥', '✨', '💯', '🎉', '🎊', '🎈', '🎁', '🏆', '⭐', '💫', '✅'].map((emoji, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setNewMessage(prev => prev + emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded transition"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <form onSubmit={handleSend} className="flex items-center space-x-2 p-4">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
            title="Add emoji"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
            </svg>
          </button>
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
              title="Record voice"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14a3 3 0 003-3V6a3 3 0 00-6 0v5a3 3 0 003 3z" />
                <path d="M19 11a7 7 0 01-14 0h2a5 5 0 0010 0h2zM12 19v3h-2v-3h2z" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="px-3 py-2 bg-red-500 text-white rounded-full transition"
              title="Stop recording"
            >
              {recordSeconds.toString().padStart(2,'0')}s
            </button>
          )}
          
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
          />
          
          {/* Media Picker Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
            title="Attach media"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,audio/*,application/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files[0])}
          />

          {/* Camera Button */}
          <button
            type="button"
            onClick={() => toast('Camera feature coming soon!')}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
            title="Take photo"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className={`p-3 rounded-full transition ${
              newMessage.trim()
                ? 'bg-primary text-white hover:bg-blue-600'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            <AiOutlineSend size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
