'use client';

import { useState } from 'react';

export default function WatermarkTest() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const testWatermark = async () => {
    if (!file) {
      setResult('Please select a file first');
      return;
    }

    setIsProcessing(true);
    setResult('Processing...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('operation', 'watermark');
      formData.append('options', JSON.stringify({
        text: 'TEST WATERMARK',
        position: 'center',
        opacity: 0.5,
        fontSize: 24
      }));

      console.log('Sending request to /api/pdf/process');
      const response = await fetch('/api/pdf/process', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        setResult(`Error: ${errorData.error || 'Unknown error'}`);
        return;
      }

      const blob = await response.blob();
      console.log('Response blob size:', blob.size);

      if (blob.size === 0) {
        setResult('Error: Empty response');
        return;
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'watermarked-test.pdf';
      link.click();
      URL.revokeObjectURL(url);

      setResult(`Success! Watermarked PDF downloaded (${blob.size} bytes)`);
    } catch (error) {
      console.error('Test error:', error);
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Watermark Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select PDF File:</label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>

          {file && (
            <div className="mb-4 p-3 bg-gray-100 rounded">
              <p><strong>Selected:</strong> {file.name}</p>
              <p><strong>Size:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          )}

          <button
            onClick={testWatermark}
            disabled={!file || isProcessing}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded disabled:bg-gray-400"
          >
            {isProcessing ? 'Processing...' : 'Test Watermark'}
          </button>

          {result && (
            <div className="mt-4 p-3 bg-gray-100 rounded">
              <p><strong>Result:</strong> {result}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
