'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { processPDF, downloadFile } from '@/utils/pdfApi';
import SuccessModal from '@/components/success-modal';

export default function SplitPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [splitMethod, setSplitMethod] = useState<'range' | 'every' | 'extract'>('range');
  const [pageRange, setPageRange] = useState('');
  const [everyPages, setEveryPages] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [processedFileInfo, setProcessedFileInfo] = useState<{
    fileName: string;
    fileSize: number;
    downloadUrl: string;
  } | null>(null);
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
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const parsePageRange = (rangeStr: string): number[] => {
    const pages: number[] = [];
    const parts = rangeStr.split(',').map(part => part.trim());
    
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        if (start && end && start <= end) {
          for (let i = start; i <= end; i++) {
            pages.push(i);
          }
        } else {
          throw new Error(`Invalid range format: ${part}. Use format like "1-5"`);
        }
      } else {
        const pageNum = Number(part);
        if (pageNum && pageNum > 0) {
          pages.push(pageNum);
        } else {
          throw new Error(`Invalid page number: ${part}`);
        }
      }
    }
    
    return pages.sort((a, b) => a - b);
  };

  const handleSplit = async () => {
    if (!file) {
      alert('Please select a PDF file to split.');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      console.log('Starting PDF split with file:', { name: file.name, size: file.size });
      console.log('Split method:', splitMethod);
      
      let options = {};
      let operation = 'split';
      
      if (splitMethod === 'range' && pageRange) {
        const pages = parsePageRange(pageRange);
        if (pages.length === 0) {
          throw new Error('Please specify valid page numbers');
        }
        options = { pages };
        operation = 'extract-pages';
        console.log('Page range options:', options);
      } else if (splitMethod === 'every' && everyPages) {
        if (everyPages < 1) {
          throw new Error('Please specify a valid number of pages (minimum 1)');
        }
        options = { everyPages };
        operation = 'split';
        console.log('Every pages options:', options);
      } else if (splitMethod === 'extract' && pageRange) {
        const pages = parsePageRange(pageRange);
        if (pages.length === 0) {
          throw new Error('Please specify valid page numbers to extract');
        }
        options = { pages };
        operation = 'extract-pages';
        console.log('Extract pages options:', options);
      } else {
        throw new Error('Please specify the split parameters');
      }
      
      const blob = await processPDF(file, operation, options);
      console.log('Split successful, blob size:', blob.size);
      
      if (blob.size === 0) {
        throw new Error('Generated PDF is empty');
      }
      
      // Create download URL
      const downloadUrl = URL.createObjectURL(blob);
      const fileName = `split-document-${new Date().toISOString().slice(0, 10)}.pdf`;
      
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
      
      // Set success modal data
      setProcessedFileInfo({
        fileName,
        fileSize: blob.size,
        downloadUrl: ''
      });
      
      // Show success modal
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('Error splitting PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to split PDF: ${errorMessage}. Please try again.`);
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Split PDF</h1>
          <p className="text-lg text-gray-600">
            Separate one page or a whole set for easy conversion into independent PDF files.
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
            <span className="text-2xl">✂️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isDragOver ? 'Drop your PDF file here' : 'Choose PDF file or drag it here'}
          </h3>
          <p className="text-gray-600 mb-4">
            Select a PDF file to split into multiple documents
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

        {/* Split Options */}
        {file && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Split Options
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <button
                  onClick={() => setSplitMethod('range')}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    splitMethod === 'range' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">📄</span>
                    <h4 className="font-medium text-gray-900">Page Range</h4>
                    <p className="text-sm text-gray-600">Split specific page ranges</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setSplitMethod('every')}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    splitMethod === 'every' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">📚</span>
                    <h4 className="font-medium text-gray-900">Every N Pages</h4>
                    <p className="text-sm text-gray-600">Split every N pages</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setSplitMethod('extract')}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    splitMethod === 'extract' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">🔍</span>
                    <h4 className="font-medium text-gray-900">Extract Pages</h4>
                    <p className="text-sm text-gray-600">Extract specific pages</p>
                  </div>
                </button>
              </div>

              {/* Split Settings */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Split Settings</h4>
                
                {splitMethod === 'range' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Page Range (e.g., 1-3, 5, 7-9)
                    </label>
                    <input
                      type="text"
                      value={pageRange}
                      onChange={(e) => setPageRange(e.target.value)}
                      placeholder="1-3, 5, 7-9"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
                
                {splitMethod === 'every' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Split every N pages
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={everyPages}
                      onChange={(e) => setEveryPages(parseInt(e.target.value) || 1)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
                
                {splitMethod === 'extract' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pages to extract (e.g., 1,3,5-7)
                    </label>
                    <input
                      type="text"
                      value={pageRange}
                      onChange={(e) => setPageRange(e.target.value)}
                      placeholder="1,3,5-7"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Split Button */}
        {file && (
          <div className="mt-8 text-center">
            <button
              onClick={handleSplit}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Splitting PDF...
                </div>
              ) : (
                'Split PDF'
              )}
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How to split a PDF</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">1</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Upload PDF file</h4>
              <p className="text-sm text-gray-600">Select the PDF you want to split</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">2</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Choose split method</h4>
              <p className="text-sm text-gray-600">Select how you want to split the PDF</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">3</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Download results</h4>
              <p className="text-sm text-gray-600">Get your split PDF files</p>
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
          title="PDF Split Successfully!"
          message="Your PDF has been split according to your specifications."
          fileName={processedFileInfo.fileName}
          fileSize={processedFileInfo.fileSize}
          downloadUrl={processedFileInfo.downloadUrl}
        />
      )}
    </div>
  );
}
