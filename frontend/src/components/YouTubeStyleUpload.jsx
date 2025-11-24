import React, { useRef, useState, useEffect } from 'react';
import { FaCamera, FaVideo, FaTimes, FaRedo, FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaUpload } from 'react-icons/fa';
import { FiMusic, FiType, FiFilter } from 'react-icons/fi';
import AudioLibrary from './AudioLibrary';
import { requestCameraAndMicrophonePermissions } from '../utils/permissions';
import toast from 'react-hot-toast';

const friendflixStyleUpload = ({ onCapture, onClose, captureType, uploadData, setUploadData }) => {
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const [error, setError] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const [facingMode, setFacingMode] = useState('user');
  const [devicesAvailable, setDevicesAvailable] = useState({ camera: true, microphone: true });
  
  // Editor states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('normal');
  const [showTextOverlay, setShowTextOverlay] = useState(false);
  const [textOverlayContent, setTextOverlayContent] = useState('');
  const [showAudioLibrary, setShowAudioLibrary] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [activePanel, setActivePanel] = useState('filters'); // filters, text, audio, media

  // Add filter options
  const FILTERS = [
    { id: 'normal', name: 'Normal', filter: 'none' },
    { id: 'clarendon', name: 'Clarendon', filter: 'contrast(1.2) saturate(1.35)' },
    { id: 'lark', name: 'Lark', filter: 'contrast(0.9) saturate(1.1) brightness(1.1)' },
    { id: 'moon', name: 'Moon', filter: 'grayscale(1) contrast(1.1)' },
    { id: 'reyes', name: 'Reyes', filter: 'sepia(0.4) contrast(1.1) saturate(1.1)' },
    { id: 'juno', name: 'Juno', filter: 'hue-rotate(-20deg) saturate(1.5)' },
    { id: 'slumber', name: 'Slumber', filter: 'saturate(0.66) brightness(1.05)' },
    { id: 'crema', name: 'Crema', filter: 'contrast(0.9) saturate(1.2) brightness(1.1)' },
    { id: 'lofi', name: 'Lo-Fi', filter: 'contrast(1.2) saturate(1.3)' }
  ];

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [captureType, facingMode]);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const startCamera = async () => {
    try {
      const permissions = await requestCameraAndMicrophonePermissions();
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      
      setDevicesAvailable({
        camera: videoDevices.length > 0,
        microphone: audioDevices.length > 0
      });
      
      if (captureType === 'video' && (videoDevices.length === 0 || audioDevices.length === 0)) {
        let message = '';
        if (videoDevices.length === 0 && audioDevices.length === 0) {
          message = 'No camera or microphone found. Please connect devices to record videos.';
        } else if (videoDevices.length === 0) {
          message = 'No camera found. Please connect a camera to record videos.';
        } else {
          message = 'No microphone found. Please connect a microphone to record videos.';
        }
        setError(message);
        return;
      } else if (captureType === 'photo' && videoDevices.length === 0) {
        setError('No camera found. Please connect a camera to take photos.');
        return;
      }
      
      if (captureType === 'video' && (!permissions.camera || !permissions.microphone)) {
        setError('Camera and microphone permissions are required for video recording. Please enable them in your browser settings.');
        return;
      } else if (captureType === 'photo' && !permissions.camera) {
        setError('Camera permission is required for taking photos. Please enable it in your browser settings.');
        return;
      }
      
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const constraints = captureType === 'photo' 
        ? { video: { facingMode }, audio: false } 
        : { video: { facingMode }, audio: true };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please check permissions and ensure you\'re using a secure connection (HTTPS).');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      onCapture(file);
    }, 'image/jpeg');
  };

  const startRecording = () => {
    if (!mediaStreamRef.current) return;

    recordedChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(mediaStreamRef.current);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const file = new File([blob], `video-${Date.now()}.webm`, { type: 'video/webm' });
      onCapture(file);
      setIsRecording(false);
      setRecordingTime(0);
    };

    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const retry = () => {
    setError(null);
    startCamera();
  };

  // Video player controls
  const handleVideoPlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (e) => {
    const seekTime = (e.target.value / 100) * videoDuration;
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const handleAudioSelect = (audio) => {
    setSelectedAudio(audio);
    setShowAudioLibrary(false);
  };

  const handleRemoveAudio = () => {
    setSelectedAudio(null);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col md:flex-row">
      {/* Main content area - Camera/Preview */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center p-4 bg-black/50 text-white">
          <h2 className="text-xl font-bold">
            {uploadData.contentType === 'reel' ? 'Create Reel' : 
             uploadData.contentType === 'story' ? 'Create Story' : 
             'Record Video'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <p className="text-white text-lg mb-4">{error}</p>
            <div className="flex gap-4">
              <button
                onClick={retry}
                className="px-6 py-3 bg-primary text-white rounded-full font-medium flex items-center gap-2"
              >
                <FaRedo /> Retry
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-600 text-white rounded-full font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 relative flex items-center justify-center bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
              />
              
              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center bg-red-500 text-white px-3 py-1 rounded-full">
                  <div className="w-3 h-3 bg-white rounded-full mr-2 animate-pulse"></div>
                  REC {formatTime(recordingTime)}
                </div>
              )}
              
              <button
                onClick={switchCamera}
                className="absolute top-4 right-4 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
              </button>
            </div>

            <div className="p-6 bg-black/80 flex flex-col items-center">
              {uploadData.contentType === 'photo' ? (
                <button
                  onClick={capturePhoto}
                  className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-white hover:bg-gray-200 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-800"></div>
                </button>
              ) : (
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-white hover:bg-gray-200'
                  } transition-colors`}
                >
                  {isRecording ? (
                    <div className="w-8 h-8 bg-white"></div>
                  ) : (
                    <FaVideo className="text-gray-800 text-2xl" />
                  )}
                </button>
              )}
              
              <p className="text-white mt-4 text-center">
                {uploadData.contentType === 'photo' 
                  ? 'Tap to capture photo' 
                  : isRecording 
                    ? 'Tap to stop recording' 
                    : 'Tap to start recording'}
              </p>
              
              {!devicesAvailable.camera && (
                <p className="text-yellow-300 text-sm mt-2 text-center">
                  No camera detected. Connect a camera to enable this feature.
                </p>
              )}
              {!devicesAvailable.microphone && uploadData.contentType === 'video' && (
                <p className="text-yellow-300 text-sm mt-1 text-center">
                  No microphone detected. Connect a microphone for audio recording.
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Side panel for editing tools - hidden on mobile */}
      <div className="hidden md:block w-80 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold">Editing Tools</h3>
        </div>
        
        {/* Toolbar */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActivePanel('filters')}
            className={`flex-1 p-3 text-center ${activePanel === 'filters' ? 'bg-gray-800 border-b-2 border-purple-500' : ''}`}
          >
            <FiFilter className="mx-auto mb-1" />
            <span className="text-xs">Filters</span>
          </button>
          <button
            onClick={() => setActivePanel('text')}
            className={`flex-1 p-3 text-center ${activePanel === 'text' ? 'bg-gray-800 border-b-2 border-purple-500' : ''}`}
          >
            <FiType className="mx-auto mb-1" />
            <span className="text-xs">Text</span>
          </button>
          <button
            onClick={() => setActivePanel('audio')}
            className={`flex-1 p-3 text-center ${activePanel === 'audio' ? 'bg-gray-800 border-b-2 border-purple-500' : ''}`}
          >
            <FiMusic className="mx-auto mb-1" />
            <span className="text-xs">Audio</span>
          </button>
          <button
            onClick={() => setActivePanel('media')}
            className={`flex-1 p-3 text-center ${activePanel === 'media' ? 'bg-gray-800 border-b-2 border-purple-500' : ''}`}
          >
            <FaVideo className="mx-auto mb-1" />
            <span className="text-xs">Media</span>
          </button>
        </div>
        
        {/* Panel content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activePanel === 'filters' && (
            <div>
              <h4 className="font-medium mb-3">Filters</h4>
              <div className="grid grid-cols-3 gap-3">
                {FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedFilter(filter.id)}
                    className={`relative rounded-lg overflow-hidden aspect-square border-2 transition-all ${
                      selectedFilter === filter.id
                        ? 'border-purple-500 ring-2 ring-purple-500/30'
                        : 'border-gray-600 hover:border-purple-500'
                    }`}
                  >
                    <div 
                      className="w-full h-full flex items-center justify-center bg-gray-700"
                      style={{ filter: filter.filter }}
                    >
                      <div className="bg-gray-600 w-8 h-8 rounded"></div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-1 px-2 text-center">
                      {filter.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {activePanel === 'text' && (
            <div>
              <h4 className="font-medium mb-3">Text Overlay</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm">Add Text Overlay</label>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                    <input
                      type="checkbox"
                      checked={showTextOverlay}
                      onChange={(e) => setShowTextOverlay(e.target.checked)}
                      className="sr-only"
                      id="textOverlay"
                    />
                    <label
                      htmlFor="textOverlay"
                      className={`block h-5 w-9 rounded-full cursor-pointer transition-colors ${
                        showTextOverlay ? 'bg-purple-500' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${
                          showTextOverlay ? 'transform translate-x-4' : ''
                        }`}
                      ></span>
                    </label>
                  </div>
                </div>
                
                {showTextOverlay && (
                  <div>
                    <textarea
                      value={textOverlayContent}
                      onChange={(e) => setTextOverlayContent(e.target.value)}
                      placeholder="Enter your text here..."
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm"
                      rows="3"
                    />
                    <div className="mt-2 text-xs text-gray-400">
                      Add captions, titles, or any text to your video
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activePanel === 'audio' && (
            <div>
              <h4 className="font-medium mb-3">Audio Track</h4>
              <div className="space-y-4">
                {!selectedAudio ? (
                  <button
                    onClick={() => setShowAudioLibrary(true)}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <FiMusic />
                    <span>Browse Audio Library</span>
                  </button>
                ) : (
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                        <FiMusic className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {selectedAudio.title || 'Untitled Audio'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {selectedAudio.extractedBy?.username || 'Unknown Artist'}
                        </p>
                      </div>
                      <button
                        onClick={handleRemoveAudio}
                        className="text-gray-400 hover:text-white"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-400">
                  Add music or sound effects to enhance your video
                </div>
              </div>
            </div>
          )}
          
          {activePanel === 'media' && (
            <div>
              <h4 className="font-medium mb-3">Media Selection</h4>
              <div className="space-y-4">
                <button
                  onClick={() => {
                    // This would trigger file upload
                    document.getElementById('media-upload').click();
                  }}
                  className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <FaUpload />
                  <span>Upload Media</span>
                </button>
                
                <button
                  onClick={switchCamera}
                  className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <FaCamera />
                  <span>Switch Camera</span>
                </button>
                
                <div className="text-xs text-gray-400">
                  Upload existing media or switch between cameras
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Apply all settings and proceed
                setUploadData(prev => ({
                  ...prev,
                  selectedFilter: selectedFilter,
                  textOverlayContent: textOverlayContent,
                  selectedAudio: selectedAudio
                }));
                // This would typically trigger the next step in the upload process
                toast.success('Settings applied!');
              }}
              className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile bottom bar for editing tools */}
      <div className="md:hidden bg-gray-900 text-white">
        <div className="flex border-t border-gray-700">
          <button
            onClick={() => setActivePanel('filters')}
            className={`flex-1 p-3 text-center ${activePanel === 'filters' ? 'bg-gray-800 border-t-2 border-purple-500' : ''}`}
          >
            <FiFilter className="mx-auto mb-1" />
            <span className="text-xs">Filters</span>
          </button>
          <button
            onClick={() => setActivePanel('text')}
            className={`flex-1 p-3 text-center ${activePanel === 'text' ? 'bg-gray-800 border-t-2 border-purple-500' : ''}`}
          >
            <FiType className="mx-auto mb-1" />
            <span className="text-xs">Text</span>
          </button>
          <button
            onClick={() => setActivePanel('audio')}
            className={`flex-1 p-3 text-center ${activePanel === 'audio' ? 'bg-gray-800 border-t-2 border-purple-500' : ''}`}
          >
            <FiMusic className="mx-auto mb-1" />
            <span className="text-xs">Audio</span>
          </button>
        </div>
        
        {/* Mobile panel content */}
        <div className="p-4 max-h-60 overflow-y-auto">
          {activePanel === 'filters' && (
            <div>
              <h4 className="font-medium mb-3">Filters</h4>
              <div className="grid grid-cols-4 gap-2">
                {FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedFilter(filter.id)}
                    className={`relative rounded overflow-hidden aspect-square border-2 transition-all ${
                      selectedFilter === filter.id
                        ? 'border-purple-500 ring-2 ring-purple-500/30'
                        : 'border-gray-600 hover:border-purple-500'
                    }`}
                  >
                    <div 
                      className="w-full h-full flex items-center justify-center bg-gray-700"
                      style={{ filter: filter.filter }}
                    >
                      <div className="bg-gray-600 w-6 h-6 rounded"></div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-1 px-1 text-center">
                      {filter.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {activePanel === 'text' && (
            <div>
              <h4 className="font-medium mb-3">Text Overlay</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm">Add Text Overlay</label>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none">
                    <input
                      type="checkbox"
                      checked={showTextOverlay}
                      onChange={(e) => setShowTextOverlay(e.target.checked)}
                      className="sr-only"
                      id="textOverlay-mobile"
                    />
                    <label
                      htmlFor="textOverlay-mobile"
                      className={`block h-5 w-9 rounded-full cursor-pointer transition-colors ${
                        showTextOverlay ? 'bg-purple-500' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${
                          showTextOverlay ? 'transform translate-x-4' : ''
                        }`}
                      ></span>
                    </label>
                  </div>
                </div>
                
                {showTextOverlay && (
                  <div>
                    <textarea
                      value={textOverlayContent}
                      onChange={(e) => setTextOverlayContent(e.target.value)}
                      placeholder="Enter your text here..."
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm"
                      rows="2"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activePanel === 'audio' && (
            <div>
              <h4 className="font-medium mb-3">Audio Track</h4>
              <div className="space-y-4">
                {!selectedAudio ? (
                  <button
                    onClick={() => setShowAudioLibrary(true)}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <FiMusic />
                    <span>Browse Audio</span>
                  </button>
                ) : (
                  <div className="bg-gray-800 rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                        <FiMusic className="text-white text-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {selectedAudio.title || 'Untitled Audio'}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {selectedAudio.extractedBy?.username || 'Unknown Artist'}
                        </p>
                      </div>
                      <button
                        onClick={handleRemoveAudio}
                        className="text-gray-400 hover:text-white"
                      >
                        <FaTimes size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Audio Library Modal */}
      {showAudioLibrary && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Select Audio</h3>
              <button
                onClick={() => setShowAudioLibrary(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <AudioLibrary 
                onAudioSelect={handleAudioSelect}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Hidden file input for media upload */}
      <input
        id="media-upload"
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => {
          // Handle media upload
          if (e.target.files && e.target.files.length > 0) {
            toast.success(`${e.target.files.length} file(s) selected`);
          }
        }}
      />
    </div>
  );
};

export default friendflixStyleUpload;