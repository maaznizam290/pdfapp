'use client';

import { useState, useRef } from 'react';

export default function PageNumbersTestPage() {
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

  const handleTestPageNumbers = async () => {
    if (!file) {
      setMessage('Please select a PDF file first.');
      return;
    }

    setIsProcessing(true);
    setMessage('Adding page numbers...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('operation', 'page-numbers');
      formData.append('options', JSON.stringify({
        position: 'bottom-center',
        format: '1',
        startPage: 1,
        fontSize: 12,
        fontColor: '#000000',
        includeTotalPages: false,
        customText: 'Page'
      }));

      const response = await fetch('/api/pdf/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Failed to add page numbers');
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const fileName = `numbered-test-${file.name}`;

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setMessage(`Page numbers added successfully! Downloaded ${fileName}`);

    } catch (error: any) {
      console.error('Error adding page numbers:', error);
      setMessage(`Failed to add page numbers: ${error.message}. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">Page Numbers Test</h1>
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

        <button
          onClick={handleTestPageNumbers}
          disabled={!file || isProcessing}
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded
            disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : 'Test Page Numbers'}
        </button>
        {message && (
          <p className="mt-4 text-center text-sm text-gray-600">{message}</p>
        )}
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Test Settings:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Position: Bottom Center</li>
            <li>• Format: 1, 2, 3...</li>
            <li>• Start Page: 1</li>
            <li>• Font Size: 12px</li>
            <li>• Custom Text: "Page"</li>
            <li>• Color: Black</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
