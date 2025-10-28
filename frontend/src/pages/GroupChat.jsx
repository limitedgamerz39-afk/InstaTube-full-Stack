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
} from 'react-icons/ai';
import { BsThreeDotsVertical } from 'react-icons/bs';

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
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchGroupData();
    
    return () => {
      socketService.off('newGroupMessage');
    };
  }, [groupId]);

  useEffect(() => {
    if (!groupInfo) return;

    // Socket listeners
    socketService.on('newGroupMessage', handleNewMessage);

    return () => {
      socketService.off('newGroupMessage');
    };
  }, [groupInfo]);

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
      // Don't add if it's from current user (already added optimistically)
      if (message.sender._id === user._id) {
        return;
      }
      
      setMessages((prev) => {
        // Avoid duplicates
        const exists = prev.some(msg => msg._id === message._id);
        if (exists) return prev;
        return [...prev, message];
      });
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    scrollToBottom();
    setSending(true);

    try {
      const response = await groupAPI.sendGroupMessage(groupId, messageText);
      const sentMessage = response.data.data;

      // Replace temp message with real message
      setMessages((prev) =>
        prev.map((msg) => (msg._id === tempId ? sentMessage : msg))
      );
    } catch (error) {
      // Remove temp message on error
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
      toast.error('Failed to send message');
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm(`Leave ${groupInfo.name}?`)) return;

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
      toast.success('Member added');
      setShowAddMember(false);
      setMemberQuery('');
      setMemberResults([]);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add member';
      toast.error(msg);
    }
  };

  // Add back media selection handler to avoid runtime errors
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      toast.success('Media upload feature coming soon!');
      console.log('Selected file:', file);
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (!groupInfo) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 dark:from-dark-bg dark:via-dark-bg dark:to-dark-bg">
      {/* Header */}
      <div className="bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border p-4 shadow-lg">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/messages')}
              className="md:hidden hover:bg-gray-100 dark:hover:bg-dark-border p-2 rounded-full"
            >
              <AiOutlineArrowLeft size={24} className="dark:text-white" />
            </button>

            {/* Group Avatar (Overlapping) */}
            <div className="flex -space-x-2">
              {groupInfo.members.slice(0, 3).map((member, index) => (
                <img
                  key={member.user._id}
                  src={member.user.avatar}
                  alt={member.user.username}
                  className="w-10 h-10 rounded-full border-2 border-white dark:border-dark-bg"
                  style={{ zIndex: 3 - index }}
                />
              ))}
            </div>

            <div>
              <h2 className="font-bold text-gray-800 dark:text-white">
                {groupInfo.name}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {groupInfo.members.length} members
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-dark-border rounded-full relative"
            >
              <BsThreeDotsVertical size={20} className="text-gray-600 dark:text-gray-400" />
              
              {showMenu && (
                <div className="absolute right-0 top-12 bg-white dark:bg-dark-card rounded-2xl shadow-glow py-2 w-48 z-50">
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-dark-border dark:text-white">
                    Group Info
                  </button>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-dark-border dark:text-white">
                    Mute Notifications
                  </button>
                  <button 
                    onClick={handleLeaveGroup}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-dark-border text-red-500"
                  >
                    Leave Group
                  </button>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 max-w-4xl w-full mx-auto">
        {messages.map((message) => {
          const isOwnMessage = message.sender._id === user._id;
          
          return (
            <div
              key={message.id}
              className={`flex mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              {!isOwnMessage && (
                <img
                  src={message.sender.avatar}
                  alt={message.sender.username}
                  className="w-8 h-8 rounded-full mr-2"
                />
              )}
              
              <div className={`max-w-xs md:max-w-md ${isOwnMessage ? 'order-1' : ''}`}>
                {!isOwnMessage && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 ml-2">
                    {message.sender.username}
                  </p>
                )}
                <div
                  className={`px-4 py-2 rounded-3xl ${
                    isOwnMessage
                      ? 'bg-gradient-primary text-white shadow-glow'
                      : 'bg-white dark:bg-dark-card text-gray-800 dark:text-white shadow-lg'
                  }`}
                >
                  <p className="break-words">{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwnMessage ? 'text-purple-100' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {timeAgo(message.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-3 dark:text-white">Add Member</h3>
            {groupInfo.admin._id !== user._id ? (
              <p className="text-sm text-gray-500">Only group admin can add members.</p>
            ) : (
              <>
                <input
                  type="text"
                  value={memberQuery}
                  onChange={(e)=>{ setMemberQuery(e.target.value); searchMembers(e.target.value); }}
                  placeholder="Search users..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg mb-3 dark:bg-dark-bg dark:text-white"
                />
                <div className="max-h-48 overflow-y-auto">
                  {memberResults.map(u => (
                    <div key={u._id} className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-dark-border rounded">
                      <div className="flex items-center gap-2">
                        <img src={u.avatar} alt={u.username} className="w-8 h-8 rounded-full" />
                        <div>
                          <p className="text-sm dark:text-white">@{u.username}</p>
                          <p className="text-xs text-gray-500">{u.fullName}</p>
                        </div>
                      </div>
                      <button onClick={() => addMember(u._id)} className="px-3 py-1 bg-primary text-white rounded">Add</button>
                    </div>
                  ))}
                  {memberResults.length === 0 && (
                    <p className="text-sm text-gray-500">No results</p>
                  )}
                </div>
              </>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={()=>setShowAddMember(false)} className="px-4 py-2 border rounded">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white dark:bg-dark-card border-t border-gray-200 dark:border-dark-border p-4 shadow-lg">
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="p-4 border-b dark:border-gray-700 max-w-4xl mx-auto">
            <div className="grid grid-cols-8 gap-2">
              {['😀','😂','😍','🥰','😎','🤔','😢','😭','😡','🤯','🥳','😇','🤗','🙏','👍','👎','👏','🙌','💪','❤️','💔','🔥','✨','💯','🎉','🎊','🎈','🎁','🏆','⭐','💫','✅'].map((emoji, idx) => (
                <button key={idx} type="button" onClick={() => { setNewMessage(prev => prev + emoji); setShowEmojiPicker(false); }} className="text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded transition">
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-center space-x-2 max-w-4xl mx-auto">
          {/* Emoji Picker Button */}
          <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition" title="Add emoji">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd"/></svg>
          </button>

          {/* Media Picker Button */}
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition" title="Attach media">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileSelect} className="hidden" />

          {/* Camera Button */}
          <button type="button" onClick={() => toast('Camera feature coming soon!')} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition" title="Take photo">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </button>

          <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 px-6 py-3 bg-gray-100 dark:bg-dark-bg border-none rounded-full focus:outline-none focus:ring-2 focus:ring-primary dark:text-white" />
          <button type="submit" disabled={!newMessage.trim() || sending} className={`p-4 rounded-full transition-all ${newMessage.trim() && !sending ? 'bg-gradient-primary text-white shadow-glow hover:scale-110' : 'bg-gray-200 dark:bg-dark-border text-gray-400 cursor-not-allowed'}`}>
            <AiOutlineSend size={22} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default GroupChat;
