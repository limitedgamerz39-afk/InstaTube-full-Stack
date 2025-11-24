import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StepNavigation from '../components/StepNavigation';
import ContentTypeStep from '../components/UploadSteps/ContentTypeStep';
import MediaSelectionStep from '../components/UploadSteps/MediaSelectionStep';
import EditorStep from '../components/UploadSteps/EditorStep';
import DetailsStep from '../components/UploadSteps/DetailsStep';
import ReviewStep from '../components/UploadSteps/ReviewStep';
import YouTubeStyleUpload from '../components/YouTubeStyleUpload';
import { requestCameraAndMicrophonePermissions } from '../utils/permissions';
import toast from 'react-hot-toast';

const Upload = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [permissionsRequested, setPermissionsRequested] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState({ camera: false, microphone: false });
  const [useYouTubeStyle, setUseYouTubeStyle] = useState(false);
  
  // State to hold all upload data across steps
  const [uploadData, setUploadData] = useState({
    contentType: '',
    files: [],
    previews: [],
    title: '',
    description: '',
    visibility: 'public',
    category: '',
    tags: '',
    thumbnailFile: null,
    thumbnailPreview: '',
    selectedFilter: 'normal',
    playbackRate: 1,
    textOverlayContent: '',
    selectedAudio: null
  });

  // Request permissions when component mounts
  useEffect(() => {
    const requestPermissions = async () => {
      if (!permissionsRequested) {
        try {
          const permissions = await requestCameraAndMicrophonePermissions();
          setPermissionsGranted(permissions);
          setPermissionsRequested(true);
          
          // Only show warnings if permissions are denied, don't block the flow
          if (!permissions.camera && !permissions.microphone) {
            console.warn('Camera and microphone permissions denied. Some features may be limited.');
          } else if (!permissions.camera) {
            console.warn('Camera permission denied. Photo/video capture features may be limited.');
          } else if (!permissions.microphone) {
            console.warn('Microphone permission denied. Audio recording features may be limited.');
          }
        } catch (error) {
          console.error('Error requesting permissions:', error);
          // Continue with the flow even if permissions fail
        }
      }
    };
    
    requestPermissions();
  }, [permissionsRequested]);

  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleStepChange = (step) => {
    // Only allow navigation to steps that have been completed or the next step
    if (step <= currentStep + 1) {
      setCurrentStep(step);
    }
  };

  const resetUpload = () => {
    setCurrentStep(1);
    setUploadData({
      contentType: '',
      files: [],
      previews: [],
      title: '',
      description: '',
      visibility: 'public',
      category: '',
      tags: '',
      thumbnailFile: null,
      thumbnailPreview: '',
      selectedFilter: 'normal',
      playbackRate: 1,
      textOverlayContent: '',
      selectedAudio: null
    });
    navigate('/');
  };

  const handleYouTubeStyleCapture = (file) => {
    // Create preview for the captured file
    const preview = {
      url: URL.createObjectURL(file),
      type: file.type,
      name: file.name
    };
    
    setUploadData(prev => ({
      ...prev,
      files: [file],
      previews: [preview]
    }));
    
    // Move to the next step (details)
    setCurrentStep(4);
  };

  const renderStep = () => {
    // If we're on step 2 (MediaSelection) and user has selected friendflix style
    if (currentStep === 2 && useYouTubeStyle) {
      return (
        <YouTubeStyleUpload
          onCapture={handleYouTubeStyleCapture}
          onClose={() => setUseYouTubeStyle(false)}
          captureType={uploadData.contentType === 'photo' ? 'photo' : 'video'}
          uploadData={uploadData}
          setUploadData={setUploadData}
        />
      );
    }
    
    switch (currentStep) {
      case 1:
        return (
          <ContentTypeStep 
            onNext={handleNext}
            setUploadData={setUploadData}
          />
        );
      case 2:
        return (
          <MediaSelectionStep 
            onNext={handleNext}
            onBack={handleBack}
            setUploadData={setUploadData}
            uploadData={uploadData}
            setUseYouTubeStyle={setUseYouTubeStyle}
          />
        );
      case 3:
        return (
          <EditorStep 
            onNext={handleNext}
            onBack={handleBack}
            uploadData={uploadData}
            setUploadData={setUploadData}
          />
        );
      case 4:
        return (
          <DetailsStep 
            onNext={handleNext}
            onBack={handleBack}
            uploadData={uploadData}
            setUploadData={setUploadData}
          />
        );
      case 5:
        return (
          <ReviewStep 
            onBack={handleBack}
            uploadData={uploadData}
            resetUpload={resetUpload}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Upload Content</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Share your content with your audience
          </p>
        </div>

        {/* Only show step navigation for non-friendflix style uploads */}
        {!useYouTubeStyle && (
          <StepNavigation 
            currentStep={currentStep}
            totalSteps={5}
            onStepChange={handleStepChange}
          />
        )}

        <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm ${useYouTubeStyle ? 'p-0' : 'p-6'}`}>
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default Upload;