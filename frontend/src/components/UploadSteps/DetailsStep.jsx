import React, { useState, useEffect } from 'react';
import AICaptionHelper from '../AICaptionHelper';

const DetailsStep = ({ onNext, onBack, uploadData, setUploadData }) => {
  const [title, setTitle] = useState(uploadData.title || '');
  const [description, setDescription] = useState(uploadData.description || '');
  const [visibility, setVisibility] = useState(uploadData.visibility || 'public');
  const [category, setCategory] = useState(uploadData.category || '');
  const [tags, setTags] = useState(uploadData.tags || '');
  const [thumbnailPreview, setThumbnailPreview] = useState(uploadData.thumbnailPreview || '');
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [allowComments, setAllowComments] = useState(uploadData.allowComments !== undefined ? uploadData.allowComments : true);
  const [hideLikeCount, setHideLikeCount] = useState(uploadData.hideLikeCount || false);
  const [autoGenerateThumbnail, setAutoGenerateThumbnail] = useState(true);
  const [errors, setErrors] = useState({});

  // Set default values based on content type
  useEffect(() => {
    // Remove the default "New Reel" title
    if (uploadData.contentType === 'story' && !title) {
      setTitle('New Story');
    }
    // For reels, we don't set a default title anymore
  }, [uploadData.contentType, title]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }
    
    if (description.length > 5000) {
      newErrors.description = 'Description must be less than 5000 characters';
    }
    
    if (tags.split(',').length > 30) {
      newErrors.tags = 'You can add maximum 30 tags';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleThumbnailChange = (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, thumbnail: 'Only image files are allowed' }));
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, thumbnail: 'Thumbnail should be less than 10MB' }));
      return;
    }
    
    setThumbnailFile(file);
    setErrors(prev => ({ ...prev, thumbnail: '' }));
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result);
      setAutoGenerateThumbnail(false); // User has uploaded a custom thumbnail
    };
    reader.readAsDataURL(file);
  };

  const handleNext = () => {
    if (!validateForm()) {
      return;
    }
    
    setUploadData(prev => ({
      ...prev,
      title,
      description,
      visibility,
      category,
      tags,
      thumbnailFile,
      thumbnailPreview,
      allowComments,
      hideLikeCount,
      autoGenerateThumbnail
    }));
    
    onNext();
  };

  const categoryOptions = [
    { value: '', label: 'Select category' },
    { value: 'Education', label: 'Education' },
    { value: 'Music', label: 'Music' },
    { value: 'Gaming', label: 'Gaming' },
    { value: 'Comedy', label: 'Comedy' },
    { value: 'News', label: 'News' },
    { value: 'Sports', label: 'Sports' },
    { value: 'Travel', label: 'Travel' },
    { value: 'Tech', label: 'Tech' },
    { value: 'Lifestyle', label: 'Lifestyle' },
    { value: 'Entertainment', label: 'Entertainment' },
    { value: 'Dance', label: 'Dance' },
    { value: 'Food', label: 'Food' },
    { value: 'Fashion', label: 'Fashion' },
    { value: 'Beauty', label: 'Beauty' }
  ];

  const visibilityOptions = [
    { value: 'public', label: 'Public' },
    { value: 'unlisted', label: 'Unlisted' },
    { value: 'private', label: 'Private' }
  ];

  const getDetailsTitle = () => {
    switch (uploadData.contentType) {
      case 'reel': return 'Add Reel details';
      case 'video': return 'Add Video details';
      case 'story': return 'Add Story details';
      case 'post': return 'Add Post details';
      default: return 'Add details';
    }
  };

  const getDetailsDescription = () => {
    switch (uploadData.contentType) {
      case 'reel': return 'Provide a title and description for your Reel';
      case 'video': return 'Provide details for your video';
      case 'story': return 'Add details for your story';
      case 'post': return 'Provide title, description, and other details for your post';
      default: return 'Provide title, description, and other details for your content';
    }
  };

  // Determine which fields to show based on content type
  const showCategory = () => {
    return uploadData.contentType === 'video' || uploadData.contentType === 'post' || uploadData.contentType === 'reel';
  };

  const showTags = () => {
    return uploadData.contentType === 'video' || uploadData.contentType === 'post' || uploadData.contentType === 'reel';
  };

  const showThumbnail = () => {
    return uploadData.contentType === 'video' || uploadData.contentType === 'post' || uploadData.contentType === 'reel';
  };

  const showAdvancedOptions = () => {
    return uploadData.contentType === 'reel' || uploadData.contentType === 'video';
  };

  // Function to generate thumbnail from video
  const generateThumbnailFromVideo = () => {
    if (uploadData.previews && uploadData.previews.length > 0 && uploadData.previews[0].type.startsWith('video/')) {
      // In a real implementation, this would extract a frame from the video
      // For now, we'll just show a placeholder
      setThumbnailPreview('');
      setAutoGenerateThumbnail(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{getDetailsTitle()}</h2>
        <p className="text-gray-600 dark:text-gray-400">
          {getDetailsDescription()}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Media Preview */}
          {uploadData.previews && uploadData.previews.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Reel Preview</h3>
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden aspect-[9/16] w-64 mx-auto flex items-center justify-center relative shadow-xl">
                {uploadData.previews[0].type.startsWith('video/') ? (
                  <div className="relative w-full h-full">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-dashed border-gray-700 rounded-xl w-16 h-16 flex items-center justify-center shadow-lg">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                      <p className="text-white font-medium text-sm bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg mx-4 truncate shadow-md">
                        {uploadData.previews[0].name || 'Reel Preview'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-dashed border-gray-700 rounded-xl w-full h-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                )}
              </div>
              {uploadData.previews.length > 1 && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 text-center">
                  +{uploadData.previews.length - 1} more files
                </p>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={uploadData.contentType === 'reel' ? "Add a catchy title for your Reel" : "Add a title that describes your content"}
              className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border ${
                errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
              maxLength={100}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.title ? (
                <p className="text-red-500 text-sm">{errors.title}</p>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Maximum 100 characters</p>
              )}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {title.length}/100
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={uploadData.contentType === 'reel' ? "Describe your Reel (supports #hashtags and @mentions)" : "Tell viewers about your content (supports #hashtags and @mentions)"}
              rows={5}
              className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border ${
                errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all`}
              maxLength={5000}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.description ? (
                <p className="text-red-500 text-sm">{errors.description}</p>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Maximum 5000 characters</p>
              )}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {description.length}/5000
              </span>
            </div>
            
            {/* AI Caption Helper */}
            <div className="mt-4">
              <AICaptionHelper 
                onCaptionSelect={(caption) => setDescription(description + (description ? ' ' : '') + caption)}
                imageDescription={uploadData.previews?.[0]?.name || "User uploaded content"}
              />
            </div>
          </div>

          {showTags() && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Add tags separated by commas (e.g., nature, travel, food)"
                className={`w-full px-4 py-3 bg-white dark:bg-gray-800 border ${
                  errors.tags ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
              />
              {errors.tags && (
                <p className="text-red-500 text-sm mt-1">{errors.tags}</p>
              )}
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Add tags to help people find your content. Maximum 30 tags.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {showThumbnail() && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Thumbnail
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800 transition-all">
                {thumbnailPreview ? (
                  <div className="relative">
                    <img 
                      src={thumbnailPreview} 
                      alt="Thumbnail preview" 
                      className="w-full h-40 object-cover rounded-lg shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setThumbnailPreview('');
                        setThumbnailFile(null);
                        setAutoGenerateThumbnail(true);
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ) : autoGenerateThumbnail ? (
                  <div className="text-center py-6">
                    <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-full flex items-center justify-center mb-3 shadow">
                      <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                      Auto-generated thumbnail
                    </p>
                    <button
                      type="button"
                      onClick={generateThumbnailFromVideo}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg cursor-pointer hover:from-blue-600 hover:to-blue-700 transition-all text-sm font-medium shadow"
                    >
                      Regenerate
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="mx-auto w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                      Upload a custom thumbnail
                    </p>
                    <label className="px-4 py-2 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-lg cursor-pointer hover:from-gray-900 hover:to-black transition-all text-sm font-medium shadow">
                      Choose file
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
              {errors.thumbnail && (
                <p className="text-red-500 text-sm mt-1">{errors.thumbnail}</p>
              )}
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                Recommended size: 1280x720px
              </p>
            </div>
          )}

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Visibility
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            >
              {visibilityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {showCategory() && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              >
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Advanced Options for Reels */}
          {showAdvancedOptions() && (
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Privacy Settings</h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Allow Comments
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Let viewers comment on your reel
                  </p>
                </div>
                <div className="relative inline-block w-12 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    checked={allowComments}
                    onChange={(e) => setAllowComments(e.target.checked)}
                    className="sr-only"
                    id="allowComments"
                  />
                  <label
                    htmlFor="allowComments"
                    className={`block h-6 w-12 rounded-full cursor-pointer transition-colors ${
                      allowComments ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform shadow-md ${
                        allowComments ? 'transform translate-x-6' : ''
                      }`}
                    ></span>
                  </label>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Hide Like Count
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Hide the number of likes on your reel
                  </p>
                </div>
                <div className="relative inline-block w-12 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    checked={hideLikeCount}
                    onChange={(e) => setHideLikeCount(e.target.checked)}
                    className="sr-only"
                    id="hideLikeCount"
                  />
                  <label
                    htmlFor="hideLikeCount"
                    className={`block h-6 w-12 rounded-full cursor-pointer transition-colors ${
                      hideLikeCount ? 'bg-gradient-to-r from-purple-400 to-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform shadow-md ${
                        hideLikeCount ? 'transform translate-x-6' : ''
                      }`}
                    ></span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white font-medium rounded-lg hover:from-gray-800 hover:to-black transition-all shadow"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow"
        >
          Next: Review
        </button>
      </div>
    </div>
  );
};

export default DetailsStep;