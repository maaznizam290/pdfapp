'use client';

import { useState, useRef } from 'react';

export default function DebugPagesPage() {
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

  const handleDebugPDF = async () => {
    if (!file) {
      setMessage('Please select a PDF file first.');
      return;
    }

    setIsProcessing(true);
    setMessage('Analyzing PDF structure...');

    try {
      // First, let's test basic PDF loading
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Check PDF header
      const header = uint8Array.slice(0, 4);
      const headerString = String.fromCharCode(...header);
      
      const basicInfo = {
        fileName: file.name,
        fileSize: file.size,
        header: headerString,
        isValidPDF: headerString === '%PDF',
        arrayBufferSize: arrayBuffer.byteLength
      };

      setDebugInfo(basicInfo);
      setMessage('Basic PDF analysis complete. Check debug info below.');

    } catch (error: any) {
      console.error('Error analyzing PDF:', error);
      setMessage(`Error analyzing PDF: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTestPageAccess = async () => {
    if (!file) {
      setMessage('Please select a PDF file first.');
      return;
    }

    setIsProcessing(true);
    setMessage('Testing page access with different operations...');

    try {
      const tests = [];
      
      // Test 1: Rotate with page range
      try {
        const formData1 = new FormData();
        formData1.append('file', file);
        formData1.append('operation', 'rotate');
        formData1.append('options', JSON.stringify({
          angle: 90,
          pageRange: '1'
        }));

        const response1 = await fetch('/api/pdf/process', {
          method: 'POST',
          body: formData1,
        });

        tests.push({
          test: 'Rotate page 1',
          success: response1.ok,
          status: response1.status,
          error: response1.ok ? null : await response1.text()
        });
      } catch (error) {
        tests.push({
          test: 'Rotate page 1',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 2: Rotate with range
      try {
        const formData2 = new FormData();
        formData2.append('file', file);
        formData2.append('operation', 'rotate');
        formData2.append('options', JSON.stringify({
          angle: 90,
          pageRange: '1-2'
        }));

        const response2 = await fetch('/api/pdf/process', {
          method: 'POST',
          body: formData2,
        });

        tests.push({
          test: 'Rotate pages 1-2',
          success: response2.ok,
          status: response2.status,
          error: response2.ok ? null : await response2.text()
        });
      } catch (error) {
        tests.push({
          test: 'Rotate pages 1-2',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 3: Crop
      try {
        const formData3 = new FormData();
        formData3.append('file', file);
        formData3.append('operation', 'crop');
        formData3.append('options', JSON.stringify({
          crop: { top: 5, right: 5, bottom: 5, left: 5, unit: 'mm' }
        }));

        const response3 = await fetch('/api/pdf/process', {
          method: 'POST',
          body: formData3,
        });

        tests.push({
          test: 'Crop PDF',
          success: response3.ok,
          status: response3.status,
          error: response3.ok ? null : await response3.text()
        });
      } catch (error) {
        tests.push({
          test: 'Crop PDF',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      setDebugInfo({ ...debugInfo, tests });
      setMessage('Page access tests completed. Check results below.');

    } catch (error: any) {
      console.error('Error testing page access:', error);
      setMessage(`Error testing page access: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">PDF Page Debug Tool</h1>
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-4xl">
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
          <p className="mt-4 text-gray-700">Selected file: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
        )}
        
        <div className="mt-6 flex gap-4">
          <button
            onClick={handleDebugPDF}
            disabled={!file || isProcessing}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded
              disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Analyzing...' : 'Analyze PDF'}
          </button>
          
          <button
            onClick={handleTestPageAccess}
            disabled={!file || isProcessing}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded
              disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Testing...' : 'Test Page Access'}
          </button>
        </div>

        {message && (
          <p className="mt-4 text-center text-sm text-gray-600">{message}</p>
        )}

        {debugInfo && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-4">Debug Information</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Basic PDF Info</h4>
                <pre className="text-xs bg-white p-3 rounded border overflow-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>

              {debugInfo.tests && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Page Access Tests</h4>
                  <div className="space-y-2">
                    {debugInfo.tests.map((test: any, index: number) => (
                      <div key={index} className={`p-3 rounded border ${
                        test.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{test.test}</span>
                          <span className={`text-sm ${test.success ? 'text-green-600' : 'text-red-600'}`}>
                            {test.success ? '✓ Success' : '✗ Failed'}
                          </span>
                        </div>
                        {test.error && (
                          <p className="text-xs text-red-600 mt-1">{test.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">What This Tool Does:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Analyze PDF:</strong> Checks PDF header, file size, and basic structure</li>
            <li>• <strong>Test Page Access:</strong> Tests rotate and crop operations with different page ranges</li>
            <li>• <strong>Debug Info:</strong> Shows detailed information about PDF processing</li>
            <li>• <strong>Error Detection:</strong> Identifies specific issues with page number handling</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
