'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { downloadFile } from '@/utils/pdfApi';
import SuccessModal from '@/components/success-modal';

export default function MergePDFPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [processedFileInfo, setProcessedFileInfo] = useState<{
    fileName: string;
    fileSize: number;
    downloadUrl: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (selectedFiles) {
      const pdfFiles = Array.from(selectedFiles).filter(file => 
        file.type === 'application/pdf'
      );
      setFiles(prev => [...prev, ...pdfFiles]);
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
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const moveFile = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= files.length) return;
    
    const newFiles = [...files];
    const [movedFile] = newFiles.splice(fromIndex, 1);
    newFiles.splice(toIndex, 0, movedFile);
    setFiles(newFiles);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      alert('Please select at least 2 PDF files to merge.');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('Starting merge process with files:', files.map(f => ({ name: f.name, size: f.size })));

      const formData = new FormData();
      formData.append('operation', 'merge');
      files.forEach(file => formData.append('files', file));

      const response = await fetch('/api/pdf/secure-download', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to merge PDFs');
      }

      const blob = await response.blob();
      console.log('Merge successful, blob size:', blob.size);

      if (blob.size === 0) {
        throw new Error('Generated PDF is empty');
      }

      // Use Blob URL for binary download
      const fileName = `merged-document-${new Date().toISOString().slice(0, 10)}.pdf`;
      downloadFile(blob, fileName, 'application/pdf');

      setProcessedFileInfo({
        fileName,
        fileSize: blob.size,
        downloadUrl: '' // Not needed, download handled directly
      });

      setShowSuccessModal(true);

    } catch (error) {
      console.error('Error merging PDFs:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to merge PDFs: ${errorMessage}. Please try again.`);
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Merge PDF</h1>
          <p className="text-lg text-gray-600">
            Combine PDFs in the order you want with the easiest PDF merger available.
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
            <span className="text-2xl">📄</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isDragOver ? 'Drop your PDF files here' : 'Choose PDF files or drag them here'}
          </h3>
          <p className="text-gray-600 mb-4">
            Select multiple PDF files to merge them into one document
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Choose Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Files to merge ({files.length})
              </h3>
              <div className="space-y-3">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📄</span>
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {index > 0 && (
                        <button
                          onClick={() => moveFile(index, index - 1)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Move up"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                      )}
                      {index < files.length - 1 && (
                        <button
                          onClick={() => moveFile(index, index + 1)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Move down"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1 text-red-400 hover:text-red-600"
                        title="Remove file"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Merge Button */}
        {files.length >= 2 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleMerge}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Merging PDFs...
                </div>
              ) : (
                'Merge PDFs'
              )}
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How to merge PDFs</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">1</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Upload PDF files</h4>
              <p className="text-sm text-gray-600">Select multiple PDF files from your device</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">2</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Arrange order</h4>
              <p className="text-sm text-gray-600">Drag and drop to reorder your PDF files</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">3</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Download result</h4>
              <p className="text-sm text-gray-600">Click merge and download your combined PDF</p>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-yellow-800">Security Notice</h4>
              <p className="mt-1 text-sm text-yellow-700">
                If you see a security warning when downloading, click "Keep" to proceed. 
                This happens because browsers are cautious about downloads from local development servers.
                In production (HTTPS), downloads will be automatically trusted.
              </p>
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
            if (processedFileInfo.downloadUrl) {
              URL.revokeObjectURL(processedFileInfo.downloadUrl);
            }
            setProcessedFileInfo(null);
          }}
          fileInfo={processedFileInfo}
        />
      )}
    </div>
  );
}

// Example usage after conversion
// import { downloadFile } from '@/utils/pdfApi';

// After receiving the blob from the API:
// const pptxFileName = `converted-${Date.now()}.pptx`;
// downloadFile(
//   blob,
//   pptxFileName,
//   'application/vnd.openxmlformats-officedocument.presentationml.presentation'
// );

// Example for sending a pptx file
// res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
// res.setHeader('Content-Disposition', 'attachment; filename="converted.pptx"');
// res.send(pptxBuffer); // pptxBuffer must be a Buffer, not a string!

// Node.js/Express example for sending a PDF or PPTX
// app.post('/api/pdf/secure-download', async (req, res) => {
//   // ...merge or convert logic...
//   // Assume resultBuffer is a Buffer containing the binary file

//   res.setHeader('Content-Type', 'application/pdf'); // or pptx MIME type
//   res.setHeader('Content-Disposition', 'attachment; filename="merged.pdf"'); // or "converted.pptx"
//   res.send(resultBuffer); // resultBuffer must be a Buffer!
// });


// merge-pdf/page.tsx hai ye file