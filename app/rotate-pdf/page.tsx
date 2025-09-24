'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

export default function RotatePDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [rotationAngle, setRotationAngle] = useState<90 | 180 | 270>(90);
  const [pageRange, setPageRange] = useState('');
  const [pageRangeError, setPageRangeError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File | null) => {
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setPageRangeError(''); // Clear any previous errors
    }
  };

  const validatePageRange = (range: string): boolean => {
    if (!range.trim()) return true; // Empty range is valid (all pages)
    
    const pageNumbers = range.split(',').map(p => p.trim());
    
    for (const pageStr of pageNumbers) {
      if (pageStr.includes('-')) {
        // Handle ranges like "1-3"
        const [start, end] = pageStr.split('-').map(n => n.trim());
        const startNum = parseInt(start);
        const endNum = parseInt(end);
        
        if (isNaN(startNum) || isNaN(endNum) || startNum < 1 || endNum < 1) {
          setPageRangeError('Invalid page range format. Use numbers like "1-3"');
          return false;
        }
        
        if (startNum > endNum) {
          setPageRangeError('Start page must be less than or equal to end page');
          return false;
        }
      } else {
        // Handle individual pages
        const pageNum = parseInt(pageStr);
        if (isNaN(pageNum) || pageNum < 1) {
          setPageRangeError('Invalid page number. Use positive numbers like "1,3,5"');
          return false;
        }
      }
    }
    
    setPageRangeError('');
    return true;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const handleRotate = async () => {
    if (!file) {
      alert('Please select a PDF file to rotate.');
      return;
    }
    
    // Validate page range
    if (!validatePageRange(pageRange)) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      console.log('Starting rotate process with file:', { name: file.name, size: file.size });
      
      const options = {
        angle: rotationAngle,
        pageRange: pageRange.trim()
      };
      
      // Use the correct API endpoint for single file operations
      const formData = new FormData();
      formData.append('file', file);
      formData.append('operation', 'rotate');
      formData.append('options', JSON.stringify(options));

      const response = await fetch('/api/pdf/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to rotate PDF');
      }

      const blob = await response.blob();
      
      console.log('Rotate successful, blob size:', blob.size);
      
      if (blob.size === 0) {
        throw new Error('Generated PDF is empty');
      }
      
      // Create a clean blob with proper MIME type
      const cleanBlob = new Blob([blob], { 
        type: 'application/pdf'
      });
      
      // Create download URL
      const downloadUrl = URL.createObjectURL(cleanBlob);
      const fileName = `rotated-${rotationAngle}deg-${file.name}`;
      
      // Trigger immediate download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.style.display = 'none';
      link.setAttribute('download', fileName);
      link.setAttribute('rel', 'noopener noreferrer');
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up URL
      URL.revokeObjectURL(downloadUrl);
      
      alert(`PDF rotated successfully! Downloaded ${fileName}`);
      
    } catch (error) {
      console.error('Error rotating PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to rotate PDF: ${errorMessage}. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to tools
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Rotate PDF</h1>
          <p className="text-lg text-gray-600">
            Rotate PDF pages to the correct orientation. Fix sideways or upside-down pages.
          </p>
        </div>

        {/* File Upload Area */}
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 bg-white'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔄</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isDragOver ? 'Drop your PDF file here' : 'Choose PDF file or drag it here'}
          </h3>
          <p className="text-gray-600 mb-4">
            Select a PDF file to rotate its pages
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Choose File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
            className="hidden"
          />
        </div>

        {/* Rotation Settings */}
        {file && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Rotation Settings
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <button
                  onClick={() => setRotationAngle(90)}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    rotationAngle === 90 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">↻</span>
                    <h4 className="font-medium text-gray-900">90° Clockwise</h4>
                    <p className="text-sm text-gray-600">Rotate right</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setRotationAngle(180)}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    rotationAngle === 180 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">↔</span>
                    <h4 className="font-medium text-gray-900">180°</h4>
                    <p className="text-sm text-gray-600">Upside down</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setRotationAngle(270)}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    rotationAngle === 270 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">↺</span>
                    <h4 className="font-medium text-gray-900">90° Counter-clockwise</h4>
                    <p className="text-sm text-gray-600">Rotate left</p>
                  </div>
                </button>
              </div>

              {/* Page Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Page Range (optional)
                </label>
                <input
                  type="text"
                  value={pageRange}
                  onChange={(e) => {
                    setPageRange(e.target.value);
                    validatePageRange(e.target.value);
                  }}
                  placeholder="e.g., 1-3, 5, 7-9 (leave empty for all pages)"
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    pageRangeError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {pageRangeError ? (
                  <p className="text-sm text-red-600 mt-2">{pageRangeError}</p>
                ) : (
                  <p className="text-sm text-gray-500 mt-2">
                    Specify which pages to rotate. Leave empty to rotate all pages.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Rotate Button */}
        {file && (
          <div className="mt-8 text-center">
            <button
              onClick={handleRotate}
              disabled={isProcessing || !!pageRangeError}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Rotating PDF...
                </div>
              ) : (
                'Rotate PDF'
              )}
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How to rotate a PDF</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">1</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Upload PDF file</h4>
              <p className="text-sm text-gray-600">Select the PDF you want to rotate</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">2</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Choose rotation</h4>
              <p className="text-sm text-gray-600">Select angle and page range</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">3</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Download result</h4>
              <p className="text-sm text-gray-600">Get your rotated PDF file</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
