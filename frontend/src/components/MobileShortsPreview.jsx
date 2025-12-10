import React, { useState, useRef, useEffect } from 'react';
import { FiType, FiCheck } from 'react-icons/fi';

const MobileShortsPreview = ({ videoFile, initialSettings, onComplete, onRetake }) => {
  const videoRef = useRef(null);
  const [textOverlay, setTextOverlay] = useState(initialSettings.textOverlay || '');
  const [isEditingText, setIsEditingText] = useState(false);

  useEffect(() => {
    if (videoFile && videoRef.current) {
      const url = URL.createObjectURL(videoFile);
      videoRef.current.src = url;
      return () => URL.revokeObjectURL(url);
    }
  }, [videoFile]);

  const handleNext = () => {
    onComplete({
      ...initialSettings,
      textOverlay: textOverlay,
    });
  };

  const renderTextEditor = () => (
    <div className="absolute inset-0 bg-black/80 z-20 flex flex-col p-4">
        <div className="flex-1 flex items-center justify-center">
            <textarea
                className="w-full bg-transparent text-white text-3xl font-bold text-center outline-none resize-none"
                placeholder="Enter text..."
                value={textOverlay}
                onChange={(e) => setTextOverlay(e.target.value)}
                rows={3}
                autoFocus
            />
        </div>
        <button
            onClick={() => setIsEditingText(false)}
            className="w-full py-3 bg-white text-black font-bold rounded-lg"
        >
            Done
        </button>
    </div>
  );

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        autoPlay
        loop
        playsInline
      />
      
      {/* Text Overlay */}
      {textOverlay && !isEditingText && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="bg-black/50 text-white text-2xl font-bold px-4 py-2 rounded-lg max-w-xs text-center">
                {textOverlay}
            </div>
        </div>
      )}

      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50">
        <button onClick={onRetake} className="text-white text-lg">Back</button>
        <div className="flex items-center space-x-4">
            <button onClick={() => setIsEditingText(true)} className="text-white flex items-center space-x-1">
                <FiType size={22} />
                <span>Text</span>
            </button>
            {/* Add buttons for Sound, Filters etc. here */}
        </div>
      </div>
      
      {/* Footer Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50">
        <button onClick={handleNext} className="w-full py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700">
            Next
        </button>
      </div>

      {isEditingText && renderTextEditor()}
    </div>
  );
};

export default MobileShortsPreview;
