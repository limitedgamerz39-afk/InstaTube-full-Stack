import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { groupAPI } from '../services/api';
import socketService from '../services/socket';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';
import { timeAgo } from '../utils/timeAgo';
import {
  AiOutlineSend,
  AiOutlineUserAdd,
  AiOutlineArrowLeft,
  AiOutlineSetting,
  AiOutlinePhone,
  AiOutlineVideoCamera,
  AiOutlinePicture,
  AiOutlineSmile,
} from 'react-icons/ai';
import { BsThreeDotsVertical, BsMicFill, BsStopFill } from 'react-icons/bs';
import { IoSend } from 'react-icons/io5';

const GroupChat = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [groupInfo, setGroupInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberQuery, setMemberQuery] = useState('');
  const [memberResults, setMemberResults] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const recorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchGroupData();
    
    return () => {
      socketService.off('newGroupMessage');
      socketService.off('userTyping');
      socketService.off('userStopTyping');
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [groupId]);

  useEffect(() => {
    if (!groupInfo) return;

    // Socket listeners
    socketService.on('newGroupMessage', handleNewMessage);
    socketService.on('userTyping', handleUserTyping);
    socketService.on('userStopTyping', handleUserStopTyping);

    return () => {
      socketService.off('newGroupMessage');
      socketService.off('userTyping');
      socketService.off('userStopTyping');
    };
  }, [groupInfo]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  const fetchGroupData = async () => {
    try {
      const [groupResponse, messagesResponse] = await Promise.all([
        groupAPI.getGroupById(groupId),
        groupAPI.getGroupMessages(groupId),
      ]);

      setGroupInfo(groupResponse.data.data);
      setMessages(messagesResponse.data.data);
    } catch (error) {
      console.error('Failed to load group:', error);
      toast.error('Failed to load group');
      navigate('/groups');
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = ({ groupId: msgGroupId, message }) => {
    if (msgGroupId === groupId) {
      if (message.sender._id === user._id) {
        return;
      }
      
      setMessages((prev) => {
        const exists = prev.some(msg => msg._id === message._id);
        if (exists) return prev;
        return [...prev, message];
      });
    }
  };

  const handleUserTyping = ({ groupId: typingGroupId, user: typingUser }) => {
    if (typingGroupId === groupId && typingUser._id !== user._id) {
      setTypingUsers(prev => {
        const exists = prev.some(u => u._id === typingUser._id);
        if (exists) return prev;
        return [...prev, typingUser];
      });
    }
  };

  const handleUserStopTyping = ({ groupId: typingGroupId, userId }) => {
    if (typingGroupId === groupId) {
      setTypingUsers(prev => prev.filter(u => u._id !== userId));
    }
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socketService.emit('typing', { groupId, user });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketService.emit('stopTyping', { groupId, userId: user._id });
    }, 1000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      toast.error('Microphone access is required for voice messages');
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
    if (!groupInfo?._id) return;
    setSending(true);
    try {
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
      toast.success('Voice message recorded! (Feature coming soon)');
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
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
      },
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage('');
    setShowEmojiPicker(false);
    
    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      socketService.emit('stopTyping', { groupId, userId: user._id });
    }

    setSending(true);

    try {
      const response = await groupAPI.sendGroupMessage(groupId, messageText);
      const sentMessage = response.data.data;

      setMessages((prev) =>
        prev.map((msg) => (msg._id === tempId ? sentMessage : msg))
      );
    } catch (error) {
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
      toast.error('Failed to send message');
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm(`Are you sure you want to leave "${groupInfo.name}"?`)) return;

    try {
      await groupAPI.leaveGroup(groupId);
      toast.success('Left group successfully');
      navigate('/groups');
    } catch (error) {
      toast.error('Failed to leave group');
    }
  };

  const searchMembers = async (query) => {
    if (!query.trim()) { setMemberResults([]); return; }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setMemberResults(data.data || []);
    } catch (e) {
      console.error('Member search failed', e);
    }
  };

  const addMember = async (userId) => {
    try {
      const res = await groupAPI.addMember(groupId, userId);
      setGroupInfo(res.data.data);
      toast.success('Member added successfully');
      setShowAddMember(false);
      setMemberQuery('');
      setMemberResults([]);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add member';
      toast.error(msg);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      toast.success('Media upload feature coming soon!');
    }
  };

  const addEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
    inputRef.current?.focus();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <Loader />
      </div>
    );
  }

  if (!groupInfo) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 transition-all duration-300">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/messages')}
              className="md:hidden hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full transition-all duration-200 hover:scale-105"
            >
              <AiOutlineArrowLeft size={20} className="dark:text-white" />
            </button>

            {/* Group Avatar with enhanced overlapping effect */}
            <div className="flex -space-x-3 relative group cursor-pointer" onClick={() => navigate(`/group-info/${groupId}`)}>
              {groupInfo.members.slice(0, 4).map((member, index) => (
                <div key={member.user._id} className="relative transition-transform duration-200 group-hover:scale-105">
                  <img
                    src={member.user.avatar}
                    alt={member.user.username}
                    className="w-10 h-10 rounded-full border-3 border-white dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-200"
                    style={{ zIndex: 4 - index }}
                  />
                  {index === 3 && groupInfo.members.length > 4 && (
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">+{groupInfo.members.length - 4}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="cursor-pointer" onClick={() => navigate(`/group-info/${groupId}`)}>
              <h2 className="font-bold text-lg text-gray-800 dark:text-white transition-colors duration-200">
                {groupInfo.name}
              </h2>
              <div className="flex items-center space-x-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {groupInfo.members.length} members
                </p>
                {typingUsers.length > 0 && (
                  <span className="text-xs text-blue-500 font-medium animate-pulse">
                    {typingUsers.map(u => u.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => navigate(`/video-call/${groupId}`)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200 hover:scale-110 hover:text-blue-500"
              title="Video Call"
            >
              <AiOutlineVideoCamera size={22} className="text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => { /* Audio call functionality */ }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200 hover:scale-110 hover:text-green-500"
              title="Audio Call"
            >
              <AiOutlinePhone size={22} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200 hover:scale-110"
              >
                <BsThreeDotsVertical size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-12 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-2 w-48 z-50 border border-gray-200 dark:border-gray-600 backdrop-blur-sm">
                  <button 
                    onClick={() => {
                      setShowAddMember(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white flex items-center space-x-2 transition-colors duration-150"
                  >
                    <AiOutlineUserAdd className="text-blue-500" />
                    <span>Add Member</span>
                  </button>
                  <button className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white flex items-center space-x-2 transition-colors duration-150">
                    <AiOutlineSetting className="text-purple-500" />
                    <span>Group Settings</span>
                  </button>
                  <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                  <button 
                    onClick={handleLeaveGroup}
                    className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 flex items-center space-x-2 transition-colors duration-150"
                  >
                    <span className="font-medium">Leave Group</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 pb-24 bg-gradient-to-b from-transparent to-white/20 dark:to-gray-800/20">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full p-8 mb-6 shadow-lg">
              <svg className="w-20 h-20 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">Welcome to {groupInfo.name}! 👋</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">Send the first message to start the conversation with your group members.</p>
            <button 
              onClick={() => setNewMessage('Hello everyone! 👋')}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 shadow-md"
            >
              Start Conversation
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message, index) => {
              const isOwnMessage = message.sender._id === user._id;
              const prevMessage = messages[index - 1];
              const showTimestamp = !prevMessage || 
                new Date(message.createdAt) - new Date(prevMessage.createdAt) > 5 * 60 * 1000;
              const showSenderName = !isOwnMessage && (!prevMessage || prevMessage.sender._id !== message.sender._id);
              
              return (
                <div
                  key={message._id}
                  className={`flex mb-2 group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 rounded-lg p-1 transition-colors duration-200 ${
                    isOwnMessage ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {!isOwnMessage && (
                    <img
                      src={message.sender.avatar}
                      alt={message.sender.username}
                      className="w-8 h-8 rounded-full mr-3 cursor-pointer hover:opacity-80 transition self-end flex-shrink-0 shadow-sm"
                      onClick={() => navigate(`/profile/${message.sender.username}`)}
                    />
                  )}
                  
                  <div className={`max-w-[70%] ${isOwnMessage ? 'order-1' : ''}`}>
                    {showSenderName && !isOwnMessage && (
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 ml-2">
                        {message.sender.fullName}
                      </p>
                    )}
                    {showTimestamp && (
                      <div className={`text-xs text-gray-500 dark:text-gray-400 mb-1 ${
                        isOwnMessage ? 'text-right mr-2' : 'ml-2'
                      }`}>
                        {timeAgo(message.createdAt)}
                      </div>
                    )}
                    <div
                      className={`px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 ${
                        isOwnMessage
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none shadow-blue-200 dark:shadow-blue-900/30'
                          : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-none shadow-gray-200 dark:shadow-gray-900/30 border border-gray-100 dark:border-gray-600'
                      } group-hover:shadow-md`}
                    >
                      <p className="break-words leading-relaxed">{message.text}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold dark:text-white">Add Members</h3>
              <button 
                onClick={() => setShowAddMember(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <span className="text-xl">×</span>
              </button>
            </div>
            
            {groupInfo.admin._id !== user._id ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AiOutlineSetting className="text-yellow-500 text-2xl" />
                </div>
                <p className="text-gray-600 dark:text-gray-400">Only group administrators can add new members.</p>
              </div>
            ) : (
              <>
                <div className="relative mb-4">
                  <input
                    type="text"
                    value={memberQuery}
                    onChange={(e) => { 
                      setMemberQuery(e.target.value); 
                      searchMembers(e.target.value); 
                    }}
                    placeholder="Search users by name or username..."
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white transition-all duration-200"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {memberResults.map(u => (
                    <div key={u._id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors duration-150">
                      <div className="flex items-center space-x-3">
                        <img src={u.avatar} alt={u.username} className="w-10 h-10 rounded-full shadow-sm" />
                        <div>
                          <p className="font-medium dark:text-white">{u.fullName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">@{u.username}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => addMember(u._id)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium shadow-sm"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                  {memberResults.length === 0 && memberQuery && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No users found matching "{memberQuery}"
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Message Input Area */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-t border-gray-200/50 dark:border-gray-700/50 p-4 shadow-lg">
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600 max-w-md mx-auto">
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium dark:text-white">Choose an emoji</span>
              <button 
                onClick={() => setShowEmojiPicker(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-8 gap-1">
              {['😀','😂','😍','🥰','😎','🤔','😢','😭','😡','🤯','🥳','😇','🤗','🙏','👍','👎','👏','🙌','💪','❤️','💔','🔥','✨','💯','🎉','🎊','🎈','🎁','🏆','⭐','💫','✅'].map((emoji, idx) => (
                <button 
                  key={idx} 
                  type="button" 
                  onClick={() => addEmoji(emoji)} 
                  className="text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors duration-150 hover:scale-110"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-end space-x-3 max-w-4xl mx-auto">
          {/* Action Buttons */}
          <div className="flex items-center space-x-1">
            <button 
              type="button" 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-3 text-gray-500 hover:text-yellow-500 dark:text-gray-400 dark:hover:text-yellow-400 transition-all duration-200 hover:scale-110 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-xl"
              title="Add emoji"
            >
              <AiOutlineSmile size={22} />
            </button>

            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()} 
              className="p-3 text-gray-500 hover:text-green-500 dark:text-gray-400 dark:hover:text-green-400 transition-all duration-200 hover:scale-110 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl"
              title="Attach media"
            >
              <AiOutlinePicture size={22} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileSelect} className="hidden" />
          </div>

          {/* Message Input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
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
              placeholder="Type your message..."
              rows={1}
              className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white resize-none transition-all duration-200 max-h-32"
              style={{ minHeight: '48px' }}
            />
            
            {/* Voice Recording Button */}
            {!newMessage.trim() && (
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-all duration-200 ${
                  isRecording 
                    ? 'text-red-500 hover:text-red-600 animate-pulse' 
                    : 'text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400'
                }`}
                title={isRecording ? 'Stop recording' : 'Record voice message'}
              >
                {isRecording ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                    <BsStopFill size={20} />
                    <span className="text-sm font-medium">{recordSeconds}s</span>
                  </div>
                ) : (
                  <BsMicFill size={20} />
                )}
              </button>
            )}
          </div>

          {/* Send Button */}
          <button 
            type="submit" 
            disabled={!newMessage.trim() || sending}
            className={`p-3 rounded-xl transition-all duration-200 ${
              newMessage.trim() && !sending 
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg transform hover:scale-105 shadow-md' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <IoSend size={20} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GroupChat;