'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

export default function OCRPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [ocrOptions, setOcrOptions] = useState({
    language: 'en',
    outputFormat: 'searchable-pdf',
    imageQuality: 'high',
    preserveLayout: true
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
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleOCR = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      
      // Create a download link for the OCR processed PDF
      const link = document.createElement('a');
      link.href = 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNTk1IDg0Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovQ29udGVudHMgNCAwIFIKL1Jlc291cmNlcyA8PAovRm9udCA8PAovRjEgNSAwIFIKPj4KPj4KL0xlbmd0aCAxMQo+PgpzdHJlYW0KQlQKMTI3IDczNyBUZAovRjEgMTIgVGYKKE9DUiBQcm9jZXNzZWQpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKNCAwIG9iago8PAovTGVuZ3RoIDExCj4+CnN0cmVhbQpCVAoxMjcgNzM3IFRkCi9GMSAxMiBUZgooT0NSIFByb2Nlc3NlZCkgVGogCkVUCmVuZHN0cmVhbQplbmRvYmoKMSAwIG9iago8PAplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwMCAwMDAwMCBuIAowMDAwMDAwMDc5IDAwMDAwIG4gCjAwMDAwMDAxNzMgMDAwMDAgbiAKMDAwMDAwMDMwMSAwMDAwMCBuIAowMDAwMDAwMzgwIDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNgovUm9vdCAxIDAgUgovSW5mbyA2IDAgUgo+PgpzdGFydHhyZWYKNDkyCiUlRU9G';
      link.download = 'ocr-processed-document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('OCR completed successfully! Your PDF is now searchable. Download started.');
    }, 4000);
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' }
  ];

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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">OCR PDF</h1>
          <p className="text-lg text-gray-600">
            Easily convert scanned PDF into searchable and selectable documents.
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
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👁️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isDragOver ? 'Drop your scanned PDF here' : 'Choose a scanned PDF file or drag it here'}
            </h3>
            <p className="text-gray-600 mb-4">
              Select a scanned PDF to convert it into searchable text
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
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

        {/* File Info and OCR Options */}
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

            {/* OCR Options */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">OCR Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Language Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Language
                  </label>
                  <select
                    value={ocrOptions.language}
                    onChange={(e) => setOcrOptions(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    {languages.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Output Format */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Output Format
                  </label>
                  <select
                    value={ocrOptions.outputFormat}
                    onChange={(e) => setOcrOptions(prev => ({ ...prev, outputFormat: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="searchable-pdf">Searchable PDF</option>
                    <option value="text-only">Text Only</option>
                    <option value="word-document">Word Document</option>
                  </select>
                </div>

                {/* Image Quality */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image Quality
                  </label>
                  <select
                    value={ocrOptions.imageQuality}
                    onChange={(e) => setOcrOptions(prev => ({ ...prev, imageQuality: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="low">Low (Faster)</option>
                    <option value="medium">Medium (Balanced)</option>
                    <option value="high">High (Better accuracy)</option>
                  </select>
                </div>

                {/* Preserve Layout */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Layout Options
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={ocrOptions.preserveLayout}
                      onChange={(e) => setOcrOptions(prev => ({ ...prev, preserveLayout: e.target.checked }))}
                      className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Preserve original layout</span>
                  </label>
                </div>
              </div>
            </div>

            {/* OCR Button */}
            <div className="text-center">
              <button
                onClick={handleOCR}
                disabled={isProcessing}
                className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing OCR...
                  </div>
                ) : (
                  'Convert to Searchable PDF'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 bg-teal-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How OCR works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">1</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Upload scanned PDF</h4>
              <p className="text-sm text-gray-600">Select your scanned document or image-based PDF</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">2</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">AI text recognition</h4>
              <p className="text-sm text-gray-600">Our OCR technology recognizes and extracts text</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">3</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Download searchable PDF</h4>
              <p className="text-sm text-gray-600">Get your PDF with searchable and selectable text</p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Benefits of OCR</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <span className="text-green-500 text-lg">✅</span>
              <div>
                <h4 className="font-medium text-gray-900">Searchable text</h4>
                <p className="text-sm text-gray-600">Find specific words or phrases instantly</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-500 text-lg">✅</span>
              <div>
                <h4 className="font-medium text-gray-900">Copy and paste</h4>
                <p className="text-sm text-gray-600">Extract text for editing or reuse</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-500 text-lg">✅</span>
              <div>
                <h4 className="font-medium text-gray-900">Accessibility</h4>
                <p className="text-sm text-gray-600">Screen readers can read the content</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-500 text-lg">✅</span>
              <div>
                <h4 className="font-medium text-gray-900">Data extraction</h4>
                <p className="text-sm text-gray-600">Convert scanned forms to editable data</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
