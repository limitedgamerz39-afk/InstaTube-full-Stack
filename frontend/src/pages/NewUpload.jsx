import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { postAPI, validateFileType } from '../services/api';
import toast from 'react-hot-toast';
import UploadFileItem from '../components/UploadFileItem';
import { FiUploadCloud, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const NewUpload = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});
  const [isDragActive, setIsDragActive] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('auto'); // 'auto', 'long', 'short', 'image'
  
  // Function to determine category based on file type
  const determineCategory = (file) => {
    // First check the MIME type
    if (file.type && file.type.startsWith('video/')) {
      return 'long';
    } else if (file.type && file.type.startsWith('image/')) {
      return 'image';
    }
    
    // If MIME type is not helpful or missing, check file extension
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.mp4') || fileName.endsWith('.mov') || fileName.endsWith('.avi') || 
        fileName.endsWith('.mkv') || fileName.endsWith('.webm') || fileName.endsWith('.ogg') ||
        fileName.endsWith('.flv') || fileName.endsWith('.wmv')) {
      return 'long';
    } else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png') || 
               fileName.endsWith('.gif') || fileName.endsWith('.webp') || fileName.endsWith('.bmp')) {
      return 'image';
    }
    
    // If we can't determine, default to long for video-like extensions
    if (fileName.includes('video') || fileName.includes('movie') || fileName.includes('film')) {
      return 'long';
    }
    
    return 'image'; // default fallback
  };
  
  const handleFiles = useCallback((selectedFiles) => {
    const newFiles = Array.from(selectedFiles);
    
    // Validate file types and sizes before adding them
    const validFiles = [];
    const invalidFiles = [];
    
    newFiles.forEach(file => {
      // Check file type
      if (!validateFileType(file)) {
        invalidFiles.push({ file, reason: 'Invalid file type' });
        return;
      }
      
      // Check file size (2GB limit)
      const maxSize = 2 * 1024 * 1024 * 1024; // 2GB in bytes
      if (file.size > maxSize) {
        invalidFiles.push({ file, reason: `File too large (${(file.size / (1024 * 1024 * 1024)).toFixed(2)}GB). Max size is 2GB.` });
        return;
      }
      
      validFiles.push(file);
    });
    
    if (invalidFiles.length > 0) {
      invalidFiles.forEach(({ file, reason }) => {
        toast.error(`${file.name}: ${reason}`);
      });
    }
    
    if (validFiles.length === 0) return;
    
    setFiles(prev => [...prev, ...validFiles]);
    
    // Auto-set category based on first file if in auto mode
    if (category === 'auto' && validFiles.length > 0) {
      const firstFile = validFiles[0];
      const autoCategory = determineCategory(firstFile);
      setCategory(autoCategory);
    }
  }, [category]);

  const onDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(true); };
  const onDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(false); };
  const onDragOver = (e) => { e.preventDefault(); e.stopPropagation(); }; // Necessary for drop to work
  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleUpload = async () => {
    if (files.length === 0) {
        toast.error("Please select files to upload first.");
        return;
    }
    if (!title.trim()) {
        toast.error("Please provide a title for your upload.");
        return;
    }

    const uploadPromises = files.map(file => {
      const formData = new FormData();
      formData.append('media', file);
      formData.append('title', title);
      formData.append('caption', title);
      formData.append('description', description);
      
      // Determine category for this file - always recompute for safety
      let fileCategory = category;
      if (category === 'auto' || category === 'image') {
        // Even if category is not 'auto', recompute if it's 'image' and file is video
        // This handles the case where state hasn't updated yet
        fileCategory = determineCategory(file);
      }
      
      formData.append('category', fileCategory);
      
      setUploadStatus(prev => ({ ...prev, [file.name]: 'uploading' }));
      
      return postAPI.createPost(formData, (progressEvent) => {
        if (progressEvent.total > 0) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prev => ({ ...prev, [file.name]: percentCompleted }));
        }
      })
      .then(response => {
        setUploadStatus(prev => ({ ...prev, [file.name]: 'completed' }));
        return response;
      })
      .catch(error => {
        setUploadStatus(prev => ({ ...prev, [file.name]: 'error' }));
        console.error(`Upload failed for ${file.name}:`, error);
        
        // More detailed error handling
        let errorMessage = `Upload failed for ${file.name}`;
        if (error.code === 'ERR_NETWORK') {
          errorMessage = `${file.name}: Network error. Check your connection and try again. For large files, this may take several minutes.`;
        } else if (error.code === 'ECONNABORTED') {
          errorMessage = `${file.name}: Upload timed out. For large files, this may take several minutes. Please try again.`;
        } else if (error.response) {
          if (error.response.status === 413) {
            errorMessage = `${file.name}: File too large.`;
          } else if (error.response.status >= 500) {
            errorMessage = `${file.name}: Server error. Please try again later.`;
          } else {
            errorMessage = `${file.name}: ${error.response.data?.message || 'Upload failed'}`;
          }
        } else if (error.request) {
          // Network error (no response received)
          errorMessage = `${file.name}: Network connection lost. Please check your internet connection and try again.`;
        }
        
        toast.error(errorMessage);
        return error;
      });
    });

    toast.promise(
        Promise.all(uploadPromises),
        {
            loading: 'Uploading posts...',
            success: 'All posts uploaded successfully!',
            error: 'Some uploads failed. Please check the list.'
        }
    ).then(() => {
        setTimeout(() => navigate('/'), 2000); // Redirect to home after a delay
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 text-gray-800 dark:text-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create a new post</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Upload videos or images to share with your audience.</p>
        </div>
        
        {/* Upload Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - File Upload */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Upload Media</h2>
              
              {/* Drag & Drop Area */}
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
                }`}
                onDragEnter={onDragEnter}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => document.getElementById('fileInput').click()}
              >
                <FiUploadCloud className="mx-auto text-4xl text-gray-400 dark:text-gray-500 mb-3" />
                <p className="text-gray-600 dark:text-gray-400 mb-1">
                  <span className="text-purple-600 dark:text-purple-400 font-medium">Click to upload</span> or drag and drop
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  MP4, MOV, JPG, PNG up to 2GB
                </p>
                <input
                  id="fileInput"
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                  multiple
                  accept="video/*,image/*"
                />
              </div>
              
              {/* Selected Files */}
              <div className="mt-6">
                <h3 className="font-medium mb-3">Selected Files</h3>
                {files.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-500 text-sm">No files selected</p>
                ) : (
                  <div>
                    {files.map((file, index) => (
                      <UploadFileItem
                        key={index}
                        file={file}
                        progress={uploadProgress[file.name] || 0}
                        status={uploadStatus[file.name] || 'pending'}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Column - Details */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Post Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Add a title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Add a description"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="auto">Auto Detect</option>
                    <option value="long">Long Video</option>
                    <option value="short">Short Video (Reel)</option>
                    <option value="image">Image Post</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {category === 'auto' && files.length > 0 
                      ? `Auto-detected: ${determineCategory(files[0])}` 
                      : 'Select content type manually'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || !title.trim()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Upload Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewUpload;