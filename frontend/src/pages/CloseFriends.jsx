import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';
import { BsStar, BsStarFill } from 'react-icons/bs';
import { AiOutlineSearch } from 'react-icons/ai';

const CloseFriends = () => {
  const { user } = useAuth();
  const [closeFriends, setCloseFriends] = useState([]);
  const [allsubscribed, setAllsubscribed] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await userAPI.getProfile(user.username);
      const subscribed = response.data.data.subscribed;
      
      setAllsubscribed(subscribed);
      // Get close friends from localStorage for now
      const saved = JSON.parse(localStorage.getItem('closeFriends') || '[]');
      setCloseFriends(saved);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCloseFriend = (friendId) => {
    let updated;
    if (closeFriends.includes(friendId)) {
      updated = closeFriends.filter(id => id !== friendId);
      toast.success('Removed from close friends');
    } else {
      updated = [...closeFriends, friendId];
      toast.success('Added to close friends');
    }
    
    setCloseFriends(updated);
    localStorage.setItem('closeFriends', JSON.stringify(updated));
  };

  const isCloseFriend = (friendId) => closeFriends.includes(friendId);

  const filteredsubscribed = allsubscribed.filter(friend =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 dark:from-dark-bg dark:via-dark-bg dark:to-dark-bg pb-20 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-secondary text-white rounded-3xl p-8 mb-8 shadow-glow">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center">
                <BsStarFill className="mr-3 text-yellow-300" />
                Close Friends
              </h1>
              <p className="text-purple-100">Share stories only with your close friends</p>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/20 backdrop-blur-lg rounded-2xl px-6 py-3">
                <p className="text-3xl font-bold">{closeFriends.length}</p>
                <p className="text-sm text-purple-100">Selected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="card p-6 mb-6">
          <h3 className="font-bold text-lg mb-2 dark:text-white flex items-center">
            <span className="text-2xl mr-2">💡</span>
            How it works
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>✓ Only close friends can see stories marked for them</li>
            <li>✓ Close friends see a green ring around your story</li>
            <li>✓ You can add or remove friends anytime</li>
            <li>✓ Friends won't be notified when you add/remove them</li>
          </ul>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <AiOutlineSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search subscribed..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-dark-card border-2 border-gray-200 dark:border-dark-border rounded-2xl focus:border-primary focus:outline-none dark:text-white"
            />
          </div>
        </div>

        {/* Friends List */}
        <div className="card overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-dark-border">
            {filteredsubscribed.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'No users found' : 'You are not subscribed anyone yet'}
                </p>
              </div>
            ) : (
              filteredsubscribed.map((friend) => (
                <div
                  key={friend._id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-border/50 transition"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={friend.avatar}
                      alt={friend.username}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold dark:text-white">{friend.username}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {friend.fullName}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleCloseFriend(friend._id)}
                    className={`p-3 rounded-full transition-all ${
                      isCloseFriend(friend._id)
                        ? 'bg-gradient-primary shadow-glow'
                        : 'bg-gray-200 dark:bg-dark-border hover:bg-gray-300 dark:hover:bg-dark-border/80'
                    }`}
                  >
                    {isCloseFriend(friend._id) ? (
                      <BsStarFill size={24} className="text-yellow-300" />
                    ) : (
                      <BsStar size={24} className="text-gray-600 dark:text-gray-400" />
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="card p-4 text-center">
            <p className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {allsubscribed.length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Subscribed</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {closeFriends.length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Close Friends</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {allsubscribed.length - closeFriends.length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Others</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloseFriends;
