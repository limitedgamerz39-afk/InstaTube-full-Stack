import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postAPI } from '../services/api';
import toast from 'react-hot-toast';
import { AiOutlineDelete } from 'react-icons/ai';
import { timeAgo } from '../utils/timeAgo';

const CommentBox = ({ post, setPost }) => {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);

  const [replyText, setReplyText] = useState('');
  const [replyTo, setReplyTo] = useState(null);

  const handleReplySubmit = async (commentId) => {
    if (!replyText.trim()) return;
    try {
      const response = await postAPI.replyToComment(post._id, commentId, replyText.trim());
      setPost((prev) => ({
        ...prev,
        comments: [...prev.comments, response.data.data],
      }));
      setReplyText('');
      setReplyTo(null);
      toast.success('Reply added');
    } catch (error) {
      toast.error('Failed to add reply');
    }
  };

  const handlePinComment = async (commentId) => {
    try {
      const response = await postAPI.pinComment(post._id, commentId);
      setPost((prev) => ({ ...prev, pinnedComment: response.data.data }));
      toast.success('Comment pinned');
    } catch (error) {
      toast.error('Failed to pin comment');
    }
  };

  const handleUnpinComment = async () => {
    try {
      await postAPI.unpinComment(post._id);
      setPost((prev) => ({ ...prev, pinnedComment: null }));
      toast.success('Comment unpinned');
    } catch (error) {
      toast.error('Failed to unpin comment');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!commentText.trim()) {
      return;
    }

    setLoading(true);
    try {
      const response = await postAPI.addComment(post._id, commentText);
      setPost((prev) => ({
        ...prev,
        comments: [...prev.comments, response.data.data],
      }));
      setCommentText('');
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await postAPI.deleteComment(post._id, commentId);
      setPost((prev) => ({
        ...prev,
        comments: prev.comments.filter((c) => c._id !== commentId),
      }));
      toast.success('Comment deleted');
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  return (
    <div className="border-t border-gray-200 pt-3">
      {/* Comments List */}
      <div className="max-h-60 overflow-y-auto mb-3">
        {(() => {
          const byParent = {};
          const roots = [];
          for (const c of post.comments) {
            const pid = c.parentComment || null;
            if (pid) {
              byParent[pid] = byParent[pid] || [];
              byParent[pid].push(c);
            } else {
              roots.push(c);
            }
          }

          const renderItem = (comment, isPinned = false) => (
            <div key={comment._id} className={`flex items-start justify-between mb-3 ${isPinned ? 'bg-yellow-50 dark:bg-yellow-900/20 rounded-md p-2' : ''}`}>
              <div className="flex items-start space-x-2 flex-1">
                <Link to={`/profile/${comment.author.username}`}>
                  <img
                    src={comment.author.avatar}
                    alt={comment.author.username}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                </Link>
                <div className="flex-1">
                  <p className="text-sm">
                    <Link
                      to={`/profile/${comment.author.username}`}
                      className="font-semibold mr-2"
                    >
                      {comment.author.username}
                    </Link>
                    {comment.text}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-gray-500">{timeAgo(comment.createdAt)}</p>
                    <button onClick={() => setReplyTo(comment._id)} className="text-xs text-gray-500 hover:underline">Reply</button>
                    {user?._id === post.author._id && (
                      <div className="text-xs text-gray-500">
                        {(post.pinnedComment && post.pinnedComment._id === comment._id) ? (
                          <button onClick={handleUnpinComment} className="hover:underline">Unpin</button>
                        ) : (
                          <button onClick={() => handlePinComment(comment._id)} className="hover:underline">Pin</button>
                        )}
                      </div>
                    )}
                  </div>

                  {replyTo === comment._id && (
                    <form onSubmit={(e) => { e.preventDefault(); handleReplySubmit(comment._id); }} className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="Write a reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="flex-1 py-1 px-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button type="submit" disabled={!replyText.trim()} className={`text-xs font-semibold ${replyText.trim() ? 'text-primary' : 'text-gray-400 cursor-not-allowed'}`}>Reply</button>
                    </form>
                  )}
                </div>
              </div>

              {user?._id === comment.author._id && (
                <button
                  onClick={() => handleDeleteComment(comment._id)}
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  <AiOutlineDelete size={16} />
                </button>
              )}
            </div>
          );

          return (
            <>
              {post.pinnedComment && renderItem(post.pinnedComment, true)}
              {roots.map((comment) => (
                <div key={comment._id}>
                  {renderItem(comment)}
                  {(byParent[comment._id] || []).map((child) => (
                    <div key={child._id} className="ml-10">
                      {renderItem(child)}
                    </div>
                  ))}
                </div>
              ))}
            </>
          );
        })()}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleAddComment} className="flex items-center space-x-2">
        <input
          type="text"
          placeholder="Add a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="flex-1 py-2 px-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={loading || !commentText.trim()}
          className={`font-semibold ${
            commentText.trim()
              ? 'text-primary hover:text-blue-700'
              : 'text-gray-400 cursor-not-allowed'
          }`}
        >
          Post
        </button>
      </form>
    </div>
  );
};

export default CommentBox;
