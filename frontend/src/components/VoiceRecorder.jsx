import { useState, useRef } from 'react';
import { BsMic, BsStopCircle, BsTrash } from 'react-icons/bs';
import { AiOutlineSend } from 'react-icons/ai';
import toast from 'react-hot-toast';

const VoiceRecorder = ({ onSend }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState('');
  
  const mediaRecorder = useRef(null);
  const timerInterval = useRef(null);
  const audioChunks = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioURL(url);
        
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      
      // Start timer
      timerInterval.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      
      toast.success('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      clearInterval(timerInterval.current);
    }
  };

  const cancelRecording = () => {
    if (isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
    setAudioBlob(null);
    setAudioURL('');
    setRecordingTime(0);
    clearInterval(timerInterval.current);
  };

  const sendVoiceMessage = () => {
    if (audioBlob) {
      onSend(audioBlob, recordingTime);
      cancelRecording();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center space-x-2">
      {!isRecording && !audioBlob ? (
        // Start Recording Button
        <button
          onClick={startRecording}
          className="p-3 bg-gradient-primary rounded-full text-white hover:shadow-glow transition-all hover:scale-110"
        >
          <BsMic size={24} />
        </button>
      ) : isRecording ? (
        // Recording UI
        <div className="flex items-center space-x-3 flex-1 bg-red-50 dark:bg-red-900/20 rounded-2xl px-4 py-3 animate-pulse">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-red-500 font-semibold">{formatTime(recordingTime)}</span>
          <div className="flex-1 flex space-x-2">
            <div className="w-1 h-8 bg-red-500 rounded animate-pulse"></div>
            <div className="w-1 h-6 bg-red-500 rounded animate-pulse" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1 h-10 bg-red-500 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1 h-7 bg-red-500 rounded animate-pulse" style={{ animationDelay: '0.3s' }}></div>
          </div>
          <button
            onClick={stopRecording}
            className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600"
          >
            <BsStopCircle size={20} />
          </button>
        </div>
      ) : (
        // Preview & Send UI
        <div className="flex items-center space-x-2 flex-1 bg-purple-50 dark:bg-purple-900/20 rounded-2xl px-4 py-3">
          <audio src={audioURL} controls className="flex-1 h-10" />
          <button
            onClick={cancelRecording}
            className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600"
          >
            <BsTrash size={18} />
          </button>
          <button
            onClick={sendVoiceMessage}
            className="p-2 bg-gradient-primary rounded-full text-white hover:shadow-glow"
          >
            <AiOutlineSend size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
