'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

export default function ExtractPagesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [extractMode, setExtractMode] = useState<'range' | 'individual'>('individual');
  const [pageRange, setPageRange] = useState({ start: 1, end: 1 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File | null) => {
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      // Simulate getting page count - in real app, you'd parse the PDF
      const pages = Math.floor(Math.random() * 20) + 5;
      setTotalPages(pages);
      setPageRange({ start: 1, end: pages });
      setSelectedPages([]);
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

  const togglePage = (pageNumber: number) => {
    setSelectedPages(prev => 
      prev.includes(pageNumber)
        ? prev.filter(p => p !== pageNumber)
        : [...prev, pageNumber]
    );
  };

  const selectAllPages = () => {
    setSelectedPages(Array.from({ length: totalPages }, (_, i) => i + 1));
  };

  const deselectAllPages = () => {
    setSelectedPages([]);
  };

  const handleExtractPages = async () => {
    if (!file) return;
    
    let pagesToExtract: number[] = [];
    if (extractMode === 'range') {
      pagesToExtract = Array.from(
        { length: pageRange.end - pageRange.start + 1 }, 
        (_, i) => pageRange.start + i
      );
    } else {
      pagesToExtract = selectedPages;
    }
    
    if (pagesToExtract.length === 0) return;
    
    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      
      // Create a download link for the extracted pages PDF
      const link = document.createElement('a');
      link.href = 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNTk1IDg0Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovQ29udGVudHMgNCAwIFIKL1Jlc291cmNlcyA8PAovRm9udCA8PAovRjEgNSAwIFIKPj4KPj4KL0xlbmd0aCAxMQo+PgpzdHJlYW0KQlQKMTI3IDczNyBUZAovRjEgMTIgVGYKKEV4dHJhY3RlZCBQYWdlcykgVGogCkVUCmVuZHN0cmVhbQplbmRvYmoKNCAwIG9iago8PAovTGVuZ3RoIDExCj4+CnN0cmVhbQpCVAoxMjcgNzM3IFRkCi9GMSAxMiBUZgooRXh0cmFjdGVkIFBhZ2VzKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCjEgMCBvYmoKPDwKZW5kb2JqCnhwcmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTAwIDAwMDAwIG4gCjAwMDAwMDAwNzkgMDAwMDAgbiAKMDAwMDAwMDE3MyAwMDAwMCBuIAowMDAwMDAwMzAxIDAwMDAwIG4gCjAwMDAwMDAzODAgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCi9JbmZvIDYgMCBSCj4+CnN0YXJ0eHJlZgo0OTIKJSVFT0Y=';
      link.download = 'extracted-pages.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert(`Pages ${pagesToExtract.join(', ')} extracted successfully! Download started.`);
    }, 2000);
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Extract Pages</h1>
          <p className="text-lg text-gray-600">
            Extract specific pages from your PDF documents.
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
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📑</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isDragOver ? 'Drop your PDF file here' : 'Choose a PDF file or drag it here'}
            </h3>
            <p className="text-gray-600 mb-4">
              Select a PDF file to extract specific pages
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
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

        {/* File Info and Page Selection */}
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
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {totalPages} pages
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setSelectedPages([]);
                    setTotalPages(0);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Extraction Mode Selection */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose extraction method</h3>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="extractMode"
                    value="individual"
                    checked={extractMode === 'individual'}
                    onChange={(e) => setExtractMode(e.target.value as 'individual' | 'range')}
                    className="mr-2"
                  />
                  <span>Select individual pages</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="extractMode"
                    value="range"
                    checked={extractMode === 'range'}
                    onChange={(e) => setExtractMode(e.target.value as 'individual' | 'range')}
                    className="mr-2"
                  />
                  <span>Extract page range</span>
                </label>
              </div>

              {extractMode === 'range' ? (
                <div className="flex items-center gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From page</label>
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={pageRange.start}
                      onChange={(e) => setPageRange(prev => ({ ...prev, start: parseInt(e.target.value) || 1 }))}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To page</label>
                    <input
                      type="number"
                      min={pageRange.start}
                      max={totalPages}
                      value={pageRange.end}
                      onChange={(e) => setPageRange(prev => ({ ...prev, end: parseInt(e.target.value) || prev.start }))}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    {pageRange.end - pageRange.start + 1} pages will be extracted
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">
                      Select pages to extract ({selectedPages.length} selected)
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={selectAllPages}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                      >
                        Select All
                      </button>
                      <button
                        onClick={deselectAllPages}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
                      <button
                        key={pageNumber}
                        onClick={() => togglePage(pageNumber)}
                        className={`p-2 text-sm font-medium rounded border transition-colors ${
                          selectedPages.includes(pageNumber)
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Extract Button */}
            <div className="text-center">
              <button
                onClick={handleExtractPages}
                disabled={isProcessing}
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Extracting pages...
                  </div>
                ) : (
                  'Extract Pages'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 bg-orange-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How to extract PDF pages</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">1</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Upload PDF file</h4>
              <p className="text-sm text-gray-600">Select a PDF file from your device</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">2</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Select pages</h4>
              <p className="text-sm text-gray-600">Choose individual pages or a page range</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">3</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Download result</h4>
              <p className="text-sm text-gray-600">Get your extracted pages as a new PDF</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
