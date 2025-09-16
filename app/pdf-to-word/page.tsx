'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { convertFile } from '@/utils/pdfApi';
import SuccessModal from '@/components/success-modal';
import { useSuccessModal } from '@/utils/useSuccessModal';
import PdfConverter from '@/components/Pdfconverter';

export default function PDFToWordPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccessModal, processedFileInfo, showSuccess, hideSuccess } = useSuccessModal();

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
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const handleConvert = async () => {
    if (!file) {
      alert('Please select a PDF file to convert.');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const blob = await convertFile(file, 'pdf-to-word');
      
      if (blob.size === 0) {
        throw new Error('Generated document is empty');
      }
      
      const baseName = file.name.replace(/\.pdf$/i, '');
      const fileName = `${baseName}-converted-${new Date().toISOString().slice(0, 10)}.docx`;
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showSuccess({
        fileName,
        fileSize: blob.size,
        downloadUrl: '',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to convert PDF to Word: ${errorMessage}. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to tools
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">PDF to Word</h1>
          <p className="text-lg text-gray-600">
            Easily convert your PDF files into easy to edit DOC and DOCX documents. The converted WORD document is almost 100% accurate.
          </p>
        </div>

        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📄</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isDragOver ? 'Drop your PDF file here' : 'Choose PDF file or drag it here'}
          </h3>
          <p className="text-gray-600 mb-4">
            Select a PDF file to convert it to Word document
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

        {file && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                File to convert
              </h3>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-lg">📄</span>
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
                  Converting to Word...
                </div>
              ) : (
                'Convert to Word'
              )}
            </button>
          </div>
        )}

        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How to convert PDF to Word</h3>
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
              <h4 className="font-medium text-gray-900 mb-2">Convert to Word</h4>
              <p className="text-sm text-gray-600">Click convert and wait for processing</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">3</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Download result</h4>
              <p className="text-sm text-gray-600">Download your converted Word document</p>
            </div>
          </div>
        </div>

        <SuccessModal
          isOpen={showSuccessModal}
          onClose={hideSuccess}
          fileInfo={processedFileInfo}
        />
      </div>
    </div>
  );
}