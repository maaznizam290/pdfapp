'use client';

import { useState } from 'react';
import PDFToolCard from './pdf-tool-card';

interface PDFToolsProps {
  selectedCategory: string;
}

export default function PDFTools({ selectedCategory }: PDFToolsProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const allTools = [
    // Organize PDF
    {
      id: 'merge-pdf',
      name: 'Merge PDF',
      description: 'Combine PDFs in the order you want with the easiest PDF merger available.',
      icon: '📄',
      category: 'organize',
      color: 'bg-blue-500',
      isNew: false,
    },
    {
      id: 'split-pdf',
      name: 'Split PDF',
      description: 'Separate one page or a whole set for easy conversion into independent PDF files.',
      icon: '✂️',
      category: 'organize',
      color: 'bg-green-500',
      isNew: false,
    },
    {
      id: 'organize-pdf',
      name: 'Organize PDF',
      description: 'Sort pages of your PDF file however you like. Delete PDF pages or add PDF pages.',
      icon: '📋',
      category: 'organize',
      color: 'bg-purple-500',
      isNew: false,
    },
    {
      id: 'remove-pages',
      name: 'Remove pages',
      description: 'Delete unwanted pages from your PDF documents easily.',
      icon: '🗑️',
      category: 'organize',
      color: 'bg-red-500',
      isNew: false,
    },
    {
      id: 'extract-pages',
      name: 'Extract pages',
      description: 'Extract specific pages from your PDF documents.',
      icon: '📑',
      category: 'organize',
      color: 'bg-orange-500',
      isNew: false,
    },

    // Optimize PDF
    {
      id: 'repair-pdf',
      name: 'Repair PDF',
      description: 'Repair a damaged PDF and recover data from corrupt PDF.',
      icon: '🔧',
      category: 'optimize',
      color: 'bg-yellow-500',
      isNew: false,
    },
    {
      id: 'ocr-pdf',
      name: 'OCR PDF',
      description: 'Easily convert scanned PDF into searchable and selectable documents.',
      icon: '👁️',
      category: 'optimize',
      color: 'bg-teal-500',
      isNew: false,
    },

    // Convert PDF
    {
      id: 'pdf-to-word',
      name: 'PDF to Word',
      description: 'Easily convert your PDF files into easy to edit DOC and DOCX documents.',
      icon: '📝',
      category: 'convert',
      color: 'bg-blue-600',
      isNew: false,
    },
    {
      id: 'pdf-to-powerpoint',
      name: 'PDF to PowerPoint',
      description: 'Turn your PDF files into easy to edit PPT and PPTX slideshows.',
      icon: '📊',
      category: 'convert',
      color: 'bg-orange-600',
      isNew: false,
    },
    {
      id: 'pdf-to-excel',
      name: 'PDF to Excel',
      description: 'Pull data straight from PDFs into Excel spreadsheets in a few short seconds.',
      icon: '📈',
      category: 'convert',
      color: 'bg-green-600',
      isNew: false,
    },
    {
      id: 'pdf-to-jpg',
      name: 'PDF to JPG',
      description: 'Convert each PDF page into a JPG or extract all images contained in a PDF.',
      icon: '🖼️',
      category: 'convert',
      color: 'bg-pink-500',
      isNew: false,
    },
    {
      id: 'word-to-pdf',
      name: 'Word to PDF',
      description: 'Make DOC and DOCX files easy to read by converting them to PDF.',
      icon: '📄',
      category: 'convert',
      color: 'bg-blue-500',
      isNew: false,
    },
    {
      id: 'powerpoint-to-pdf',
      name: 'PowerPoint to PDF',
      description: 'Make PPT and PPTX slideshows easy to view by converting them to PDF.',
      icon: '📊',
      category: 'convert',
      color: 'bg-orange-500',
      isNew: false,
    },
    {
      id: 'excel-to-pdf',
      name: 'Excel to PDF',
      description: 'Make EXCEL spreadsheets easy to read by converting them to PDF.',
      icon: '📈',
      category: 'convert',
      color: 'bg-green-500',
      isNew: false,
    },
    {
      id: 'jpg-to-pdf',
      name: 'JPG to PDF',
      description: 'Convert JPG images to PDF in seconds. Easily adjust orientation and margins.',
      icon: '🖼️',
      category: 'convert',
      color: 'bg-pink-500',
      isNew: false,
    },
    {
      id: 'html-to-pdf',
      name: 'HTML to PDF',
      description: 'Convert webpages in HTML to PDF. Copy and paste the URL of the page you want.',
      icon: '🌐',
      category: 'convert',
      color: 'bg-purple-500',
      isNew: false,
    },

    // Edit PDF
    {
      id: 'edit-pdf',
      name: 'Edit PDF',
      description: 'Add text, images, shapes or freehand annotations to a PDF document.',
      icon: '✏️',
      category: 'edit',
      color: 'bg-blue-500',
      isNew: true,
    },
    {
      id: 'watermark',
      name: 'Watermark',
      description: 'Stamp an image or text over your PDF in seconds. Choose typography and position.',
      icon: '💧',
      category: 'edit',
      color: 'bg-cyan-500',
      isNew: false,
    },
    {
      id: 'rotate-pdf',
      name: 'Rotate PDF',
      description: 'Rotate your PDFs the way you need them. You can even rotate multiple PDFs at once!',
      icon: '🔄',
      category: 'edit',
      color: 'bg-yellow-500',
      isNew: false,
    },
    {
      id: 'page-numbers',
      name: 'Page numbers',
      description: 'Add page numbers into PDFs with ease. Choose your positions and typography.',
      icon: '🔢',
      category: 'edit',
      color: 'bg-gray-500',
      isNew: false,
    },
    {
      id: 'crop-pdf',
      name: 'Crop PDF',
      description: 'Crop margins of PDF documents or select specific areas.',
      icon: '✂️',
      category: 'edit',
      color: 'bg-green-500',
      isNew: true,
    },

    // PDF Security
    {
      id: 'unlock-pdf',
      name: 'Unlock PDF',
      description: 'Remove PDF password security, giving you the freedom to use your PDFs as you want.',
      icon: '🔓',
      category: 'security',
      color: 'bg-green-500',
      isNew: false,
    },
    {
      id: 'protect-pdf',
      name: 'Protect PDF',
      description: 'Protect PDF files with a password. Encrypt PDF documents to prevent unauthorized access.',
      icon: '🔒',
      category: 'security',
      color: 'bg-red-500',
      isNew: false,
    },
    {
      id: 'sign-pdf',
      name: 'Sign PDF',
      description: 'Sign yourself or request electronic signatures from others.',
      icon: '✍️',
      category: 'security',
      color: 'bg-blue-500',
      isNew: false,
    },
    {
      id: 'redact-pdf',
      name: 'Redact PDF',
      description: 'Redact text and graphics to permanently remove sensitive information from a PDF.',
      icon: '⚫',
      category: 'security',
      color: 'bg-black',
      isNew: true,
    },
    {
      id: 'compare-pdf',
      name: 'Compare PDF',
      description: 'Show a side-by-side document comparison and easily spot changes between different file versions.',
      icon: '🔍',
      category: 'security',
      color: 'bg-purple-500',
      isNew: true,
    },
  ];

  const filteredTools = selectedCategory === 'all' 
    ? allTools 
    : allTools.filter(tool => tool.category === selectedCategory);

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
    // Handle file drop logic here
  };

  return (
    <div 
      className={`min-h-96 rounded-lg border-2 border-dashed transition-colors ${
        isDragOver 
          ? 'border-blue-400 bg-blue-50' 
          : 'border-gray-300 bg-gray-50'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {selectedCategory === 'all' ? 'All PDF Tools' : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Tools`}
          </h2>
          <p className="text-gray-600">
            {isDragOver ? 'Drop your files here' : 'Drag and drop your files here or click to browse'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTools.map((tool) => (
            <PDFToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </div>
    </div>
  );
}
