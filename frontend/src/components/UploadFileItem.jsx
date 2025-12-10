import React from 'react';
import { FiFile, FiImage, FiVideo, FiLoader, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

const FileIcon = ({ type }) => {
  if (type.startsWith('image/')) return <FiImage className="text-purple-500" size={24} />;
  if (type.startsWith('video/')) return <FiVideo className="text-green-500" size={24} />;
  return <FiFile className="text-gray-500" size={24} />;
};

const UploadFileItem = ({ file, progress, status, error }) => {
  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-3">
      {file.type.startsWith('image/') ? (
        <img src={URL.createObjectURL(file)} alt="preview" className="w-14 h-14 rounded-md object-cover mr-4" />
      ) : (
        <div className="w-14 h-14 rounded-md bg-gray-200 dark:bg-gray-600 flex items-center justify-center mr-4">
          <FileIcon type={file.type} />
        </div>
      )}
      <div className="flex-1">
        <div className="flex justify-between items-start">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 break-all">{file.name}</p>
            <div className="ml-2">
                {status === 'uploading' && <FiLoader className="animate-spin text-purple-500" size={20} />}
                {status === 'completed' && <FiCheckCircle className="text-green-500" size={20} />}
                {status === 'error' && <FiAlertCircle className="text-red-500" size={20} />}
            </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{formatSize(file.size)}</p>
        
        {status === 'uploading' && (
            <div className="relative w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                <div 
                    className="absolute top-0 left-0 h-full bg-purple-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        )}

        {status === 'error' && (
            <p className="text-xs text-red-500 mt-1">{error || 'An unknown error occurred.'}</p>
        )}
      </div>
    </div>
  );
};

export default UploadFileItem;
