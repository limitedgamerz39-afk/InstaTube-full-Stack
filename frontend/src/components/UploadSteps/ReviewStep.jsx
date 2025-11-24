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
      
      // Append files
      uploadData.files.forEach((file) => {
        formData.append('media', file);
      });
      
      // Append metadata
      formData.append('title', uploadData.title);
      formData.append('description', uploadData.description);
      formData.append('tags', uploadData.tags);
      formData.append('visibility', uploadData.visibility);
      
      // Map contentType to category
      let category = 'image'; // default
      if (uploadData.contentType === 'reel') {
        category = 'short';
      } else if (uploadData.contentType === 'video') {
        category = 'long';
      } else {
        category = 'image';
      }
      
      formData.append('category', category);
      formData.append('filter', uploadData.selectedFilter || 'normal');
      formData.append('playbackRate', String(uploadData.playbackRate || 1));
      formData.append('contentType', uploadData.contentType || 'post');
      
      // Append thumbnail if provided
      if (uploadData.thumbnailFile) {
        formData.append('thumbnail', uploadData.thumbnailFile);
      }
      
      // Append selected audio if provided
      if (uploadData.selectedAudio) {
        formData.append('audioId', uploadData.selectedAudio._id);
      }

      // Simulate progress for better UX
      const interval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Upload the post
      const response = await postAPI.createPost(formData);
      
      clearInterval(interval);
      setUploadProgress(100);
      
      toast.success(`${contentTypeLabels[uploadData.contentType] || 'Content'} uploaded successfully!`);
      resetUpload();
    } catch (error) {
      console.error('Upload error:', error);
      
      // More detailed error handling
      let errorMessage = 'Failed to upload content';
      
      if (error.response) {
        // Server responded with error status
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
      } else if (error.request) {
        // Network error
        errorMessage = 'Network error. Please check your connection and try again.';
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
      case 'reel': return 'Check all details before publishing your Reel';
      case 'video': return 'Check all details before publishing your video';
      case 'story': return 'Check all details before publishing your story';
      case 'post': return 'Check all details before publishing your post';
      default: return 'Check all details before publishing';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{getReviewTitle()}</h2>
        <p className="text-gray-600 dark:text-gray-400">
          {getReviewDescription()}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preview section */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900 rounded-2xl overflow-hidden aspect-video flex items-center justify-center">
            {uploadData.previews && uploadData.previews[0] ? (
              uploadData.previews[0].type.startsWith('video/') ? (
                <video
                  src={uploadData.previews[0].url}
                  className="w-full h-full object-contain"
                  controls
                  playsInline
                />
              ) : (
                <img
                  src={uploadData.previews[0].url}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              )
            ) : (
              <div className="text-gray-500">No preview available</div>
            )}
          </div>

          {/* Content type indicator */}
          <div className="mt-4 flex items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="mr-3">
              {contentTypeIcons[uploadData.contentType]}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {contentTypeLabels[uploadData.contentType] || 'Content'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Content type
              </p>
            </div>
          </div>

          {/* File list */}
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Files</h3>
            <div className="space-y-2">
              {uploadData.previews.map((preview, index) => (
                <div key={index} className="flex items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="mr-3">
                    {getFileTypeIcon(preview.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {preview.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {preview.type.startsWith('video/') ? 'Video' : 'Image'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Details section */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Details</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Title</h4>
                <p className="text-gray-900 dark:text-white">{uploadData.title || 'No title'}</p>
              </div>
              
              {uploadData.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Description</h4>
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                    {uploadData.description}
                  </p>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Visibility</h4>
                <div className="flex items-center">
                  <span className="mr-2">
                    {visibilityIcons[uploadData.visibility]}
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {visibilityLabels[uploadData.visibility]}
                  </span>
                </div>
              </div>
              
              {uploadData.category && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Category</h4>
                  <p className="text-gray-900 dark:text-white">{uploadData.category}</p>
                </div>
              )}
              
              {uploadData.tags && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {uploadData.tags.split(',').map((tag, index) => (
                      <span 
                        key={index} 
                        className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded-full"
                      >
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Selected Audio */}
              {uploadData.selectedAudio && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Audio Track</h4>
                  <div className="flex items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="mr-3">
                      <FaMusic className="text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {uploadData.selectedAudio.title || 'Untitled Audio'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {uploadData.selectedAudio.extractedBy?.username || 'Unknown Artist'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {uploadData.thumbnailPreview && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Thumbnail</h3>
              <img 
                src={uploadData.thumbnailPreview} 
                alt="Thumbnail" 
                className="w-full rounded-lg"
              />
            </div>
          )}
        </div>
      </div>

      {/* Upload progress */}
      {isUploading && (
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div 
              className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          disabled={isUploading}
          className="px-6 py-3 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 disabled:opacity-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={isUploading}
          className="px-6 py-3 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 disabled:opacity-50 transition-colors flex items-center"
        >
          {isUploading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </>
          ) : (
            `Publish ${contentTypeLabels[uploadData.contentType] || 'Content'}`
          )}
        </button>
      </div>
    </div>
  );
};

export default ReviewStep;