'use client';

import { useState, useRef } from 'react';

export default function CropTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [cropSettings, setCropSettings] = useState({
    top: 10,
    right: 10,
    bottom: 10,
    left: 10,
    unit: 'mm'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File | null) => {
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setMessage('');
    } else {
      setFile(null);
      setMessage('Please select a PDF file.');
    }
  };

  const handleTestCrop = async () => {
    if (!file) {
      setMessage('Please select a PDF file first.');
      return;
    }

    setIsProcessing(true);
    setMessage('Processing crop...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('operation', 'crop');
      formData.append('options', JSON.stringify({
        crop: cropSettings
      }));

      const response = await fetch('/api/pdf/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Failed to crop PDF');
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const fileName = `cropped-test-${file.name}`;

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setMessage(`Crop successful! Downloaded ${fileName}`);

    } catch (error: any) {
      console.error('Error cropping PDF:', error);
      setMessage(`Failed to crop PDF: ${error.message}. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">Crop PDF Test Page</h1>
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
          ref={fileInputRef}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        {file && (
          <p className="mt-4 text-gray-700">Selected file: {file.name}</p>
        )}
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Unit
          </label>
          <select
            value={cropSettings.unit}
            onChange={(e) => setCropSettings(prev => ({ ...prev, unit: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="mm">Millimeters (mm)</option>
            <option value="pt">Points (pt)</option>
            <option value="in">Inches (in)</option>
          </select>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Top: {cropSettings.top} {cropSettings.unit}
            </label>
            <input
              type="range"
              min="0"
              max={cropSettings.unit === 'mm' ? 50 : cropSettings.unit === 'in' ? 2 : 150}
              step="1"
              value={cropSettings.top}
              onChange={(e) => setCropSettings(prev => ({ ...prev, top: parseInt(e.target.value) }))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Right: {cropSettings.right} {cropSettings.unit}
            </label>
            <input
              type="range"
              min="0"
              max={cropSettings.unit === 'mm' ? 50 : cropSettings.unit === 'in' ? 2 : 150}
              step="1"
              value={cropSettings.right}
              onChange={(e) => setCropSettings(prev => ({ ...prev, right: parseInt(e.target.value) }))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bottom: {cropSettings.bottom} {cropSettings.unit}
            </label>
            <input
              type="range"
              min="0"
              max={cropSettings.unit === 'mm' ? 50 : cropSettings.unit === 'in' ? 2 : 150}
              step="1"
              value={cropSettings.bottom}
              onChange={(e) => setCropSettings(prev => ({ ...prev, bottom: parseInt(e.target.value) }))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Left: {cropSettings.left} {cropSettings.unit}
            </label>
            <input
              type="range"
              min="0"
              max={cropSettings.unit === 'mm' ? 50 : cropSettings.unit === 'in' ? 2 : 150}
              step="1"
              value={cropSettings.left}
              onChange={(e) => setCropSettings(prev => ({ ...prev, left: parseInt(e.target.value) }))}
              className="w-full"
            />
          </div>
        </div>

        <button
          onClick={handleTestCrop}
          disabled={!file || isProcessing}
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded
            disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : 'Test Crop'}
        </button>
        {message && (
          <p className="mt-4 text-center text-sm text-gray-600">{message}</p>
        )}
      </div>
    </div>
  );
}
