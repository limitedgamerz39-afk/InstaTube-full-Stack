import React, { useState, useEffect } from 'react';
import { FaUpload, FaCamera, FaVideo, FaYoutube } from 'react-icons/fa';
import CameraCapture from '../CameraCapture';
import { requestCameraAndMicrophonePermissions } from '../../utils/permissions';
import { compressImages } from '../../utils/imageCompression';
import toast from 'react-hot-toast';

const MediaSelectionStep = ({ onNext, onBack, setUploadData, uploadData, setUseYouTubeStyle }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [captureType, setCaptureType] = useState('photo');
  const [error, setError] = useState('');
  const [permissionsChecked, setPermissionsChecked] = useState(false);
  const [devicesAvailable, setDevicesAvailable] = useState({ camera: true, microphone: true });

  // Set default capture type based on content type
  useEffect(() => {
    if (uploadData.contentType === 'reel' || uploadData.contentType === 'video' || uploadData.contentType === 'story') {
      setCaptureType('video');
    } else {
      setCaptureType('photo');
    }
  }, [uploadData.contentType]);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    await validateAndProcessFiles(files);
  };

  const validateAndProcessFiles = async (files) => {
    setError('');
    
    // Check file count based on content type
    const maxFiles = uploadData.contentType === 'post' ? 10 : 1;
    if (files.length > maxFiles) {
      setError(`You can upload maximum ${maxFiles} file${maxFiles > 1 ? 's' : ''}`);
      return;
    }
    
    // Compress images before validation
    const compressedFiles = await compressImages(files);
    
    // Validate file types and sizes based on content type
    const validFiles = [];
    const validPreviews = [];
    
    for (let i = 0; i < compressedFiles.length; i++) {
      const file = compressedFiles[i];
      
      // Validate based on content type
      if (uploadData.contentType === 'reel') {
        // Reels are short videos only
        if (!file.type.startsWith('video/')) {
          setError('Reels must be video files');
          return;
        }
        if (file.size > 100 * 1024 * 1024) { // 100MB limit for reels
          setError('Reel files should be less than 100MB');
          return;
        }
      } else if (uploadData.contentType === 'video') {
        // Videos can be longer
        if (!file.type.startsWith('video/')) {
          setError('Videos must be video files');
          return;
        }
        if (file.size > 1500 * 1024 * 1024) { // 1500MB limit for videos
          setError('Video files should be less than 1500MB');
          return;
        }
      } else if (uploadData.contentType === 'story') {
        // Stories are short-lived content
        if (file.size > 50 * 1024 * 1024) { // 50MB limit for stories
          setError('Story files should be less than 50MB');
          return;
        }
      } else {
        // Posts can be images or videos
        if (file.type.startsWith('video/')) {
          if (file.size > 1500 * 1024 * 1024) {
            setError('Video files should be less than 1500MB');
            return;
          }
        } else if (file.type.startsWith('image/')) {
          if (file.size > 10 * 1024 * 1024) {
            setError('Image files should be less than 10MB');
            return;
          }
        } else {
          setError('Only image and video files are allowed');
          return;
        }
      }
      
      validFiles.push(file);
      
      // Create preview
      const preview = {
        url: URL.createObjectURL(file),
        type: file.type,
        name: file.name
      };
      validPreviews.push(preview);
    }
    
    setSelectedFiles(validFiles);
    setPreviews(validPreviews);
  };

  const handleCameraCapture = (file) => {
    setShowCamera(false);
    validateAndProcessFiles([file]);
  };

  const removeFile = (index) => {
    const newFiles = [...selectedFiles];
    const newPreviews = [...previews];
    
    // Clean up object URL
    URL.revokeObjectURL(newPreviews[index].url);
    
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleNext = () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file');
      return;
    }
    
    setUploadData(prev => ({
      ...prev,
      files: selectedFiles,
      previews: previews
    }));
    
    onNext();
  };

  const getContentTitle = () => {
    switch (uploadData.contentType) {
      case 'reel': return 'Create a Reel';
      case 'video': return 'Upload a Video';
      case 'story': return 'Create a Story';
      case 'post': return 'Create a Post';
      default: return 'Select your content';
    }
  };

  const getContentDescription = () => {
    switch (uploadData.contentType) {
      case 'reel': return 'Create a short, engaging video';
      case 'video': return 'Upload a longer video to share with your audience';
      case 'story': return 'Share a 24-hour disappearing moment';
      case 'post': return 'Share photos and videos with your followers';
      default: return 'Upload videos or images to share with your audience';
    }
  };

  const showPhotoCapture = () => {
    return uploadData.contentType === 'post' || uploadData.contentType === 'story';
  };

  const showVideoCapture = () => {
    return uploadData.contentType === 'reel' || uploadData.contentType === 'video' || uploadData.contentType === 'story';
  };

  const showYouTubeStyleOption = () => {
    // Show friendflix-style option for reels, videos, and stories
    return uploadData.contentType === 'reel' || uploadData.contentType === 'video' || uploadData.contentType === 'story';
  };

  const handleCameraClick = async (type) => {
    // Check devices availability
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      
      setDevicesAvailable({
        camera: videoDevices.length > 0,
        microphone: audioDevices.length > 0
      });
      
      // Check if required devices are available
      if (type === 'video' && (videoDevices.length === 0 || audioDevices.length === 0)) {
        let message = '';
        if (videoDevices.length === 0 && audioDevices.length === 0) {
          message = 'No camera or microphone found. Please connect devices to record videos.';
        } else if (videoDevices.length === 0) {
          message = 'No camera found. Please connect a camera to record videos.';
        } else {
          message = 'No microphone found. Please connect a microphone to record videos.';
        }
        toast.error(message);
        return;
      } else if (type === 'photo' && videoDevices.length === 0) {
        toast.error('No camera found. Please connect a camera to take photos.');
        return;
      }
      
      // Check permissions
      const permissions = await requestCameraAndMicrophonePermissions();
      setPermissionsChecked(true);
      
      if (type === 'video' && (!permissions.camera || !permissions.microphone)) {
        toast.error('Camera and microphone permissions are required for video recording.');
        return;
      } else if (type === 'photo' && !permissions.camera) {
        toast.error('Camera permission is required for taking photos.');
        return;
      }
      
      setCaptureType(type);
      setShowCamera(true);
    } catch (error) {
      console.error('Error checking devices or permissions:', error);
      toast.error('Failed to check media devices or permissions.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {showCamera ? (
        <CameraCapture 
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
          captureType={captureType}
        />
      ) : (
        <>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{getContentTitle()}</h2>
            <p className="text-gray-600 dark:text-gray-400">
              {getContentDescription()}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Upload from device */}
            <div 
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => document.getElementById('file-upload').click()}
            >
              <div className="mx-auto w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <FaUpload className="text-primary text-2xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Upload files</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Drag and drop or click to select files
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {uploadData.contentType === 'reel' || uploadData.contentType === 'video' 
                  ? 'Max file size: 1500MB for videos' 
                  : uploadData.contentType === 'story' 
                    ? 'Max file size: 50MB' 
                    : 'Max file size: 1500MB for videos, 10MB for images'}
              </p>
              <input
                id="file-upload"
                type="file"
                accept={uploadData.contentType === 'post' ? "image/*,video/*" : "video/*"}
                multiple={uploadData.contentType === 'post'}
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Capture options */}
            <div className="space-y-4">
              {showPhotoCapture() && (
                <div 
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleCameraClick('photo')}
                >
                  <div className="mx-auto w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mb-4">
                    <FaCamera className="text-primary text-2xl" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Take photo</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Capture a photo directly from your camera
                  </p>
                  {!devicesAvailable.camera && (
                    <p className="text-yellow-600 dark:text-yellow-400 text-sm mt-2">
                      No camera detected
                    </p>
                  )}
                </div>
              )}
              
              {showVideoCapture() && (
                <div 
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleCameraClick('video')}
                >
                  <div className="mx-auto w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mb-4">
                    <FaVideo className="text-primary text-2xl" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {uploadData.contentType === 'story' ? 'Record story' : 'Record video'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {uploadData.contentType === 'story' 
                      ? 'Record a story directly from your camera' 
                      : 'Record a video directly from your camera'}
                  </p>
                  {(!devicesAvailable.camera || !devicesAvailable.microphone) && (
                    <p className="text-yellow-600 dark:text-yellow-400 text-sm mt-2">
                      {!devicesAvailable.camera ? 'No camera detected' : 'No microphone detected'}
                    </p>
                  )}
                </div>
              )}
              
              {/* friendflix-style upload option */}
              {showYouTubeStyleOption() && (
                <div 
                  className="border-2 border-dashed border-purple-300 dark:border-purple-600 rounded-2xl p-8 text-center cursor-pointer hover:border-purple-500 transition-colors"
                  onClick={() => setUseYouTubeStyle(true)}
                >
                  <div className="mx-auto w-16 h-16 bg-purple-500/10 dark:bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
                    <FaYoutube className="text-purple-500 text-2xl" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">YouTube-Style Record</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Full-screen camera with editing tools
                  </p>
                  <p className="text-sm text-purple-500 dark:text-purple-400 mt-2">
                    Record and edit in one interface
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Preview section */}
          {previews.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Selected files</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {previews.map((preview, index) => (
                  <div key={index} className="relative group">
                    {preview.type.startsWith('video/') ? (
                      <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                        <video 
                          src={preview.url} 
                          className="w-full h-full object-cover"
                          playsInline
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <FaVideo className="text-white text-2xl" />
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <img 
                          src={preview.url} 
                          alt={preview.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                      {preview.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={onBack}
              className="px-6 py-3 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 transition-colors"
            >
              Back
            </button>
            <div className="relative">
              <button
                onClick={handleNext}
                disabled={selectedFiles.length === 0}
                className={`px-6 py-3 font-medium rounded-lg transition-colors relative z-10 ${
                  selectedFiles.length === 0
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-300 cursor-not-allowed'
                    : 'bg-gray-800 text-white hover:bg-gray-900'
                }`}
              >
                Next: Editor
              </button>
              {selectedFiles.length === 0 && (
                <div className="absolute -top-8 right-0 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs px-2 py-1 rounded whitespace-nowrap border border-yellow-200 dark:border-yellow-700">
                  Select files first
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MediaSelectionStep;