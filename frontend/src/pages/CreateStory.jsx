import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storyAPI } from '../services/api';
import toast from 'react-hot-toast';
import { AiOutlineCloudUpload, AiOutlineClose } from 'react-icons/ai';
import AREffects from '../components/AREffects';

const CreateStory = () => {
  const navigate = useNavigate();
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedEffect, setSelectedEffect] = useState('none');
  const [location, setLocation] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/') && !selectedFile.type.startsWith('video/')) {
      toast.error('Please select an image or video file');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }

    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('media', file);
      formData.append('caption', caption);
      formData.append('effect', selectedEffect);
      if (location) formData.append('location', location);

      await storyAPI.createStory(formData);
      toast.success('Story created successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create story');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-900">
        <button
          onClick={() => navigate('/')}
          className="text-white hover:bg-gray-800 p-2 rounded-full"
        >
          <AiOutlineClose size={24} />
        </button>
        <h1 className="text-white text-lg font-semibold">Create Story</h1>
        <button
          onClick={handleSubmit}
          disabled={loading || !file}
          className={`px-6 py-2 rounded-full font-semibold ${
            file && !loading
              ? 'bg-primary text-white hover:bg-blue-600'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? 'Sharing...' : 'Share'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        {!preview ? (
          <div className="text-center">
            <label
              htmlFor="story-upload"
              className="cursor-pointer inline-flex flex-col items-center"
            >
              <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 flex items-center justify-center mb-4">
                <div className="w-28 h-28 rounded-full bg-black flex items-center justify-center">
                  <AiOutlineCloudUpload size={48} className="text-white" />
                </div>
              </div>
              <p className="text-white text-lg mb-2">Add to Your Story</p>
              <p className="text-gray-400 text-sm">Share a photo or video</p>
              <input
                id="story-upload"
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="max-w-md w-full">
            {file?.type.startsWith('video/') ? (
              <video
                src={preview}
                controls
                className="w-full max-h-[70vh] object-contain rounded-lg"
              />
            ) : (
              <img
                src={preview}
                alt="Preview"
                className="w-full max-h-[70vh] object-contain rounded-lg"
              />
            )}

            {/* AR Effects */}
            <AREffects 
              selectedEffect={selectedEffect} 
              setSelectedEffect={setSelectedEffect} 
            />

            {/* Location Input */}
            <div className="mt-4">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add location..."
                className="w-full px-4 py-3 bg-gray-900 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Caption Input */}
            <div className="mt-4">
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption..."
                maxLength={200}
                className="w-full px-4 py-3 bg-gray-900 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-gray-500 text-xs mt-1 text-right">
                {caption.length}/200
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateStory;