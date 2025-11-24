import { createContext, useContext, useState } from 'react';

const VideoContext = createContext();

export const useVideo = () => {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error('useVideo must be used within a VideoProvider');
  }
  return context;
};

export const VideoProvider = ({ children }) => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  return (
    <VideoContext.Provider value={{ isVideoPlaying, setIsVideoPlaying }}>
      {children}
    </VideoContext.Provider>
  );
};