'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function PDFToJPGPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [conversionOptions, setConversionOptions] = useState({
    outputFormat: 'jpg',
    quality: 'high',
    resolution: '300',
    extractMode: 'pages'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Suppress insecure connection warnings in development
  useEffect(() => {
    if (window.location.protocol === 'http:') {
      const originalWarn = console.warn;
      console.warn = (...args) => {
        // Suppress insecure connection warnings for blob URLs
        if (args[0] && typeof args[0] === 'string' && args[0].includes('insecure connection')) {
          return;
        }
        originalWarn.apply(console, args);
      };

      return () => {
        console.warn = originalWarn;
      };
    }
  }, []);

  const handleFileSelect = (selectedFile: File | null) => {
    if (selectedFile) {
      // File type validation
      if (selectedFile.type !== 'application/pdf') {
        alert('Please select a PDF file. Only PDF files are supported.');
        return;
      }
      
      // File size validation (50MB limit)
      const maxFileSize = 50 * 1024 * 1024; // 50MB
      if (selectedFile.size > maxFileSize) {
        alert('File too large. Maximum file size is 50MB. Please try with a smaller PDF.');
        return;
      }
      
      // File name validation
      if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
        alert('Please select a valid PDF file with .pdf extension.');
        return;
      }
      
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

  const handleConvert = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('operation', `pdf-to-${conversionOptions.outputFormat}`);
      formData.append('options', JSON.stringify(conversionOptions));

      const apiUrl = `${window.location.origin}/api/pdf/convert`;
      console.log('Making request to:', apiUrl);
      console.log('Conversion options:', conversionOptions);

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle specific error cases
        if (errorData.code === 'FILE_TOO_LARGE') {
          alert('File too large. Maximum file size is 50MB. Please try with a smaller PDF.');
        } else if (errorData.code === 'INVALID_FILE_TYPE') {
          alert('Invalid file type. Please upload a PDF file.');
        } else if (errorData.code === 'NO_IMAGES_FOUND') {
          alert('This PDF does not contain extractable images. Try converting pages to images instead.');
        } else if (errorData.code === 'CONVERSION_LIMIT') {
          alert('Conversion limit reached. Please try again later.');
        } else {
          throw new Error(errorData.error || 'Conversion failed');
        }
        return;
      }

      // Get the converted file as a blob
      const blob = await response.blob();
      
      // Debug logging
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      console.log('Blob info:', {
        size: blob.size,
        type: blob.type
      });
      
      // Check the actual content type from the response
      const contentType = response.headers.get('content-type') || '';
      const isImageFile = contentType.includes('image/') || 
                         contentType.includes('jpeg') || 
                         contentType.includes('jpg') || 
                         contentType.includes('png') || 
                         contentType.includes('webp');
      const isZipFile = contentType.includes('application/zip') || blob.type.includes('zip');
      
      console.log('Content type:', contentType);
      console.log('Is image file:', isImageFile);
      console.log('Is ZIP file:', isZipFile);
      
      // Use the actual content type from the response, or fallback to expected type
      const mimeType = contentType || 
                     (conversionOptions.outputFormat === 'jpg' ? 'image/jpeg' : 
                      conversionOptions.outputFormat === 'png' ? 'image/png' : 
                      'image/webp');
      
      const secureBlob = new Blob([blob], { type: mimeType });
      
      // Create a secure download link
      const url = URL.createObjectURL(secureBlob);
      const link = document.createElement('a');
      link.href = url;
      
      // Set appropriate filename based on actual file type
      const baseName = file.name.replace(/\.pdf$/i, '');
      const extension = conversionOptions.outputFormat;
      
      // If it's actually an image file, use image extension
      // If it's a ZIP file, use zip extension
      const filename = isImageFile 
        ? `${baseName}.${extension}`
        : isZipFile 
          ? `${baseName}-pages.zip`
          : `${baseName}-images.${extension}`;
      
      link.download = filename;
      link.style.display = 'none';
      
      // Add security attributes
      link.setAttribute('rel', 'noopener noreferrer');
      link.setAttribute('target', '_blank');
      
      document.body.appendChild(link);
      
      // Use a more secure download method with error handling
      try {
        // Try direct download first
        link.click();
        
        // If we're on HTTP and get security warnings, suppress them
        if (window.location.protocol === 'http:') {
          console.log('HTTP detected - blob download may show security warning');
        }
      } catch (downloadError) {
        console.warn('Direct download failed, trying alternative method:', downloadError);
        
        // Fallback: create a data URL for small files
        if (blob.size < 10 * 1024 * 1024) { // Less than 10MB
          try {
            const reader = new FileReader();
            reader.onload = function() {
              const dataUrl = reader.result as string;
              const fallbackLink = document.createElement('a');
              fallbackLink.href = dataUrl;
              fallbackLink.download = filename;
              fallbackLink.style.display = 'none';
              document.body.appendChild(fallbackLink);
              fallbackLink.click();
              document.body.removeChild(fallbackLink);
            };
            reader.readAsDataURL(secureBlob);
          } catch (dataUrlError) {
            console.warn('Data URL fallback failed:', dataUrlError);
            // Final fallback: open in new tab
            window.open(url, '_blank');
          }
        } else {
          // For large files, just open in new tab
          window.open(url, '_blank');
        }
      }
      
      document.body.removeChild(link);
      
      // Clean up the object URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 2000);
      
            const successMessage = isZipFile 
              ? `PDF converted to ${extension.toUpperCase()} images successfully! ${result.Files?.length || 'Multiple'} pages downloaded as ZIP file.`
              : isImageFile 
                ? `PDF converted to ${extension.toUpperCase()} successfully! Download started.`
                : conversionOptions.extractMode === 'pages' 
                  ? 'PDF pages converted to images successfully! Download started.'
                  : 'Images extracted from PDF successfully! Download started.';
            
            alert(successMessage);
    } catch (error) {
      console.error('Conversion error:', error);
      // Check if it's a network error (wrong port)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        alert('Network error: Unable to connect to the server. Please check if the development server is running.');
      } else {
        alert(`Conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">PDF to JPG</h1>
          <p className="text-lg text-gray-600">
            Convert each PDF page into a JPG or extract all images contained in a PDF.
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
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🖼️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isDragOver ? 'Drop your PDF here' : 'Choose a PDF file or drag it here'}
            </h3>
            <p className="text-gray-600 mb-4">
              Select a PDF file to convert to JPG images
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
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

        {/* File Info and Conversion Options */}
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

            {/* Conversion Options */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Extract Mode</label>
                  <select
                    value={conversionOptions.extractMode}
                    onChange={(e) => setConversionOptions(prev => ({ ...prev, extractMode: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="pages">Convert pages to images</option>
                    <option value="images">Extract embedded images only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Output Format</label>
                  <select
                    value={conversionOptions.outputFormat}
                    onChange={(e) => setConversionOptions(prev => ({ ...prev, outputFormat: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="jpg">JPG</option>
                    <option value="png">PNG</option>
                    <option value="webp">WebP</option>
                  </select>
                </div>
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                           Image Quality
                           {conversionOptions.outputFormat === 'png' && (
                             <span className="text-xs text-gray-500 ml-1">(compression level)</span>
                           )}
                         </label>
                         <select
                           value={conversionOptions.quality}
                           onChange={(e) => setConversionOptions(prev => ({ ...prev, quality: e.target.value }))}
                           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                         >
                           <option value="low">
                             {conversionOptions.outputFormat === 'png' ? 'Low compression (larger files)' : 'Low (smaller files)'}
                           </option>
                           <option value="medium">Medium</option>
                           <option value="high">
                             {conversionOptions.outputFormat === 'png' ? 'High compression (smaller files)' : 'High (better quality)'}
                           </option>
                         </select>
                         {conversionOptions.outputFormat === 'png' && (
                           <p className="text-xs text-gray-500 mt-1">
                             PNG is lossless - quality affects compression, not image quality
                           </p>
                         )}
                       </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Resolution (DPI)</label>
                  <select
                    value={conversionOptions.resolution}
                    onChange={(e) => setConversionOptions(prev => ({ ...prev, resolution: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="72">72 DPI (web)</option>
                    <option value="150">150 DPI (print)</option>
                    <option value="300">300 DPI (high quality)</option>
                    <option value="600">600 DPI (ultra high)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Convert Button */}
            <div className="text-center">
              <button
                onClick={handleConvert}
                disabled={isProcessing}
                className="bg-pink-600 hover:bg-pink-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
              >
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Converting PDF...
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-white h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <span className="text-sm">{Math.round(progress)}%</span>
                  </div>
                ) : (
                  conversionOptions.extractMode === 'pages' ? 'Convert to JPG' : 'Extract Images'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 bg-pink-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How to convert PDF to JPG</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">1</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Upload PDF file</h4>
              <p className="text-sm text-gray-600">Select the PDF you want to convert</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">2</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Choose options</h4>
              <p className="text-sm text-gray-600">Set format, quality, and resolution</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">3</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Download images</h4>
              <p className="text-sm text-gray-600">Get your converted JPG files</p>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Important Notes</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Maximum file size: 50MB</li>
                  <li>Only PDF files are supported</li>
                  <li>Large PDFs may take longer to process</li>
                  <li>Password-protected PDFs are not supported</li>
                  <li>Complex layouts may not convert perfectly</li>
                  <li><strong>Security Warning:</strong> You may see a "insecure connection" warning when downloading files. This is normal for development and doesn't affect the file quality.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Perfect for</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <span className="text-green-500 text-lg">✅</span>
              <div>
                <h4 className="font-medium text-gray-900">Web publishing</h4>
                <p className="text-sm text-gray-600">Convert PDF pages to web-friendly images</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-500 text-lg">✅</span>
              <div>
                <h4 className="font-medium text-gray-900">Social media</h4>
                <p className="text-sm text-gray-600">Share PDF content on social platforms</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-500 text-lg">✅</span>
              <div>
                <h4 className="font-medium text-gray-900">Image extraction</h4>
                <p className="text-sm text-gray-600">Extract embedded images from PDFs</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-500 text-lg">✅</span>
              <div>
                <h4 className="font-medium text-gray-900">Print materials</h4>
                <p className="text-sm text-gray-600">Convert PDFs to printable image formats</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
