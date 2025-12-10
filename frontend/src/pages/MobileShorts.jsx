import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileShortsRecorder from '../components/MobileShortsRecorder';
import MobileShortsPreview from '../components/MobileShortsPreview';
import MobileShortsDetails from '../components/MobileShortsDetails';

const MobileShorts = () => {
  const navigate = useNavigate();
  
  // State machine for the upload flow
  const [stage, setStage] = useState('capture'); // 'capture', 'preview', 'details'
  
  // Data passed between stages
  const [videoFile, setVideoFile] = useState(null);
  const [initialSettings, setInitialSettings] = useState({});
  const [editedData, setEditedData] = useState({});

  const handleCaptureComplete = (file, settings) => {
    setVideoFile(file);
    setInitialSettings(settings);
    setStage('preview');
  };

  const handlePreviewComplete = (finalEditedData) => {
    setEditedData(finalEditedData);
    setStage('details');
  };

  const handleRetake = () => {
    setVideoFile(null);
    setInitialSettings({});
    setEditedData({});
    setStage('capture');
  };

  const handleClose = () => {
    navigate('/');
  };

  const renderStage = () => {
    switch (stage) {
      case 'capture':
        return (
          <MobileShortsRecorder
            onClose={handleClose}
            onVideoCaptured={handleCaptureComplete}
          />
        );
      case 'preview':
        return (
          <MobileShortsPreview
            videoFile={videoFile}
            initialSettings={initialSettings}
            onComplete={handlePreviewComplete}
            onRetake={handleRetake}
          />
        );

      case 'details':
        return (
          <MobileShortsDetails
            videoFile={videoFile}
            editedData={editedData}
          />
        );
      default:
        return (
          <MobileShortsRecorder
            onClose={handleClose}
            onVideoCaptured={handleCaptureComplete}
          />
        );
    }
  };

  return (
    <div className="h-screen bg-black overflow-hidden">
      {renderStage()}
    </div>
  );
};

export default MobileShorts;
