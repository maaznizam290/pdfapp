'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { processMultipleFiles } from '@/utils/pdfApi';
import SuccessModal from '@/components/success-modal';

export default function CropPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [processedFileInfo, setProcessedFileInfo] = useState<{
    fileName: string;
    fileSize: number;
    downloadUrl: string;
  } | null>(null);
  const [cropSettings, setCropSettings] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    unit: 'mm'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File | null) => {
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    }
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
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const handleCrop = async () => {
    if (!file) {
      alert('Please select a PDF file to crop.');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      console.log('Starting crop process with file:', { name: file.name, size: file.size });
      
      const options = {
        crop: cropSettings
      };
      
      // Use the correct API endpoint for single file operations
      const formData = new FormData();
      formData.append('file', file);
      formData.append('operation', 'crop');
      formData.append('options', JSON.stringify(options));

      const response = await fetch('/api/pdf/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to crop PDF');
      }

      const blob = await response.blob();
      
      console.log('Crop successful, blob size:', blob.size);
      
      if (blob.size === 0) {
        throw new Error('Generated PDF is empty');
      }
      
      // Create a clean blob with proper MIME type
      const cleanBlob = new Blob([blob], { 
        type: 'application/pdf'
      });
      
      // Create download URL
      const downloadUrl = URL.createObjectURL(cleanBlob);
      const fileName = `cropped-${file.name}`;
      
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
      
      // Set success modal data for confirmation
      setProcessedFileInfo({
        fileName,
        fileSize: cleanBlob.size,
        downloadUrl: ''
      });
      
      // Show success modal
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('Error cropping PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to crop PDF: ${errorMessage}. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePresetCrop = (preset: string) => {
    switch (preset) {
      case 'remove-margins':
        setCropSettings({ top: 10, right: 10, bottom: 10, left: 10, unit: 'mm' });
        break;
      case 'tight-crop':
        setCropSettings({ top: 5, right: 5, bottom: 5, left: 5, unit: 'mm' });
        break;
      case 'wide-margins':
        setCropSettings({ top: 20, right: 20, bottom: 20, left: 20, unit: 'mm' });
        break;
      case 'custom':
        setCropSettings({ top: 0, right: 0, bottom: 0, left: 0, unit: 'mm' });
        break;
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Crop PDF</h1>
          <p className="text-lg text-gray-600">
            Crop PDF pages to remove unwanted margins or focus on specific content areas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* File Upload Section */}
          <div>
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
                <span className="text-2xl">✂️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {isDragOver ? 'Drop your PDF file here' : 'Choose PDF file to crop'}
              </h3>
              <p className="text-gray-600 mb-4">
                Select a PDF file to crop
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

            {/* Selected File */}
            {file && (
              <div className="mt-6 bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">📄</span>
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={removeFile}
                    className="p-1 text-red-400 hover:text-red-600"
                    title="Remove file"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Crop Settings */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Crop Settings</h3>
            
            {/* Preset Options */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Quick Presets
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handlePresetCrop('remove-margins')}
                  className="px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Remove Margins
                </button>
                <button
                  onClick={() => handlePresetCrop('tight-crop')}
                  className="px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Tight Crop
                </button>
                <button
                  onClick={() => handlePresetCrop('wide-margins')}
                  className="px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Wide Margins
                </button>
                <button
                  onClick={() => handlePresetCrop('custom')}
                  className="px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Custom
                </button>
              </div>
            </div>

            {/* Custom Settings */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit
                </label>
                <select
                  value={cropSettings.unit}
                  onChange={(e) => setCropSettings(prev => ({ ...prev, unit: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="mm">Millimeters (mm)</option>
                  <option value="pt">Points (pt)</option>
                  <option value="in">Inches (in)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Top: {cropSettings.top} {cropSettings.unit}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={cropSettings.top}
                    onChange={(e) => setCropSettings(prev => ({ ...prev, top: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Right: {cropSettings.right} {cropSettings.unit}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={cropSettings.right}
                    onChange={(e) => setCropSettings(prev => ({ ...prev, right: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bottom: {cropSettings.bottom} {cropSettings.unit}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={cropSettings.bottom}
                    onChange={(e) => setCropSettings(prev => ({ ...prev, bottom: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Left: {cropSettings.left} {cropSettings.unit}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={cropSettings.left}
                    onChange={(e) => setCropSettings(prev => ({ ...prev, left: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
              <div className="relative h-32 bg-white border border-gray-200 rounded">
                <div 
                  className="absolute border-2 border-blue-500 border-dashed"
                  style={{
                    top: `${cropSettings.top}px`,
                    right: `${cropSettings.right}px`,
                    bottom: `${cropSettings.bottom}px`,
                    left: `${cropSettings.left}px`,
                  }}
                >
                  <div className="w-full h-full bg-blue-50 opacity-50 flex items-center justify-center text-xs text-blue-600">
                    Content Area
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Blue area shows what will be cropped out
              </p>
            </div>
          </div>
        </div>

        {/* Crop Button */}
        {file && (
          <div className="mt-8 text-center">
            <button
              onClick={handleCrop}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Cropping PDF...
                </div>
              ) : (
                'Crop PDF'
              )}
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How to crop PDFs</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">1</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Upload PDF file</h4>
              <p className="text-sm text-gray-600">Select a PDF file from your device</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">2</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Set crop margins</h4>
              <p className="text-sm text-gray-600">Choose preset or set custom margins</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">3</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Download result</h4>
              <p className="text-sm text-gray-600">Get your cropped PDF file</p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {processedFileInfo && (
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            setProcessedFileInfo(null);
          }}
          title="PDF Cropped Successfully!"
          message="Your PDF file has been cropped and is ready for download."
          fileName={processedFileInfo.fileName}
          fileSize={processedFileInfo.fileSize}
          downloadUrl={processedFileInfo.downloadUrl}
        />
      )}
    </div>
  );
}
