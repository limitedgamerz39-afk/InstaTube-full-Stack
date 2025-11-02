import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { playlistAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiPlay, FiLock, FiGlobe, FiTrash2, FiEdit2 } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import Loader from '../components/Loader';

function Playlists() {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState({ title: '', description: '', visibility: 'public' });
  const { userId } = useParams();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchPlaylists();
  }, [userId]);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const targetUserId = userId || currentUser._id;
      const response = await playlistAPI.getUserPlaylists(targetUserId);
      setPlaylists(response.data.playlists || []);
    } catch (error) {
      console.error('Error fetching playlists:', error);
      toast.error('Failed to load playlists');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylist.title.trim()) {
      toast.error('Playlist title is required');
      return;
    }

    try {
      await playlistAPI.createPlaylist(newPlaylist);
      toast.success('Playlist created!');
      setShowCreateModal(false);
      setNewPlaylist({ title: '', description: '', visibility: 'public' });
      fetchPlaylists();
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast.error('Failed to create playlist');
    }
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;

    try {
      await playlistAPI.deletePlaylist(playlistId);
      toast.success('Playlist deleted');
      fetchPlaylists();
    } catch (error) {
      console.error('Error deleting playlist:', error);
      toast.error('Failed to delete playlist');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-6 pb-20">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {!userId || userId === currentUser._id ? 'My Playlists' : `${userId}'s Playlists`}
          </h1>
          {(!userId || userId === currentUser._id) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:opacity-90"
            >
              <FiPlus /> New Playlist
            </button>
          )}
        </div>

        {playlists.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No playlists yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map((playlist) => (
              <div
                key={playlist._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition cursor-pointer"
                onClick={() => navigate(`/playlist/${playlist._id}`)}
              >
                <div className="aspect-video bg-gradient-to-br from-purple-500 to-pink-500 rounded-t-lg flex items-center justify-center">
                  <FiPlay className="w-16 h-16 text-white opacity-80" />
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                      {playlist.title}
                    </h3>
                    {playlist.visibility === 'private' ? (
                      <FiLock className="text-gray-500" />
                    ) : (
                      <FiGlobe className="text-gray-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                    {playlist.description || 'No description'}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {playlist.videoCount} videos
                    </span>
                    {playlist.creator._id === currentUser._id && (
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="text-blue-500 hover:text-blue-600"
                          onClick={() => navigate(`/playlist/${playlist._id}/edit`)}
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleDeletePlaylist(playlist._id)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Create New Playlist</h2>
            <form onSubmit={handleCreatePlaylist}>
              <input
                type="text"
                placeholder="Playlist title"
                className="w-full p-3 border rounded-lg mb-3 dark:bg-gray-700 dark:text-white"
                value={newPlaylist.title}
                onChange={(e) => setNewPlaylist({ ...newPlaylist, title: e.target.value })}
              />
              <textarea
                placeholder="Description (optional)"
                className="w-full p-3 border rounded-lg mb-3 dark:bg-gray-700 dark:text-white"
                rows="3"
                value={newPlaylist.description}
                onChange={(e) => setNewPlaylist({ ...newPlaylist, description: e.target.value })}
              />
              <select
                className="w-full p-3 border rounded-lg mb-4 dark:bg-gray-700 dark:text-white"
                value={newPlaylist.visibility}
                onChange={(e) => setNewPlaylist({ ...newPlaylist, visibility: e.target.value })}
              >
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

export default Playlists;
