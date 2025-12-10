import React, { useRef, useState, useEffect } from 'react';
import { FaCamera, FaVideo, FaTimes, FaRedo, FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaUpload, FaMusic } from 'react-icons/fa';
import { FiType } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AudioLibrary from './AudioLibrary';
import { requestCameraAndMicrophonePermissions } from '../utils/permissions';
import toast from 'react-hot-toast';

const MobileShortsRecorder = ({ onClose, onVideoCaptured }) => {
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const [error, setError] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const [facingMode, setFacingMode] = useState('environment');
  const [devicesAvailable, setDevicesAvailable] = useState({ camera: true, microphone: true });
  
  // Recording settings
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerDuration, setTimerDuration] = useState(3); // 3 seconds countdown
  const [videoDuration, setVideoDuration] = useState(15); // 15 seconds default
  const [recordingSpeed, setRecordingSpeed] = useState(1); // 1x speed
  
  // Editor states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showTextOverlay, setShowTextOverlay] = useState(false);
  const [textOverlayContent, setTextOverlayContent] = useState('');
  const [showAudioLibrary, setShowAudioLibrary] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState(null);
  
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= videoDuration) {
            stopRecording();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, videoDuration]);

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
      
      if (videoDevices.length === 0 || audioDevices.length === 0) {
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
      }
      
      if (!permissions.camera || !permissions.microphone) {
        setError('Camera and microphone permissions are required for video recording. Please enable them in your browser settings.');
        return;
      }
      
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const constraints = { 
        video: { 
          facingMode: facingMode,
          width: { ideal: 1080 },
          height: { ideal: 1920 } // Portrait mode for shorts
        }, 
        audio: true 
      };
      
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

  const startRecording = async () => {
    if (!mediaStreamRef.current) return;
    
    if (timerEnabled) {
      // Countdown timer
      for (let i = timerDuration; i > 0; i--) {
        toast(`Recording in ${i}...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

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
      const file = new File([blob], `short-${Date.now()}.webm`, { type: 'video/webm' });
      
      // Pass the captured video to the parent component
      if (onVideoCaptured) {
        onVideoCaptured(file, {
          textOverlay: textOverlayContent,
          audio: selectedAudio,
          speed: recordingSpeed
        });
      }
      
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

  const handleAudioSelect = (audio) => {
    setSelectedAudio(audio);
    setShowAudioLibrary(false);
  };

  const handleRemoveAudio = () => {
    setSelectedAudio(null);
  };

  return (
    <div className="mobile-shorts-recorder flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black/50 text-white">
        <button 
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/20 transition-colors"
        >
          <FaTimes size={24} />
        </button>
        <h2 className="text-xl font-bold">Create Short</h2>
        <button className="opacity-0 p-2">
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
              className="px-6 py-3 bg-red-600 text-white rounded-full font-medium flex items-center gap-2"
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
          {/* Camera Preview */}
          <div className="flex-1 relative flex items-center justify-center bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Recording indicator */}
            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center bg-red-500 text-white px-3 py-1 rounded-full">
                <div className="w-3 h-3 bg-white rounded-full mr-2 animate-pulse"></div>
                REC {formatTime(recordingTime)}
              </div>
            )}
            
            {/* Text overlay preview */}
            {showTextOverlay && textOverlayContent && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/50 text-white text-2xl font-bold px-4 py-2 rounded-lg max-w-xs text-center">
                  {textOverlayContent}
                </div>
              </div>
            )}
            
            {/* Selected audio indicator */}
            {selectedAudio && (
              <div className="absolute top-4 right-4 flex items-center bg-black/50 text-white px-3 py-1 rounded-full">
                <FaMusic className="mr-2" />
                <span className="text-sm truncate max-w-[100px]">{selectedAudio.title || 'Audio'}</span>
              </div>
            )}
          </div>

          {/* Top Controls */}
          <div className="absolute top-20 right-4 flex flex-col space-y-4">
            {/* Camera flip button */}
            <button
              onClick={switchCamera}
              className="p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            >
              <FaCamera size={20} />
            </button>
            
            {/* Timer button */}
            <button
              onClick={() => setTimerEnabled(!timerEnabled)}
              className={`p-3 rounded-full transition-colors ${
                timerEnabled 
                  ? 'bg-red-600 text-white' 
                  : 'bg-black/50 text-white hover:bg-black/70'
              }`}
            >
              <span className="text-xs font-bold">{timerDuration}s</span>
            </button>
            
            {/* Duration selector */}
            <div className="bg-black/50 text-white rounded-full p-1">
              <select 
                value={videoDuration}
                onChange={(e) => setVideoDuration(Number(e.target.value))}
                className="bg-transparent text-xs font-bold focus:outline-none"
              >
                <option value={15}>15s</option>
                <option value={30}>30s</option>
                <option value={60}>60s</option>
              </select>
            </div>
            
            {/* Speed selector */}
            <div className="bg-black/50 text-white rounded-full p-1">
              <select 
                value={recordingSpeed}
                onChange={(e) => setRecordingSpeed(Number(e.target.value))}
                className="bg-transparent text-xs font-bold focus:outline-none"
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={2}>2x</option>
              </select>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="p-6 bg-black/80 flex items-center justify-between">
            {/* Gallery Import Button */}
            <button
              onClick={() => {
                // Would trigger file upload
                document.getElementById('gallery-upload-mobile').click();
              }}
              className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center"
            >
              <FaUpload className="text-white" />
            </button>
            
            {/* Record Button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!devicesAvailable.camera || !devicesAvailable.microphone}
              className={`record-button transition-all ${
                isRecording 
                  ? 'bg-red-600 scale-110' 
                  : 'bg-red-500 hover:bg-red-600'
              } ${(!devicesAvailable.camera || !devicesAvailable.microphone) ? 'opacity-50' : ''}`}
            >
              {isRecording ? (
                <div className="w-10 h-10 bg-white rounded-sm"></div>
              ) : (
                <FaVideo className="text-white text-2xl" />
              )}
            </button>
            
            {/* Add Sound Button */}
            <button
              onClick={() => setShowAudioLibrary(true)}
              className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center"
            >
              <FaMusic className="text-white" />
            </button>
          </div>

          {/* Bottom Navigation */}
          <div className="flex border-t border-gray-700 bg-gray-900">
            <button
              onClick={() => navigate('/')}
              className="flex-1 p-3 text-center text-gray-400"
            >
              <div className="text-xs">Video</div>
            </button>
            <button
              className="flex-1 p-3 text-center text-white border-t-2 border-red-500"
            >
              <div className="text-xs font-bold">Short</div>
            </button>
            <button
              onClick={() => navigate('/live')}
              className="flex-1 p-3 text-center text-gray-400"
            >
              <div className="text-xs">Live</div>
            </button>
            <button
              onClick={() => navigate('/upload')}
              className="flex-1 p-3 text-center text-gray-400"
            >
              <div className="text-xs">Post</div>
            </button>
            <button
              onClick={() => navigate('/stories')}
              className="flex-1 p-3 text-center text-gray-400"
            >
              <div className="text-xs">Story</div>
            </button>
          </div>
        </>
      )}

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

      {/* Hidden file input for gallery upload */}
      <input
        id="gallery-upload-mobile"
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            // Handle gallery upload
            if (onVideoCaptured) {
              onVideoCaptured(e.target.files[0], {
                textOverlay: textOverlayContent,
                audio: selectedAudio,
                speed: recordingSpeed
              });
            }
          }
        }}
      />
    </div>
  );
};

export default MobileShortsRecorder;