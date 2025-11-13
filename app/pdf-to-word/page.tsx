'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';

const BENEFITS = [
  'Preserve fonts, tables, and layout as much as possible.',
  'Edit text immediately in Microsoft Word or Google Docs.',
  'Works in your browser—no software download required.',
];

const HOW_IT_WORKS = [
  'Upload the PDF document you want to edit.',
  'We convert it to an editable Word file while keeping formatting.',
  'Download the DOCX file and continue editing anywhere.',
];

export default function PDFToWordPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File | null) => {
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setErrorMessage('');
    } else if (selectedFile) {
      setErrorMessage('Please upload a PDF file.');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    handleFileSelect(droppedFile ?? null);
  };

  const handleConvert = async () => {
    if (!file) {
      setErrorMessage('Please select a PDF file first.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('operation', 'pdf-to-word');

      const response = await fetch('/api/pdf/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to convert PDF to Word');
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Generated Word document is empty');
      }

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.name.replace(/\.pdf$/i, '.docx');
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (error: any) {
      console.error('PDF to Word conversion failed:', error);
      setErrorMessage(error.message || 'Failed to convert PDF to Word');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link
            href="/tools"
            className="mb-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to tools
          </Link>
          <h1 className="mb-4 text-4xl font-bold text-gray-900">PDF to Word</h1>
          <p className="text-lg text-gray-600">
            Convert your PDF into an editable Word document while keeping the original formatting as much as possible.
          </p>
        </div>

        {/* Upload area */}
        <div
          className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-3xl">
            📄
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            {isDragOver ? 'Drop your PDF here' : 'Choose a PDF file or drag it here'}
          </h3>
          <p className="mb-4 text-gray-600">Upload the PDF you’d like to convert to Word.</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
          >
            Choose File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
            className="hidden"
          />
        </div>

        {/* File info and action */}
        {file && (
          <div className="mt-6 space-y-6">
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📄</span>
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="text-gray-400 transition hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={handleConvert}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isProcessing ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Converting…
                  </>
                ) : (
                  'Convert to Word'
                )}
              </button>
            </div>
          </div>
        )}

        {errorMessage && (
          <p className="mt-4 text-center text-sm text-red-500">
            {errorMessage}
          </p>
        )}

        {/* How it works */}
        <div className="mt-12 rounded-lg bg-blue-50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">How to convert PDF to Word</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {HOW_IT_WORKS.map((step, index) => (
              <div key={index} className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg">
                  {index + 1}
                </div>
                <p className="text-sm text-gray-600">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Why choose this converter?</h3>
          <ul className="grid gap-4 md:grid-cols-2">
            {BENEFITS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-gray-600">
                <span className="text-blue-500">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}