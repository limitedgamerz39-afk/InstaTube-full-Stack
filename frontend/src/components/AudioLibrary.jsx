import { useState, useEffect } from 'react';
import { audioAPI } from '../services/api';
import { FiMusic, FiSearch, FiDownload, FiPlay, FiPause, FiHeart, FiShare2 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const AudioLibrary = ({ userId, onAudioSelect }) => {
  const [audios, setAudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [audioElement, setAudioElement] = useState(null);

  useEffect(() => {
    fetchAudios();
  }, [userId, currentPage]);

  const fetchAudios = async () => {
    try {
      setLoading(true);
      const response = userId 
        ? await audioAPI.getUserAudio(userId, currentPage)
        : await audioAPI.searchAudio(searchQuery, currentPage);
      
      setAudios(response.data.data);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      toast.error('Failed to load audio library');
      console.error('Audio library error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAudios();
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const togglePlay = (audio) => {
    if (playingAudio?._id === audio._id) {
      // Pause current audio
      if (audioElement) {
        audioElement.pause();
      }
      setPlayingAudio(null);
    } else {
      // Stop previously playing audio
      if (audioElement) {
        audioElement.pause();
      }
      
      // Create new audio element
      const newAudio = new Audio(audio.audioUrl);
      newAudio.play().catch(error => {
        console.error('Audio play error:', error);
        toast.error('Failed to play audio');
      });
      
      setAudioElement(newAudio);
      setPlayingAudio(audio);
      
      // Handle audio end
      newAudio.onended = () => {
        setPlayingAudio(null);
        setAudioElement(null);
      };
    }
  };

  const handleDownload = async (audio) => {
    try {
      // Increment download count
      await audioAPI.incrementDownloadCount(audio._id);
      
      // Create download link
      const link = document.createElement('a');
      link.href = audio.audioUrl;
      link.download = `${audio.title || 'audio'}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Audio downloaded!');
    } catch (error) {
      toast.error('Failed to download audio');
      console.error('Download error:', error);
    }
  };

  const handleSelect = (audio) => {
    if (onAudioSelect) {
      onAudioSelect(audio);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audio tracks..."
            className="w-full px-4 py-3 pl-12 rounded-2xl bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium"
          >
            Search
          </button>
        </div>
      </form>

      {/* Audio List */}
      <div className="space-y-4">
        {audios.length === 0 ? (
          <div className="text-center py-12">
            <FiMusic className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No audio tracks found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery ? 'Try a different search term' : 'No audio tracks available yet'}
            </p>
          </div>
        ) : (
          audios.map((audio) => (
            <div 
              key={audio._id} 
              className="bg-white dark:bg-dark-card rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                {/* Play Button */}
                <button
                  onClick={() => togglePlay(audio)}
                  className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white hover:bg-purple-600 transition-colors"
                >
                  {playingAudio?._id === audio._id ? (
                    <FiPause size={20} />
                  ) : (
                    <FiPlay size={20} className="ml-1" />
                  )}
                </button>

                {/* Audio Info */}
                <div className="flex-1 min-w-0">
                  <h3 
                    className="font-semibold text-gray-900 dark:text-white truncate cursor-pointer hover:text-purple-500"
                    onClick={() => handleSelect(audio)}
                  >
                    {audio.title || 'Untitled Audio'}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <span>{formatDuration(audio.durationSec)}</span>
                    <span>•</span>
                    <span>{formatNumber(audio.views || 0)} plays</span>
                    <span>•</span>
                    <span>{formatNumber(audio.downloads || 0)} downloads</span>
                  </div>
                  {audio.extractedBy && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      by {audio.extractedBy.username}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(audio)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-card-hover text-gray-600 dark:text-gray-400"
                    title="Download"
                  >
                    <FiDownload size={18} />
                  </button>
                  <button
                    onClick={() => handleSelect(audio)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-card-hover text-gray-600 dark:text-gray-400"
                    title="Use this audio"
                  >
                    <FiHeart size={18} />
                  </button>
                  <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-card-hover text-gray-600 dark:text-gray-400">
                    <FiShare2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-card disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-card disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AudioLibrary;