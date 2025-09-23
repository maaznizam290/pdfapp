'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import PDFEditor from '@/components/pdf-editor';

export default function EditPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
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
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleStartEditing = () => {
    if (file) {
      setShowEditor(true);
    }
  };

  const handleSavePDF = (editedPdfBytes: Uint8Array) => {
    const blob = new Blob([editedPdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `edited-${file?.name || 'document.pdf'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Reset state
    setShowEditor(false);
    setFile(null);
  };

  const handleCancelEditing = () => {
    setShowEditor(false);
  };

  // Show PDF Editor if file is selected and editor is open
  if (showEditor && file) {
    return (
      <PDFEditor
        file={file}
        onSave={handleSavePDF}
        onCancel={handleCancelEditing}
      />
    );
  }

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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Edit PDF</h1>
          <p className="text-lg text-gray-600">
            Add text, images, and annotations to your PDF documents. Choose from practical editing options below.
          </p>
        </div>

        {/* File Upload Area */}
        {!file && (
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
              <span className="text-2xl">✏️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isDragOver ? 'Drop your PDF here' : 'Choose a PDF file or drag it here'}
            </h3>
            <p className="text-gray-600 mb-4">
              Select a PDF file to open in our visual editor
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
        )}

        {/* File Info and Edit Options */}
        {file && !showEditor && (
          <div className="space-y-6">
            {/* File Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
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
                  onClick={() => setFile(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Practical Edit Options */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose editing option</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => setShowEditor(true)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="text-2xl mb-2">✏️</div>
                  <h4 className="font-medium text-gray-900 mb-1">Add Text</h4>
                  <p className="text-sm text-gray-600">Add text annotations to your PDF</p>
                </button>
                
                <button
                  onClick={() => window.open('/watermark', '_blank')}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="text-2xl mb-2">💧</div>
                  <h4 className="font-medium text-gray-900 mb-1">Add Watermark</h4>
                  <p className="text-sm text-gray-600">Add text or image watermarks</p>
                </button>
                
                <button
                  onClick={() => window.open('/page-numbers', '_blank')}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="text-2xl mb-2">🔢</div>
                  <h4 className="font-medium text-gray-900 mb-1">Add Page Numbers</h4>
                  <p className="text-sm text-gray-600">Add page numbers to your PDF</p>
                </button>
                
                <button
                  onClick={() => window.open('/rotate-pdf', '_blank')}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="text-2xl mb-2">🔄</div>
                  <h4 className="font-medium text-gray-900 mb-1">Rotate Pages</h4>
                  <p className="text-sm text-gray-600">Rotate PDF pages</p>
                </button>
                
                <button
                  onClick={() => window.open('/crop-pdf', '_blank')}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="text-2xl mb-2">✂️</div>
                  <h4 className="font-medium text-gray-900 mb-1">Crop Pages</h4>
                  <p className="text-sm text-gray-600">Crop PDF pages to remove margins</p>
                </button>
                
                <button
                  onClick={() => window.open('/protect-pdf', '_blank')}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="text-2xl mb-2">🔒</div>
                  <h4 className="font-medium text-gray-900 mb-1">Protect PDF</h4>
                  <p className="text-sm text-gray-600">Add password protection</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular PDF editing tasks</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">✏️</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Add Text</h4>
              <p className="text-sm text-gray-600">Add text annotations and comments</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">💧</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Add Watermark</h4>
              <p className="text-sm text-gray-600">Add text or image watermarks</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">🔢</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Page Numbers</h4>
              <p className="text-sm text-gray-600">Add page numbers to your PDF</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
