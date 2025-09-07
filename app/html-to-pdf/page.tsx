'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import SuccessModal from '@/components/success-modal';

export default function HTMLToPDFPage() {
  const [htmlContent, setHtmlContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [processedFileInfo, setProcessedFileInfo] = useState<{
    fileName: string;
    fileSize: number;
    downloadUrl: string;
  } | null>(null);
  const [pageSize, setPageSize] = useState('A4');
  const [orientation, setOrientation] = useState('portrait');
  const [margin, setMargin] = useState('20');

  const handleConvert = async () => {
    if (!htmlContent.trim()) {
      alert('Please enter HTML content to convert.');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      console.log('Starting HTML to PDF conversion');
      
      // For now, we'll create a simple HTML file and provide instructions
      // In a real implementation, you'd use a service like Puppeteer or similar
      const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
      const htmlUrl = URL.createObjectURL(htmlBlob);
      
      // Create a simple instruction file
      const instructions = `HTML to PDF Conversion Instructions

Your HTML content has been prepared for conversion.

To convert HTML to PDF:

1. Open the HTML file in your browser
2. Press Ctrl+P (or Cmd+P on Mac) to print
3. Select "Save as PDF" as the destination
4. Choose your preferred settings:
   - Page size: ${pageSize}
   - Orientation: ${orientation}
   - Margins: ${margin}mm

Alternative methods:
- Use online HTML to PDF converters
- Use browser extensions
- Use professional PDF conversion tools

HTML file size: ${htmlBlob.size} bytes
Generated: ${new Date().toLocaleString()}`;

      const instructionBlob = new Blob([instructions], { type: 'text/plain' });
      const downloadUrl = URL.createObjectURL(instructionBlob);
      const fileName = `html-to-pdf-instructions-${new Date().toISOString().slice(0, 10)}.txt`;
      
      // Trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.style.display = 'none';
      link.setAttribute('download', fileName);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up URLs
      URL.revokeObjectURL(downloadUrl);
      URL.revokeObjectURL(htmlUrl);
      
      // Set success modal data
      setProcessedFileInfo({
        fileName,
        fileSize: instructionBlob.size,
        downloadUrl: ''
      });
      
      // Show success modal
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('Error converting HTML to PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to convert HTML to PDF: ${errorMessage}. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePreview = () => {
    if (!htmlContent.trim()) {
      alert('Please enter HTML content to preview.');
      return;
    }
    
    const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
    const htmlUrl = URL.createObjectURL(htmlBlob);
    window.open(htmlUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">HTML to PDF</h1>
          <p className="text-lg text-gray-600">
            Convert HTML content to PDF format with customizable settings.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* HTML Input Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">HTML Content</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handlePreview}
                    className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => setHtmlContent('')}
                    className="px-4 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
              
              <textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="Enter your HTML content here...

Example:
<!DOCTYPE html>
<html>
<head>
    <title>My Document</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>Hello World</h1>
    <p>This is a sample HTML document.</p>
</body>
</html>"
                className="w-full h-96 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
              
              <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <span>Characters: {htmlContent.length}</span>
                <span>Lines: {htmlContent.split('\n').length}</span>
              </div>
            </div>
          </div>

          {/* Settings Section */}
          <div className="space-y-6">
            {/* PDF Settings */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">PDF Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Page Size
                  </label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="A4">A4</option>
                    <option value="A3">A3</option>
                    <option value="Letter">Letter</option>
                    <option value="Legal">Legal</option>
                    <option value="Tabloid">Tabloid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Orientation
                  </label>
                  <select
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Margins: {margin}mm
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="5"
                    value={margin}
                    onChange={(e) => setMargin(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Quick Templates */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Templates</h3>
              
              <div className="space-y-2">
                <button
                  onClick={() => setHtmlContent(`<!DOCTYPE html>
<html>
<head>
    <title>Simple Document</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
        p { margin-bottom: 15px; }
    </style>
</head>
<body>
    <h1>Document Title</h1>
    <p>This is a simple document template. You can edit this content as needed.</p>
    <p>Add more paragraphs, images, or any HTML content you want to convert to PDF.</p>
</body>
</html>`)}
                  className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Simple Document
                </button>
                
                <button
                  onClick={() => setHtmlContent(`<!DOCTYPE html>
<html>
<head>
    <title>Invoice</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .total { font-weight: bold; font-size: 1.2em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>INVOICE</h1>
        <p>Invoice #: INV-001</p>
    </div>
    
    <div class="invoice-details">
        <div>
            <strong>From:</strong><br>
            Your Company Name<br>
            Address Line 1<br>
            City, State ZIP
        </div>
        <div>
            <strong>To:</strong><br>
            Client Name<br>
            Client Address<br>
            City, State ZIP
        </div>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Service Description</td>
                <td>1</td>
                <td>$100.00</td>
                <td>$100.00</td>
            </tr>
        </tbody>
    </table>
    
    <div class="total" style="text-align: right; margin-top: 20px;">
        Total: $100.00
    </div>
</body>
</html>`)}
                  className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Invoice Template
                </button>
                
                <button
                  onClick={() => setHtmlContent(`<!DOCTYPE html>
<html>
<head>
    <title>Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { color: #2c3e50; text-align: center; }
        h2 { color: #34495e; border-left: 4px solid #3498db; padding-left: 15px; }
        .summary { background-color: #ecf0f1; padding: 20px; border-radius: 5px; margin: 20px 0; }
        ul { margin-left: 20px; }
    </style>
</head>
<body>
    <h1>Project Report</h1>
    
    <div class="summary">
        <h2>Executive Summary</h2>
        <p>This report provides an overview of the project status and key findings.</p>
    </div>
    
    <h2>Key Findings</h2>
    <ul>
        <li>Finding 1: Description of the first key finding</li>
        <li>Finding 2: Description of the second key finding</li>
        <li>Finding 3: Description of the third key finding</li>
    </ul>
    
    <h2>Recommendations</h2>
    <p>Based on the analysis, the following recommendations are made:</p>
    <ul>
        <li>Recommendation 1</li>
        <li>Recommendation 2</li>
        <li>Recommendation 3</li>
    </ul>
</body>
</html>`)}
                  className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Report Template
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Convert Button */}
        {htmlContent.trim() && (
          <div className="mt-8 text-center">
            <button
              onClick={handleConvert}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Converting to PDF...
                </div>
              ) : (
                'Convert to PDF'
              )}
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How to convert HTML to PDF</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">1</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Enter HTML content</h4>
              <p className="text-sm text-gray-600">Paste or type your HTML code</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">2</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Customize settings</h4>
              <p className="text-sm text-gray-600">Set page size, orientation, and margins</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">3</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Convert and download</h4>
              <p className="text-sm text-gray-600">Get conversion instructions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {processedFileInfo && (
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            setProcessedFileInfo(null);
          }}
          title="HTML to PDF Conversion Ready!"
          message="Instructions for converting your HTML to PDF have been generated."
          fileName={processedFileInfo.fileName}
          fileSize={processedFileInfo.fileSize}
          downloadUrl={processedFileInfo.downloadUrl}
        />
      )}
    </div>
  );
}
