import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import socketService from '../services/socket';
import toast from 'react-hot-toast';
import { BsMicMute, BsMic } from 'react-icons/bs';
import { AiOutlinePhone, AiOutlineAudio } from 'react-icons/ai';

const AudioCall = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isInitiatorQuery = new URLSearchParams(location.search).get('initiator') === '1';
  const { user } = useAuth();

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isInitiator, setIsInitiator] = useState(isInitiatorQuery);
  const [callStatus, setCallStatus] = useState('connecting'); // connecting, connected, ended
  const [callDuration, setCallDuration] = useState(0);

  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const peerConnection = useRef(null);
  const durationInterval = useRef(null);
  const participantsRef = useRef(new Set());
  const startedRef = useRef(false);

  useEffect(() => {
    initializeCall();
    socketService.emit('call:join', { roomId });

    // Wait for second participant before starting offer (avoids missing offer)
    socketService.on('call:participant', ({ userId }) => {
      if (userId && userId !== user._id) {
        participantsRef.current.add(userId);
        if (isInitiator && !startedRef.current) {
          startedRef.current = true;
          startCall();
        }
      }
    });

    // Socket signaling handlers
    socketService.on('call:offer', async ({ offer }) => {
      if (!peerConnection.current) return;
      // Only non-initiator should handle offer, and only when stable
      if (isInitiator || peerConnection.current.signalingState !== 'stable') return;
      await peerConnection.current.setRemoteDescription(offer);
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socketService.emit('call:answer', { roomId, answer, from: user._id });
      setCallStatus('connected');
      startCallDuration();
    });

    socketService.on('call:answer', async ({ answer }) => {
      if (!peerConnection.current) return;
      // Only initiator applies remote answer
      if (!isInitiator) return;
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
      // Avoid false end before connection
      if (callStatus === 'connected') {
        endCall();
      }
    });

    return () => {
      endCall();
      socketService.off('call:offer');
      socketService.off('call:answer');
      socketService.off('call:ice-candidate');
      socketService.off('endCall');
      socketService.off('call:participant');
    };
  }, []);

  const initializeCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      });

      setLocalStream(stream);
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
      }

      setupPeerConnection(stream);
      toast.success('Microphone ready');
      // Auto-start only when second participant joins (handled by call:participant)
      // if (isInitiatorQuery) { startCall(); }
    } catch (error) {
      console.error('Failed to get audio:', error);
      toast.error('Failed to access microphone');
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

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    const remote = new MediaStream();
    setRemoteStream(remote);
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remote;
    }
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => remote.addTrack(track));
    };

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
      startedRef.current = true;
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
    if (peerConnection.current) {
      try { peerConnection.current.close(); } catch {}
      peerConnection.current = null;
    }
    setCallStatus('ended');
    socketService.emit('endCall', { roomId });
    if (callDuration > 0) {
      setTimeout(() => {
        navigate('/messages');
      }, 2000);
    } else {
      navigate('/messages');
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-black flex flex-col">
      <div className="flex-1 relative flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-32 h-32 bg-gradient-primary rounded-full flex items-center justify-center mb-4 animate-pulse">
            <AiOutlineAudio size={64} />
          </div>
          <p className="text-2xl font-bold mb-2">Audio Call</p>
          <p className="text-indigo-200">{callStatus === 'connected' ? 'Connected' : 'Connecting...'}</p>
          <div className="mt-4 font-mono">{formatDuration(callDuration)}</div>
        </div>
        {/* Hidden audio elements */}
        <audio ref={localAudioRef} autoPlay muted playsInline />
        <audio ref={remoteAudioRef} autoPlay playsInline />
      </div>

      {/* Controls */}
      <div className="p-8 bg-black/50 backdrop-blur-lg">
        <div className="flex items-center justify-center space-x-6">
          <button
            onClick={toggleMute}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {isMuted ? <BsMicMute className="text-white" size={24} /> : <BsMic className="text-white" size={24} />}
          </button>

          <button
            onClick={endCall}
            className="w-20 h-20 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-glow"
          >
            <AiOutlinePhone className="text-white rotate-135" size={32} />
          </button>

          <button
            onClick={startCall}
            className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
            title="Start Call"
          >
            <AiOutlineAudio className="text-white" size={24} />
          </button>
        </div>
      </div>

      {callStatus === 'ended' && callDuration > 0 && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="text-center text-white">
            <div className="text-6xl mb-4">🎧</div>
            <h2 className="text-3xl font-bold mb-2">Call Ended</h2>
            <p className="text-xl text-indigo-200 mb-2">Duration: {formatDuration(callDuration)}</p>
            {callDuration > 0 && <p className="text-gray-400">Redirecting...</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioCall;
