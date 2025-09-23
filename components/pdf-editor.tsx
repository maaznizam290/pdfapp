'use client';

import { useState, useRef, useEffect } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface PDFEditorProps {
  file: File;
  onSave: (editedPdf: Uint8Array) => void;
  onCancel: () => void;
}

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  page: number;
}

interface ImageElement {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

export default function PDFEditor({ file, onSave, onCancel }: PDFEditorProps) {
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [editMode, setEditMode] = useState<'text' | 'image' | 'annotation'>('text');
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [imageElements, setImageElements] = useState<ImageElement[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newText, setNewText] = useState('');
  const [fontSize, setFontSize] = useState(12);
  const [textColor, setTextColor] = useState('#000000');
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [zoom, setZoom] = useState(100);
  const [viewMode, setViewMode] = useState<'fit-width' | 'fit-page' | 'actual-size'>('fit-width');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    loadPDF();
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [file]);

  // Update iframe when zoom, view mode, or page changes
  useEffect(() => {
    if (iframeRef.current && pdfUrl) {
      const viewParam = viewMode === 'fit-width' ? 'FitH' : viewMode === 'fit-page' ? 'FitV' : 'Fit';
      iframeRef.current.src = `${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&page=${currentPage}&view=${viewParam}&zoom=${zoom}`;
    }
  }, [pdfUrl, currentPage, zoom, viewMode]);

  const loadPDF = async () => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      setPdfDoc(pdf);
      setTotalPages(pdf.getPageCount());
      
      // Create URL for iframe display
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEditing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (editMode === 'text' && newText.trim()) {
      const newElement: TextElement = {
        id: Date.now().toString(),
        text: newText,
        x,
        y,
        fontSize,
        color: textColor,
        page: currentPage,
      };
      setTextElements(prev => [...prev, newElement]);
      setNewText('');
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imgSrc = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const newElement: ImageElement = {
          id: Date.now().toString(),
          src: imgSrc,
          x: 100,
          y: 100,
          width: Math.min(img.width, 200),
          height: Math.min(img.height, 200),
          page: currentPage,
        };
        setImageElements(prev => [...prev, newElement]);
      };
      img.src = imgSrc;
    };
    reader.readAsDataURL(file);
  };

  const savePDF = async () => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Add text elements to PDF
      for (const element of textElements) {
        const page = pdfDoc.getPage(element.page - 1);
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        
        page.drawText(element.text, {
          x: element.x,
          y: page.getHeight() - element.y,
          size: element.fontSize,
          font: font,
          color: rgb(
            parseInt(element.color.slice(1, 3), 16) / 255,
            parseInt(element.color.slice(3, 5), 16) / 255,
            parseInt(element.color.slice(5, 7), 16) / 255
          ),
        });
      }

      const pdfBytes = await pdfDoc.save();
      onSave(pdfBytes);
    } catch (error) {
      console.error('Error saving PDF:', error);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">PDF Editor</h2>
            
            {/* Page Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={prevPage}
                disabled={currentPage <= 1}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 rounded text-sm"
              >
                ← Previous
              </button>
              <span className="text-sm px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={nextPage}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 rounded text-sm"
              >
                Next →
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(Math.max(25, zoom - 25))}
                className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
              >
                -
              </button>
              <span className="text-sm px-2 min-w-[60px] text-center">
                {zoom}%
              </span>
              <button
                onClick={() => setZoom(Math.min(400, zoom + 25))}
                className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
              >
                +
              </button>
            </div>

            {/* View Mode */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode('fit-width')}
                className={`px-2 py-1 rounded text-xs ${viewMode === 'fit-width' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Fit Width
              </button>
              <button
                onClick={() => setViewMode('fit-page')}
                className={`px-2 py-1 rounded text-xs ${viewMode === 'fit-page' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Fit Page
              </button>
              <button
                onClick={() => setViewMode('actual-size')}
                className={`px-2 py-1 rounded text-xs ${viewMode === 'actual-size' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Actual Size
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Editing Tools */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditMode('text')}
                className={`px-3 py-1 rounded text-sm ${editMode === 'text' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                📝 Text
              </button>
              <button
                onClick={() => setEditMode('image')}
                className={`px-3 py-1 rounded text-sm ${editMode === 'image' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                🖼️ Image
              </button>
              <button
                onClick={() => setEditMode('annotation')}
                className={`px-3 py-1 rounded text-sm ${editMode === 'annotation' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                ✍️ Annotation
              </button>
            </div>
            
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-4 py-2 rounded font-medium ${isEditing ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-500 text-white hover:bg-green-600'}`}
            >
              {isEditing ? 'Stop Editing' : 'Start Editing'}
            </button>
          </div>
        </div>
      </div>

      {/* Editing Controls */}
      {isEditing && (
        <div className="bg-white border-b border-gray-200 p-4">
          {editMode === 'text' && (
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Enter text to add..."
                className="px-3 py-2 border border-gray-300 rounded"
              />
              <input
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-20 px-3 py-2 border border-gray-300 rounded"
                min="8"
                max="72"
              />
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-12 h-10 border border-gray-300 rounded"
              />
            </div>
          )}
          
          {editMode === 'image' && (
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Upload Image
              </button>
            </div>
          )}
        </div>
      )}

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex justify-center">
          {pdfUrl ? (
            <div className="relative w-full max-w-6xl">
              <iframe
                ref={iframeRef}
                src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&page=${currentPage}&view=${viewMode === 'fit-width' ? 'FitH' : viewMode === 'fit-page' ? 'FitV' : 'Fit'}&zoom=${zoom}`}
                width="100%"
                height="800"
                className="border border-gray-300 shadow-lg rounded-lg"
                style={{ minHeight: '600px' }}
                title="PDF Document"
              />
              {/* Overlay for editing */}
              {isEditing && (
                <div 
                  className="absolute inset-0 cursor-crosshair z-10"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    if (editMode === 'text' && newText.trim()) {
                      const newElement: TextElement = {
                        id: Date.now().toString(),
                        text: newText,
                        x: x * 0.8, // Scale to match PDF size
                        y: y * 0.8,
                        fontSize,
                        color: textColor,
                        page: currentPage,
                      };
                      setTextElements(prev => [...prev, newElement]);
                      setNewText('');
                    }
                  }}
                />
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 bg-gray-200 rounded-lg">
              <p className="text-gray-500">Loading PDF...</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={savePDF}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save PDF
          </button>
        </div>
      </div>
    </div>
  );
}
