import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { postAPI, exploreAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  AiOutlineHeart,
  AiFillHeart,
  AiOutlineComment,
  AiOutlineShareAlt,
  AiOutlineEye,
} from 'react-icons/ai';
import { BsBookmark, BsBookmarkFill } from 'react-icons/bs';
import VideoAd from '../components/VideoAd';
import { AD_CONFIG } from '../utils/adConfig';

const Videos = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const watchId = searchParams.get('watch');
  
  const [videos, setVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [adType, setAdType] = useState('pre-roll');
  const [midRollShown, setMidRollShown] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    if (watchId && videos.length > 0) {
      const video = videos.find(v => v._id === watchId);
      if (video) {
        setCurrentVideo(video);
        fetchComments(watchId);
        if (AD_CONFIG.videoAds.preRoll.enabled) {
          setShowAd(true);
          setAdType('pre-roll');
        }
      }
    }
  }, [watchId, videos]);

  const fetchVideos = async () => {
    try {
      const response = await exploreAPI.getExplorePosts();
      const data = response.data.data || [];
      const longVideos = data.filter((post) => post.category === 'long').map(v => ({
        ...v,
        comments: v.comments || [],
        likes: v.likes || []
      }));
      setVideos(longVideos);
    } catch (error) {
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId) => {
    setCommentsLoading(true);
    try {
      const res = await postAPI.getComments(postId);
      setComments(res.data.data || []);
    } catch {
      toast.error('Failed to load comments');
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !currentVideo) return;
    try {
      const res = await postAPI.addComment(currentVideo._id, commentText.trim());
      setComments((prev) => [...prev, res.data.data]);
      setCommentText('');
      setVideos((prev) => prev.map(v => v._id === currentVideo._id ? { ...v, comments: [...(v.comments || []), res.data.data] } : v));
      if (currentVideo) {
        setCurrentVideo({
          ...currentVideo,
          comments: [...(currentVideo.comments || []), res.data.data]
        });
      }
    } catch {
      toast.error('Failed to add comment');
    }
  };

  const handleLike = async (postId) => {
    try {
      const response = await postAPI.likePost(postId);
      const isLiked = response.data.isLiked;
      setVideos(videos.map(v => 
        v._id === postId 
          ? { ...v, likes: isLiked ? [...(v.likes || []), user._id] : (v.likes || []).filter(id => id !== user._id) }
          : v
      ));
      if (currentVideo && currentVideo._id === postId) {
        setCurrentVideo({
          ...currentVideo,
          likes: isLiked ? [...(currentVideo.likes || []), user._id] : (currentVideo.likes || []).filter(id => id !== user._id)
        });
      }
    } catch (error) {
      toast.error('Failed to like video');
    }
  };

  const handleVideoProgress = (e) => {
    const video = e.target;
    const currentTime = video.currentTime;
    const interval = AD_CONFIG.videoAds.midRoll.interval;
    
    if (AD_CONFIG.videoAds.midRoll.enabled && currentTime >= interval && !midRollShown && video.duration > interval + 10) {
      video.pause();
      setMidRollShown(true);
      setAdType('mid-roll');
      setShowAd(true);
    }
  };

  const handleAdComplete = () => {
    setShowAd(false);
    const videoEl = document.getElementById('main-video');
    if (videoEl) videoEl.play();
  };

  const handleShare = async (video) => {
    try {
      const url = `${window.location.origin}/videos?watch=${video._id}`;
      if (navigator.share) {
        await navigator.share({
          title: video.title || 'Watch on InstaTube',
          text: video.description || 'Check this video!',
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      }
    } catch (e) {
      toast.error('Unable to share');
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const formatViews = (count) => {
    if (!count) return '0 views';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M views`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K views`;
    return `${count} views`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-500"></div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="text-6xl mb-4">🎥</div>
          <h2 className="text-2xl font-bold mb-2 dark:text-white">No Long Videos Yet</h2>
          <p className="text-gray-600 dark:text-gray-400">Be the first to upload a long-form video!</p>
          <button onClick={() => navigate('/upload')} className="btn-primary mt-4">Upload Video</button>
        </div>
      </div>
    );
  }

  if (currentVideo) {
    return (
      <>
        {showAd && (
          <VideoAd
            type={adType}
            duration={
              adType === 'pre-roll' ? AD_CONFIG.videoAds.preRoll.duration :
              AD_CONFIG.videoAds.midRoll.duration
            }
            onComplete={handleAdComplete}
            onSkip={handleAdComplete}
          />
        )}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-black rounded-lg overflow-hidden mb-4">
                <video
                  id="main-video"
                  src={currentVideo.media?.[0]?.url || currentVideo.mediaUrl}
                  controls
                  autoPlay
                  className="w-full"
                  onTimeUpdate={handleVideoProgress}
                  onLoadedMetadata={(e) => {
                    if (typeof currentVideo.playbackRate === 'number') {
                      try { e.target.playbackRate = currentVideo.playbackRate; } catch {}
                    }
                  }}
                />
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
                <h1 className="text-2xl font-bold mb-2 dark:text-white">{currentVideo.title}</h1>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <AiOutlineEye /> {formatViews(currentVideo.views)}
                    </span>
                    <span>{new Date(currentVideo.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => handleLike(currentVideo._id)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                    >
                      {currentVideo.likes.includes(user?._id) ? (
                        <AiFillHeart size={20} className="text-red-500" />
                      ) : (
                        <AiOutlineHeart size={20} />
                      )}
                      <span>{currentVideo.likes.length}</span>
                    </button>
                    <button 
                      onClick={() => handleShare(currentVideo)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                    >
                      <AiOutlineShareAlt size={20} />
                      Share
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-4 py-4 border-t dark:border-gray-700">
                  <img
                    src={currentVideo.author.avatar}
                    alt={currentVideo.author.username}
                    className="w-12 h-12 rounded-full cursor-pointer"
                    onClick={() => navigate(`/profile/${currentVideo.author.username}`)}
                  />
                  <div className="flex-1">
                    <p 
                      className="font-semibold dark:text-white cursor-pointer hover:underline"
                      onClick={() => navigate(`/profile/${currentVideo.author.username}`)}
                    >
                      {currentVideo.author.username}
                    </p>
                    <p className="text-sm text-gray-500">{currentVideo.author.followers?.length || 0} followers</p>
                  </div>
                  <button className="btn-primary">Subscribe</button>
                </div>

                <div className="py-4 border-t dark:border-gray-700">
                  <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{currentVideo.description}</p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-4 dark:text-white">
                  {comments.length} Comments
                </h3>
                
                <form onSubmit={handleAddComment} className="flex items-start gap-3 mb-6">
                  <img src={user?.avatar} alt="You" className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="w-full px-4 py-2 border-b-2 border-gray-300 dark:border-gray-600 focus:border-primary dark:bg-gray-800 dark:text-white outline-none"
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button 
                        type="button" 
                        onClick={() => setCommentText('')}
                        className="btn-outline"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={!commentText.trim()}
                        className="btn-primary disabled:opacity-50"
                      >
                        Comment
                      </button>
                    </div>
                  </div>
                </form>

                <div className="space-y-4">
                  {commentsLoading ? (
                    <div className="text-sm text-gray-500">Loading comments...</div>
                  ) : comments.length === 0 ? (
                    <div className="text-sm text-gray-500 text-center py-8">No comments yet. Be the first!</div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment._id} className="flex items-start gap-3">
                        <img 
                          src={comment.author.avatar} 
                          alt={comment.author.username} 
                          className="w-10 h-10 rounded-full cursor-pointer"
                          onClick={() => navigate(`/profile/${comment.author.username}`)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span 
                              className="font-semibold text-sm dark:text-white cursor-pointer hover:underline"
                              onClick={() => navigate(`/profile/${comment.author.username}`)}
                            >
                              {comment.author.username}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm mt-1 dark:text-gray-300">{comment.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <h3 className="font-semibold mb-4 dark:text-white">More Videos</h3>
              <div className="space-y-3">
                {videos.filter(v => v._id !== currentVideo._id).slice(0, 10).map((video) => (
                  <div
                    key={video._id}
                    onClick={() => {
                      navigate(`/videos?watch=${video._id}`);
                      setMidRollShown(false);
                      setCurrentVideo(video);
                      fetchComments(video._id);
                      if (AD_CONFIG.videoAds.preRoll.enabled) {
                        setShowAd(true);
                        setAdType('pre-roll');
                      }
                    }}
                    className="flex gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition"
                  >
                    <div className="relative min-w-[168px] h-24 bg-black rounded-lg overflow-hidden">
                      <video 
                        src={video.media?.[0]?.url || video.mediaUrl} 
                        className="w-full h-full object-cover"
                        muted
                      />
                      <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                        {formatDuration(video.durationSec)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm line-clamp-2 dark:text-white">{video.title}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{video.author.username}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {formatViews(video.views)} • {new Date(video.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 dark:text-white">Long Videos</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {videos.map((video) => (
          <div
            key={video._id}
            onClick={() => navigate(`/videos?watch=${video._id}`)}
            className="cursor-pointer group"
          >
            <div className="relative bg-black rounded-lg overflow-hidden mb-2">
              <video 
                src={video.media?.[0]?.url || video.mediaUrl} 
                className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-200"
                muted
              />
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                {formatDuration(video.durationSec)}
              </div>
            </div>
            
            <div className="flex gap-3">
              <img
                src={video.author.avatar}
                alt={video.author.username}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm line-clamp-2 dark:text-white group-hover:text-primary transition">
                  {video.title}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {video.author.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {formatViews(video.views)} • {new Date(video.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Videos;
