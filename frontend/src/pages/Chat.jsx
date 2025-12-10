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
import { BsThreeDotsVertical, BsMicFill, BsStopFill, BsPlayFill } from 'react-icons/bs';
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

  // Helper for message bubble styling
  const getMessageBubbleStyles = (isOwn, isFirst, isLast) => {
    const baseClasses = 'px-4 py-3 max-w-full';
    let dynamicClasses = '';

    if (isOwn) {
      // Use gradient for user's own messages (saffron to green)
      dynamicClasses = 'bg-gradient-to-r from-primary-500 to-secondary-600 text-white shadow-card hover:shadow-card-hover transition-shadow ';
      if (isFirst && isLast) dynamicClasses += 'rounded-2xl rounded-tr-none';
      else if (isFirst) dynamicClasses += 'rounded-t-2xl rounded-bl-2xl';
      else if (isLast) dynamicClasses += 'rounded-b-2xl rounded-l-2xl';
      else dynamicClasses += 'rounded-l-2xl';
    } else {
      // Use theme-appropriate colors for other user's messages (light gradient)
      dynamicClasses = 'bg-gradient-to-r from-primary-100 to-secondary-100 text-gray-900 dark:text-white shadow-card ';
      if (isFirst && isLast) dynamicClasses += 'rounded-2xl rounded-tl-none';
      else if (isFirst) dynamicClasses += 'rounded-t-2xl rounded-br-2xl';
      else if (isLast) dynamicClasses += 'rounded-b-2xl rounded-r-2xl';
      else dynamicClasses += 'rounded-r-2xl';
    }
    return `${baseClasses} ${dynamicClasses}`;
  };

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
    // Redirect if username is undefined
    if (!username) {
      navigate('/messages');
      return;
    }
    
    try {
      let userResponse;
      
      // Check if username is actually a user ID (MongoDB ObjectId format)
      const isUserId = /^[0-9a-fA-F]{24}$/.test(username);
      
      if (isUserId) {
        // If it's a user ID, fetch user by ID
        userResponse = await userAPI.getUserById(username);
      } else {
        // Otherwise, fetch user by username
        userResponse = await userAPI.getProfile(username);
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
    <div className="flex flex-col h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-dark-bg dark:to-dark-bg-secondary safe-area">
      {/* Enhanced Chat Header */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-600 text-white border-b border-white/20 sticky top-0 z-20 shadow-lg safe-top">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <button
              onClick={() => navigate('/messages')}
              className="flex-shrink-0 hover:bg-black/20 p-2 rounded-full transition touch-target"
              aria-label="Back to messages"
            >
              <AiOutlineArrowLeft size={20} className="text-white" />
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
                  className="h-10 w-10 rounded-full object-cover border-2 border-white/30 hover:opacity-80 transition"
                />
                {isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate text-base">
                  {otherUser.username}
                </p>
                <p className="text-sm text-white/80 truncate">
                  {isTyping ? (
                    <span className="text-white font-medium animate-pulse">typing...</span>
                  ) : isOnline ? (
                    <span className="text-white/90 font-medium">Online</span>
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
              className="p-2 hover:bg-black/20 rounded-full transition touch-target"
              title="Video Call"
              aria-label="Video call"
            >
              <AiOutlineVideoCamera size={20} className="text-white" />
            </button>
            
            <button
              onClick={() => navigate(`/audio-call/${otherUser._id}`)}
              className="p-2 hover:bg-black/20 rounded-full transition touch-target"
              title="Audio Call"
              aria-label="Audio call"
            >
              <AiOutlinePhone size={20} className="text-white" />
            </button>
            
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-black/20 rounded-full transition touch-target"
              title="More options"
              aria-label="More options"
            >
              <BsThreeDotsVertical size={20} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-24 md:pb-20">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 rounded-full p-6 mb-4">
              <svg className="w-16 h-16 text-primary-500 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9 8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">No messages yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm">Start a conversation with {otherUser.username}</p>
            <button 
              onClick={() => setNewMessage('Hi there! 👋')}
              className="px-6 py-3 bg-gradient-primary text-white rounded-full font-medium hover:shadow-lg transition-shadow duration-200"
            >
              Say Hello
            </button>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwnMessage = message.sender._id === currentUser._id;
              const prevMessage = messages[index - 1];
              const nextMessage = messages[index + 1];

              const isFirstInSequence = !prevMessage || prevMessage.sender._id !== message.sender._id;
              const isLastInSequence = !nextMessage || nextMessage.sender._id !== message.sender._id;
              
              const showAvatar = !isOwnMessage && isLastInSequence;
              const showTimestamp = isFirstInSequence;

              return (
                <div
                  key={message._id}
                  className={`flex items-end ${isLastInSequence ? 'mb-2' : 'mb-0.5'} ${
                    isOwnMessage ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div className={`flex items-end space-x-2 max-w-[85%]`}>
                    {showAvatar ? (
                      <img
                        src={otherUser.avatar}
                        alt={otherUser.username}
                        className="h-8 w-8 rounded-full object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition"
                        onClick={() => navigate(`/profile/${otherUser.username}`)}
                      />
                    ) : (
                      !isOwnMessage && <div className="w-8 flex-shrink-0"></div>
                    )}
                    
                    <div className="relative group flex-1 min-w-0">
                      {showTimestamp && (
                        <div className={`text-xs text-gray-500 dark:text-gray-400 mb-1 ${isOwnMessage ? 'mr-2 text-right' : 'ml-2'}`}>
                          {!isOwnMessage && `${otherUser.username} • `}
                          {timeAgo(message.createdAt)}
                        </div>
                      )}
                      <div 
                        className={getMessageBubbleStyles(isOwnMessage, isFirstInSequence, isLastInSequence)}
                        onDoubleClick={() => setShowReactions(message._id)}
                      >
                        {message.image ? (
                          <div className="relative">
                            <img src={message.image} alt="Shared image" className="max-w-full rounded-lg" loading="lazy" />
                          </div>
                        ) : message.text ? (
                          <div>
                            {message.text.includes('/reels/') ? (
                              // Handle reel links
                              <div className="space-y-2">
                                <div className="break-words leading-relaxed">
                                  {message.text.split('\n').map((line, idx) => {
                                    // Check if this line contains a reel URL
                                    const reelMatch = line.match(/(?:https?:\/\/[^\/]+)?\/reels\/([a-zA-Z0-9]+)/);
                                    const reelId = reelMatch ? reelMatch[1] : null;
                                    
                                    if (reelId) {
                                      // If the line is just the reel URL or the formatted message, show the reel card
                                      const isSimpleUrl = line.trim() === `${window.location.origin}/reels/${reelId}`;
                                      const isFormattedMessage = line.trim() === `Check out this reel: ${window.location.origin}/reels/${reelId}`;
                                      
                                      if (isSimpleUrl || isFormattedMessage) {
                                        return (
                                          <div 
                                            key={idx}
                                            className="mt-2 p-3 bg-gradient-to-r from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 rounded-lg cursor-pointer hover:from-primary-200 hover:to-secondary-200 dark:hover:from-primary-800/30 dark:hover:to-secondary-800/30 transition-colors"
                                            onClick={() => navigate(`/reels/${reelId}`)}
                                          >
                                            <div className="flex items-center">
                                              <BsPlayFill className="text-red-500 mr-2" />
                                              <span className="font-medium text-sm">Reel</span>
                                            </div>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                                              Tap to view this reel
                                            </span>
                                          </div>
                                        );
                                      }
                                      
                                      // For other cases, show the text with embedded reel link
                                      return (
                                        <div key={idx} className="inline-block">
                                          {line.replace(/Check out this reel:.*$|https?:\/\/[^\/]+\/reels\/[a-zA-Z0-9]+/g, '').trim() && (
                                            <span>{line.replace(/Check out this reel:.*$|https?:\/\/[^\/]+\/reels\/[a-zA-Z0-9]+/g, '').trim()} </span>
                                          )}
                                          <div 
                                            className="mt-2 p-3 bg-gradient-to-r from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 rounded-lg cursor-pointer hover:from-primary-200 hover:to-secondary-200 dark:hover:from-primary-800/30 dark:hover:to-secondary-800/30 transition-colors inline-block"
                                            onClick={() => navigate(`/reels/${reelId}`)}
                                          >
                                            <div className="flex items-center">
                                              <BsPlayFill className="text-red-500 mr-2" />
                                              <span className="font-medium text-sm">Reel</span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                              Tap to view this reel
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    }
                                    return line ? <span key={idx}>{line}<br /></span> : <br key={idx} />;
                                  })}
                                </div>
                              </div>
                            ) : (
                              <p className="break-words leading-relaxed">{message.text}</p>
                            )}
                          </div>
                        ) : null}
                      </div>

                      <button
                        onClick={() => setShowReactions(showReactions === message._id ? null : message._id)}
                        className={`absolute -bottom-2 ${isOwnMessage ? '-left-2' : '-right-2'} hidden group-hover:flex items-center justify-center w-6 h-6 bg-gradient-to-r from-primary-500 to-secondary-600 rounded-full shadow-lg hover:from-primary-600 hover:to-secondary-700 transition-colors border border-white/30`}
                      >
                        <AiOutlineSmile size={12} className="text-white" />
                      </button>
                      
                      {showReactions === message._id && (
                        <div className={`absolute -bottom-12 ${isOwnMessage ? 'right-0' : 'left-0'} bg-gradient-to-r from-primary-700 to-secondary-800 rounded-full shadow-xl px-3 py-2 flex space-x-2 z-50 animate-fadeIn border border-white/20`}>
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
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Enhanced Message Input */}
      <div className="bg-gradient-to-r from-primary-700 to-secondary-800 text-white border-t border-white/10 fixed bottom-0 left-0 right-0 z-30 safe-bottom">
        {/* Enhanced Emoji Picker */}
        {showEmojiPicker && (
          <div className="p-4 border-b border-white/10 bg-gradient-to-r from-primary-700 to-secondary-800">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-white">Emojis</span>
              <button
                onClick={() => setShowEmojiPicker(false)}
                className="text-white/70 hover:text-white"
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
                  className="text-xl hover:bg-black/20 p-2 rounded transition-colors duration-150 touch-target"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Enhanced Media Options */}
        {showMediaOptions && (
          <div className="p-4 border-b border-white/10 bg-gradient-to-r from-primary-700 to-secondary-800 media-menu-container">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-white">Send Media</span>
              <button
                onClick={() => setShowMediaOptions(false)}
                className="text-white/70 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
              <button
                onClick={() => imageInputRef.current?.click()}
                className="flex flex-col items-center space-y-2 p-3 hover:bg-black/20 rounded-lg transition-colors"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-600 rounded-full flex items-center justify-center">
                  <AiOutlinePicture size={24} className="text-white" />
                </div>
                <span className="text-xs text-white/80">Photo</span>
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center space-y-2 p-3 hover:bg-black/20 rounded-lg transition-colors"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-600 rounded-full flex items-center justify-center">
                  <AiOutlineFile size={24} className="text-white" />
                </div>
                <span className="text-xs text-white/80">File</span>
              </button>
              
              <button
                onClick={startRecording}
                className="flex flex-col items-center space-y-2 p-3 hover:bg-black/20 rounded-lg transition-colors"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-600 rounded-full flex items-center justify-center">
                  <BsMicFill size={20} className="text-white" />
                </div>
                <span className="text-xs text-white/80">Voice</span>
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
            className="flex-shrink-0 p-2 text-white/80 hover:text-white transition-colors touch-target"
            title="Attach media"
            aria-label="Attach media"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder="Type a message..."
              className="w-full bg-black/20 backdrop-blur-sm border border-white/20 rounded-full py-3 px-4 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
              disabled={sending}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={`flex-shrink-0 p-3 rounded-full transition-all duration-200 ${
              newMessage.trim() && !sending
                ? 'bg-gradient-to-r from-primary-500 to-secondary-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                : 'bg-black/20 text-white/40 cursor-not-allowed'
            }`}
            title="Send message"
            aria-label="Send message"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <IoSend size={20} />
            )}
          </button>

          {/* Emoji Button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="flex-shrink-0 p-3 text-white/80 hover:text-white transition-colors touch-target"
            title="Add emoji"
            aria-label="Add emoji"
          >
            <AiOutlineSmile size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;