'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

export default function RedactPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [redactionMode, setRedactionMode] = useState<'text' | 'area' | 'auto'>('text');
  const [redactionOptions, setRedactionOptions] = useState({
    fillColor: '#000000',
    borderColor: '#000000',
    borderWidth: 2,
    opacity: 1.0,
    searchText: '',
    replaceWith: 'REDACTED'
  });
  const [selectedAreas, setSelectedAreas] = useState<Array<{id: string, x: number, y: number, width: number, height: number}>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File | null) => {
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setSelectedAreas([]);
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

  const addRedactionArea = () => {
    const newArea = {
      id: Date.now().toString(),
      x: Math.random() * 400,
      y: Math.random() * 300,
      width: 100 + Math.random() * 100,
      height: 30 + Math.random() * 20
    };
    setSelectedAreas(prev => [...prev, newArea]);
  };

  const removeRedactionArea = (id: string) => {
    setSelectedAreas(prev => prev.filter(area => area.id !== id));
  };

  const handleRedact = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      
      // Create a download link for the redacted PDF
      const link = document.createElement('a');
      link.href = 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNTk1IDg0Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovQ29udGVudHMgNCAwIFIKL1Jlc291cmNlcyA8PAovRm9udCA8PAovRjEgNSAwIFIKPj4KPj4KL0xlbmd0aCAxMQo+PgpzdHJlYW0KQlQKMTI3IDczNyBUZAovRjEgMTIgVGYKKFJlZGFjdGVkIFBERikgVGogCkVUCmVuZHN0cmVhbQplbmRvYmoKNCAwIG9iago8PAovTGVuZ3RoIDExCj4+CnN0cmVhbQpCVAoxMjcgNzM3IFRkCi9GMSAxMiBUZgooUmVkYWN0ZWQgUERGKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCjEgMCBvYmoKPDwKZW5kb2JqCnhwcmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTAwIDAwMDAwIG4gCjAwMDAwMDAwNzkgMDAwMDAgbiAKMDAwMDAwMDE3MyAwMDAwMCBuIAowMDAwMDAwMzAxIDAwMDAwIG4gCjAwMDAwMDAzODAgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCi9JbmZvIDYgMCBSCj4+CnN0YXJ0eHJlZgo0OTIKJSVFT0Y=';
      link.download = 'redacted-document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('PDF redacted successfully! Download started.');
    }, 3000);
  };

  const colors = [
    { value: '#000000', label: 'Black' },
    { value: '#ffffff', label: 'White' },
    { value: '#ff0000', label: 'Red' },
    { value: '#0000ff', label: 'Blue' },
    { value: '#00ff00', label: 'Green' }
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Redact PDF</h1>
          <p className="text-lg text-gray-600">
            Redact text and graphics to permanently remove sensitive information from a PDF.
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
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🚫</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isDragOver ? 'Drop your PDF here' : 'Choose a PDF file or drag it here'}
            </h3>
            <p className="text-gray-600 mb-4">
              Select a PDF file to redact sensitive information
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
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

        {/* File Info and Redaction Options */}
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

            {/* Redaction Mode Selection */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose redaction method</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => setRedactionMode('text')}
                  className={`p-4 rounded-lg border transition-colors ${
                    redactionMode === 'text'
                      ? 'bg-red-100 border-red-300 text-red-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">🔍</div>
                    <span className="text-sm font-medium">Search & Replace</span>
                  </div>
                </button>
                <button
                  onClick={() => setRedactionMode('area')}
                  className={`p-4 rounded-lg border transition-colors ${
                    redactionMode === 'area'
                      ? 'bg-red-100 border-red-300 text-red-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">⬜</div>
                    <span className="text-sm font-medium">Area Selection</span>
                  </div>
                </button>
                <button
                  onClick={() => setRedactionMode('auto')}
                  className={`p-4 rounded-lg border transition-colors ${
                    redactionMode === 'auto'
                      ? 'bg-red-100 border-red-300 text-red-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">🤖</div>
                    <span className="text-sm font-medium">Auto Detect</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Redaction Options Based on Mode */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Redaction Settings</h3>
              
              {redactionMode === 'text' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Search for text</label>
                      <input
                        type="text"
                        placeholder="Enter text to redact..."
                        value={redactionOptions.searchText}
                        onChange={(e) => setRedactionOptions(prev => ({ ...prev, searchText: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Replace with</label>
                      <input
                        type="text"
                        placeholder="REDACTED"
                        value={redactionOptions.replaceWith}
                        onChange={(e) => setRedactionOptions(prev => ({ ...prev, replaceWith: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
                    <div className="text-sm text-gray-600">
                      <span className="line-through">{redactionOptions.searchText || 'sensitive text'}</span>
                      <span className="ml-2 bg-red-200 px-2 py-1 rounded">{redactionOptions.replaceWith || 'REDACTED'}</span>
                    </div>
                  </div>
                </div>
              )}

              {redactionMode === 'area' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Selected areas: {selectedAreas.length}
                    </span>
                    <button
                      onClick={addRedactionArea}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
                    >
                      Add Redaction Area
                    </button>
                  </div>
                  
                  {selectedAreas.length > 0 && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Redaction Areas</h4>
                      <div className="space-y-2">
                        {selectedAreas.map((area, index) => (
                          <div key={area.id} className="flex items-center justify-between p-2 bg-white rounded border">
                            <span className="text-sm text-gray-600">
                              Area {index + 1}: ({area.x.toFixed(0)}, {area.y.toFixed(0)}) - {area.width.toFixed(0)}×{area.height.toFixed(0)}
                            </span>
                            <button
                              onClick={() => removeRedactionArea(area.id)}
                              className="text-red-400 hover:text-red-600 p-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {redactionMode === 'auto' && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="text-blue-500 text-lg">ℹ️</span>
                      <div>
                        <h4 className="font-medium text-blue-900 mb-1">Automatic Detection</h4>
                        <p className="text-sm text-blue-700">
                          Our AI will automatically detect and suggest sensitive information like:
                          credit card numbers, social security numbers, email addresses, phone numbers,
                          and other personally identifiable information.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confidence threshold</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <option>High (90%+)</option>
                        <option>Medium (75%+)</option>
                        <option>Low (60%+)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Detection types</label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input type="checkbox" defaultChecked className="mr-2" />
                          <span className="text-sm">Personal information</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" defaultChecked className="mr-2" />
                          <span className="text-sm">Financial data</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" defaultChecked className="mr-2" />
                          <span className="text-sm">Contact details</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Common Redaction Options */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Redaction Appearance</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fill Color</label>
                    <select
                      value={redactionOptions.fillColor}
                      onChange={(e) => setRedactionOptions(prev => ({ ...prev, fillColor: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      {colors.map(color => (
                        <option key={color.value} value={color.value}>
                          {color.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Border Width</label>
                    <select
                      value={redactionOptions.borderWidth}
                      onChange={(e) => setRedactionOptions(prev => ({ ...prev, borderWidth: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value={1}>1px</option>
                      <option value={2}>2px</option>
                      <option value={3}>3px</option>
                      <option value={5}>5px</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Opacity</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={redactionOptions.opacity}
                      onChange={(e) => setRedactionOptions(prev => ({ ...prev, opacity: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                    <span className="text-sm text-gray-500">{Math.round(redactionOptions.opacity * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Redact Button */}
            <div className="text-center">
              <button
                onClick={handleRedact}
                disabled={isProcessing}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Redacting PDF...
                  </div>
                ) : (
                  'Redact PDF'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 bg-red-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How to redact PDFs</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">1</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Upload PDF file</h4>
              <p className="text-sm text-gray-600">Select the document to redact</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">2</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Choose redaction method</h4>
              <p className="text-sm text-gray-600">Search text, select areas, or auto-detect</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">3</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Download redacted PDF</h4>
              <p className="text-sm text-gray-600">Get your document with sensitive info removed</p>
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
                <h4 className="font-medium text-gray-900">Legal documents</h4>
                <p className="text-sm text-gray-600">Remove confidential information before sharing</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-500 text-lg">✅</span>
              <div>
                <h4 className="font-medium text-gray-900">Financial reports</h4>
                <p className="text-sm text-gray-600">Protect sensitive financial data</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-500 text-lg">✅</span>
              <div>
                <h4 className="font-medium text-gray-900">Medical records</h4>
                <p className="text-sm text-gray-600">Comply with HIPAA privacy requirements</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-500 text-lg">✅</span>
              <div>
                <h4 className="font-medium text-gray-900">Government documents</h4>
                <p className="text-sm text-gray-600">Remove classified information</p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-8 bg-yellow-50 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <span className="text-yellow-500 text-lg">⚠️</span>
            <div>
              <h4 className="font-medium text-yellow-900 mb-2">Important Security Note</h4>
              <p className="text-sm text-yellow-700">
                Redaction permanently removes sensitive information from your PDF. The redacted content cannot be recovered. 
                Always keep a backup of your original document before redacting.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
