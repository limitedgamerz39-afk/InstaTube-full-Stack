import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AiOutlineCalendar, AiOutlineClockCircle } from 'react-icons/ai';
import { BsCheckCircle } from 'react-icons/bs';

const SchedulePost = () => {
  const navigate = useNavigate();
  const [scheduledPosts, setScheduledPosts] = useState([
    {
      id: 1,
      caption: 'Morning vibes ☀️',
      media: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
      scheduledFor: new Date(Date.now() + 86400000),
      status: 'scheduled',
    },
    {
      id: 2,
      caption: 'Sunset beauty 🌅',
      media: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      scheduledFor: new Date(Date.now() + 172800000),
      status: 'scheduled',
    },
  ]);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  const cancelScheduledPost = (postId) => {
    setScheduledPosts(scheduledPosts.filter(post => post.id !== postId));
    toast.success('Scheduled post cancelled');
  };

  const formatScheduledDate = (date) => {
    const now = new Date();
    const scheduled = new Date(date);
    const diffTime = scheduled - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return scheduled.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 dark:from-dark-bg dark:via-dark-bg dark:to-dark-bg pb-20 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-primary text-white rounded-3xl p-8 mb-8 shadow-glow">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center">
                <AiOutlineCalendar className="mr-3" />
                Scheduled Posts
              </h1>
              <p className="text-purple-100">Plan your content in advance</p>
            </div>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="hidden md:block bg-white/20 backdrop-blur-lg hover:bg-white/30 px-6 py-3 rounded-2xl font-semibold transition-all hover:scale-105"
            >
              + Schedule New
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card p-6 text-center">
            <p className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {scheduledPosts.length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Scheduled</p>
          </div>
          <div className="card p-6 text-center">
            <p className="text-3xl font-bold text-green-500">
              {scheduledPosts.filter(p => p.status === 'published').length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Published</p>
          </div>
          <div className="card p-6 text-center">
            <p className="text-3xl font-bold text-blue-500">
              {scheduledPosts.filter(p => new Date(p.scheduledFor) < new Date(Date.now() + 86400000)).length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Next 24h</p>
          </div>
        </div>

        {/* Scheduled Posts List */}
        <div className="space-y-4">
          {scheduledPosts.length === 0 ? (
            <div className="card p-12 text-center">
              <AiOutlineCalendar size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No scheduled posts yet
              </p>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="btn-primary"
              >
                Schedule Your First Post
              </button>
            </div>
          ) : (
            scheduledPosts.map((post) => (
              <div
                key={post.id}
                className="card overflow-hidden hover:shadow-glow transition-all"
              >
                <div className="flex items-center space-x-4 p-4">
                  {/* Thumbnail */}
                  <img
                    src={post.media}
                    alt="Post preview"
                    className="w-24 h-24 rounded-2xl object-cover"
                  />

                  {/* Content */}
                  <div className="flex-1">
                    <p className="font-semibold dark:text-white mb-1 line-clamp-2">
                      {post.caption}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center">
                        <AiOutlineCalendar className="mr-1" />
                        {formatScheduledDate(post.scheduledFor)}
                      </span>
                      <span className="flex items-center">
                        <AiOutlineClockCircle className="mr-1" />
                        {new Date(post.scheduledFor).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="mt-2">
                      {post.status === 'scheduled' ? (
                        <span className="inline-flex items-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-semibold">
                          <AiOutlineClockCircle className="mr-1" />
                          Scheduled
                        </span>
                      ) : (
                        <span className="inline-flex items-center bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
                          <BsCheckCircle className="mr-1" />
                          Published
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => toast('Edit functionality coming soon!')}
                      className="px-4 py-2 bg-gradient-primary text-white rounded-2xl text-sm font-semibold hover:shadow-glow transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => cancelScheduledPost(post.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-2xl text-sm font-semibold hover:bg-red-600 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Schedule Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-card rounded-3xl p-8 max-w-md w-full shadow-glow">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
                Schedule Post
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-dark-border rounded-2xl focus:border-primary focus:outline-none dark:bg-dark-bg dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-dark-border rounded-2xl focus:border-primary focus:outline-none dark:bg-dark-bg dark:text-white"
                  />
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-2xl">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    💡 <strong>Pro Tip:</strong> Best times to post are 9 AM, 12 PM, and 7 PM
                  </p>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="flex-1 py-3 bg-gray-200 dark:bg-dark-border rounded-2xl font-semibold hover:bg-gray-300 dark:hover:bg-dark-border/80 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      toast.success('Post scheduled successfully!');
                      setShowScheduleModal(false);
                    }}
                    className="flex-1 btn-primary"
                  >
                    Schedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile FAB */}
        <button
          onClick={() => setShowScheduleModal(true)}
          className="md:hidden fixed bottom-20 right-4 w-16 h-16 bg-gradient-primary rounded-full shadow-glow flex items-center justify-center text-white text-3xl hover:scale-110 transition-all z-40"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default SchedulePost;
