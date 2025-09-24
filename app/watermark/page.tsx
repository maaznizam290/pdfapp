'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { processMultipleFiles } from '@/utils/pdfApi';
import SuccessModal from '@/components/success-modal';

export default function WatermarkPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [processedFileInfo, setProcessedFileInfo] = useState<{
    fileName: string;
    fileSize: number;
    downloadUrl: string;
  } | null>(null);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkPosition, setWatermarkPosition] = useState('center');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.3);
  const [watermarkSize, setWatermarkSize] = useState(24);
  const [watermarkType, setWatermarkType] = useState<'text' | 'image'>('text');
  const [watermarkImage, setWatermarkImage] = useState<string | null>(null);
  const [watermarkRotation, setWatermarkRotation] = useState(-45);
  const [watermarkColor, setWatermarkColor] = useState('#999999');
  const [pageRange, setPageRange] = useState<'all' | 'range' | 'specific'>('all');
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(1);
  const [specificPages, setSpecificPages] = useState('');
  const [watermarkLayer, setWatermarkLayer] = useState<'above' | 'below'>('above');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setWatermarkImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWatermark = async () => {
    if (!file) {
      alert('Please select a PDF file to watermark.');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      console.log('Starting watermark process with file:', { name: file.name, size: file.size });
      
      const options = {
        type: watermarkType,
        text: watermarkText,
        image: watermarkImage,
        position: watermarkPosition,
        opacity: watermarkOpacity,
        fontSize: watermarkSize,
        rotation: watermarkRotation,
        color: watermarkColor,
        pageRange: pageRange,
        startPage: startPage,
        endPage: endPage,
        specificPages: specificPages,
        layer: watermarkLayer
      };
      
      // Use the correct API endpoint for single file operations
      const formData = new FormData();
      formData.append('file', file);
      formData.append('operation', 'watermark');
      formData.append('options', JSON.stringify(options));

      const response = await fetch('/api/pdf/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to watermark PDF');
      }

      const blob = await response.blob();
      
      console.log('Watermark successful, blob size:', blob.size);
      
      if (blob.size === 0) {
        throw new Error('Generated PDF is empty');
      }
      
      // Create a clean blob with proper MIME type
      const cleanBlob = new Blob([blob], { 
        type: 'application/pdf'
      });
      
      // Create download URL
      const downloadUrl = URL.createObjectURL(cleanBlob);
      const fileName = `watermarked-${file.name}`;
      
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
      console.error('Error watermarking PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to watermark PDF: ${errorMessage}. Please try again.`);
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Watermark PDF</h1>
          <p className="text-lg text-gray-600">
            Add text watermarks to your PDF documents for branding or security.
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
                <span className="text-2xl">💧</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {isDragOver ? 'Drop your PDF file here' : 'Choose PDF file to watermark'}
              </h3>
              <p className="text-gray-600 mb-4">
                Select a PDF file to add watermark
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

          {/* Watermark Settings */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Advanced Watermark Settings</h3>
            
            <div className="space-y-6">
              {/* Watermark Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Watermark Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="text"
                      checked={watermarkType === 'text'}
                      onChange={(e) => setWatermarkType(e.target.value as 'text' | 'image')}
                      className="mr-2"
                    />
                    Text Watermark
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="image"
                      checked={watermarkType === 'image'}
                      onChange={(e) => setWatermarkType(e.target.value as 'text' | 'image')}
                      className="mr-2"
                    />
                    Image Watermark
                  </label>
                </div>
              </div>

              {/* Text Watermark Settings */}
              {watermarkType === 'text' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Watermark Text
                    </label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter watermark text"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Font Size: {watermarkSize}px
                    </label>
                    <input
                      type="range"
                      min="12"
                      max="72"
                      step="2"
                      value={watermarkSize}
                      onChange={(e) => setWatermarkSize(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Text Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={watermarkColor}
                        onChange={(e) => setWatermarkColor(e.target.value)}
                        className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={watermarkColor}
                        onChange={(e) => setWatermarkColor(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="#999999"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Image Watermark Settings */}
              {watermarkType === 'image' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Watermark Image
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => imageInputRef.current?.click()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Choose Image
                      </button>
                      {watermarkImage && (
                        <div className="flex items-center gap-2">
                          <img src={watermarkImage} alt="Watermark preview" className="w-8 h-8 object-contain border rounded" />
                          <button
                            onClick={() => setWatermarkImage(null)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Position Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position
                </label>
                <select
                  value={watermarkPosition}
                  onChange={(e) => setWatermarkPosition(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="center">Center</option>
                  <option value="top-left">Top Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="top-center">Top Center</option>
                  <option value="bottom-center">Bottom Center</option>
                </select>
              </div>

              {/* Rotation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rotation: {watermarkRotation}°
                </label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="15"
                  value={watermarkRotation}
                  onChange={(e) => setWatermarkRotation(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Opacity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opacity: {Math.round(watermarkOpacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={watermarkOpacity}
                  onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Page Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Apply to Pages
                </label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="all"
                      checked={pageRange === 'all'}
                      onChange={(e) => setPageRange(e.target.value as 'all' | 'range' | 'specific')}
                      className="mr-2"
                    />
                    All Pages
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="range"
                      checked={pageRange === 'range'}
                      onChange={(e) => setPageRange(e.target.value as 'all' | 'range' | 'specific')}
                      className="mr-2"
                    />
                    Page Range
                  </label>
                  {pageRange === 'range' && (
                    <div className="ml-6 flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={startPage}
                        onChange={(e) => setStartPage(parseInt(e.target.value))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Start"
                      />
                      <span>to</span>
                      <input
                        type="number"
                        min="1"
                        value={endPage}
                        onChange={(e) => setEndPage(parseInt(e.target.value))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="End"
                      />
                    </div>
                  )}
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="specific"
                      checked={pageRange === 'specific'}
                      onChange={(e) => setPageRange(e.target.value as 'all' | 'range' | 'specific')}
                      className="mr-2"
                    />
                    Specific Pages
                  </label>
                  {pageRange === 'specific' && (
                    <div className="ml-6">
                      <input
                        type="text"
                        value={specificPages}
                        onChange={(e) => setSpecificPages(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="e.g., 1,3,5-7,10"
                      />
                      <p className="text-xs text-gray-500 mt-1">Enter page numbers separated by commas. Use ranges like 5-7 for multiple pages.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Layer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Watermark Layer
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="above"
                      checked={watermarkLayer === 'above'}
                      onChange={(e) => setWatermarkLayer(e.target.value as 'above' | 'below')}
                      className="mr-2"
                    />
                    Above Content
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="below"
                      checked={watermarkLayer === 'below'}
                      onChange={(e) => setWatermarkLayer(e.target.value as 'above' | 'below')}
                      className="mr-2"
                    />
                    Below Content
                  </label>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
              <div className="relative h-32 bg-white border border-gray-200 rounded overflow-hidden">
                {watermarkType === 'text' ? (
                  <div 
                    className="absolute"
                    style={{
                      fontSize: `${watermarkSize}px`,
                      opacity: watermarkOpacity,
                      color: watermarkColor,
                      transform: `translate(-50%, -50%) rotate(${watermarkRotation}deg)`,
                      ...(watermarkPosition === 'center' && { 
                        top: '50%', 
                        left: '50%'
                      }),
                      ...(watermarkPosition === 'top-left' && { 
                        top: '20px', 
                        left: '20px',
                        transform: `rotate(${watermarkRotation}deg)`
                      }),
                      ...(watermarkPosition === 'top-right' && { 
                        top: '20px', 
                        right: '20px',
                        transform: `rotate(${watermarkRotation}deg)`
                      }),
                      ...(watermarkPosition === 'bottom-left' && { 
                        bottom: '20px', 
                        left: '20px',
                        transform: `rotate(${watermarkRotation}deg)`
                      }),
                      ...(watermarkPosition === 'bottom-right' && { 
                        bottom: '20px', 
                        right: '20px',
                        transform: `rotate(${watermarkRotation}deg)`
                      }),
                      ...(watermarkPosition === 'top-center' && { 
                        top: '20px', 
                        left: '50%',
                        transform: `translateX(-50%) rotate(${watermarkRotation}deg)`
                      }),
                      ...(watermarkPosition === 'bottom-center' && { 
                        bottom: '20px', 
                        left: '50%',
                        transform: `translateX(-50%) rotate(${watermarkRotation}deg)`
                      }),
                    }}
                  >
                    {watermarkText}
                  </div>
                ) : watermarkImage ? (
                  <div 
                    className="absolute"
                    style={{
                      opacity: watermarkOpacity,
                      transform: `translate(-50%, -50%) rotate(${watermarkRotation}deg)`,
                      ...(watermarkPosition === 'center' && { 
                        top: '50%', 
                        left: '50%'
                      }),
                      ...(watermarkPosition === 'top-left' && { 
                        top: '20px', 
                        left: '20px',
                        transform: `rotate(${watermarkRotation}deg)`
                      }),
                      ...(watermarkPosition === 'top-right' && { 
                        top: '20px', 
                        right: '20px',
                        transform: `rotate(${watermarkRotation}deg)`
                      }),
                      ...(watermarkPosition === 'bottom-left' && { 
                        bottom: '20px', 
                        left: '20px',
                        transform: `rotate(${watermarkRotation}deg)`
                      }),
                      ...(watermarkPosition === 'bottom-right' && { 
                        bottom: '20px', 
                        right: '20px',
                        transform: `rotate(${watermarkRotation}deg)`
                      }),
                      ...(watermarkPosition === 'top-center' && { 
                        top: '20px', 
                        left: '50%',
                        transform: `translateX(-50%) rotate(${watermarkRotation}deg)`
                      }),
                      ...(watermarkPosition === 'bottom-center' && { 
                        bottom: '20px', 
                        left: '50%',
                        transform: `translateX(-50%) rotate(${watermarkRotation}deg)`
                      }),
                    }}
                  >
                    <img 
                      src={watermarkImage} 
                      alt="Watermark preview" 
                      className="max-w-16 max-h-16 object-contain"
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                    {watermarkType === 'image' ? 'Upload an image to preview' : 'Enter text to preview'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Watermark Button */}
        {file && (
          <div className="mt-8 text-center">
            <button
              onClick={handleWatermark}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Adding Watermark...
                </div>
              ) : (
                'Add Watermark'
              )}
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How to watermark PDFs</h3>
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
              <h4 className="font-medium text-gray-900 mb-2">Customize watermark</h4>
              <p className="text-sm text-gray-600">Set text, position, opacity, and size</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">3</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Download result</h4>
              <p className="text-sm text-gray-600">Get your watermarked PDF file</p>
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
          title="PDF Watermarked Successfully!"
          message="Your PDF file has been watermarked and is ready for download."
          fileName={processedFileInfo.fileName}
          fileSize={processedFileInfo.fileSize}
          downloadUrl={processedFileInfo.downloadUrl}
        />
      )}
    </div>
  );
}
