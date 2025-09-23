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
                    
                    // Create text input box at click position
                    const textBoxId = `textbox-${Date.now()}`;
                    const newElement: TextElement = {
                      id: textBoxId,
                      text: '',
                      x: x - 100, // Center the text box
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