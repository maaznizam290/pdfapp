'use client';

import Link from 'next/link';

export default function ToolsPage() {
  const pdfTools = [
    {
      name: 'Merge PDF',
      description: 'Combine multiple PDF files into one document',
      icon: '📄',
      href: '/merge-pdf',
      category: 'Edit'
    },
    {
      name: 'Split PDF',
      description: 'Split a PDF into multiple separate files',
      icon: '✂️',
      href: '/split-pdf',
      category: 'Edit'
    },
    {
      name: 'Compress PDF',
      description: 'Reduce PDF file size while maintaining quality',
      icon: '🗜️',
      href: '/compress-pdf',
      category: 'Optimize'
    },
    {
      name: 'Convert PDF',
      description: 'Convert PDF to Word, Excel, PowerPoint, or images',
      icon: '🔄',
      href: '/pdf-to-word',
      category: 'Convert'
    },
    {
      name: 'Word to PDF',
      description: 'Convert Word documents to PDF format',
      icon: '📝',
      href: '/word-to-pdf',
      category: 'Convert'
    },
    {
      name: 'Excel to PDF',
      description: 'Convert Excel spreadsheets to PDF format',
      icon: '📊',
      href: '/excel-to-pdf',
      category: 'Convert'
    },
    {
      name: 'PowerPoint to PDF',
      description: 'Convert PowerPoint presentations to PDF format',
      icon: '📈',
      href: '/powerpoint-to-pdf',
      category: 'Convert'
    },
    {
      name: 'JPG to PDF',
      description: 'Convert JPG images to PDF format',
      icon: '🖼️',
      href: '/jpg-to-pdf',
      category: 'Convert'
    },
    {
      name: 'PDF to JPG',
      description: 'Convert PDF pages to JPG images',
      icon: '🖼️',
      href: '/pdf-to-jpg',
      category: 'Convert'
    },
    {
      name: 'PDF to Excel',
      description: 'Convert PDF tables to Excel spreadsheets',
      icon: '📊',
      href: '/pdf-to-excel',
      category: 'Convert'
    },
    {
      name: 'PDF to PowerPoint',
      description: 'Convert PDF to PowerPoint presentation',
      icon: '📈',
      href: '/pdf-to-powerpoint',
      category: 'Convert'
    },
    {
      name: 'Rotate PDF',
      description: 'Rotate PDF pages in any direction',
      icon: '🔄',
      href: '/rotate-pdf',
      category: 'Edit'
    },
    {
      name: 'Protect PDF',
      description: 'Add password protection to PDF files',
      icon: '🔒',
      href: '/protect-pdf',
      category: 'Security'
    },
    {
      name: 'Unlock PDF',
      description: 'Remove password protection from PDF files',
      icon: '🔓',
      href: '/unlock-pdf',
      category: 'Security'
    },
    {
      name: 'Sign PDF',
      description: 'Add digital signatures to PDF documents',
      icon: '✍️',
      href: '/sign-pdf',
      category: 'Security'
    },
    {
      name: 'Watermark PDF',
      description: 'Add text or image watermarks to PDF files',
      icon: '💧',
      href: '/watermark',
      category: 'Edit'
    },
    {
      name: 'Extract Pages',
      description: 'Extract specific pages from PDF documents',
      icon: '📑',
      href: '/extract-pages',
      category: 'Edit'
    },
    {
      name: 'Remove Pages',
      description: 'Remove unwanted pages from PDF files',
      icon: '🗑️',
      href: '/remove-pages',
      category: 'Edit'
    },
    {
      name: 'Add Page Numbers',
      description: 'Add page numbers to PDF documents',
      icon: '🔢',
      href: '/page-numbers',
      category: 'Edit'
    },
    {
      name: 'Repair PDF',
      description: 'Fix corrupted or damaged PDF files',
      icon: '🔧',
      href: '/repair-pdf',
      category: 'Optimize'
    },
    {
      name: 'OCR PDF',
      description: 'Extract text from scanned PDF documents',
      icon: '👁️',
      href: '/ocr-pdf',
      category: 'Convert'
    },
    {
      name: 'Redact PDF',
      description: 'Remove sensitive information from PDF files',
      icon: '⚫',
      href: '/redact-pdf',
      category: 'Security'
    },
    {
      name: 'Organize PDF',
      description: 'Rearrange and organize PDF pages',
      icon: '📋',
      href: '/organize-pdf',
      category: 'Edit'
    },
    {
      name: 'Compare PDF',
      description: 'Compare two PDF files and find differences',
      icon: '📊',
      href: '/compare-pdf',
      category: 'Analyze'
    },
    {
      name: 'HTML to PDF',
      description: 'Convert HTML content to PDF format',
      icon: '🌐',
      href: '/html-to-pdf',
      category: 'Convert'
    },
    {
      name: 'Crop PDF',
      description: 'Crop PDF pages to remove unwanted margins',
      icon: '✂️',
      href: '/crop-pdf',
      category: 'Edit'
    }
  ];

  const categories = {
    'Convert': { color: 'bg-blue-100 text-blue-800', icon: '🔄' },
    'Edit': { color: 'bg-green-100 text-green-800', icon: '✏️' },
    'Security': { color: 'bg-red-100 text-red-800', icon: '🔒' },
    'Optimize': { color: 'bg-purple-100 text-purple-800', icon: '⚡' },
    'Analyze': { color: 'bg-orange-100 text-orange-800', icon: '📊' }
  };

  const groupedTools = pdfTools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, typeof pdfTools>);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to home
          </Link>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">PDF Tools Dashboard</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Access all your PDF tools in one place. Choose from {pdfTools.length} powerful tools to work with PDF documents.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{pdfTools.length}</div>
            <div className="text-gray-600">Total Tools</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{Object.keys(categories).length}</div>
            <div className="text-gray-600">Categories</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">100%</div>
            <div className="text-gray-600">Free to Use</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">∞</div>
            <div className="text-gray-600">Unlimited Files</div>
          </div>
        </div>

        {/* Tools by Category */}
        {Object.entries(groupedTools).map(([category, tools]) => (
          <div key={category} className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">{categories[category as keyof typeof categories].icon}</span>
              <h2 className="text-2xl font-bold text-gray-900">{category}</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${categories[category as keyof typeof categories].color}`}>
                {tools.length} tools
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {tools.map((tool) => (
                <Link
                  key={tool.name}
                  href={tool.href}
                  className="group bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 p-6 hover:border-blue-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl group-hover:scale-110 transition-transform duration-200">
                      {tool.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                        {tool.name}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-700">
                    Use Tool
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Popular Tools */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Most Popular Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pdfTools.slice(0, 3).map((tool) => (
              <Link
                key={tool.name}
                href={tool.href}
                className="group bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 p-6 hover:border-blue-300"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-2xl">{tool.icon}</div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {tool.name}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {tool.description}
                </p>
                <div className="flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-700">
                  Try Now
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Why Choose Our PDF Tools?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure & Private</h3>
              <p className="text-gray-600">
                All files are processed securely and deleted immediately after processing. Your privacy is our priority.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast Processing</h3>
              <p className="text-gray-600">
                Our tools are optimized for speed. Process your PDFs in seconds, not minutes.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💯</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">High Quality</h3>
              <p className="text-gray-600">
                Maintain the highest quality output with our advanced PDF processing algorithms.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
