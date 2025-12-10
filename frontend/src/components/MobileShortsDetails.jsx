import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiUploadCloud, FiLoader } from 'react-icons/fi';

const MobileShortsDetails = ({ videoFile, editedData }) => {
  const navigate = useNavigate();
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUpload = async () => {
    if (!caption.trim()) {
      toast.error('Please add a caption to your short.');
      return;
    }
    
    setIsUploading(true);

    const formData = new FormData();
    formData.append('media', videoFile);
    formData.append('caption', caption);
    formData.append('category', 'short');
    formData.append('visibility', visibility);
    
    // Append other edited data if needed
    formData.append('textOverlay', editedData.textOverlay || '');
    if (editedData.audio) {
      formData.append('audioTrack', editedData.audio.id); // Or however your backend identifies audio
    }

    try {
      await postAPI.createPost(formData, (progressEvent) => {
        if (progressEvent.total > 0) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      toast.success('Short uploaded successfully!');
      navigate('/'); // Navigate to feed on success

    } catch (error) {
      console.error('Upload error:', error);
      
      // More detailed error handling
      let errorMessage = 'Upload failed. Please try again.';
      
      if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Check your connection and try again.';
      } else if (error.response) {
        if (error.response.status === 413) {
          errorMessage = 'File too large. Please reduce file size and try again.';
        } else if (error.response.status === 400) {
          errorMessage = error.response.data?.message || 'Invalid file format or missing required fields.';
        } else if (error.response.status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (error.response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = error.response.data?.message || `Upload failed with status ${error.response.status}`;
        }
      }
      
      toast.error(errorMessage);
      setIsUploading(false);
    }
  };
  
  if (isUploading) {
    return (
        <div className="w-full h-full bg-black/90 flex flex-col items-center justify-center text-white p-8">
            <FiLoader className="animate-spin text-purple-500" size={64} />
            <h2 className="text-2xl font-bold mt-6">Uploading...</h2>
            <p className="text-lg mt-2">{uploadProgress}%</p>
            <div className="w-full bg-gray-600 rounded-full h-2.5 mt-4">
                <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
            </div>
        </div>
    );
  }

  return (
    <div className="w-full h-full bg-black flex flex-col text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-800 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">New Short</h1>
        <button 
          onClick={handleUpload}
          disabled={!caption.trim()}
          className={`px-4 py-2 rounded-lg font-medium ${
            caption.trim() 
              ? 'bg-purple-600 hover:bg-purple-700' 
              : 'bg-gray-700 cursor-not-allowed'
          }`}
        >
          Share
        </button>
      </div>

      {/* Video Preview */}
      <div className="flex-1 flex items-center justify-center bg-black">
        <video 
          src={URL.createObjectURL(videoFile)} 
          className="max-h-full max-w-full object-contain"
          autoPlay
          loop
          muted
        />
      </div>

      {/* Caption and Settings */}
      <div className="p-4 border-t border-gray-800">
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Add a caption..."
          className="w-full bg-transparent border-none focus:outline-none text-white placeholder-gray-500 resize-none mb-4"
          rows={3}
        />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-1 text-gray-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-sm">Tag</span>
            </button>
            
            <button className="flex items-center space-x-1 text-gray-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm">Location</span>
            </button>
          </div>
          
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="bg-gray-800 text-white rounded-lg px-3 py-1 text-sm focus:outline-none"
          >
            <option value="public">Public</option>
            <option value="friends">Friends</option>
            <option value="private">Private</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default MobileShortsDetails;