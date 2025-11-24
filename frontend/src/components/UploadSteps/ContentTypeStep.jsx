import React, { useState } from 'react';
import { 
  FaPhotoVideo, 
  FaVideo, 
  FaHistory, 
  FaImages,
  FaPlayCircle,
  FaBookOpen,
  FaUserFriends
} from 'react-icons/fa';

const ContentTypeStep = ({ onNext, setUploadData }) => {
  const [selectedType, setSelectedType] = useState('');
  const [error, setError] = useState('');

  const contentTypes = [
    {
      id: 'post',
      name: 'Post',
      description: 'Share photos and videos with your followers',
      icon: <FaImages className="text-blue-500" />,
      color: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-500'
    },
    {
      id: 'reel',
      name: 'Reel',
      description: 'Create short, engaging videos',
      icon: <FaPlayCircle className="text-purple-500" />,
      color: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-500'
    },
    {
      id: 'video',
      name: 'Video',
      description: 'Upload longer videos',
      icon: <FaVideo className="text-red-500" />,
      color: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-500'
    },
    {
      id: 'story',
      name: 'Story',
      description: 'Share 24-hour disappearing content',
      icon: <FaHistory className="text-yellow-500" />,
      color: 'bg-yellow-100 dark:bg-yellow-900/30',
      iconColor: 'text-yellow-500'
    }
  ];

  const handleNext = () => {
    if (!selectedType) {
      setError('Please select a content type');
      return;
    }
    
    setUploadData(prev => ({
      ...prev,
      contentType: selectedType
    }));
    
    onNext();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create new content</h2>
        <p className="text-gray-600 dark:text-gray-400">
          What type of content would you like to share?
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-300 text-center">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {contentTypes.map((type) => (
          <div
            key={type.id}
            onClick={() => setSelectedType(type.id)}
            className={`border-2 rounded-2xl p-6 cursor-pointer transition-all duration-200 ${
              selectedType === type.id
                ? 'border-primary ring-2 ring-primary/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-primary'
            }`}
          >
            <div className={`w-12 h-12 rounded-lg ${type.color} flex items-center justify-center mb-4`}>
              {type.icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {type.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {type.description}
            </p>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleNext}
          disabled={!selectedType}
          className="px-8 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ContentTypeStep;