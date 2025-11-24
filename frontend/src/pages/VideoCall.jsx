import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import socketService from '../services/socket';
import toast from 'react-hot-toast';
import {
  AiOutlineVideoCamera,
  AiOutlineAudio,
  AiOutlinePhone,
  AiOutlineVideoCameraAdd,
} from 'react-icons/ai';
import { BsMicMute, BsMic, BsCameraVideo, BsCameraVideoOff } from 'react-icons/bs';

const VideoCall = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isInitiator, setIsInitiator] = useState(false);
  const [callStatus, setCallStatus] = useState('connecting'); // connecting, connected, ended
  const [callDuration, setCallDuration] = useState(0);
  const [connectionError, setConnectionError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const durationInterval = useRef(null);

  useEffect(() => {
    initializeCall();
    
    // Join room
    socketService.emit('call:join', { roomId, userId: user._id });

    // Socket signaling handlers
    const handleOffer = async ({ offer, from }) => {
      if (!peerConnection.current) return;
      try {
        await peerConnection.current.setRemoteDescription(offer);
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        socketService.emit('call:answer', { roomId, answer, from: user._id, to: from });
      } catch (error) {
        console.error('Error handling offer:', error);
        toast.error('Failed to establish connection');
      }
    };

    const handleAnswer = async ({ answer }) => {
      if (!peerConnection.current) return;
      try {
        await peerConnection.current.setRemoteDescription(answer);
        setCallStatus('connected');
        startCallDuration();
      } catch (error) {
        console.error('Error handling answer:', error);
        toast.error('Failed to establish connection');
      }
    };

    const handleIceCandidate = async ({ candidate }) => {
      try {
        if (peerConnection.current && candidate) {
          await peerConnection.current.addIceCandidate(candidate);
        }
      } catch (e) {
        console.error('Failed to add ICE candidate', e);
      }
    };

    const handleUserJoined = ({ userId }) => {
      if (userId !== user._id) {
        setIsInitiator(true);
        // Automatically start call when another user joins
        setTimeout(() => {
          startCall();
        }, 1000);
      }
    };

    const handleEndCall = () => {
      endCall();
    };

    // Register socket listeners
    socketService.on('call:offer', handleOffer);
    socketService.on('call:answer', handleAnswer);
    socketService.on('call:ice-candidate', handleIceCandidate);
    socketService.on('call:user-joined', handleUserJoined);
    socketService.on('endCall', handleEndCall);

    return () => {
      console.log('Cleaning up VideoCall component');
      endCall();
      socketService.off('call:offer', handleOffer);
      socketService.off('call:answer', handleAnswer);
      socketService.off('call:ice-candidate', handleIceCandidate);
      socketService.off('call:user-joined', handleUserJoined);
      socketService.off('endCall', handleEndCall);
      
      // Clear any remaining intervals
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, [roomId, user._id]);

  const initializeCall = async () => {
    try {
      // Check if media devices are supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Media devices not supported in this browser');
        setCallStatus('ended');
        return;
      }
      
      // Get user media with constraints
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };
      
      console.log('Requesting user media with constraints:', constraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('User media stream acquired:', stream);
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Setup WebRTC
      setupPeerConnection(stream);
      
      toast.success('Camera and microphone ready');
      
      // Auto-start call for initiator
      if (isInitiator) {
        setTimeout(() => {
          startCall();
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to get user media:', error);
      
      // Handle specific errors
      if (error.name === 'NotAllowedError') {
        toast.error('Permission denied for camera/microphone. Please allow access.');
      } else if (error.name === 'NotFoundError') {
        toast.error('No camera/microphone found.');
      } else if (error.name === 'NotReadableError') {
        toast.error('Camera/microphone is being used by another application.');
      } else if (error.name === 'OverconstrainedError') {
        toast.error('Camera/microphone constraints cannot be satisfied.');
      } else {
        toast.error('Failed to access camera/microphone: ' + error.message);
      }
      
      setCallStatus('ended');
      
      // Redirect after delay
      setTimeout(() => {
        navigate('/messages');
      }, 3000);
    }
  };

  const setupPeerConnection = async (stream) => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        ...(function(){
          try {
            const env = import.meta.env.VITE_TURN_SERVERS;
            if (!env) return [];
            const servers = JSON.parse(env);
            return servers;
          } catch {
            return [];
          }
        })(),
      ],
    };
    
    try {
      const pc = new RTCPeerConnection(configuration);
      peerConnection.current = pc;

      // Add local tracks
      if (stream) {
        stream.getTracks().forEach((track) => {
          if (pc.signalingState !== 'closed') {
            pc.addTrack(track, stream);
          }
        });
      }

      // Remote stream
      const remote = new MediaStream();
      setRemoteStream(remote);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remote;
      }
      
      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          if (!remote.getTrackById(track.id)) {
            remote.addTrack(track);
          }
        });
      };

      // ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketService.emit('call:ice-candidate', { 
            roomId, 
            candidate: event.candidate,
            userId: user._id 
          });
        }
      };

      // Connection state changes
      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          toast.error('Connection lost');
          endCall();
        }
      };

      // ICE connection state changes
      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'failed') {
          toast.error('ICE connection failed');
        }
      };

      setCallStatus('connecting');
    } catch (error) {
      console.error('Failed to setup peer connection:', error);
      toast.error('Failed to initialize call connection');
    }
  };

  const startCallDuration = () => {
    durationInterval.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const startCall = async () => {
    try {
      if (!peerConnection.current) {
        toast.error('Call connection not ready');
        return;
      }
      
      // Check signaling state
      if (peerConnection.current.signalingState !== 'stable') {
        console.log('Peer connection not stable, current state:', peerConnection.current.signalingState);
        // Don't start call if connection is already in progress
        return;
      }
      
      setIsInitiator(true);
      const offer = await peerConnection.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      // Ensure we're setting the local description properly
      await peerConnection.current.setLocalDescription(offer);
      
      socketService.emit('call:offer', { 
        roomId, 
        offer, 
        from: user._id,
        timestamp: Date.now()
      });
      
      console.log('Call offer sent');
    } catch (e) {
      console.error('Failed to start call', e);
      toast.error('Failed to start call: ' + e.message);
    }
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const newState = !audioTracks[0].enabled;
        audioTracks.forEach((track) => {
          track.enabled = newState;
        });
        setIsMuted(!newState);
        
        // Visual feedback
        if (newState) {
          toast.success('Microphone unmuted');
        } else {
          toast.success('Microphone muted');
        }
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        const newState = !videoTracks[0].enabled;
        videoTracks.forEach((track) => {
          track.enabled = newState;
        });
        setIsVideoOff(!newState);
        
        // Visual feedback
        if (newState) {
          toast.success('Camera turned on');
        } else {
          toast.success('Camera turned off');
        }
      }
    }
  };

  const endCall = (shouldReconnect = false) => {
    console.log('Ending call...');
    
    // Stop local stream tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.log('Error stopping track:', e);
        }
      });
      setLocalStream(null);
    }
    
    // Stop remote stream tracks
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.log('Error stopping remote track:', e);
        }
      });
      setRemoteStream(null);
    }
    
    // Close peer connection
    if (peerConnection.current) {
      try {
        peerConnection.current.close();
      } catch (e) {
        console.log('Error closing peer connection:', e);
      }
      peerConnection.current = null;
    }
    
    // Clear duration interval
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }
    
    if (!shouldReconnect) {
      // Update call status
      setCallStatus('ended');
      
      // Emit socket event
      try {
        socketService.emit('endCall', { roomId, userId: user._id });
      } catch (e) {
        console.log('Error emitting endCall event:', e);
      }
      
      // Navigate away after delay
      setTimeout(() => {
        try {
          navigate('/messages');
        } catch (e) {
          console.log('Error navigating:', e);
          // Fallback navigation
          window.location.href = '/messages';
        }
      }, 2000);
    }
  };

  const retryConnection = async () => {
    if (reconnectAttempts >= 3) {
      toast.error('Maximum reconnection attempts reached');
      endCall();
      return;
    }
    
    setReconnectAttempts(prev => prev + 1);
    setConnectionError(null);
    setCallStatus('connecting');
    
    try {
      // End current call but don't navigate away
      endCall(true);
      
      // Reinitialize
      setTimeout(() => {
        initializeCall();
      }, 1000);
      
      toast.success('Reconnection attempt ' + reconnectAttempts + 1);
    } catch (error) {
      console.error('Reconnection failed:', error);
      setConnectionError('Reconnection failed');
    }
  };

  const switchCamera = async () => {
    if (!localStream) return;
    
    try {
      // Stop current tracks
      localStream.getTracks().forEach(track => track.stop());
      
      // Get new stream with different facing mode
      const currentFacingMode = localStream.getVideoTracks()[0]?.getSettings()?.facingMode || 'user';
      const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
      
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: true
      });
      
      setLocalStream(newStream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = newStream;
      }
      
      // Update peer connection if it exists
      if (peerConnection.current && peerConnection.current.signalingState !== 'closed') {
        // Remove old tracks
        localStream.getTracks().forEach(track => {
          try {
            peerConnection.current.removeTrack(track, localStream);
          } catch (e) {
            console.log('Error removing track:', e);
          }
        });
        
        // Add new tracks
        newStream.getTracks().forEach(track => {
          try {
            peerConnection.current.addTrack(track, newStream);
          } catch (e) {
            console.log('Error adding track:', e);
          }
        });
      }
      
      toast.success(`Switched to ${newFacingMode} camera`);
    } catch (error) {
      console.error('Error switching camera:', error);
      toast.error('Failed to switch camera');
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-black flex flex-col">
      {/* Remote Video (Full Screen) */}
      <div className="flex-1 relative">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white">
            <div className="w-32 h-32 bg-gradient-primary rounded-full flex items-center justify-center mb-4 animate-pulse">
              <AiOutlineVideoCamera size={64} />
            </div>
            <p className="text-2xl font-bold mb-2">Calling...</p>
            <p className="text-purple-200">Waiting for response</p>
          </div>
        )}

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute top-4 right-4 w-32 h-48 md:w-48 md:h-64 rounded-3xl overflow-hidden shadow-glow border-2 border-white/30">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {isVideoOff && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <BsCameraVideoOff className="text-white" size={32} />
            </div>
          )}
        </div>

        {/* Call Info */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-lg rounded-2xl px-6 py-3 text-white">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="font-semibold">{formatDuration(callDuration)}</span>
          </div>
        </div>

        {/* Call Status */}
        {callStatus === 'connecting' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white mb-4"></div>
            <p className="text-white text-xl font-semibold">Connecting...</p>
            {reconnectAttempts > 0 && (
              <p className="text-purple-200 mt-2">Attempt {reconnectAttempts} of 3</p>
            )}
          </div>
        )}
        
        {/* Connection Error */}
        {connectionError && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center bg-black/80 p-6 rounded-2xl">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-white text-xl font-semibold mb-4">{connectionError}</p>
            <div className="flex space-x-4">
              <button
                onClick={retryConnection}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-semibold transition-colors"
              >
                Retry
              </button>
              <button
                onClick={endCall}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold transition-colors"
              >
                End Call
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-8 bg-black/50 backdrop-blur-lg">
        <div className="flex items-center justify-center space-x-6">
          {/* Mute */}
          <button
            onClick={toggleMute}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              isMuted
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-white/20 hover:bg-white/30'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? (
              <BsMicMute className="text-white" size={24} />
            ) : (
              <BsMic className="text-white" size={24} />
            )}
          </button>

          {/* Video Toggle */}
          <button
            onClick={toggleVideo}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              isVideoOff
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-white/20 hover:bg-white/30'
            }`}
            title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isVideoOff ? (
              <BsCameraVideoOff className="text-white" size={24} />
            ) : (
              <BsCameraVideo className="text-white" size={24} />
            )}
          </button>

          {/* Switch Camera */}
          <button
            onClick={switchCamera}
            className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
            title="Switch camera"
          >
            <AiOutlineVideoCameraAdd className="text-white" size={24} />
          </button>

          {/* End Call */}
          <button
            onClick={endCall}
            className="w-20 h-20 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-glow"
            title="End call"
          >
            <AiOutlinePhone className="text-white rotate-135" size={32} />
          </button>

          {/* Start Call */}
          <button
            onClick={startCall}
            className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
            title="Start Call"
          >
            <AiOutlineVideoCamera className="text-white" size={24} />
          </button>
        </div>
      </div>

      {/* Call Ended Overlay */}
      {callStatus === 'ended' && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="text-center text-white">
            <div className="text-6xl mb-4">📞</div>
            <h2 className="text-3xl font-bold mb-2">Call Ended</h2>
            <p className="text-xl text-purple-200 mb-2">
              Duration: {formatDuration(callDuration)}
            </p>
            <p className="text-gray-400">Redirecting...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCall;
