import React, { useState } from 'react';
import { FaPlay, FaEye, FaLock, FaUsers, FaImages, FaPlayCircle, FaHistory, FaVideo, FaMusic } from 'react-icons/fa';
import { postAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ReviewStep = ({ onBack, uploadData, resetUpload }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const visibilityIcons = {
    public: <FaUsers className="text-blue-500" />,
    unlisted: <FaEye className="text-yellow-500" />,
    private: <FaLock className="text-red-500" />
  };

  const visibilityLabels = {
    public: 'Public',
    unlisted: 'Unlisted',
    private: 'Private'
  };

  const contentTypeIcons = {
    post: <FaImages className="text-blue-500" />,
    reel: <FaPlayCircle className="text-purple-500" />,
    video: <FaVideo className="text-red-500" />,
    story: <FaHistory className="text-yellow-500" />
  };

  const contentTypeLabels = {
    post: 'Post',
    reel: 'Reel',
    video: 'Video',
    story: 'Story'
  };

  const handleSubmit = async () => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      
      // Append metadata FIRST, before files
      formData.append('title', uploadData.title);
      formData.append('description', uploadData.description);
      formData.append('caption', uploadData.caption || uploadData.title);
      formData.append('tags', uploadData.tags);
      formData.append('category', uploadData.contentType);
      formData.append('visibility', uploadData.visibility);
      
      // Append files
      uploadData.files.forEach((file, index) => {
        formData.append('media', file);
      });
      
      // Append thumbnail if exists
      if (uploadData.thumbnailFile) {
        formData.append('thumbnail', uploadData.thumbnailFile);
      }
      
      // Append audio if exists
      if (uploadData.selectedAudio) {
        formData.append('audioId', uploadData.selectedAudio._id);
      }

      // Upload the post
      const response = await postAPI.createPost(formData, (progressEvent) => {
        if (progressEvent.total > 0) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      toast.success(`${contentTypeLabels[uploadData.contentType] || 'Content'} uploaded successfully!`);
      resetUpload();
    } catch (error) {
      console.error('Upload error:', error);
      
      // More detailed error handling
      let errorMessage = 'Failed to upload content';
      
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

  const getFileTypeIcon = (fileType) => {
    if (fileType.startsWith('video/')) {
      return <FaPlay className="text-red-500" />;
    }
    return (
      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
      </svg>
    );
  };

  const getReviewTitle = () => {
    switch (uploadData.contentType) {
      case 'reel': return 'Review your Reel';
      case 'video': return 'Review your Video';
      case 'story': return 'Review your Story';
      case 'post': return 'Review your Post';
      default: return 'Review your content';
    }
  };

  const getReviewDescription = () => {
    switch (uploadData.contentType) {
      case 'reel': return 'Make sure your Reel looks perfect before sharing with your followers.';
      case 'video': return 'Review your video details and settings before publishing.';
      case 'story': return 'Check your story before sharing it with your friends.';
      case 'post': return 'Review your post before sharing with your audience.';
      default: return 'Review your content before sharing.';
    }
  };

  if (isUploading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Uploading...</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{uploadProgress}% complete</p>
        <div className="w-full max-w-md bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div 
            className="bg-purple-600 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{getReviewTitle()}</h1>
        <p className="text-gray-600 dark:text-gray-400">{getReviewDescription()}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="p-1 bg-gradient-to-r from-purple-500 to-pink-500">
              <div className="bg-white dark:bg-gray-800 p-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Preview</h2>
                
                {/* Media Preview */}
                <div className="mb-6">
                  {uploadData.previews.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {uploadData.previews.slice(0, 4).map((preview, index) => (
                        <div key={index} className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                          {preview.type.startsWith('video/') ? (
                            <video 
                              src={preview.url} 
                              className="w-full h-full object-cover"
                              muted
                              loop
                            />
                          ) : (
                            <img 
                              src={preview.url} 
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          )}
                          {uploadData.previews.length > 4 && index === 3 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-white font-bold text-xl">
                                +{uploadData.previews.length - 4}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <FaImages className="text-gray-400 text-4xl" />
                    </div>
                  )}
                </div>

                {/* Content Details */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Title</h3>
                    <p className="text-gray-700 dark:text-gray-300">{uploadData.title || 'No title'}</p>
                  </div>
                  
                  {uploadData.description && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Description</h3>
                      <p className="text-gray-700 dark:text-gray-300">{uploadData.description}</p>
                    </div>
                  )}
                  
                  {uploadData.tags && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {uploadData.tags.split(',').map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm">
                            #{tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Settings */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Settings</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Visibility</h3>
                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="mr-3">
                    {visibilityIcons[uploadData.visibility]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {visibilityLabels[uploadData.visibility]}
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Content Type</h3>
                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="mr-3">
                    {contentTypeIcons[uploadData.contentType]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {contentTypeLabels[uploadData.contentType]}
                    </p>
                  </div>
                </div>
              </div>
              
              {uploadData.selectedAudio && (
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Audio Track</h3>
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <FaMusic className="text-purple-500 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {uploadData.selectedAudio.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {uploadData.selectedAudio.artist}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onBack}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isUploading}
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-medium"
            >
              {isUploading ? 'Uploading...' : 'Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewStep;