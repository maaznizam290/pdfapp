'use client';

import { useState, useRef } from 'react';

export default function CropDebugPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File | null) => {
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setMessage('');
      setDebugInfo(null);
    } else {
      setFile(null);
      setMessage('Please select a PDF file.');
    }
  };

  const handleDebugCrop = async () => {
    if (!file) {
      setMessage('Please select a PDF file first.');
      return;
    }

    setIsProcessing(true);
    setMessage('Debugging crop...');
    setDebugInfo(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('operation', 'crop');
      formData.append('options', JSON.stringify({
        crop: {
          top: 5,
          right: 5,
          bottom: 5,
          left: 5,
          unit: 'mm'
        }
      }));

      console.log('Sending request...');
      const response = await fetch('/api/pdf/process', {
        method: 'POST',
        body: formData,
      });

      console.log('Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      setDebugInfo({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        ok: response.ok
      });

      if (!response.ok) {
        let errorMessage = 'Failed to crop PDF';
        let errorData = null;
        
        try {
          errorData = await response.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (jsonError) {
          try {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          } catch (textError) {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
        }
        
        setDebugInfo(prev => ({
          ...prev,
          error: errorMessage,
          errorData
        }));
        
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      console.log('Blob received:', { size: blob.size, type: blob.type });

      setDebugInfo(prev => ({
        ...prev,
        blobSize: blob.size,
        blobType: blob.type
      }));

      if (blob.size === 0) {
        throw new Error('Generated PDF is empty');
      }

      const downloadUrl = URL.createObjectURL(blob);
      const fileName = `debug-cropped-${file.name}`;

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setMessage(`PDF cropped successfully! Downloaded ${fileName}`);

    } catch (error: any) {
      console.error('Error cropping PDF:', error);
      setMessage(`Failed to crop PDF: ${error.message}. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">Crop PDF Debug</h1>
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
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

        <button
          onClick={handleDebugCrop}
          disabled={!file || isProcessing}
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded
            disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Debugging...' : 'Debug Crop PDF'}
        </button>
        
        {message && (
          <p className="mt-4 text-center text-sm text-gray-600">{message}</p>
        )}
        
        {debugInfo && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Debug Information:</h3>
            <pre className="text-xs text-gray-700 overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Test Settings:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Crop: 5mm from all sides</li>
            <li>• Unit: Millimeters</li>
            <li>• All pages will be cropped</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
