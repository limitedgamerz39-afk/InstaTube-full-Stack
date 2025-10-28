import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { groupAPI, userAPI } from '../services/api';
import socketService from '../services/socket';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';
import { timeAgo } from '../utils/timeAgo';
import { AiOutlinePlus, AiOutlineUsergroupAdd } from 'react-icons/ai';
import { FiUsers } from 'react-icons/fi';

const Groups = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchGroups();

    // Listen for new groups and messages
    socketService.on('newGroup', handleNewGroup);
    socketService.on('newGroupMessage', handleNewGroupMessage);
    socketService.on('addedToGroup', handleAddedToGroup);

    return () => {
      socketService.off('newGroup');
      socketService.off('newGroupMessage');
      socketService.off('addedToGroup');
    };
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await groupAPI.getUserGroups();
      setGroups(response.data.data);
    } catch (error) {
      console.error('Failed to load groups:', error);
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleNewGroup = (group) => {
    setGroups((prev) => [group, ...prev]);
  };

  const handleNewGroupMessage = ({ groupId, message }) => {
    setGroups((prev) =>
      prev.map((group) =>
        group._id === groupId
          ? { ...group, lastMessage: message, lastMessageAt: new Date() }
          : group
      )
    );
  };

  const handleAddedToGroup = (group) => {
    setGroups((prev) => [group, ...prev]);
    toast.success(`You were added to ${group.name}`);
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await userAPI.searchUsers(query);
      setSearchResults(response.data.data);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const toggleMember = (user) => {
    setSelectedMembers((prev) => {
      const exists = prev.find((m) => m._id === user._id);
      if (exists) {
        return prev.filter((m) => m._id !== user._id);
      }
      return [...prev, user];
    });
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();

    if (!groupName.trim()) {
      toast.error('Group name is required');
      return;
    }

    if (selectedMembers.length === 0) {
      toast.error('Please select at least one member');
      return;
    }

    setCreating(true);

    try {
      const response = await groupAPI.createGroup({
        name: groupName,
        description: groupDescription,
        memberIds: selectedMembers.map((m) => m._id),
      });

      toast.success('Group created successfully!');
      setShowCreateModal(false);
      setGroupName('');
      setGroupDescription('');
      setSelectedMembers([]);
      navigate(`/group/${response.data.data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Groups</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-full hover:bg-primary/90 transition"
        >
          <AiOutlinePlus size={20} />
          <span>Create Group</span>
        </button>
      </div>

      {/* Groups List */}
      <div className="card dark:bg-gray-800 dark:border-gray-700">
        {groups.length === 0 ? (
          <div className="p-12 text-center">
            <FiUsers size={64} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">No groups yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create Your First Group
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {groups.map((group) => (
              <Link
                key={group._id}
                to={`/group/${group._id}`}
                className="flex items-center space-x-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                {/* Group Avatar (Overlapping members) */}
                <div className="relative flex-shrink-0">
                  <div className="flex -space-x-2">
                    {group.members.slice(0, 3).map((member, index) => (
                      <img
                        key={member.user._id}
                        src={member.user.avatar}
                        alt={member.user.username}
                        className="h-12 w-12 rounded-full object-cover border-2 border-white dark:border-gray-800"
                        style={{ zIndex: 3 - index }}
                      />
                    ))}
                  </div>
                  {group.members.length > 3 && (
                    <div className="absolute -bottom-1 -right-1 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold border-2 border-white dark:border-gray-800">
                      +{group.members.length - 3}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold dark:text-white truncate">
                      {group.name}
                    </p>
                    {group.lastMessageAt && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {timeAgo(group.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {group.lastMessage?.text || group.description || `${group.members.length} members`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4 dark:text-white">Create Group</h2>

              <form onSubmit={handleCreateGroup}>
                {/* Group Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 dark:text-white">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                {/* Group Description */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 dark:text-white">
                    Description (Optional)
                  </label>
                  <textarea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    placeholder="What's this group about?"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Search Members */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 dark:text-white">
                    Add Members *
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchUsers(e.target.value);
                    }}
                    placeholder="Search users..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary"
                  />

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="mt-2 max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg">
                      {searchResults.map((user) => (
                        <div
                          key={user._id}
                          onClick={() => toggleMember(user)}
                          className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                        >
                          <img
                            src={user.avatar}
                            alt={user.username}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <p className="font-medium dark:text-white">{user.username}</p>
                            <p className="text-xs text-gray-500">{user.fullName}</p>
                          </div>
                          {selectedMembers.find((m) => m._id === user._id) && (
                            <span className="text-primary">✓</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Members */}
                {selectedMembers.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2 dark:text-white">
                      Selected Members ({selectedMembers.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedMembers.map((member) => (
                        <div
                          key={member._id}
                          className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full"
                        >
                          <img
                            src={member.avatar}
                            alt={member.username}
                            className="h-6 w-6 rounded-full object-cover"
                          />
                          <span className="text-sm dark:text-white">{member.username}</span>
                          <button
                            type="button"
                            onClick={() => toggleMember(member)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setGroupName('');
                      setGroupDescription('');
                      setSelectedMembers([]);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !groupName.trim() || selectedMembers.length === 0}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? 'Creating...' : 'Create Group'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
