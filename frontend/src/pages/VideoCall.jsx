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

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const durationInterval = useRef(null);

  useEffect(() => {
    initializeCall();
    socketService.emit('call:join', { roomId });

    // Socket signaling handlers
    socketService.on('call:offer', async ({ offer }) => {
      if (!peerConnection.current) return;
      await peerConnection.current.setRemoteDescription(offer);
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socketService.emit('call:answer', { roomId, answer, from: user._id });
    });

    socketService.on('call:answer', async ({ answer }) => {
      if (!peerConnection.current) return;
      await peerConnection.current.setRemoteDescription(answer);
      setCallStatus('connected');
      startCallDuration();
    });

    socketService.on('call:ice-candidate', async ({ candidate }) => {
      try {
        await peerConnection.current?.addIceCandidate(candidate);
      } catch (e) {
        console.error('Failed to add ICE candidate', e);
      }
    });

    socketService.on('endCall', () => {
      endCall();
    });

    return () => {
      endCall();
      socketService.off('call:offer');
      socketService.off('call:answer');
      socketService.off('call:ice-candidate');
      socketService.off('endCall');
    };
  }, []);

  const initializeCall = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Setup WebRTC (simplified version)
      setupPeerConnection(stream);
      
      toast.success('Camera and microphone ready');
    } catch (error) {
      console.error('Failed to get user media:', error);
      toast.error('Failed to access camera/microphone');
    }
  };

  const setupPeerConnection = async (stream) => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
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
    const pc = new RTCPeerConnection(configuration);
    peerConnection.current = pc;

    // Add local tracks
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    // Remote stream
    const remote = new MediaStream();
    setRemoteStream(remote);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remote;
    }
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => remote.addTrack(track));
    };

    // ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.emit('call:ice-candidate', { roomId, candidate: event.candidate });
      }
    };

    setCallStatus('connecting');
  };

  const startCallDuration = () => {
    durationInterval.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const startCall = async () => {
    try {
      setIsInitiator(true);
      if (!peerConnection.current) return toast.error('Call not ready');
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      socketService.emit('call:offer', { roomId, offer, from: user._id });
    } catch (e) {
      console.error('Failed to start call', e);
      toast.error('Failed to start call');
    }
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
    }
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
    }
    setCallStatus('ended');
    
    // Emit socket event
    socketService.emit('endCall', { roomId });
    
    setTimeout(() => {
      navigate('/messages');
    }, 2000);
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
          >
            {isVideoOff ? (
              <BsCameraVideoOff className="text-white" size={24} />
            ) : (
              <BsCameraVideo className="text-white" size={24} />
            )}
          </button>

          {/* End Call */}
          <button
            onClick={endCall}
            className="w-20 h-20 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-glow"
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
