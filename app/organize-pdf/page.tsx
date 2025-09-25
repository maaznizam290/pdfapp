'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import SuccessModal from '@/components/success-modal';

interface PageInfo {
  id: number;
  number: number;
  thumbnail?: string;
}

export default function OrganizePDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [processedFileInfo, setProcessedFileInfo] = useState<{
    fileName: string;
    fileSize: number;
    downloadUrl: string;
  } | null>(null);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [draggedPage, setDraggedPage] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File | null) => {
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      // Simulate getting page count - in real app, you'd parse the PDF
      const pageCount = Math.floor(Math.random() * 20) + 5;
      const newPages = Array.from({ length: pageCount }, (_, i) => ({
        id: i + 1,
        number: i + 1
      }));
      setPages(newPages);
      setSelectedPages([]);
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
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Page management functions
  const togglePageSelection = (pageNumber: number) => {
    setSelectedPages(prev => 
      prev.includes(pageNumber)
        ? prev.filter(p => p !== pageNumber)
        : [...prev, pageNumber]
    );
  };

  const selectAllPages = () => {
    setSelectedPages(pages.map(p => p.number));
  };

  const deselectAllPages = () => {
    setSelectedPages([]);
  };

  const deleteSelectedPages = () => {
    setPages(prev => prev.filter(page => !selectedPages.includes(page.number)));
    setSelectedPages([]);
  };

  const movePage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= pages.length) return;
    
    const newPages = [...pages];
    const [movedPage] = newPages.splice(fromIndex, 1);
    newPages.splice(toIndex, 0, movedPage);
    
    // Update page numbers
    const updatedPages = newPages.map((page, index) => ({
      ...page,
      number: index + 1
    }));
    
    setPages(updatedPages);
  };

  const handleDragStart = (e: React.DragEvent, pageNumber: number) => {
    setDraggedPage(pageNumber);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverPage = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropPage = (e: React.DragEvent, targetPageNumber: number) => {
    e.preventDefault();
    
    if (draggedPage && draggedPage !== targetPageNumber) {
      const fromIndex = pages.findIndex(p => p.number === draggedPage);
      const toIndex = pages.findIndex(p => p.number === targetPageNumber);
      movePage(fromIndex, toIndex);
    }
    
    setDraggedPage(null);
  };

  const handleOrganize = async () => {
    if (!file) {
      alert('Please select a PDF file to organize.');
      return;
    }
    
    if (pages.length === 0) {
      alert('No pages to organize.');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      console.log('Starting PDF organization with file:', { name: file.name, size: file.size });
      console.log('Pages to organize:', pages.map(p => p.number));
      
      // Use the process API endpoint
      const formData = new FormData();
      formData.append('file', file);
      formData.append('operation', 'organize');
      formData.append('options', JSON.stringify({ 
        pageOrder: pages.map(p => p.number)
      }));

      const response = await fetch('/api/pdf/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to organize PDF');
      }

      const blob = await response.blob();
      console.log('Organization successful, blob size:', blob.size);
      
      if (blob.size === 0) {
        throw new Error('Generated PDF is empty');
      }
      
      // Create a clean blob with proper MIME type
      const cleanBlob = new Blob([blob], { 
        type: 'application/pdf'
      });
      
      // Create download URL
      const downloadUrl = URL.createObjectURL(cleanBlob);
      const fileName = `organized-${file.name}`;
      
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
      console.error('Error organizing PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to organize PDF: ${errorMessage}. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Organize PDF</h1>
          <p className="text-lg text-gray-600">
            Sort pages of your PDF file however you like. Delete PDF pages or add PDF pages to your document at your convenience.
          </p>
        </div>

        {/* File Upload Area */}
        {!file && (
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-purple-400 bg-purple-50' 
                : 'border-gray-300 bg-white'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isDragOver ? 'Drop your PDF file here' : 'Choose a PDF file or drag it here'}
            </h3>
            <p className="text-gray-600 mb-4">
              Select a PDF file to organize, reorder, or modify pages
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
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
        )}

        {/* File Info and Page Management */}
        {file && (
          <div className="space-y-6">
            {/* File Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">📄</span>
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {pages.length} pages
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setPages([]);
                    setSelectedPages([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Page Management Controls */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Page Management ({selectedPages.length} selected)
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllPages}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                  >
                    Select All
                  </button>
                  <button
                    onClick={deselectAllPages}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                  >
                    Deselect All
                  </button>
                  {selectedPages.length > 0 && (
                    <button
                      onClick={deleteSelectedPages}
                      className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded"
                    >
                      Delete Selected
                    </button>
                  )}
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-4">
                Drag and drop pages to reorder them. Click to select pages for deletion.
              </div>

              {/* Page Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {pages.map((page, index) => (
                  <div
                    key={page.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, page.number)}
                    onDragOver={handleDragOverPage}
                    onDrop={(e) => handleDropPage(e, page.number)}
                    onClick={() => togglePageSelection(page.number)}
                    className={`relative p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedPages.includes(page.number)
                        ? 'border-red-500 bg-red-50'
                        : draggedPage === page.number
                        ? 'border-purple-500 bg-purple-50 opacity-50'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-12 h-16 bg-white border border-gray-200 rounded mb-2 mx-auto flex items-center justify-center">
                        <span className="text-xs text-gray-500">Page</span>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {page.number}
                      </div>
                    </div>
                    
                    {/* Selection indicator */}
                    {selectedPages.includes(page.number) && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Organize Button */}
            <div className="text-center">
              <button
                onClick={handleOrganize}
                disabled={isProcessing || pages.length === 0}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Organizing PDF...
                  </div>
                ) : (
                  'Organize PDF'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 bg-purple-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How to organize PDFs</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">1</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Upload PDF file</h4>
              <p className="text-sm text-gray-600">Select a PDF file from your device</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">2</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Organize pages</h4>
              <p className="text-sm text-gray-600">Drag to reorder, click to select, delete unwanted pages</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">3</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Download result</h4>
              <p className="text-sm text-gray-600">Get your organized PDF document</p>
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
          title="PDF Organization Complete!"
          message="Your PDF has been successfully organized and is ready for download."
          fileName={processedFileInfo.fileName}
          fileSize={processedFileInfo.fileSize}
          downloadUrl={processedFileInfo.downloadUrl}
        />
      )}
    </div>
  );
}