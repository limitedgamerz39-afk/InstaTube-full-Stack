import React, { useState, useEffect } from 'react';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import AudioLibrary from '../AudioLibrary';
import { FiMusic } from 'react-icons/fi';

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

const EditorStep = ({ onNext, onBack, uploadData, setUploadData }) => {
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState(uploadData.selectedFilter || 'normal');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(uploadData.playbackRate || 1);
  const [showTextOverlay, setShowTextOverlay] = useState(false);
  const [textOverlayContent, setTextOverlayContent] = useState(uploadData.textOverlayContent || '');
  const [showAudioLibrary, setShowAudioLibrary] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState(uploadData.selectedAudio || null);
  const videoRef = React.useRef(null);

  const currentPreview = uploadData.previews[currentFileIndex];

  useEffect(() => {
    if (currentPreview && currentPreview.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = currentPreview.url;
      
      video.onloadedmetadata = () => {
        setVideoDuration(Math.round(video.duration || 0));
      };
    }
  }, [currentPreview]);

  useEffect(() => {
    // Apply selected audio to video if available
    if (selectedAudio && videoRef.current) {
      // In a real implementation, we would apply the audio to the video
      // For now, we'll just log it
      console.log('Selected audio:', selectedAudio);
    }
  }, [selectedAudio]);

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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNext = () => {
    setUploadData(prev => ({
      ...prev,
      selectedFilter: selectedFilter,
      playbackRate: playbackRate,
      textOverlayContent: textOverlayContent,
      selectedAudio: selectedAudio
    }));
    onNext();
  };

  const handleAudioSelect = (audio) => {
    setSelectedAudio(audio);
    setShowAudioLibrary(false);
  };

  const handleRemoveAudio = () => {
    setSelectedAudio(null);
  };

  const getEditorTitle = () => {
    switch (uploadData.contentType) {
      case 'reel': return 'Edit your Reel';
      case 'video': return 'Edit your Video';
      case 'story': return 'Edit your Story';
      case 'post': return 'Edit your Post';
      default: return 'Edit your content';
    }
  };

  const getEditorDescription = () => {
    switch (uploadData.contentType) {
      case 'reel': return 'Add effects and filters to make your Reel stand out';
      case 'video': return 'Enhance your video with filters and adjustments';
      case 'story': return 'Add effects and filters to your story';
      case 'post': return 'Add filters and adjust settings for your media';
      default: return 'Add filters and adjust settings for your media';
    }
  };

  // Determine if advanced editing features should be shown
  const showAdvancedEditing = () => {
    return uploadData.contentType === 'video' || uploadData.contentType === 'reel';
  };

  // Determine if text overlay should be shown
  const showTextOverlayFeature = () => {
    return uploadData.contentType === 'reel' || uploadData.contentType === 'story';
  };

  // Determine if audio selection should be shown
  const showAudioSelection = () => {
    return uploadData.contentType === 'reel' || uploadData.contentType === 'story';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{getEditorTitle()}</h2>
        <p className="text-gray-600 dark:text-gray-400">
          {getEditorDescription()}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preview section */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900 rounded-2xl overflow-hidden aspect-[9/16] w-64 mx-auto flex items-center justify-center relative">
            {currentPreview ? (
              currentPreview.type.startsWith('video/') ? (
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    src={currentPreview.url}
                    className="w-full h-full object-cover"
                    style={{ filter: FILTERS.find(f => f.id === selectedFilter)?.filter || 'none' }}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                    playsInline
                  />
                  {showTextOverlayFeature() && showTextOverlay && textOverlayContent && (
                    <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 text-center px-4">
                      <div className="inline-block bg-black/50 text-white px-4 py-2 rounded-lg text-lg font-bold">
                        {textOverlayContent}
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      onClick={handleVideoPlay}
                      className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    >
                      {isPlaying ? <FaPause size={24} /> : <FaPlay size={24} className="ml-1" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center"
                  style={{ filter: FILTERS.find(f => f.id === selectedFilter)?.filter || 'none' }}
                >
                  <img 
                    src={currentPreview.url} 
                    alt="Preview" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )
            ) : (
              <div className="text-gray-500">No preview available</div>
            )}
          </div>

          {/* Video controls */}
          {currentPreview && currentPreview.type.startsWith('video/') && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleVideoPlay}
                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {isPlaying ? <FaPause /> : <FaPlay className="ml-0.5" />}
                </button>
                <button
                  onClick={handleVideoMute}
                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                </button>
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-12">
                    {formatTime(currentTime)}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={videoDuration ? (currentTime / videoDuration) * 100 : 0}
                    onChange={handleSeek}
                    className="flex-1 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-12">
                    {formatTime(videoDuration)}
                  </span>
                </div>
              </div>
              
              {showAdvancedEditing() && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Speed:</span>
                  <select
                    value={playbackRate}
                    onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                    className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm"
                  >
                    <option value={0.5}>0.5x</option>
                    <option value={0.75}>0.75x</option>
                    <option value={1}>1x</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={2}>2x</option>
                  </select>
                </div>
              )}
              
              {showTextOverlayFeature() && (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400">Add Text Overlay</label>
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
                          showTextOverlay ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
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
                    <input
                      type="text"
                      value={textOverlayContent}
                      onChange={(e) => setTextOverlayContent(e.target.value)}
                      placeholder="Enter text for overlay"
                      className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                    />
                  )}
                </div>
              )}
              
              {showAudioSelection() && (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400">Audio Track</label>
                    {!selectedAudio ? (
                      <button
                        onClick={() => setShowAudioLibrary(true)}
                        className="flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                      >
                        <FiMusic size={14} />
                        <span>Browse Audio</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleRemoveAudio}
                        className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  {selectedAudio && (
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                          <FiMusic className="text-white" size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {selectedAudio.title || 'Untitled Audio'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {selectedAudio.extractedBy?.username || 'Unknown Artist'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* File navigation */}
          {uploadData.previews.length > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => setCurrentFileIndex(prev => Math.max(0, prev - 1))}
                disabled={currentFileIndex === 0}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-gray-600 dark:text-gray-400">
                {currentFileIndex + 1} of {uploadData.previews.length}
              </span>
              <button
                onClick={() => setCurrentFileIndex(prev => Math.min(uploadData.previews.length - 1, prev + 1))}
                disabled={currentFileIndex === uploadData.previews.length - 1}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Filters section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h3>
          <div className="grid grid-cols-3 gap-3">
            {FILTERS.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`relative rounded-lg overflow-hidden aspect-square border-2 transition-all ${
                  selectedFilter === filter.id
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary'
                }`}
              >
                <div 
                  className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700"
                  style={{ filter: filter.filter }}
                >
                  {currentPreview ? (
                    currentPreview.type.startsWith('video/') ? (
                      <div className="bg-gray-300 dark:bg-gray-600 w-8 h-8 rounded flex items-center justify-center">
                        <FaPlay className="text-gray-600 dark:text-gray-400 text-xs ml-0.5" />
                      </div>
                    ) : (
                      <img 
                        src={currentPreview.url} 
                        alt={filter.name}
                        className="w-full h-full object-cover"
                      />
                    )
                  ) : (
                    <div className="bg-gray-300 dark:bg-gray-600 w-8 h-8 rounded"></div>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-1 px-2 text-center">
                  {filter.name}
                </div>
              </button>
            ))}
          </div>
          
          {/* Reel-specific enhancements */}
          {uploadData.contentType === 'reel' && (
            <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Reel Tips</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Keep it under 60 seconds for best engagement</li>
                <li>• Use trending audio for better reach</li>
                <li>• Add captions for better accessibility</li>
                <li>• Use hashtags to increase discoverability</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Audio Library Modal */}
      {showAudioLibrary && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select Audio</h3>
              <button
                onClick={() => setShowAudioLibrary(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
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

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-3 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-900 transition-colors"
        >
          Next: Details
        </button>
      </div>
    </div>
  );
};

export default EditorStep;