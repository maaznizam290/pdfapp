'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import SuccessModal from '@/components/success-modal';

export default function WordToPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [processedFileInfo, setProcessedFileInfo] = useState<{
    fileName: string;
    fileSize: number;
    downloadUrl: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File | null) => {
    if (selectedFile && (selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                        selectedFile.type === 'application/msword' ||
                        selectedFile.name.endsWith('.doc') ||
                        selectedFile.name.endsWith('.docx'))) {
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
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const handleConvert = async () => {
    if (!file) {
      alert('Please select a Word document to convert.');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      console.log('Starting Word to PDF conversion with file:', { name: file.name, size: file.size });
      
      // Use the convert API endpoint
      const formData = new FormData();
      formData.append('file', file);
      formData.append('operation', 'word-to-pdf');

      const response = await fetch('/api/pdf/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to convert Word to PDF');
      }

      const blob = await response.blob();
      console.log('Conversion successful, blob size:', blob.size);
      
      if (blob.size === 0) {
        throw new Error('Generated PDF is empty');
      }
      
      // Create a clean blob with proper MIME type
      const cleanBlob = new Blob([blob], { 
        type: 'application/pdf'
      });
      
      // Create download URL
      const downloadUrl = URL.createObjectURL(cleanBlob);
      const fileName = file.name.replace(/\.(doc|docx)$/i, '.pdf');
      
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
      console.error('Error converting Word to PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to convert Word to PDF: ${errorMessage}. Please try again.`);
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Word to PDF</h1>
          <p className="text-lg text-gray-600">
            Convert your Word documents to PDF format. Maintain formatting and layout perfectly.
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
            <span className="text-2xl">📝</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isDragOver ? 'Drop your Word file here' : 'Choose Word file or drag it here'}
          </h3>
          <p className="text-gray-600 mb-4">
            Select a Word document (.doc or .docx) to convert to PDF
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
            accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
            className="hidden"
          />
        </div>

        {/* File Info */}
        {file && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                File to convert
              </h3>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-lg">📝</span>
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Convert Button */}
        {file && (
          <div className="mt-8 text-center">
            <button
              onClick={handleConvert}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Converting to PDF...
                </div>
              ) : (
                'Convert to PDF'
              )}
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How to convert Word to PDF</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">1</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Upload Word file</h4>
              <p className="text-sm text-gray-600">Select a Word document from your device</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">2</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Convert to PDF</h4>
              <p className="text-sm text-gray-600">Click convert and wait for processing</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">3</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Download result</h4>
              <p className="text-sm text-gray-600">Download your converted PDF document</p>
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
          title="Word to PDF Conversion Complete!"
          message="Your Word document has been successfully converted to PDF format."
          fileName={processedFileInfo.fileName}
          fileSize={processedFileInfo.fileSize}
          downloadUrl={processedFileInfo.downloadUrl}
        />
      )}
    </div>
  );
}
