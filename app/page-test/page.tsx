'use client';

import { useState, useRef } from 'react';

export default function PageTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [pageRange, setPageRange] = useState('1,3,5-7');
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

  const handleTestPageRange = async () => {
    if (!file) {
      setMessage('Please select a PDF file first.');
      return;
    }

    setIsProcessing(true);
    setMessage('Testing page range parsing...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('operation', 'rotate');
      formData.append('options', JSON.stringify({
        angle: 90,
        pageRange: pageRange.trim()
      }));

      const response = await fetch('/api/pdf/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Failed to process PDF');
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const fileName = `page-test-${file.name}`;

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setMessage(`Page range test successful! Downloaded ${fileName}. Check server logs for page parsing details.`);

    } catch (error: any) {
      console.error('Error testing page range:', error);
      setMessage(`Failed to test page range: ${error.message}. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">Page Range Test</h1>
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
            Page Range to Test
          </label>
          <input
            type="text"
            value={pageRange}
            onChange={(e) => setPageRange(e.target.value)}
            placeholder="e.g., 1,3,5-7,10"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <p className="text-xs text-gray-500 mt-1">
            This will rotate pages: {pageRange} (90° clockwise)
          </p>
        </div>

        <button
          onClick={handleTestPageRange}
          disabled={!file || isProcessing}
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded
            disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Testing...' : 'Test Page Range'}
        </button>
        {message && (
          <p className="mt-4 text-center text-sm text-gray-600">{message}</p>
        )}
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Test Examples:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <code>1</code> - Rotate only page 1</li>
            <li>• <code>1-3</code> - Rotate pages 1, 2, 3</li>
            <li>• <code>1,3,5</code> - Rotate pages 1, 3, 5</li>
            <li>• <code>1-3,5,7-9</code> - Rotate pages 1,2,3,5,7,8,9</li>
            <li>• <code></code> (empty) - Rotate all pages</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
