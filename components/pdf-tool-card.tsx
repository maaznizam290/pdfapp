'use client';

import { useState } from 'react';
import Link from 'next/link';

interface PDFTool {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  color: string;
  isNew: boolean;
}

interface PDFToolCardProps {
  tool: PDFTool;
}

export default function PDFToolCard({ tool }: PDFToolCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getToolPath = (toolId: string) => {
    const pathMap: { [key: string]: string } = {
      'merge-pdf': '/merge-pdf',
      'split-pdf': '/split-pdf',
      'compress-pdf': '/compress-pdf',
      'pdf-to-word': '/pdf-to-word',
      'word-to-pdf': '/word-to-pdf',
      'edit-pdf': '/edit-pdf',
      'watermark': '/watermark',
      'rotate-pdf': '/rotate-pdf',
      'unlock-pdf': '/unlock-pdf',
      'protect-pdf': '/protect-pdf',
      'sign-pdf': '/sign-pdf',
    };
    return pathMap[toolId] || '/';
  };

  return (
    <Link href={getToolPath(tool.id)}>
      <div
        className={`relative bg-white rounded-lg border border-gray-200 p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-blue-300 group ${
          isHovered ? 'transform -translate-y-1' : ''
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* New badge */}
        {tool.isNew && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
            NEW
          </div>
        )}

        {/* Icon */}
        <div className={`w-12 h-12 ${tool.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
          <span className="text-2xl">{tool.icon}</span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
          {tool.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 leading-relaxed">
          {tool.description}
        </p>

        {/* Hover effect indicator */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg 
            className="w-5 h-5 text-blue-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 5l7 7-7 7" 
            />
          </svg>
        </div>

        {/* Category badge */}
        <div className="absolute top-4 right-4">
          <span className="text-xs text-gray-400 uppercase tracking-wide">
            {tool.category}
          </span>
        </div>
      </div>
    </Link>
  );
}
