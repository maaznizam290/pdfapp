import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { writeFile, unlink, readFile, access } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

// Helper: safely delete temp files
async function safeUnlink(filePath: string): Promise<void> {
  try {
    await access(filePath);
    await unlink(filePath);
  } catch {
    // ignore
  }
}

// Helper: save buffer to temp file
async function saveTempFile(buffer: Buffer): Promise<string> {
  const tempPath = join(tmpdir(), `temp_${Date.now()}.pdf`);
  await writeFile(tempPath, buffer);
  return tempPath;
}

// 📌 Merge PDFs
async function mergePDFs(files: File[]): Promise<Buffer> {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const fileBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(fileBuffer);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => mergedPdf.addPage(page));
  }

  return Buffer.from(await mergedPdf.save());
}

// 📌 Split PDF
async function splitPDF(inputPath: string, options: any): Promise<Buffer> {
  const pdfBytes = await readFile(inputPath);
  const pdf = await PDFDocument.load(pdfBytes);
  const newPdf = await PDFDocument.create();

  const startPage = options.startPage || 1;
  const endPage = options.endPage || pdf.getPageCount();

  for (let i = startPage - 1; i < endPage; i++) {
    const [page] = await newPdf.copyPages(pdf, [i]);
    newPdf.addPage(page);
  }

  return Buffer.from(await newPdf.save());
}


// 📌 Extract specific pages
async function extractPages(inputPath: string, options: any): Promise<Buffer> {
  const pdfBytes = await readFile(inputPath);
  const pdf = await PDFDocument.load(pdfBytes);
  const newPdf = await PDFDocument.create();

  const pageNumbers = options.pages || [1];

  for (const pageNum of pageNumbers) {
    const [page] = await newPdf.copyPages(pdf, [pageNum - 1]);
    newPdf.addPage(page);
  }

  return Buffer.from(await newPdf.save());
}

// 📌 Remove pages
async function removePages(inputPath: string, options: any): Promise<Buffer> {
  const pdfBytes = await readFile(inputPath);
  const pdf = await PDFDocument.load(pdfBytes);
  const newPdf = await PDFDocument.create();

  const pagesToRemove = options.pages || [];
  const totalPages = pdf.getPageCount();

  for (let i = 0; i < totalPages; i++) {
    if (!pagesToRemove.includes(i + 1)) {
      const [page] = await newPdf.copyPages(pdf, [i]);
      newPdf.addPage(page);
    }
  }

  return Buffer.from(await newPdf.save());
}

// 📌 Rotate PDF pages
async function rotatePDF(inputPath: string, options: any): Promise<Buffer> {
  try {
    console.log('Starting rotate PDF process with options:', options);
    
    const pdfBytes = await readFile(inputPath);
    console.log('PDF file read, size:', pdfBytes.length);
    
    if (pdfBytes.length === 0) {
      throw new Error('PDF file is empty');
    }
    
    // Validate PDF header
    const header = new Uint8Array(pdfBytes.slice(0, 4));
    if (header[0] !== 0x25 || header[1] !== 0x50 || header[2] !== 0x44 || header[3] !== 0x46) {
      throw new Error('Invalid PDF file format');
    }
    
    const pdf = await PDFDocument.load(pdfBytes);
    const pageCount = pdf.getPageCount();
    console.log('PDF loaded successfully, pages:', pageCount);
    
    if (pageCount === 0) {
      throw new Error('PDF has no pages');
    }
    
    const { angle, pageRange } = options;
    console.log('Rotation options:', { angle, pageRange });
    
    // Determine which pages to rotate
    let pagesToRotate: number[] = [];
    
    if (!pageRange || pageRange.trim() === '') {
      // Rotate all pages
      pagesToRotate = Array.from({ length: pageCount }, (_, i) => i);
    } else {
      // Parse page range - simplified approach
      console.log('Parsing page range:', pageRange);
      const pageNumbers = pageRange.split(',').map(p => p.trim());
      pagesToRotate = [];
      
      for (const pageStr of pageNumbers) {
        if (pageStr.includes('-')) {
          // Handle ranges like "1-3"
          const parts = pageStr.split('-');
          if (parts.length !== 2) {
            console.warn(`Invalid range format: ${pageStr}`);
            continue;
          }
          
          const start = parseInt(parts[0].trim());
          const end = parseInt(parts[1].trim());
          
          if (isNaN(start) || isNaN(end) || start < 1 || end < 1) {
            console.warn(`Invalid range numbers: ${pageStr}`);
            continue;
          }
          
          if (start > end) {
            console.warn(`Start > end in range: ${pageStr}`);
            continue;
          }
          
          // Convert to 0-based indices
          const startIndex = start - 1;
          const endIndex = end - 1;
          
          // Ensure within bounds
          if (startIndex >= pageCount) {
            console.warn(`Range start ${start} exceeds page count ${pageCount}`);
            continue;
          }
          
          const actualEndIndex = Math.min(endIndex, pageCount - 1);
          
          for (let i = startIndex; i <= actualEndIndex; i++) {
            pagesToRotate.push(i);
          }
        } else {
          // Handle individual pages
          const pageNum = parseInt(pageStr);
          if (isNaN(pageNum) || pageNum < 1) {
            console.warn(`Invalid page number: ${pageStr}`);
            continue;
          }
          
          const pageIndex = pageNum - 1; // Convert to 0-based
          if (pageIndex >= pageCount) {
            console.warn(`Page ${pageNum} exceeds page count ${pageCount}`);
            continue;
          }
          
          pagesToRotate.push(pageIndex);
        }
      }
    }
    
    console.log('Pages to rotate (1-based):', pagesToRotate.map(p => p + 1));
    console.log('Pages to rotate (0-based indices):', pagesToRotate);
    console.log('Total pages in document:', pageCount);
    
    if (pagesToRotate.length === 0) {
      throw new Error('No valid pages to rotate. Please check your page range format.');
    }
    
    // Sort and remove duplicates
    pagesToRotate.sort((a, b) => a - b);
    const uniquePages = [...new Set(pagesToRotate)];
    console.log('Unique pages to rotate:', uniquePages.map(p => p + 1));
    
    // Rotate each page
    for (const pageIndex of uniquePages) {
      console.log(`Rotating page ${pageIndex + 1} (index ${pageIndex})`);
      const page = pdf.getPage(pageIndex);
      const { width, height } = page.getSize();
      
      console.log(`Page ${pageIndex + 1}: ${width}x${height} - rotating by ${angle}°`);
      
      // Apply rotation
      page.setRotation({ type: 'degrees', angle: angle });
      
      console.log(`Page ${pageIndex + 1} rotated successfully`);
    }

    console.log('Saving rotated PDF...');
    const pdfBytesResult = await pdf.save();
    console.log('PDF saved successfully, result size:', pdfBytesResult.length);
    
    return Buffer.from(pdfBytesResult);
  } catch (error) {
    console.error('Error in rotatePDF function:', error);
    throw error;
  }
}

// 📌 Crop PDF pages
async function cropPDF(inputPath: string, options: any): Promise<Buffer> {
  try {
    console.log('Starting crop PDF process with options:', options);
    
    const pdfBytes = await readFile(inputPath);
    console.log('PDF file read, size:', pdfBytes.length);
    
    if (pdfBytes.length === 0) {
      throw new Error('PDF file is empty');
    }
    
    // Validate PDF header
    const header = new Uint8Array(pdfBytes.slice(0, 4));
    if (header[0] !== 0x25 || header[1] !== 0x50 || header[2] !== 0x44 || header[3] !== 0x46) {
      throw new Error('Invalid PDF file format');
    }
    
    const pdf = await PDFDocument.load(pdfBytes);
    const pageCount = pdf.getPageCount();
    console.log('PDF loaded successfully, pages:', pageCount);
    
    if (pageCount === 0) {
      throw new Error('PDF has no pages');
    }
    
    const { crop } = options;
    console.log('Crop options:', crop);
    
    if (!crop) {
      throw new Error('Crop options are required');
    }
    
    const { top, right, bottom, left, unit } = crop;
    
    // Validate crop values
    if (top < 0 || right < 0 || bottom < 0 || left < 0) {
      throw new Error('Crop values cannot be negative');
    }
    
    // Convert units to points (PDF uses points as base unit)
    const conversionFactor = (() => {
      switch (unit) {
        case 'mm': return 2.834645669; // 1 mm = 2.834645669 points
        case 'in': return 72; // 1 inch = 72 points
        case 'pt': return 1; // 1 point = 1 point
        default: return 2.834645669; // Default to mm
      }
    })();
    
    const topPt = top * conversionFactor;
    const rightPt = right * conversionFactor;
    const bottomPt = bottom * conversionFactor;
    const leftPt = left * conversionFactor;
    
    console.log(`Converted crop values: top=${topPt}pt, right=${rightPt}pt, bottom=${bottomPt}pt, left=${leftPt}pt`);
    
    const pages = pdf.getPages();
    console.log('Processing', pages.length, 'pages');
    
    for (let i = 0; i < pages.length; i++) {
      console.log(`Processing page ${i + 1} (index ${i})`);
      const page = pages[i];
      const { width, height } = page.getSize();
      
      console.log(`Page ${i + 1}: ${width}x${height}`);
    
      // Calculate new crop box
      // PDF coordinates: (0,0) is bottom-left, (width, height) is top-right
      const newX = leftPt;
      const newY = bottomPt;
      const newWidth = Math.max(1, width - leftPt - rightPt);
      const newHeight = Math.max(1, height - topPt - bottomPt);
      
      // Validate crop box
      if (newWidth <= 0 || newHeight <= 0) {
        throw new Error(`Invalid crop dimensions for page ${i + 1}: width=${newWidth}, height=${newHeight}`);
      }
      
      if (newX < 0 || newY < 0 || newX + newWidth > width || newY + newHeight > height) {
        throw new Error(`Crop box exceeds page boundaries for page ${i + 1}`);
      }
      
      console.log(`Page ${i + 1} crop box: x=${newX}, y=${newY}, width=${newWidth}, height=${newHeight}`);
      
      try {
        // Set crop box using pdf-lib's approach
        page.setCropBox(newX, newY, newWidth, newHeight);
        
        console.log(`Page ${i + 1} cropped successfully`);
      } catch (cropError) {
        console.error(`Error setting crop box for page ${i + 1}:`, cropError);
        throw new Error(`Failed to set crop box for page ${i + 1}: ${cropError instanceof Error ? cropError.message : 'Unknown error'}`);
      }
    }

    console.log('Saving cropped PDF...');
    const pdfBytesResult = await pdf.save();
    console.log('PDF saved successfully, result size:', pdfBytesResult.length);
    
    return Buffer.from(pdfBytesResult);
  } catch (error) {
    console.error('Error in cropPDF function:', error);
    throw error;
  }
}

// 📌 Add page numbers to PDF
async function addPageNumbers(inputPath: string, options: any): Promise<Buffer> {
  try {
    console.log('Starting page numbers process with options:', options);
    
    const pdfBytes = await readFile(inputPath);
    console.log('PDF file read, size:', pdfBytes.length);
    
    if (pdfBytes.length === 0) {
      throw new Error('PDF file is empty');
    }
    
    // Validate PDF header
    const header = new Uint8Array(pdfBytes.slice(0, 4));
    if (header[0] !== 0x25 || header[1] !== 0x50 || header[2] !== 0x44 || header[3] !== 0x46) {
      throw new Error('Invalid PDF file format');
    }
    
    const pdf = await PDFDocument.load(pdfBytes);
    const pageCount = pdf.getPageCount();
    console.log('PDF loaded successfully, pages:', pageCount);
    
    if (pageCount === 0) {
      throw new Error('PDF has no pages');
    }
    
    const { 
      position, 
      format, 
      startPage, 
      fontSize, 
      fontColor, 
      includeTotalPages, 
      customText 
    } = options;
    
    console.log('Page number options:', { position, format, startPage, fontSize, fontColor, includeTotalPages, customText });
    
    // Embed font
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    console.log('Font embedded successfully');
    
    // Convert hex color to RGB
    const hexColor = fontColor || '#000000';
    const r = parseInt(hexColor.slice(1, 3), 16) / 255;
    const g = parseInt(hexColor.slice(3, 5), 16) / 255;
    const b = parseInt(hexColor.slice(5, 7), 16) / 255;
    
    // Process each page
    const pages = pdf.getPages();
    console.log('Processing', pages.length, 'pages');
    
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      
      console.log(`Page ${i + 1}: ${width}x${height}`);
      
      // Calculate page number
      const pageNumber = startPage + i;
      let pageText = '';
      
      // Format page number
      switch (format) {
        case '1':
          pageText = pageNumber.toString();
          break;
        case 'i':
          pageText = toRomanNumerals(pageNumber).toLowerCase();
          break;
        case 'I':
          pageText = toRomanNumerals(pageNumber).toUpperCase();
          break;
        case 'a':
          pageText = toAlphabet(pageNumber).toLowerCase();
          break;
        case 'A':
          pageText = toAlphabet(pageNumber).toUpperCase();
          break;
        default:
          pageText = pageNumber.toString();
      }
      
      // Add custom text and total pages if needed
      let fullText = '';
      if (customText) {
        fullText += customText + ' ';
      }
      fullText += pageText;
      if (includeTotalPages) {
        fullText += ` of ${pageCount}`;
      }
      
      // Calculate position
      let x = 0;
      let y = 0;
      
      switch (position) {
        case 'top-left':
          x = 50;
          y = height - 30;
          break;
        case 'top-center':
          x = width / 2;
          y = height - 30;
          break;
        case 'top-right':
          x = width - 50;
          y = height - 30;
          break;
        case 'bottom-left':
          x = 50;
          y = 30;
          break;
        case 'bottom-center':
          x = width / 2;
          y = 30;
          break;
        case 'bottom-right':
          x = width - 50;
          y = 30;
          break;
        case 'left-center':
          x = 30;
          y = height / 2;
          break;
        case 'right-center':
          x = width - 30;
          y = height / 2;
          break;
        default:
          x = width / 2;
          y = 30;
      }
      
      console.log(`Page ${i + 1} page number: "${fullText}" at (${x}, ${y})`);
      
      // Draw page number
      page.drawText(fullText, {
        x: x,
        y: y,
        size: fontSize || 12,
        font: font,
        color: rgb(r, g, b),
      });
      
      console.log(`Page ${i + 1} page number added successfully`);
    }

    console.log('Saving PDF with page numbers...');
    const pdfBytesResult = await pdf.save();
    console.log('PDF saved successfully, result size:', pdfBytesResult.length);
    
    return Buffer.from(pdfBytesResult);
  } catch (error) {
    console.error('Error in addPageNumbers function:', error);
    throw error;
  }
}

// Helper function to convert numbers to Roman numerals
function toRomanNumerals(num: number): string {
  const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const symbols = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  
  let result = '';
  for (let i = 0; i < values.length; i++) {
    while (num >= values[i]) {
      result += symbols[i];
      num -= values[i];
    }
  }
  return result;
}

// Helper function to convert numbers to alphabet
function toAlphabet(num: number): string {
  let result = '';
  while (num > 0) {
    num--;
    result = String.fromCharCode(65 + (num % 26)) + result;
    num = Math.floor(num / 26);
  }
  return result;
}

// 📌 Add watermark to PDF
async function addWatermark(inputPath: string, options: any): Promise<Buffer> {
  try {
    console.log('Starting watermark process with options:', options);
    
    const pdfBytes = await readFile(inputPath);
    console.log('PDF file read, size:', pdfBytes.length);
    
    if (pdfBytes.length === 0) {
      throw new Error('PDF file is empty');
    }
    
    // Validate PDF header
    const header = new Uint8Array(pdfBytes.slice(0, 4));
    if (header[0] !== 0x25 || header[1] !== 0x50 || header[2] !== 0x44 || header[3] !== 0x46) {
      throw new Error('Invalid PDF file format');
    }
    
    const pdf = await PDFDocument.load(pdfBytes);
    const pageCount = pdf.getPageCount();
    console.log('PDF loaded successfully, pages:', pageCount);
    
    if (pageCount === 0) {
      throw new Error('PDF has no pages');
    }
    
    const { 
      type, 
      text, 
      image, 
      position, 
      opacity, 
      fontSize, 
      rotation, 
      color, 
      pageRange, 
      startPage, 
      endPage, 
      specificPages, 
      layer 
    } = options;
    
    console.log('Watermark options:', { type, text, position, opacity, fontSize, rotation, color, pageRange });
    
    // Determine which pages to watermark
    let pagesToWatermark: number[] = [];
    
    switch (pageRange) {
      case 'all':
        pagesToWatermark = Array.from({ length: pageCount }, (_, i) => i);
        break;
      case 'range':
        const start = Math.max(1, startPage) - 1;
        const end = Math.min(pageCount, endPage) - 1;
        pagesToWatermark = Array.from({ length: end - start + 1 }, (_, i) => start + i);
        break;
      case 'specific':
        const pageNumbers = specificPages.split(',').map(p => p.trim());
        pagesToWatermark = [];
        for (const pageStr of pageNumbers) {
          if (pageStr.includes('-')) {
            // Handle ranges like "1-3"
            const [startStr, endStr] = pageStr.split('-').map(n => n.trim());
            const start = parseInt(startStr);
            const end = parseInt(endStr);
            
            if (isNaN(start) || isNaN(end) || start < 1 || end < 1) {
              console.warn(`Invalid range: ${pageStr}`);
              continue;
            }
            
            // Convert to 0-based indices and ensure they're within bounds
            const startIndex = Math.max(0, start - 1);
            const endIndex = Math.min(pageCount - 1, end - 1);
            
            for (let i = startIndex; i <= endIndex; i++) {
              if (!pagesToWatermark.includes(i)) {
                pagesToWatermark.push(i);
              }
            }
          } else {
            // Handle individual pages
            const pageNum = parseInt(pageStr);
            if (isNaN(pageNum) || pageNum < 1) {
              console.warn(`Invalid page number: ${pageStr}`);
              continue;
            }
            
            const pageIndex = pageNum - 1; // Convert to 0-based
            if (pageIndex >= 0 && pageIndex < pageCount && !pagesToWatermark.includes(pageIndex)) {
              pagesToWatermark.push(pageIndex);
            }
          }
        }
        break;
      default:
        pagesToWatermark = Array.from({ length: pageCount }, (_, i) => i);
    }
    
    console.log('Pages to watermark (1-based):', pagesToWatermark.map(p => p + 1));
    console.log('Pages to watermark (0-based indices):', pagesToWatermark);
    console.log('Total pages in document:', pageCount);
    
    // Sort and remove duplicates
    pagesToWatermark.sort((a, b) => a - b);
    const uniquePages = [...new Set(pagesToWatermark)];
    console.log('Unique pages to watermark:', uniquePages.map(p => p + 1));
    
    // Prepare watermark resources
    let font = null;
    let watermarkImage = null;
    
    if (type === 'text') {
      font = await pdf.embedFont(StandardFonts.Helvetica);
      console.log('Font embedded successfully');
    } else if (type === 'image' && image) {
      try {
        watermarkImage = await pdf.embedPng(image);
        console.log('Image embedded successfully');
      } catch (imageError) {
        console.error('Failed to embed image, falling back to text:', imageError);
        font = await pdf.embedFont(StandardFonts.Helvetica);
      }
    }
    
    // Process each page
    for (const pageIndex of uniquePages) {
      const page = pdf.getPage(pageIndex);
      const { width, height } = page.getSize();
      console.log(`Page ${pageIndex + 1}: ${width}x${height}`);
      
      // Calculate position based on position string
      let x = 0;
      let y = 0;
      
      switch (position) {
        case 'center':
          x = width / 2;
          y = height / 2;
          break;
        case 'top-left':
          x = 50;
          y = height - 50;
          break;
        case 'top-right':
          x = width - 200;
          y = height - 50;
          break;
        case 'bottom-left':
          x = 50;
          y = 50;
          break;
        case 'bottom-right':
          x = width - 200;
          y = 50;
          break;
        case 'top-center':
          x = width / 2;
          y = height - 50;
          break;
        case 'bottom-center':
          x = width / 2;
          y = 50;
          break;
        default:
          x = width / 2;
          y = height / 2;
      }
      
      console.log(`Page ${pageIndex + 1} watermark position: (${x}, ${y})`);
      
      // Convert hex color to RGB
      const hexColor = color || '#999999';
      const r = parseInt(hexColor.slice(1, 3), 16) / 255;
      const g = parseInt(hexColor.slice(3, 5), 16) / 255;
      const b = parseInt(hexColor.slice(5, 7), 16) / 255;
      
      // Draw watermark
      if (type === 'text' && font) {
        page.drawText(text, {
          x: x,
          y: y,
          size: fontSize || 24,
          font: font,
          color: rgb(r, g, b),
          opacity: opacity || 0.3,
          rotate: { type: 'degrees', angle: rotation || -45 },
        });
      } else if (type === 'image' && watermarkImage) {
        page.drawImage(watermarkImage, {
          x: x - 50, // Center the image
          y: y - 25,
          width: 100,
          height: 50,
          opacity: opacity || 0.3,
          rotate: { type: 'degrees', angle: rotation || -45 },
        });
      }
      
      console.log(`Watermark added to page ${pageIndex + 1}`);
    }

    console.log('Saving watermarked PDF...');
    const pdfBytesResult = await pdf.save();
    console.log('PDF saved successfully, result size:', pdfBytesResult.length);
    
    return Buffer.from(pdfBytesResult);
  } catch (error) {
    console.error('Error in addWatermark function:', error);
    throw error;
  }
}

// 📌 API route handler
export async function POST(request: NextRequest) {
  const requestId = `process-${Date.now()}`;
  let tempFilePath: string | null = null;
  
  console.log(`[${requestId}] --- New PDF processing request received ---`);

  try {
    const formData = await request.formData();
    const operation = formData.get('operation') as string;
    const file = formData.get('file') as File | null;
    const files = formData.getAll('files') as File[];
    const optionsStr = formData.get('options') as string | null;
    const options = optionsStr ? JSON.parse(optionsStr) : {};

    console.log(`[${requestId}] Step 1: Form data parsed. Operation: ${operation}, Files: ${files.length}, Single file: ${file?.name || 'none'}`);

    if (!operation) {
      console.error(`[${requestId}] Validation failed: No operation specified.`);
      return NextResponse.json({ error: 'No operation specified' }, { status: 400 });
    }

    // Validate operation
    const supportedOperations = ['merge', 'split', 'extract-pages', 'remove-pages', 'watermark', 'rotate', 'crop', 'page-numbers'];
    if (!supportedOperations.includes(operation)) {
      console.error(`[${requestId}] Validation failed: Unsupported operation '${operation}'.`);
      return NextResponse.json({ error: `Unsupported operation: ${operation}` }, { status: 400 });
    }

    if (operation !== 'merge' && !file) {
      console.error(`[${requestId}] Validation failed: No file provided for operation '${operation}'.`);
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (operation === 'merge' && files.length === 0) {
      console.error(`[${requestId}] Validation failed: No files provided for merge operation.`);
      return NextResponse.json({ error: 'No files provided for merge operation' }, { status: 400 });
    }

    let resultBuffer: Buffer;

    console.log(`[${requestId}] Step 2: Starting ${operation} operation...`);

    switch (operation) {
      case 'merge':
        resultBuffer = await mergePDFs(files);
        break;
      case 'split':
        tempFilePath = await saveTempFile(Buffer.from(await file!.arrayBuffer()));
        resultBuffer = await splitPDF(tempFilePath, options);
        break;
      case 'extract-pages':
        tempFilePath = await saveTempFile(Buffer.from(await file!.arrayBuffer()));
        resultBuffer = await extractPages(tempFilePath, options);
        break;
      case 'remove-pages':
        tempFilePath = await saveTempFile(Buffer.from(await file!.arrayBuffer()));
        resultBuffer = await removePages(tempFilePath, options);
        break;
        case 'watermark':
            console.log(`[${requestId}] Starting watermark operation with options:`, options);
            tempFilePath = await saveTempFile(Buffer.from(await file!.arrayBuffer()));
            console.log(`[${requestId}] Temporary file created: ${tempFilePath}`);
            resultBuffer = await addWatermark(tempFilePath, options);
            console.log(`[${requestId}] Watermark operation completed successfully`);
            break;
            
        case 'rotate':
            console.log(`[${requestId}] Starting rotate operation with options:`, options);
            tempFilePath = await saveTempFile(Buffer.from(await file!.arrayBuffer()));
            console.log(`[${requestId}] Temporary file created: ${tempFilePath}`);
            resultBuffer = await rotatePDF(tempFilePath, options);
            console.log(`[${requestId}] Rotate operation completed successfully`);
            break;
            
        case 'crop':
            console.log(`[${requestId}] Starting crop operation with options:`, options);
            tempFilePath = await saveTempFile(Buffer.from(await file!.arrayBuffer()));
            console.log(`[${requestId}] Temporary file created: ${tempFilePath}`);
            resultBuffer = await cropPDF(tempFilePath, options);
            console.log(`[${requestId}] Crop operation completed successfully`);
            break;
            
        case 'page-numbers':
            console.log(`[${requestId}] Starting page-numbers operation with options:`, options);
            tempFilePath = await saveTempFile(Buffer.from(await file!.arrayBuffer()));
            console.log(`[${requestId}] Temporary file created: ${tempFilePath}`);
            resultBuffer = await addPageNumbers(tempFilePath, options);
            console.log(`[${requestId}] Page-numbers operation completed successfully`);
            break;
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }

    console.log(`[${requestId}] Step 3: Operation completed successfully. Result size: ${resultBuffer.length} bytes`);

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${operation}-document-${timestamp}.pdf`;

    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);

    console.log(`[${requestId}] --- Processing request finished successfully ---`);
    return new NextResponse(new Uint8Array(resultBuffer), { headers });

  } catch (error: any) {
    console.error(`[${requestId}] --- PDF PROCESSING FAILED ---`);
    console.error(`[${requestId}] Error Message:`, error.message);
    console.error(`[${requestId}] Error Stack:`, error.stack);
    console.error(`[${requestId}] Error Type:`, typeof error);
    console.error(`[${requestId}] Error Constructor:`, error.constructor.name);
    
    // More detailed error information
    if (error.message) {
      console.error(`[${requestId}] Detailed Error:`, error.message);
    }
    
    return NextResponse.json(
      { 
        error: 'Processing failed', 
        details: error.message,
        type: error.constructor.name,
        operation: operation || 'unknown'
      },
      { status: 500 },
    );
  } finally {
    // Cleanup temporary files
    if (tempFilePath) {
      try {
        await safeUnlink(tempFilePath);
        console.log(`[${requestId}] Cleaned up temporary file: ${tempFilePath}`);
      } catch (cleanupError) {
        console.error(`[${requestId}] Failed to delete temporary file: ${tempFilePath}`, cleanupError);
      }
    }
  }
}
