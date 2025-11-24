import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { messageAPI, userAPI } from '../services/api';
import socketService from '../services/socket';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';
import { timeAgo } from '../utils/timeAgo';
import { 
  AiOutlineSend, 
  AiOutlineArrowLeft, 
  AiOutlinePhone, 
  AiOutlineVideoCamera,
  AiOutlinePicture,
  AiOutlineFile,
  AiOutlineSmile
} from 'react-icons/ai';
import { BsThreeDotsVertical, BsMicFill, BsStopFill } from 'react-icons/bs';
import { IoSend } from 'react-icons/io5';
import VoiceRecorder from '../components/VoiceRecorder';

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
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const recorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const inputRef = useRef(null);
  const mediaMenuRef = useRef(null);
  
  const reactions = ['👍', '❤️', '🔥', '😂', '😢', '😡'];
  const emojis = ['😀', '😂', '😍', '🥰', '😎', '🤔', '😢', '😭', '😡', '🤯', '🥳', '😇', '🤗', '🙏', '👍', '👎', '👏', '🙌', '💪', '❤️', '💔', '🔥', '✨', '💯', '🎉', '🎊', '🎈', '🎁', '🏆', '⭐', '💫', '✅'];

  useEffect(() => {
    setMessages([]);
    setLoading(true);
    fetchUserAndMessages();
    
    return () => {
      setMessages([]);
      setShowMenu(false);
      setShowMediaOptions(false);
    };
  }, [username]);

  useEffect(() => {
    if (!otherUser) return;

    const handleNewMessage = (message) => {
      console.log('📨 New message received:', message);
      
      const isFromOtherUser = message.sender._id === otherUser._id;
      const isToCurrentUser = message.receiver._id === currentUser._id;

      if (isFromOtherUser && isToCurrentUser) {
        setMessages((prev) => {
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

    socketService.on('newMessage', handleNewMessage);
    socketService.on('userOnline', handleUserOnline);
    socketService.on('userOffline', handleUserOffline);
    
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

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest('.menu-container')) {
        setShowMenu(false);
      }
      if (showMediaOptions && !event.target.closest('.media-menu-container')) {
        setShowMediaOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu, showMediaOptions]);

  const fetchUserAndMessages = async () => {
    try {
      let userResponse;
      try {
        userResponse = await userAPI.getProfile(username);
      } catch (profileError) {
        // If getting by username fails, try getting by ID
        console.log('Username lookup failed, trying ID lookup...');
        // This would require the user ID to be passed as a parameter or obtained another way
        // For now, we'll re-throw the error
        throw profileError;
      }
      
      setOtherUser(userResponse.data.data);

      const messagesResponse = await messageAPI.getConversation(userResponse.data.data._id);
      setMessages(messagesResponse.data.data);

      const metaRes = await messageAPI.getConversationMetadata(userResponse.data.data._id);
      const meta = metaRes.data.data || {};
      setTypingEnabled(meta.typingIndicatorEnabled ?? true);
      setReadReceiptsEnabled(meta.readReceiptsEnabled ?? true);
      setExpiryHours(meta.messageExpiryHours ?? null);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      toast.error(error.response?.data?.message || 'Failed to load conversation');
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
    
    socketService.emit('typing', { receiverId: otherUser._id });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketService.emit('stopTyping', { receiverId: otherUser._id });
    }, 2000);
  };

  const handleFileUpload = async (file, type = 'file') => {
    if (!file) return;
    try {
      const response = await messageAPI.sendAttachment(otherUser._id, file);
      const msg = response.data.data;
      setMessages(prev => [...prev, msg]);
      scrollToBottom();
      setShowMediaOptions(false);
    } catch (e) {
      toast.error(`Failed to send ${type}`);
    }
  };

  // Add this function to handle voice messages
  const handleVoiceMessageSend = async (audioBlob, duration) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, `voice-message-${Date.now()}.webm`);
      
      const response = await messageAPI.sendVoiceMessage(otherUser._id, formData);
      
      if (response.data.success) {
        setMessages((prev) => [...prev, response.data.data]);
        scrollToBottom();
        toast.success('Voice message sent');
      }
    } catch (error) {
      console.error('Failed to send voice message:', error);
      toast.error('Failed to send voice message');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await handleFileUpload(file, 'image');
    }
  };
  
  const handleAddReaction = async (messageId, emoji) => {
    try {
      await messageAPI.addReaction(messageId, emoji);
      setShowReactions(null);
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
      setShowMediaOptions(false);
    } catch (err) {
      toast.error('Microphone permission denied');
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
    setNewMessage('');
    
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
      
      setMessages((prev) => 
        prev.map(msg => msg._id === tempId ? sentMessage : msg)
      );
      scrollToBottom();
    } catch (error) {
      setMessages((prev) => prev.filter(msg => msg._id !== tempId));
      toast.error('Failed to send message');
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const addEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 safe-area">
      {/* Enhanced Chat Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-20 shadow-sm safe-top">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <button
              onClick={() => navigate('/messages')}
              className="flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full transition touch-target"
              aria-label="Back to messages"
            >
              <AiOutlineArrowLeft size={20} className="dark:text-white" />
            </button>

            {/* Enhanced User Info */}
            <div 
              className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer"
              onClick={() => navigate(`/profile/${otherUser.username}`)}
            >
              <div className="relative flex-shrink-0">
                <img
                  src={otherUser.avatar}
                  alt={otherUser.username}
                  className="h-10 w-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 hover:opacity-80 transition"
                />
                {isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate text-base">
                  {otherUser.username}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {isTyping ? (
                    <span className="text-blue-500 font-medium animate-pulse">typing...</span>
                  ) : isOnline ? (
                    <span className="text-green-500 font-medium">Online</span>
                  ) : (
                    "Offline"
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex items-center space-x-1 flex-shrink-0">
            <button
              onClick={() => navigate(`/video-call/${otherUser._id}`)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition touch-target"
              title="Video Call"
              aria-label="Video call"
            >
              <AiOutlineVideoCamera size={22} className="text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={() => { 
                socketService.emit('call:invite', { to: otherUser._id, roomId: otherUser._id, type: 'audio', from: currentUser._id }); 
                navigate(`/audio-call/${otherUser._id}?initiator=1`); 
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition touch-target"
              title="Audio Call"
              aria-label="Audio call"
            >
              <AiOutlinePhone size={22} className="text-gray-600 dark:text-gray-300" />
            </button>
            
            {/* Enhanced Menu */}
            <div className="relative menu-container">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition touch-target"
                title="More Options"
                aria-label="More options"
              >
                <BsThreeDotsVertical size={20} className="text-gray-600 dark:text-gray-300" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-12 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 animate-fadeIn max-h-[80vh] overflow-y-auto">
                  {/* Menu items remain the same as original */}
                  <button
                    onClick={() => {
                      navigate(`/profile/${otherUser.username}`);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition"
                  >
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div>
                      <p className="font-medium dark:text-white">View Profile</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">See user profile</p>
                    </div>
                  </button>

                  {/* Other menu items... */}
                  
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-24 md:pb-20">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full p-6 mb-4">
              <svg className="w-16 h-16 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No messages yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm">Start a conversation with {otherUser.username}</p>
            <button 
              onClick={() => setNewMessage('Hi there! 👋')}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-medium hover:shadow-lg transition-shadow duration-200"
            >
              Say Hello
            </button>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwnMessage = message.sender._id === currentUser._id;
              const nextMessage = messages[index + 1];
              const showAvatar = !nextMessage || nextMessage.sender._id !== message.sender._id;
              
              const prevMessage = messages[index - 1];
              const showTimestamp = !prevMessage || 
                new Date(message.createdAt) - new Date(prevMessage.createdAt) > 5 * 60 * 1000 ||
                prevMessage.sender._id !== message.sender._id;
              
              return (
                <div
                  key={message._id}
                  className={`flex items-end mb-2 ${
                    isOwnMessage ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {/* Received Messages */}
                  {!isOwnMessage && (
                    <div className="flex items-end space-x-2 max-w-[85%]">
                      {showAvatar ? (
                        <img
                          src={otherUser.avatar}
                          alt={otherUser.username}
                          className="h-8 w-8 rounded-full object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition"
                          onClick={() => navigate(`/profile/${otherUser.username}`)}
                        />
                      ) : (
                        <div className="w-8 flex-shrink-0"></div>
                      )}
                      
                      <div className="relative group flex-1 min-w-0">
                        {showTimestamp && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-2">
                            {timeAgo(message.createdAt)}
                          </div>
                        )}
                        <div 
                          className="px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-tl-none hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                          onDoubleClick={() => setShowReactions(message._id)}
                        >
                          {/* Message content rendering remains the same */}
                          {message.image ? (
                            <div className="relative">
                              <img src={message.image} alt="Shared image" className="max-w-full rounded-lg" loading="lazy" />
                              <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                                {timeAgo(message.createdAt)}
                              </div>
                            </div>
                          ) : message.text ? (
                            <p className="break-words leading-relaxed">{message.text}</p>
                          ) : null}
                        </div>

                        {/* Enhanced Reactions */}
                        <button
                          onClick={() => setShowReactions(showReactions === message._id ? null : message._id)}
                          className="absolute -bottom-2 -right-2 hidden group-hover:flex items-center justify-center w-6 h-6 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
                        >
                          <AiOutlineSmile size={12} className="text-gray-600 dark:text-gray-400" />
                        </button>
                        
                        {showReactions === message._id && (
                          <div className="absolute -bottom-12 left-0 bg-white dark:bg-gray-800 rounded-full shadow-xl px-3 py-2 flex space-x-2 z-50 animate-fadeIn border border-gray-200 dark:border-gray-600">
                            {reactions.map((emoji, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleAddReaction(message._id, emoji)}
                                className="text-xl hover:scale-125 transition-transform duration-150"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Sent Messages */}
                  {isOwnMessage && (
                    <div className="flex items-end space-x-2 max-w-[85%]">
                      <div className="relative group flex-1 min-w-0">
                        {showTimestamp && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 mr-2 text-right">
                            {timeAgo(message.createdAt)}
                          </div>
                        )}
                        <div 
                          className="px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-tr-none hover:from-blue-600 hover:to-purple-600 transition-all cursor-pointer shadow-sm"
                          onDoubleClick={() => setShowReactions(message._id)}
                        >
                          {message.image ? (
                            <div className="relative">
                              <img src={message.image} alt="Shared image" className="max-w-full rounded-lg" loading="lazy" />
                              <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                                {timeAgo(message.createdAt)}
                              </div>
                            </div>
                          ) : message.text ? (
                            <p className="break-words leading-relaxed">{message.text}</p>
                          ) : null}
                        </div>

                        {/* Enhanced Reactions for sent messages */}
                        <button
                          onClick={() => setShowReactions(showReactions === message._id ? null : message._id)}
                          className="absolute -bottom-2 -left-2 hidden group-hover:flex items-center justify-center w-6 h-6 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
                        >
                          <AiOutlineSmile size={12} className="text-gray-600 dark:text-gray-400" />
                        </button>
                        
                        {showReactions === message._id && (
                          <div className="absolute -bottom-12 right-0 bg-white dark:bg-gray-800 rounded-full shadow-xl px-3 py-2 flex space-x-2 z-50 animate-fadeIn border border-gray-200 dark:border-gray-600">
                            {reactions.map((emoji, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleAddReaction(message._id, emoji)}
                                className="text-xl hover:scale-125 transition-transform duration-150"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {showAvatar ? (
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.username}
                          className="h-8 w-8 rounded-full object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition"
                          onClick={() => navigate(`/profile/${currentUser.username}`)}
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

      {/* Enhanced Message Input */}
      <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 fixed bottom-0 left-0 right-0 z-30 safe-bottom">
        {/* Enhanced Emoji Picker */}
        {showEmojiPicker && (
          <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Emojis</span>
              <button
                onClick={() => setShowEmojiPicker(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-8 gap-1 max-w-md mx-auto">
              {emojis.map((emoji, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => addEmoji(emoji)}
                  className="text-xl hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded transition-colors duration-150 touch-target"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Enhanced Media Options */}
        {showMediaOptions && (
          <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 media-menu-container">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Send Media</span>
              <button
                onClick={() => setShowMediaOptions(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
              <button
                onClick={() => imageInputRef.current?.click()}
                className="flex flex-col items-center space-y-2 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <AiOutlinePicture size={24} className="text-blue-500" />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Photo</span>
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center space-y-2 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <AiOutlineFile size={24} className="text-green-500" />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">File</span>
              </button>
              
              <button
                onClick={startRecording}
                className="flex flex-col items-center space-y-2 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <BsMicFill size={20} className="text-red-500" />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Voice</span>
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Input Bar */}
        <form onSubmit={handleSend} className="flex items-center space-x-2 p-3 max-w-4xl mx-auto">
          {/* Media Button */}
          <button
            type="button"
            onClick={() => setShowMediaOptions(!showMediaOptions)}
            className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors touch-target"
            title="Attach media"
            aria-label="Attach media"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          {/* Hidden file inputs */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="*"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files[0])}
          />

          {/* Message Input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Message..."
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
              className="w-full py-3 px-4 text-base border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Emoji Button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors touch-target"
            title="Add emoji"
            aria-label="Add emoji"
          >
            <AiOutlineSmile size={24} />
          </button>

          {/* Send/Voice Record Button */}
          {newMessage.trim() ? (
            <button
              type="submit"
              disabled={sending}
              className="flex-shrink-0 p-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-sm touch-target disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <IoSend size={18} />
            </button>
          ) : (
            <VoiceRecorder onSend={handleVoiceMessageSend} />
          )}

        </form>
      </div>
    </div>
  );
};

export default Chat;