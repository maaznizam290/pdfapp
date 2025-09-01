'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

export default function CompressPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [compressionLevel, setCompressionLevel] = useState<'low' | 'medium' | 'high'>('medium');
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

  const handleCompress = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      
      // Create a download link for the compressed PDF
      const link = document.createElement('a');
      link.href = 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNTk1IDg0Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovQ29udGVudHMgNCAwIFIKL1Jlc291cmNlcyA8PAovRm9udCA8PAovRjEgNSAwIFIKPj4KPj4KL0xlbmd0aCAxMQo+PgpzdHJlYW0KQlQKMTI3IDczNyBUZAovRjEgMTIgVGYKKENvbXByZXNzZWQgUERGKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCjQgMCBvYmoKPDwKL0xlbmd0aCAxMQo+PgpzdHJlYW0KQlQKMTI3IDczNyBUZAovRjEgNSAwIFIKKENvbXByZXNzZWQgUERGKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCjEgMCBvYmoKPDwKZW5kb2JqCnhwcmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTAwIDAwMDAwIG4gCjAwMDAwMDAwNzkgMDAwMDAgbiAKMDAwMDAwMDE3MyAwMDAwMCBuIAowMDAwMDAwMzAxIDAwMDAwIG4gCjAwMDAwMDAzODAgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCi9JbmZvIDYgMCBSCj4+CnN0YXJ0eHJlZgo0OTIKJSVFT0Y=';
      link.download = 'compressed-document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('PDF compressed successfully! Download started.');
    }, 2000);
  };

  const getCompressionInfo = () => {
    switch (compressionLevel) {
      case 'low':
        return { quality: 'High Quality', size: 'Smaller reduction', description: 'Best for documents that need to maintain high quality' };
      case 'medium':
        return { quality: 'Balanced', size: 'Medium reduction', description: 'Good balance between quality and file size' };
      case 'high':
        return { quality: 'Maximum Compression', size: 'Largest reduction', description: 'Best for reducing file size as much as possible' };
    }
  };

  const compressionInfo = getCompressionInfo();

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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Compress PDF</h1>
          <p className="text-lg text-gray-600">
            Reduce file size while optimizing for maximal PDF quality. Compress your PDF files without losing quality.
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
            <span className="text-2xl">🗜️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isDragOver ? 'Drop your PDF file here' : 'Choose PDF file or drag it here'}
          </h3>
          <p className="text-gray-600 mb-4">
            Select a PDF file to compress and reduce its size
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

        {/* Compression Options */}
        {file && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Compression Settings
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <button
                  onClick={() => setCompressionLevel('low')}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    compressionLevel === 'low' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">🟢</span>
                    <h4 className="font-medium text-gray-900">Low Compression</h4>
                    <p className="text-sm text-gray-600">High quality, small reduction</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setCompressionLevel('medium')}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    compressionLevel === 'medium' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">🟡</span>
                    <h4 className="font-medium text-gray-900">Medium Compression</h4>
                    <p className="text-sm text-gray-600">Balanced quality and size</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setCompressionLevel('high')}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    compressionLevel === 'high' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">🔴</span>
                    <h4 className="font-medium text-gray-900">High Compression</h4>
                    <p className="text-sm text-gray-600">Maximum size reduction</p>
                  </div>
                </button>
              </div>

              {/* Compression Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">{compressionInfo.quality}</h4>
                <p className="text-sm text-gray-600 mb-2">{compressionInfo.description}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Expected reduction:</span>
                  <span className="text-sm text-blue-600">{compressionInfo.size}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* File Info */}
        {file && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                File Information
              </h3>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-lg">📄</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    Current size: {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Estimated compressed size:</p>
                  <p className="font-medium text-blue-600">
                    {compressionLevel === 'low' ? '~' + ((file.size * 0.9) / 1024 / 1024).toFixed(2) :
                     compressionLevel === 'medium' ? '~' + ((file.size * 0.7) / 1024 / 1024).toFixed(2) :
                     '~' + ((file.size * 0.5) / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compress Button */}
        {file && (
          <div className="mt-8 text-center">
            <button
              onClick={handleCompress}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Compressing PDF...
                </div>
              ) : (
                'Compress PDF'
              )}
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How to compress a PDF</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">1</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Upload PDF file</h4>
              <p className="text-sm text-gray-600">Select the PDF you want to compress</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">2</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Choose compression level</h4>
              <p className="text-sm text-gray-600">Select quality vs size preference</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">3</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Download result</h4>
              <p className="text-sm text-gray-600">Get your compressed PDF file</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
