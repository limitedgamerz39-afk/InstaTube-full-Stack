import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import socketService from '../services/socket';
import toast from 'react-hot-toast';
import {
  AiOutlineHeart,
  AiFillHeart,
  AiOutlineClose,
  AiOutlineSend,
  AiOutlineShareAlt,
} from 'react-icons/ai';
import { BsPeople, BsThreeDots } from 'react-icons/bs';

const LiveStream = () => {
  const { streamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [stream, setStream] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  
  const videoRef = useRef(null);
  const commentsEndRef = useRef(null);

  useEffect(() => {
    fetchStreamData();
    joinStream();

    // Socket listeners
    socketService.on('streamComment', handleNewComment);
    socketService.on('streamLike', handleNewLike);
    socketService.on('viewerCountUpdate', handleViewerUpdate);
    socketService.on('streamEnded', handleStreamEnded);

    return () => {
      leaveStream();
      socketService.off('streamComment');
      socketService.off('streamLike');
      socketService.off('viewerCountUpdate');
      socketService.off('streamEnded');
    };
  }, [streamId]);

  const fetchStreamData = async () => {
    // Simulated stream data
    setStream({
      id: streamId,
      host: {
        id: '123',
        username: 'creator_username',
        avatar: 'https://ui-avatars.com/api/?name=Creator',
        isVerified: true,
      },
      title: 'Amazing Live Stream! 🔥',
      viewerCount: 1234,
      likes: 567,
      isLive: true,
      startedAt: new Date(),
    });
    setViewerCount(1234);
  };

  const joinStream = () => {
    socketService.emit('joinLiveStream', { streamId, userId: user._id });
    toast.success('Joined live stream!');
  };

  const leaveStream = () => {
    socketService.emit('leaveLiveStream', { streamId, userId: user._id });
  };

  const handleNewComment = (comment) => {
    setComments((prev) => [...prev, comment]);
    scrollToBottom();
  };

  const handleNewLike = () => {
    // Animation for new like
    const heart = document.createElement('div');
    heart.innerHTML = '❤️';
    heart.className = 'floating-heart';
    heart.style.left = `${Math.random() * 80 + 10}%`;
    document.getElementById('hearts-container')?.appendChild(heart);
    
    setTimeout(() => heart.remove(), 3000);
  };

  const handleViewerUpdate = (count) => {
    setViewerCount(count);
  };

  const handleStreamEnded = () => {
    toast.error('Stream has ended');
    setTimeout(() => navigate('/'), 2000);
  };

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment = {
      user: {
        username: user.username,
        avatar: user.avatar,
      },
      text: newComment,
      timestamp: new Date(),
    };

    socketService.emit('sendStreamComment', { streamId, comment });
    setComments([...comments, comment]);
    setNewComment('');
    scrollToBottom();
  };

  const sendLike = () => {
    socketService.emit('sendStreamLike', { streamId, userId: user._id });
    setIsLiked(true);
    handleNewLike();
    
    setTimeout(() => setIsLiked(false), 1000);
  };

  return (
    <div className="h-screen bg-black flex flex-col md:flex-row">
      {/* Video Section */}
      <div className="flex-1 relative">
        {/* Live Video Stream (Placeholder) */}
        <div className="w-full h-full bg-gradient-to-br from-purple-900 via-pink-900 to-black flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-6xl mb-4">📡</div>
            <p className="text-2xl font-bold mb-2">LIVE STREAM</p>
            <p className="text-purple-200">Video stream would appear here</p>
          </div>
        </div>

        {/* Floating Hearts Container */}
        <div id="hearts-container" className="absolute inset-0 pointer-events-none overflow-hidden"></div>

        {/* Live Badge */}
        <div className="absolute top-4 left-4 flex items-center space-x-2">
          <div className="bg-red-500 px-4 py-2 rounded-full flex items-center space-x-2 animate-pulse shadow-glow">
            <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
            <span className="text-white font-bold">LIVE</span>
          </div>
          
          <div className="bg-black/70 backdrop-blur-lg px-4 py-2 rounded-full flex items-center space-x-2">
            <BsPeople className="text-white" />
            <span className="text-white font-bold">{viewerCount.toLocaleString()}</span>
          </div>
        </div>

        {/* Host Info */}
        <div className="absolute top-4 right-4 left-4 md:left-auto flex items-center justify-between md:justify-end space-x-3">
          <div className="flex items-center space-x-3 bg-black/70 backdrop-blur-lg rounded-full px-4 py-2">
            <img
              src={stream?.host.avatar}
              alt={stream?.host.username}
              className="w-8 h-8 rounded-full border-2 border-white"
            />
            <div>
              <p className="text-white font-bold text-sm">@{stream?.host.username}</p>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/')}
            className="bg-black/70 backdrop-blur-lg p-2 rounded-full hover:bg-black/90 transition"
          >
            <AiOutlineClose className="text-white" size={24} />
          </button>
        </div>

        {/* Title */}
        <div className="absolute bottom-20 left-4 right-4">
          <p className="text-white text-lg font-semibold bg-black/50 backdrop-blur-lg rounded-2xl px-4 py-2">
            {stream?.title}
          </p>
        </div>

        {/* Like Button */}
        <button
          onClick={sendLike}
          className={`absolute bottom-32 right-4 w-16 h-16 rounded-full flex items-center justify-center transition-all ${
            isLiked
              ? 'bg-red-500 scale-125'
              : 'bg-white/20 backdrop-blur-lg hover:scale-110'
          }`}
        >
          {isLiked ? (
            <AiFillHeart className="text-white" size={32} />
          ) : (
            <AiOutlineHeart className="text-white" size={32} />
          )}
        </button>

        {/* Share Button (Mobile) */}
        <button
          onClick={() => setShowShareMenu(!showShareMenu)}
          className="md:hidden absolute bottom-32 left-4 w-12 h-12 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center hover:scale-110 transition"
        >
          <AiOutlineShareAlt className="text-white" size={24} />
        </button>
      </div>

      {/* Comments Section (Desktop Sidebar / Mobile Bottom) */}
      <div className="md:w-96 bg-black/90 backdrop-blur-lg border-t md:border-l border-white/10 flex flex-col max-h-64 md:max-h-screen">
        {/* Comments Header */}
        <div className="p-4 border-b border-white/10">
          <h3 className="text-white font-bold text-lg">Live Chat</h3>
          <p className="text-gray-400 text-sm">{comments.length} messages</p>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
          {comments.map((comment, index) => (
            <div key={index} className="flex items-start space-x-2 animate-fadeIn">
              <img
                src={comment.user.avatar}
                alt={comment.user.username}
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
              <div className="flex-1">
                <p className="text-sm">
                  <span className="text-purple-400 font-semibold">
                    @{comment.user.username}
                  </span>
                  <span className="text-white ml-2">{comment.text}</span>
                </p>
              </div>
            </div>
          ))}
          <div ref={commentsEndRef} />
        </div>

        {/* Comment Input */}
        <form onSubmit={sendComment} className="p-4 border-t border-white/10">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Say something..."
              className="flex-1 bg-white/10 text-white placeholder-gray-400 px-4 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
              maxLength={200}
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className={`p-3 rounded-full transition-all ${
                newComment.trim()
                  ? 'bg-gradient-primary shadow-glow hover:scale-110'
                  : 'bg-gray-700 cursor-not-allowed'
              }`}
            >
              <AiOutlineSend className="text-white" size={20} />
            </button>
          </div>
        </form>
      </div>

      {/* Floating Hearts Animation CSS */}
      <style jsx>{`
        .floating-heart {
          position: absolute;
          bottom: 0;
          font-size: 2rem;
          animation: floatUp 3s ease-out forwards;
          pointer-events: none;
        }
        
        @keyframes floatUp {
          0% {
            bottom: 0;
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            bottom: 100%;
            opacity: 0;
            transform: translateY(-100px) scale(1.5);
          }
        }
      `}</style>
    </div>
  );
};

export default LiveStream;
