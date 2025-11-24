import React, { useRef, useState, useEffect } from 'react';
import { FaCamera, FaVideo, FaTimes, FaRedo } from 'react-icons/fa';
import { requestCameraAndMicrophonePermissions } from '../utils/permissions';
import toast from 'react-hot-toast';

const CameraCapture = ({ onCapture, onClose, captureType }) => {
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const [error, setError] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const [facingMode, setFacingMode] = useState('user'); // 'user' for front camera, 'environment' for back camera
  const [devicesAvailable, setDevicesAvailable] = useState({ camera: true, microphone: true });

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
      // Check permissions first
      const permissions = await requestCameraAndMicrophonePermissions();
      
      // Check if devices are available
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      
      setDevicesAvailable({
        camera: videoDevices.length > 0,
        microphone: audioDevices.length > 0
      });
      
      // Show warning if devices are not available
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
      
      // Check permissions
      if (captureType === 'video' && (!permissions.camera || !permissions.microphone)) {
        setError('Camera and microphone permissions are required for video recording. Please enable them in your browser settings.');
        return;
      } else if (captureType === 'photo' && !permissions.camera) {
        setError('Camera permission is required for taking photos. Please enable it in your browser settings.');
        return;
      }
      
      // Stop any existing stream
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

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex justify-between items-center p-4 bg-black/50 text-white">
        <h2 className="text-xl font-bold">
          {captureType === 'photo' ? 'Take Photo' : 'Record Video'}
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
          <div className="flex-1 relative flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
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
            {captureType === 'photo' ? (
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
              {captureType === 'photo' 
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
            {!devicesAvailable.microphone && captureType === 'video' && (
              <p className="text-yellow-300 text-sm mt-1 text-center">
                No microphone detected. Connect a microphone for audio recording.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CameraCapture;