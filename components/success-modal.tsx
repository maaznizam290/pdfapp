'use client';

import { useState, useEffect } from 'react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  fileName: string;
  fileSize?: number;
  downloadUrl?: string;
}

export default function SuccessModal({
  isOpen,
  onClose,
  title,
  message,
  fileName,
  fileSize,
  downloadUrl
}: SuccessModalProps) {
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDownloadProgress(0);
      setIsDownloading(false);
    }
  }, [isOpen]);

  const handleDownload = async () => {
    if (!downloadUrl) {
      // If no download URL, the file was already downloaded
      alert('File has already been downloaded successfully!');
      return;
    }
    
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      // Simulate download progress
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Fetch the blob data
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Validate blob type and size
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }
      
      // Create a clean blob with explicit PDF MIME type
      const cleanBlob = new Blob([blob], { 
        type: 'application/pdf'
      });
      
      // Create a secure blob URL
      const secureUrl = URL.createObjectURL(cleanBlob);
      
      // Create download link with security attributes
      const link = document.createElement('a');
      link.href = secureUrl;
      link.download = fileName;
      link.style.display = 'none';
      link.setAttribute('download', fileName);
      link.setAttribute('rel', 'noopener noreferrer');
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(secureUrl);

      // Complete progress
      setTimeout(() => {
        setDownloadProgress(100);
        clearInterval(progressInterval);
        setTimeout(() => {
          setIsDownloading(false);
          onClose();
        }, 500);
      }, 1000);

    } catch (error) {
      console.error('Download failed:', error);
      setIsDownloading(false);
      setDownloadProgress(0);
      alert('Download failed. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Success Icon */}
        <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
          {title}
        </h3>

        {/* Message */}
        <p className="text-gray-600 text-center mb-4">
          {message}
        </p>

        {/* File Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{fileName}</p>
              {fileSize && (
                <p className="text-sm text-gray-500">
                  {(fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>
            <div className="text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Download Progress */}
        {isDownloading && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Downloading...</span>
              <span>{downloadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isDownloading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Downloading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
{downloadUrl ? 'Download File' : 'File Downloaded'}
              </>
            )}
          </button>
          
          <button
            onClick={onClose}
            disabled={isDownloading}
            className="px-4 py-2 border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>

        {/* Additional Actions */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-center gap-4 text-sm">
            <button
              onClick={() => {
                // Reset the form/page
                window.location.reload();
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Process Another File
            </button>
            <button
              onClick={() => {
                // Go back to tools
                window.location.href = '/';
              }}
              className="text-gray-600 hover:text-gray-700 font-medium"
            >
              Back to Tools
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

