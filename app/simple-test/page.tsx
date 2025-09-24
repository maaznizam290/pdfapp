'use client';

import { useState, useRef } from 'react';

export default function SimpleTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
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

  const handleTest = async (pageRange: string) => {
    if (!file) {
      setMessage('Please select a PDF file first.');
      return;
    }

    setIsProcessing(true);
    setMessage(`Testing page range: ${pageRange}`);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('operation', 'rotate');
      formData.append('options', JSON.stringify({
        angle: 90,
        pageRange: pageRange
      }));

      const response = await fetch('/api/pdf/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process PDF');
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const fileName = `test-${pageRange.replace(/[^a-zA-Z0-9]/g, '-')}-${file.name}`;

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setMessage(`Success! Downloaded ${fileName}`);

    } catch (error: any) {
      console.error('Error:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">Simple Page Test</h1>
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
          <p className="mt-4 text-gray-700">Selected: {file.name}</p>
        )}
        
        <div className="mt-6 space-y-2">
          <button
            onClick={() => handleTest('1')}
            disabled={!file || isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded
              disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Test Page 1
          </button>
          
          <button
            onClick={() => handleTest('1-2')}
            disabled={!file || isProcessing}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded
              disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Test Pages 1-2
          </button>
          
          <button
            onClick={() => handleTest('')}
            disabled={!file || isProcessing}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded
              disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Test All Pages
          </button>
        </div>

        {message && (
          <p className="mt-4 text-center text-sm text-gray-600">{message}</p>
        )}
      </div>
    </div>
  );
}
