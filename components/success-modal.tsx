import React from 'react';

// Define the props for the SuccessModal component
interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileInfo: {
    fileName: string;
    fileSize: number;
  } | null;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, fileInfo }) => {
  if (!isOpen || !fileInfo) {
    return null;
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 m-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Conversion Successful!</h2>
          <p className="text-gray-600 mb-6">Your file has been converted and the download has started.</p>
          
          <div className="bg-gray-50 border rounded-lg p-4 text-left mb-6">
            <p className="font-semibold text-gray-800 break-all">{fileInfo.fileName}</p>
            <p className="text-sm text-gray-500">{formatFileSize(fileInfo.fileSize)}</p>
          </div>
          
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Convert Another File
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;