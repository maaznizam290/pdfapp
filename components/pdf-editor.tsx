'use client';

import { useState, useRef, useEffect } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import PDFEditorAPI from '@/utils/pdfEditorAPI';

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
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline' | 'line-through';
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

interface AnnotationElement {
  id: string;
  type: 'highlight' | 'underline' | 'strikethrough' | 'sticky-note' | 'arrow' | 'rectangle' | 'circle';
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  color: string;
  text?: string; // For sticky notes
  startX?: number; // For lines/arrows
  startY?: number;
  endX?: number;
  endY?: number;
}

export default function PDFEditor({ file, onSave, onCancel }: PDFEditorProps) {
  // PDF Editor API instance
  const pdfAPI = useRef(new PDFEditorAPI());
  
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [editMode, setEditMode] = useState<'text' | 'image' | 'annotation' | 'form' | 'security'>('text');
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [imageElements, setImageElements] = useState<ImageElement[]>([]);
  const [annotationElements, setAnnotationElements] = useState<AnnotationElement[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newText, setNewText] = useState('');
  
  // Text formatting options
  const [fontSize, setFontSize] = useState(12);
  const [textColor, setTextColor] = useState('#000000');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontWeight, setFontWeight] = useState<'normal' | 'bold'>('normal');
  const [fontStyle, setFontStyle] = useState<'normal' | 'italic'>('normal');
  const [textDecoration, setTextDecoration] = useState<'none' | 'underline' | 'line-through'>('none');
  
  // Annotation options
  const [annotationType, setAnnotationType] = useState<'highlight' | 'underline' | 'strikethrough' | 'sticky-note' | 'arrow' | 'rectangle' | 'circle'>('highlight');
  const [annotationColor, setAnnotationColor] = useState('#ffff00');
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [zoom, setZoom] = useState(100);
  const [viewMode, setViewMode] = useState<'fit-width' | 'fit-page' | 'actual-size'>('fit-width');
  
  // Undo/Redo functionality
  const [history, setHistory] = useState<TextElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Drag functionality - simplified
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
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

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  // Global mouse events for dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (draggedElement) {
        e.preventDefault();
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        
        const newElements = textElements.map(el => 
          el.id === draggedElement 
            ? { ...el, x: Math.max(0, el.x + deltaX), y: Math.max(0, el.y + deltaY) }
            : el
        );
        setTextElements(newElements);
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (draggedElement) {
        e.preventDefault();
        setDraggedElement(null);
        saveToHistory(textElements);
      }
    };

    if (draggedElement) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggedElement, dragStart, textElements]);

  // Save state to history
  const saveToHistory = (newElements: TextElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newElements]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo function
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setTextElements([...history[historyIndex - 1]]);
    }
  };

  // Redo function
  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setTextElements([...history[historyIndex + 1]]);
    }
  };

  const loadPDF = async () => {
    try {
      const success = await pdfAPI.current.openPDF(file);
      if (success) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        setPdfDoc(pdf);
        setTotalPages(pdf.getPageCount());
        
        // Create URL for iframe display
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      }
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imgSrc = e.target?.result as string;
        const img = new Image();
        img.onload = async () => {
          // Use API to insert image
          const imageId = await pdfAPI.current.insertImage(
            currentPage,
            imgSrc,
            { x: 100, y: 100 },
            { width: Math.min(img.width, 200), height: Math.min(img.height, 200) }
          );
          
          // Also add to local state for UI rendering
          const newElement: ImageElement = {
            id: imageId,
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
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const savePDF = async () => {
    try {
      const pdfBytes = await pdfAPI.current.savePDF();
      if (pdfBytes) {
        onSave(pdfBytes);
      } else {
        throw new Error('Failed to save PDF');
      }
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

  // Enhanced drag functionality
  const handleDragStart = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedElement(elementId);
    setDragStart({ x: e.clientX, y: e.clientY });
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

            {/* Undo/Redo */}
            {isEditing && (
              <div className="flex items-center gap-1">
                <button
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  className={`px-2 py-1 rounded text-xs ${historyIndex <= 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'}`}
                  title="Undo (Ctrl+Z)"
                >
                  ↶ Undo
                </button>
                <button
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  className={`px-2 py-1 rounded text-xs ${historyIndex >= history.length - 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'}`}
                  title="Redo (Ctrl+Y)"
                >
                  ↷ Redo
                </button>
              </div>
            )}

            {/* Page Manipulation */}
            {isEditing && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const newPageNumber = pdfAPI.current.addPage();
                    setTotalPages(pdfAPI.current.getPageCount());
                    console.log('Added page:', newPageNumber);
                  }}
                  className="px-2 py-1 bg-blue-200 hover:bg-blue-300 rounded text-xs"
                  title="Add Page"
                >
                  ➕ Add Page
                </button>
                <button
                  onClick={() => {
                    if (totalPages > 1) {
                      const success = pdfAPI.current.deletePage(currentPage);
                      if (success) {
                        setTotalPages(pdfAPI.current.getPageCount());
                        if (currentPage > 1) {
                          setCurrentPage(currentPage - 1);
                        }
                      }
                    }
                  }}
                  disabled={totalPages <= 1}
                  className={`px-2 py-1 rounded text-xs ${totalPages <= 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-200 hover:bg-red-300'}`}
                  title="Delete Page"
                >
                  🗑️ Delete Page
                </button>
                <button
                  onClick={() => {
                    const success = pdfAPI.current.rotatePage(currentPage, 90);
                    console.log('Rotated page:', success);
                  }}
                  className="px-2 py-1 bg-orange-200 hover:bg-orange-300 rounded text-xs"
                  title="Rotate Page"
                >
                  🔄 Rotate
                </button>
              </div>
            )}

            {/* API Functions */}
            {isEditing && (
              <div className="flex items-center gap-1">
                <button
                  onClick={async () => {
                    const results = await pdfAPI.current.searchText('test');
                    console.log('Search results:', results);
                  }}
                  className="px-2 py-1 bg-purple-200 hover:bg-purple-300 rounded text-xs"
                  title="Search Text"
                >
                  🔍 Search
                </button>
                <button
                  onClick={() => {
                    const pageCount = pdfAPI.current.getPageCount();
                    console.log('Page count:', pageCount);
                  }}
                  className="px-2 py-1 bg-green-200 hover:bg-green-300 rounded text-xs"
                  title="Get Page Count"
                >
                  📄 Pages
                </button>
              </div>
            )}
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
              <button
                onClick={() => setEditMode('form')}
                className={`px-3 py-1 rounded text-sm ${editMode === 'form' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                📋 Form
              </button>
              <button
                onClick={() => setEditMode('security')}
                className={`px-3 py-1 rounded text-sm ${editMode === 'security' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                🔒 Security
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
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Click anywhere on the PDF to add text</span>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                {/* Font Family */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Font:</label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                  </select>
                </div>
                
                {/* Font Size */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Size:</label>
                  <input
                    type="number"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    min="8"
                    max="72"
                  />
                </div>
                
                {/* Font Weight */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFontWeight(fontWeight === 'bold' ? 'normal' : 'bold')}
                    className={`px-2 py-1 rounded text-sm ${fontWeight === 'bold' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  >
                    <strong>B</strong>
                  </button>
                  <button
                    onClick={() => setFontStyle(fontStyle === 'italic' ? 'normal' : 'italic')}
                    className={`px-2 py-1 rounded text-sm ${fontStyle === 'italic' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  >
                    <em>I</em>
                  </button>
                  <button
                    onClick={() => setTextDecoration(textDecoration === 'underline' ? 'none' : 'underline')}
                    className={`px-2 py-1 rounded text-sm ${textDecoration === 'underline' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  >
                    <u>U</u>
                  </button>
                </div>
                
                {/* Text Color */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Color:</label>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                  />
                </div>
              </div>
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
          
          {editMode === 'annotation' && (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Click and drag on the PDF to add annotations</span>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                {/* Annotation Type */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Type:</label>
                  <select
                    value={annotationType}
                    onChange={(e) => setAnnotationType(e.target.value as any)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="highlight">🖍️ Highlight</option>
                    <option value="underline">📝 Underline</option>
                    <option value="strikethrough">❌ Strikethrough</option>
                    <option value="sticky-note">📌 Sticky Note</option>
                    <option value="arrow">➡️ Arrow</option>
                    <option value="rectangle">⬜ Rectangle</option>
                    <option value="circle">⭕ Circle</option>
                  </select>
                </div>
                
                {/* Annotation Color */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Color:</label>
                  <input
                    type="color"
                    value={annotationColor}
                    onChange={(e) => setAnnotationColor(e.target.value)}
                    className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {editMode === 'form' && (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Form editing tools</span>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <button
                  onClick={() => {
                    const validation = pdfAPI.current.validateForm();
                    console.log('Form validation:', validation);
                    if (!validation.isValid) {
                      alert('Form validation errors:\n' + validation.errors.join('\n'));
                    } else {
                      alert('Form is valid!');
                    }
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Validate Form
                </button>
                <button
                  onClick={() => {
                    const signatureId = pdfAPI.current.addSignature(
                      { x: 100, y: 100 },
                      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
                    );
                    console.log('Added signature:', signatureId);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add Signature
                </button>
              </div>
            </div>
          )}

          {editMode === 'security' && (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Security and protection tools</span>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <button
                  onClick={() => {
                    const password = prompt('Enter password for PDF protection:');
                    if (password) {
                      const success = pdfAPI.current.addPassword(password);
                      console.log('Password protection:', success);
                    }
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Add Password
                </button>
                <button
                  onClick={() => {
                    const watermarkText = prompt('Enter watermark text (or leave empty for "CONFIDENTIAL"):') || 'CONFIDENTIAL';
                    const watermarkId = pdfAPI.current.addWatermark(
                      watermarkText,
                      { x: 50, y: 50 },
                      0.3
                    );
                    console.log('Added watermark:', watermarkId);
                    alert(`Watermark "${watermarkText}" added successfully! It will appear on all pages when you save the PDF.`);
                  }}
                  className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  Add Text Watermark
                </button>
                <button
                  onClick={() => {
                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.accept = 'image/*';
                    fileInput.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          const imageData = e.target?.result as string;
                          const watermarkId = pdfAPI.current.addWatermark(
                            imageData,
                            { x: 50, y: 50 },
                            0.5
                          );
                          console.log('Added image watermark:', watermarkId);
                          alert('Image watermark added successfully! It will appear on all pages when you save the PDF.');
                        };
                        reader.readAsDataURL(file);
                      }
                    };
                    fileInput.click();
                  }}
                  className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                >
                  Add Image Watermark
                </button>
                <button
                  onClick={() => {
                    const success = pdfAPI.current.restrictEditing();
                    console.log('Editing restrictions:', success);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Restrict Editing
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto p-2">
        <div className="flex justify-center">
          {pdfUrl ? (
            <div className="relative w-full max-w-7xl pdf-container">
              <iframe
                ref={iframeRef}
                src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&page=${currentPage}&view=${viewMode === 'fit-width' ? 'FitH' : viewMode === 'fit-page' ? 'FitV' : 'Fit'}&zoom=${zoom}`}
                width="100%"
                height="900"
                className="border border-gray-300 shadow-lg rounded-lg"
                style={{ minHeight: '700px' }}
                title="PDF Document"
              />
              
              {/* Interactive Annotation Overlay */}
              {isEditing && editMode === 'annotation' && (
                <div 
                  className="absolute inset-0 z-10"
                  style={{ 
                    background: 'rgba(0,0,0,0.01)',
                    cursor: 'crosshair'
                  }}
                  onMouseDown={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const startX = e.clientX - rect.left;
                    const startY = e.clientY - rect.top;
                    
                    const handleMouseMove = (moveEvent: MouseEvent) => {
                      const currentX = moveEvent.clientX - rect.left;
                      const currentY = moveEvent.clientY - rect.top;
                      
                      // Create annotation based on type
                      const annotationId = pdfAPI.current.addComment(
                        currentPage,
                        { x: Math.min(startX, currentX), y: Math.min(startY, currentY) },
                        `Annotation ${annotationType}`,
                        { width: Math.abs(currentX - startX), height: Math.abs(currentY - startY) }
                      );
                      
                      // Add to local state for rendering
                      const newAnnotation: AnnotationElement = {
                        id: annotationId,
                        type: annotationType,
                        x: Math.min(startX, currentX),
                        y: Math.min(startY, currentY),
                        width: Math.abs(currentX - startX),
                        height: Math.abs(currentY - startY),
                        page: currentPage,
                        color: annotationColor,
                      };
                      setAnnotationElements(prev => [...prev, newAnnotation]);
                    };
                    
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                />
              )}

              {/* Interactive Text Box Overlay */}
              {isEditing && editMode === 'text' && (
                <div 
                  className="absolute inset-0 z-10"
                  style={{ 
                    background: 'rgba(0,0,0,0.01)', // Almost transparent to detect clicks
                    cursor: 'text'
                  }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    // Create text input box at click position using API
                    const textBoxId = pdfAPI.current.addText(
                      { x: x - 100, y: y - 15 },
                      '',
                      {
                        family: fontFamily,
                        size: fontSize,
                        weight: fontWeight,
                        style: fontStyle,
                        color: textColor,
                        underline: textDecoration === 'underline',
                        strikethrough: textDecoration === 'line-through'
                      },
                      currentPage
                    );
                    
                    // Also add to local state for UI rendering
                    const newElement: TextElement = {
                      id: textBoxId,
                      text: '',
                      x: x - 100,
                      y: y - 15,
                      fontSize,
                      color: textColor,
                      page: currentPage,
                      fontFamily,
                      fontWeight,
                      fontStyle,
                      textDecoration,
                    };
                    const newElements = [...textElements, newElement];
                    setTextElements(newElements);
                    saveToHistory(newElements);
                    
                    // Focus on the new text input
                    setTimeout(() => {
                      const textInput = document.getElementById(textBoxId) as HTMLInputElement;
                      if (textInput) {
                        textInput.focus();
                      }
                    }, 100);
                  }}
                />
              )}
              
              {/* Render Image Elements */}
              {imageElements
                .filter(element => element.page === currentPage)
                .map((element) => (
                  <div
                    key={element.id}
                    className="absolute z-20"
                    style={{
                      left: element.x,
                      top: element.y,
                    }}
                  >
                    {isEditing && editMode === 'image' ? (
                      <div className="relative group">
                        <img
                          src={element.src}
                          alt="PDF Image"
                          className="border-2 border-blue-400 border-dashed rounded"
                          style={{
                            width: element.width,
                            height: element.height,
                          }}
                        />
                        {/* Image resize handles */}
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
                          onMouseDown={(e) => {
                            // Handle image resizing
                            e.preventDefault();
                            console.log('Resize image:', element.id);
                          }}
                        />
                        {/* Image move handle */}
                        <div className="absolute -top-1 -left-1 w-3 h-3 bg-green-500 rounded-full cursor-move opacity-0 group-hover:opacity-100 transition-opacity"
                          onMouseDown={(e) => {
                            // Handle image moving
                            e.preventDefault();
                            console.log('Move image:', element.id);
                          }}
                        />
                        {/* Delete button */}
                        <button
                          className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          onClick={() => {
                            pdfAPI.current.deleteImage(element.id);
                            setImageElements(prev => prev.filter(img => img.id !== element.id));
                          }}
                          title="Delete image"
                        >
                          <span className="text-white text-xs">×</span>
                        </button>
                      </div>
                    ) : (
                      <img
                        src={element.src}
                        alt="PDF Image"
                        className="rounded"
                        style={{
                          width: element.width,
                          height: element.height,
                        }}
                      />
                    )}
                  </div>
                ))}

              {/* Render Annotation Elements */}
              {annotationElements
                .filter(element => element.page === currentPage)
                .map((element) => (
                  <div
                    key={element.id}
                    className="absolute z-15"
                    style={{
                      left: element.x,
                      top: element.y,
                      width: element.width,
                      height: element.height,
                    }}
                  >
                    {element.type === 'highlight' && (
                      <div 
                        className="absolute inset-0 bg-yellow-300 bg-opacity-50 rounded"
                        style={{ backgroundColor: element.color + '50' }}
                      />
                    )}
                    {element.type === 'underline' && (
                      <div 
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ backgroundColor: element.color }}
                      />
                    )}
                    {element.type === 'strikethrough' && (
                      <div 
                        className="absolute top-1/2 left-0 right-0 h-0.5"
                        style={{ backgroundColor: element.color }}
                      />
                    )}
                    {element.type === 'sticky-note' && (
                      <div 
                        className="absolute inset-0 bg-yellow-200 border border-yellow-400 rounded p-2 text-xs"
                        style={{ backgroundColor: element.color + '80' }}
                      >
                        <div className="font-semibold">Note:</div>
                        <div>{element.text || 'Click to edit'}</div>
                        {isEditing && (
                          <button
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center"
                            onClick={() => {
                              pdfAPI.current.deleteAnnotation(element.id);
                              setAnnotationElements(prev => prev.filter(ann => ann.id !== element.id));
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    )}
                    {element.type === 'rectangle' && (
                      <div 
                        className="absolute inset-0 border-2 border-dashed rounded"
                        style={{ borderColor: element.color }}
                      />
                    )}
                    {element.type === 'circle' && (
                      <div 
                        className="absolute inset-0 border-2 border-dashed rounded-full"
                        style={{ borderColor: element.color }}
                      />
                    )}
                    {element.type === 'arrow' && (
                      <div 
                        className="absolute"
                        style={{
                          width: element.width,
                          height: element.height,
                          background: `linear-gradient(45deg, ${element.color} 0%, ${element.color} 100%)`,
                          clipPath: 'polygon(0 0, 100% 50%, 0 100%)'
                        }}
                      />
                    )}
                  </div>
                ))}

              {/* Render Text Elements */}
              {textElements
                .filter(element => element.page === currentPage)
                .map((element) => (
                  <div
                    key={element.id}
                    className="absolute z-20"
                    style={{
                      left: element.x,
                      top: element.y,
                    }}
                  >
                    {isEditing && editMode === 'text' ? (
                      <div className="relative group">
                        <input
                          id={element.id}
                          type="text"
                          value={element.text}
                          onChange={(e) => {
                            // Update via API
                            pdfAPI.current.editText(currentPage, element.id, e.target.value);
                            
                            // Update local state
                            const newElements = textElements.map(el => 
                              el.id === element.id 
                                ? { ...el, text: e.target.value }
                                : el
                            );
                            setTextElements(newElements);
                            saveToHistory(newElements);
                          }}
                          onBlur={() => {
                            // Remove empty text elements
                            if (!element.text.trim()) {
                              const newElements = textElements.filter(el => el.id !== element.id);
                              setTextElements(newElements);
                              saveToHistory(newElements);
                            }
                          }}
                          className="bg-transparent border-2 border-blue-400 border-dashed px-2 py-1 rounded text-sm focus:outline-none focus:border-blue-600 focus:bg-white focus:bg-opacity-90 w-full"
                          style={{
                            fontSize: `${element.fontSize}px`,
                            color: element.color,
                            minWidth: '100px',
                            fontFamily: element.fontFamily,
                            fontWeight: element.fontWeight,
                            fontStyle: element.fontStyle,
                            textDecoration: element.textDecoration
                          }}
                          placeholder="Type here..."
                          autoFocus
                        />
                        {/* Enhanced drag handle */}
                        <div 
                          className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full cursor-move opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          onMouseDown={(e) => handleDragStart(e, element.id)}
                          title="Drag to move"
                        >
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="text-sm px-2 py-1 bg-white bg-opacity-90 rounded border border-gray-300"
                        style={{
                          fontSize: `${element.fontSize}px`,
                          color: element.color,
                          fontFamily: element.fontFamily,
                          fontWeight: element.fontWeight,
                          fontStyle: element.fontStyle,
                          textDecoration: element.textDecoration
                        }}
                      >
                        {element.text}
                      </div>
                    )}
                  </div>
                ))}
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