import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { postAPI, exploreAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import VideoAd from '../components/VideoAd';
import { shouldShowReelAd, AD_CONFIG } from '../utils/adConfig';
import toast from 'react-hot-toast';
import {
  AiOutlineHeart,
  AiFillHeart,
  AiOutlineComment,
  AiOutlineShareAlt,
} from 'react-icons/ai';
import { BsBookmark, BsBookmarkFill, BsThreeDots } from 'react-icons/bs';

const Reels = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reels, setReels] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const videoRefs = useRef([]);
  const [commentPostId, setCommentPostId] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [following, setFollowing] = useState({});
  const [detailsFor, setDetailsFor] = useState(null);
  const [showAd, setShowAd] = useState(false);
  const [adType, setAdType] = useState('pre-roll');

  useEffect(() => {
    fetchReels();
  }, []);

  useEffect(() => {
    if (shouldShowReelAd(currentIndex)) {
      setShowAd(true);
      setAdType('pre-roll');
    } else {
      videoRefs.current.forEach((video, index) => {
        if (video) {
          if (index === currentIndex) {
            video.play();
          } else {
            video.pause();
          }
        }
      });
    }
  }, [currentIndex]);

  const handleAdComplete = () => {
    setShowAd(false);
    const video = videoRefs.current[currentIndex];
    if (video) video.play();
  };

  const fetchReels = async () => {
    try {
      const response = await exploreAPI.getExplorePosts();
      const data = response.data.data || [];
      // Filter only shorts (category === 'short'); fallback to short-like videos
      const videoReels = data.filter((post) => {
        if (post.category) return post.category === 'short';
        const isVideo = post.media?.[0]?.type === 'video' || post.mediaType === 'video';
        const isShort = typeof post.durationSec === 'number' ? post.durationSec <= 60 : true;
        return isVideo && isShort;
      });
      setReels(videoReels);
    } catch (error) {
      toast.error('Failed to load reels');
    } finally {
      setLoading(false);
    }
  };

  const openComments = async (postId) => {
    setCommentPostId(postId);
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

  const closeComments = () => {
    setCommentPostId(null);
    setComments([]);
    setCommentText('');
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !commentPostId) return;
    try {
      const res = await postAPI.addComment(commentPostId, commentText.trim());
      setComments((prev) => [...prev, res.data.data]);
      setCommentText('');
      // Update count in main list
      setReels((prev) => prev.map(r => r._id === commentPostId ? { ...r, comments: [...r.comments, res.data.data] } : r));
    } catch {
      toast.error('Failed to add comment');
    }
  };

  const handleScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    const windowHeight = window.innerHeight;
    const newIndex = Math.round(scrollTop / windowHeight);
    if (newIndex !== currentIndex && newIndex < reels.length) {
      setCurrentIndex(newIndex);
    }
  };

  const handleShare = async (reel) => {
    try {
      const url = reel.media?.[0]?.url || reel.mediaUrl || `${window.location.origin}/posts/${reel._id}`;
      if (navigator.share) {
        await navigator.share({
          title: reel.title || `@${reel.author.username} on InstaTube`,
          text: reel.caption || 'Check this out!',
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

  const handleLike = async (postId, index) => {
    try {
      const response = await postAPI.likePost(postId);
      const newReels = [...reels];
      newReels[index].likes = response.data.isLiked
        ? [...newReels[index].likes, user._id]
        : newReels[index].likes.filter((id) => id !== user._id);
      setReels(newReels);
    } catch (error) {
      toast.error('Failed to like reel');
    }
  };

  const handleFollow = async (author) => {
    try {
      const res = await userAPI.followUser(author._id);
      setFollowing((prev) => ({ ...prev, [author._id]: res.data.isFollowing }));
      toast.success(res.data.isFollowing ? 'Following' : 'Unfollowed');
    } catch {
      toast.error('Failed to follow user');
    }
  };

  const openDetails = (reel) => setDetailsFor(reel);
  const closeDetails = () => setDetailsFor(null);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-500"></div>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-pink-900 to-amber-900 text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">🎬</div>
          <h2 className="text-2xl font-bold mb-2">No Reels Yet</h2>
          <p className="text-purple-200">Upload your first video reel!</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showAd && (
        <VideoAd
          type={adType}
          duration={AD_CONFIG.videoAds.preRoll.duration}
          onComplete={handleAdComplete}
          onSkip={handleAdComplete}
        />
      )}
      <div
        className="h-screen overflow-y-scroll snap-y snap-mandatory bg-black"
        onScroll={handleScroll}
      >
        {reels.map((reel, index) => (
        <div
          key={reel._id}
          className="h-screen w-full snap-start relative flex items-center justify-center"
        >
          {/* Video or Duet */}
          {reel.remixType === 'duet' && reel.derivedFrom ? (
            <div className="h-full w-full flex items-center justify-center gap-2">
              <video
                src={reel.derivedFrom.media?.[0]?.url || reel.derivedFrom.mediaUrl}
                className="h-full w-1/2 object-contain"
                loop
                playsInline
                muted
              />
              <video
                ref={(el) => (videoRefs.current[index] = el)}
                src={reel.media?.[0]?.url || reel.mediaUrl}
                className="h-full w-1/2 object-contain"
                loop
                playsInline
                onLoadedMetadata={(e)=>{ if (typeof reel.playbackRate==='number') { try { e.target.playbackRate = reel.playbackRate; } catch {} } }}
                onClick={(e) => {
                  if (e.target.paused) {
                    e.target.play();
                  } else {
                    e.target.pause();
                  }
                }}
              />
            </div>
          ) : (
            <video
              ref={(el) => (videoRefs.current[index] = el)}
              src={reel.media?.[0]?.url || reel.mediaUrl}
              className="h-full w-auto max-w-full object-contain"
              loop
              playsInline
              onLoadedMetadata={(e)=>{ if (typeof reel.playbackRate==='number') { try { e.target.playbackRate = reel.playbackRate; } catch {} } }}
              onClick={(e) => {
                if (e.target.paused) {
                  e.target.play();
                } else {
                  e.target.pause();
                }
              }}
            />
          )}

          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50 pointer-events-none"></div>

          {/* Top Bar */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <div className="flex items-center space-x-3">
              <img
                src={reel.author.avatar}
                alt={reel.author.username}
                className="w-12 h-12 rounded-full border-2 border-white shadow-glow cursor-pointer"
                onClick={() => navigate(`/profile/${reel.author.username}`)}
              />
              <button
                className="text-white font-semibold underline-offset-2 hover:underline"
                onClick={() => navigate(`/profile/${reel.author.username}`)}
              >
                @{reel.author.username}
              </button>
              <button
                className="px-3 py-1 bg-white/20 text-white rounded-full text-sm hover:bg-white/30"
                onClick={() => handleFollow(reel.author)}
              >
                {following[reel.author._id] ? 'Following' : 'Follow'}
              </button>
            </div>
            <button className="text-white" onClick={() => navigate(`/upload?remixOf=${reel._id}&category=short`)}>
              Duet
            </button>

          </div>

          {/* Bottom Info */}
          <div className="absolute bottom-20 left-4 right-20 z-10">

            <p className="text-white text-sm mb-3 cursor-pointer" onClick={() => setDetailsFor(reel)}>{reel.description || reel.caption}</p>
          </div>

          {/* Right Actions - TikTok Style */}
          <div className="absolute right-4 bottom-20 flex flex-col space-y-6 z-10">
            {/* Like */}
            <button
              onClick={() => handleLike(reel._id, index)}
              className="flex flex-col items-center"
            >
              {reel.likes.includes(user?._id) ? (
                <AiFillHeart size={36} className="text-red-500 drop-shadow-glow" />
              ) : (
                <AiOutlineHeart size={36} className="text-white drop-shadow-lg" />
              )}
              <span className="text-white text-xs mt-1 font-semibold">
                {reel.likes.length}
              </span>
            </button>

            {/* Comment */}
            <button className="flex flex-col items-center" onClick={() => openComments(reel._id)}>
              <AiOutlineComment size={36} className="text-white drop-shadow-lg" />
              <span className="text-white text-xs mt-1 font-semibold">
                {reel.comments.length}
              </span>
            </button>

            <button className="flex flex-col items-center" onClick={() => handleShare(reel)}>
              <AiOutlineShareAlt size={36} className="text-white drop-shadow-lg" />
              <span className="text-white text-xs mt-1 font-semibold">Share</span>
            </button>

            {/* Bookmark */}
            <button className="flex flex-col items-center">
              <BsBookmark size={32} className="text-white drop-shadow-lg" />
            </button>

            {/* Author Avatar (Spinning) */}
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-primary p-0.5 animate-spin-slow">
                <img
                  src={reel.author.avatar}
                  alt={reel.author.username}
                  className="w-full h-full rounded-full border-2 border-black cursor-pointer"
                  onClick={() => navigate(`/profile/${reel.author.username}`)}
                />
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="absolute top-1/2 right-2 transform -translate-y-1/2 flex flex-col space-y-1">
            {reels.map((_, i) => (
              <div
                key={i}
                className={`w-1 h-8 rounded-full transition-all ${
                  i === currentIndex
                    ? 'bg-white'
                    : i < currentIndex
                    ? 'bg-white/50'
                    : 'bg-white/20'
                }`}
              ></div>
            ))}
          </div>
        </div>
      ))}

      <style >{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>

      {/* Comments Overlay */}
      {commentPostId && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md mx-4 p-4 border dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold dark:text-white">Comments</h3>
              <button onClick={closeComments} className="text-gray-500">✕</button>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-3 mb-3">
              {commentsLoading ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : comments.length === 0 ? (
                <div className="text-sm text-gray-500">No comments yet.</div>
              ) : (
                comments.map((c) => (
                  <div key={c._id} className="flex items-start gap-2">
                    <img src={c.author.avatar} alt={c.author.username} className="h-8 w-8 rounded-full" />
                    <div>
                      <p className="text-sm"><span className="font-semibold">{c.author.username}</span> {c.text}</p>
                      <p className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleAddComment} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e)=>setCommentText(e.target.value)}
                className="flex-1 input-field dark:bg-gray-800 dark:text-white"
              />
              <button type="submit" disabled={!commentText.trim()} className="btn-primary">Post</button>
            </form>
          </div>
        </div>
      )}

      {detailsFor && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm mx-4 p-4 border dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold dark:text-white">Details</h3>
              <button onClick={closeDetails} className="text-gray-500">✕</button>
            </div>
            <div className="space-y-2 text-sm dark:text-white">
              <div className="flex justify-between">
                <span>Likes</span>
                <span>{(detailsFor.likes || []).length}</span>
              </div>
              <div className="flex justify-between">
                <span>Views</span>
                <span>{detailsFor.views || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Uploaded</span>
                <span>{new Date(detailsFor.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default Reels;
