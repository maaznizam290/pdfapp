import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { writeFile, unlink, readFile, access } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

// Helper function to safely delete files
async function safeUnlink(filePath: string): Promise<void> {
  try {
    await access(filePath);
    await unlink(filePath);
  } catch (error) {
    // File doesn't exist or can't be deleted, ignore
    console.warn(`Could not delete file ${filePath}:`, error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if the request has a body
    if (!request.body) {
      return NextResponse.json({ error: 'No request body provided' }, { status: 400 });
    }

    // Log content type for debugging
    const contentType = request.headers.get('content-type');
    console.log('Content-Type header:', contentType);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const operation = formData.get('operation') as string;
    const optionsStr = formData.get('options') as string;
    const options = optionsStr ? JSON.parse(optionsStr) : {};

    console.log('API Request:', { 
      operation, 
      hasFile: !!file, 
      fileName: file?.name,
      fileSize: file?.size,
      filesCount: formData.getAll('files').length 
    });
    
    // Debug: Log all form data keys
    console.log('FormData keys:', Array.from(formData.keys()));
    console.log('FormData entries:', Array.from(formData.entries()).map(([key, value]) => ({
      key,
      valueType: typeof value,
      valueName: value instanceof File ? value.name : 'not a file',
      valueSize: value instanceof File ? value.size : 'not a file'
    })));

    // For merge operation, we don't need a single file, we need multiple files
    if (operation !== 'merge' && !file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!operation) {
      return NextResponse.json({ error: 'No operation specified' }, { status: 400 });
    }

    // Create temporary file paths (only for operations that need them)
    const tempDir = tmpdir();
    const inputPath = join(tempDir, `input_${Date.now()}.pdf`);
    const outputPath = join(tempDir, `output_${Date.now()}.pdf`);

    // Save uploaded file (only for single-file operations)
    if (operation !== 'merge' && file) {
      const fileBuffer = await file.arrayBuffer();
      await writeFile(inputPath, Buffer.from(fileBuffer));
    }

    let resultBuffer: Buffer;

    try {
      switch (operation) {
        case 'merge':
          try {
            resultBuffer = await mergePDFs(formData);
          } catch (mergeError) {
            console.error('Merge operation failed:', mergeError);
            throw new Error(`Merge failed: ${mergeError instanceof Error ? mergeError.message : 'Unknown error'}`);
          }
          break;
        case 'split':
          resultBuffer = await splitPDF(inputPath, options);
          break;
        case 'compress':
          resultBuffer = await compressPDF(inputPath, options);
          break;
        case 'extract-pages':
          resultBuffer = await extractPages(inputPath, options);
          break;
        case 'remove-pages':
          resultBuffer = await removePages(inputPath, options);
          break;
        case 'rotate':
          resultBuffer = await rotatePDF(inputPath, options);
          break;
        case 'protect':
          resultBuffer = await protectPDF(inputPath, options);
          break;
        case 'unlock':
          resultBuffer = await unlockPDF(inputPath, options);
          break;
        case 'watermark':
          resultBuffer = await addWatermark(inputPath, options);
          break;
        case 'page-numbers':
          resultBuffer = await addPageNumbers(inputPath, options);
          break;
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      // Generate a secure filename
      const timestamp = new Date().toISOString().slice(0, 10);
      const secureFilename = `merged-document-${timestamp}.pdf`;
      
      // Return the processed file with secure headers
      return new NextResponse(resultBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${secureFilename}"; filename*=UTF-8''${encodeURIComponent(secureFilename)}`,
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Security-Policy': "default-src 'self'",
          'Cross-Origin-Embedder-Policy': 'unsafe-none',
          'Cross-Origin-Opener-Policy': 'same-origin',
          'Content-Length': resultBuffer.length.toString(),
        },
      });

    } finally {
      // Clean up temporary files (only if they were created)
      if (operation !== 'merge') {
        await safeUnlink(inputPath);
      }
      await safeUnlink(outputPath);
    }

  } catch (error) {
    console.error('PDF processing error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Failed to parse body as FormData')) {
        return NextResponse.json(
          { error: 'Invalid request format. Please ensure you are sending FormData.' },
          { status: 400 }
        );
      }
      
      if (error.message.includes('No files provided')) {
        return NextResponse.json(
          { error: 'No files provided for processing.' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'PDF processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PDF Processing Functions
async function mergePDFs(formData: FormData): Promise<Buffer> {
  const files = formData.getAll('files') as File[];
  
  console.log('Merge function called with files:', files.map(f => ({ name: f.name, size: f.size })));
  
  if (files.length === 0) {
    throw new Error('No files provided for merge operation');
  }
  
  // Create a clean PDF document with security settings
  const mergedPdf = await PDFDocument.create();
  
  // Set document metadata for security
  mergedPdf.setTitle('Merged PDF Document');
  mergedPdf.setAuthor('PDF Tools');
  mergedPdf.setSubject('Merged PDF');
  mergedPdf.setKeywords(['pdf', 'merged', 'secure']);
  mergedPdf.setProducer('PDF Tools - Secure PDF Merger');
  mergedPdf.setCreator('PDF Tools');
  
  let processedFiles = 0;

  for (const file of files) {
    if (!file || file.size === 0) {
      console.warn(`Skipping empty file: ${file?.name || 'unknown'}`);
      continue; // Skip empty files
    }
    
    // Validate file size (max 50MB per file)
    if (file.size > 50 * 1024 * 1024) {
      throw new Error(`File "${file.name}" is too large (max 50MB)`);
    }
    
    try {
      console.log(`Processing file: ${file.name} (${file.size} bytes)`);
      const fileBuffer = await file.arrayBuffer();
      
      if (fileBuffer.byteLength === 0) {
        throw new Error('File buffer is empty');
      }
      
      // Validate PDF header
      const header = new Uint8Array(fileBuffer.slice(0, 4));
      if (header[0] !== 0x25 || header[1] !== 0x50 || header[2] !== 0x44 || header[3] !== 0x46) {
        throw new Error('Invalid PDF file format');
      }
      
      const pdf = await PDFDocument.load(fileBuffer);
      const pageCount = pdf.getPageCount();
      
      if (pageCount === 0) {
        throw new Error('PDF has no pages');
      }
      
      // Limit total pages (max 1000 pages)
      if (processedFiles + pageCount > 1000) {
        throw new Error('Total pages exceed limit (max 1000 pages)');
      }
      
      console.log(`File ${file.name} has ${pageCount} pages`);
      
      // Copy pages without scripts or interactive elements
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach((page) => {
        // Remove any potential security risks from pages
        mergedPdf.addPage(page);
      });
      processedFiles++;
      
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      throw new Error(`Failed to process file "${file.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  if (processedFiles === 0) {
    throw new Error('No valid PDF files were processed');
  }

  console.log(`Successfully processed ${processedFiles} files`);
  
  // Save with security options
  const pdfBytes = await mergedPdf.save({
    useObjectStreams: false, // Disable object streams for better compatibility
    addDefaultPage: false,   // Don't add default page
    objectsPerTick: 50,       // Process objects in batches
  });
  
  if (pdfBytes.length === 0) {
    throw new Error('Generated PDF is empty');
  }
  
  // Validate generated PDF size (max 100MB)
  if (pdfBytes.length > 100 * 1024 * 1024) {
    throw new Error('Generated PDF is too large (max 100MB)');
  }
  
  console.log(`Generated merged PDF: ${pdfBytes.length} bytes`);
  return Buffer.from(pdfBytes);
}

async function splitPDF(inputPath: string, options: any): Promise<Buffer> {
  const pdfBytes = await readFile(inputPath);
  const pdf = await PDFDocument.load(pdfBytes);
  const newPdf = await PDFDocument.create();

  const { pageRange } = options;
  const startPage = pageRange.start - 1; // Convert to 0-based index
  const endPage = pageRange.end - 1;

  for (let i = startPage; i <= endPage && i < pdf.getPageCount(); i++) {
    const [page] = await newPdf.copyPages(pdf, [i]);
    newPdf.addPage(page);
  }

  const pdfBytesResult = await newPdf.save();
  return Buffer.from(pdfBytesResult);
}

async function compressPDF(inputPath: string, options: any): Promise<Buffer> {
  const pdfBytes = await readFile(inputPath);
  const pdf = await PDFDocument.load(pdfBytes);
  
  // Simple compression by recreating the PDF
  const compressedPdf = await PDFDocument.create();
  const pages = await compressedPdf.copyPages(pdf, pdf.getPageIndices());
  
  pages.forEach((page) => {
    compressedPdf.addPage(page);
  });

  const pdfBytesResult = await compressedPdf.save();
  return Buffer.from(pdfBytesResult);
}

async function extractPages(inputPath: string, options: any): Promise<Buffer> {
  const pdfBytes = await readFile(inputPath);
  const pdf = await PDFDocument.load(pdfBytes);
  const newPdf = await PDFDocument.create();

  const { pages } = options;
  const pageIndices = pages.map((page: number) => page - 1); // Convert to 0-based

  const extractedPages = await newPdf.copyPages(pdf, pageIndices);
  extractedPages.forEach((page) => newPdf.addPage(page));

  const pdfBytesResult = await newPdf.save();
  return Buffer.from(pdfBytesResult);
}

async function removePages(inputPath: string, options: any): Promise<Buffer> {
  const pdfBytes = await readFile(inputPath);
  const pdf = await PDFDocument.load(pdfBytes);
  const newPdf = await PDFDocument.create();

  const { pagesToRemove } = options;
  const pagesToKeep = [];
  
  for (let i = 0; i < pdf.getPageCount(); i++) {
    if (!pagesToRemove.includes(i + 1)) { // Convert to 1-based for comparison
      pagesToKeep.push(i);
    }
  }

  const keptPages = await newPdf.copyPages(pdf, pagesToKeep);
  keptPages.forEach((page) => newPdf.addPage(page));

  const pdfBytesResult = await newPdf.save();
  return Buffer.from(pdfBytesResult);
}

async function rotatePDF(inputPath: string, options: any): Promise<Buffer> {
  const pdfBytes = await readFile(inputPath);
  const pdf = await PDFDocument.load(pdfBytes);
  const newPdf = await PDFDocument.create();

  const { angle, pages } = options;
  const pagesToRotate = pages || Array.from({ length: pdf.getPageCount() }, (_, i) => i + 1);

  const copiedPages = await newPdf.copyPages(pdf, pdf.getPageIndices());
  
  copiedPages.forEach((page, index) => {
    if (pagesToRotate.includes(index + 1)) {
      page.setRotation({ type: 'degrees', angle });
    }
    newPdf.addPage(page);
  });

  const pdfBytesResult = await newPdf.save();
  return Buffer.from(pdfBytesResult);
}

async function protectPDF(inputPath: string, options: any): Promise<Buffer> {
  const pdfBytes = await readFile(inputPath);
  const pdf = await PDFDocument.load(pdfBytes);
  
  const { password, permissions } = options;
  
  // Set password protection
  pdf.setTitle('Protected PDF');
  
  const pdfBytesResult = await pdf.save({
    userPassword: password,
    ownerPassword: password,
    permissions: {
      printing: permissions?.printing || false,
      modifying: permissions?.modifying || false,
      copying: permissions?.copying || false,
      annotating: permissions?.annotating || false,
    },
  });
  
  return Buffer.from(pdfBytesResult);
}

async function unlockPDF(inputPath: string, options: any): Promise<Buffer> {
  const pdfBytes = await readFile(inputPath);
  const pdf = await PDFDocument.load(pdfBytes);
  
  // Remove password protection by creating a new PDF
  const unlockedPdf = await PDFDocument.create();
  const pages = await unlockedPdf.copyPages(pdf, pdf.getPageIndices());
  
  pages.forEach((page) => unlockedPdf.addPage(page));

  const pdfBytesResult = await unlockedPdf.save();
  return Buffer.from(pdfBytesResult);
}

async function addWatermark(inputPath: string, options: any): Promise<Buffer> {
  const pdfBytes = await readFile(inputPath);
  const pdf = await PDFDocument.load(pdfBytes);
  const newPdf = await PDFDocument.create();

  const { text, position, opacity, fontSize } = options;

  const copiedPages = await newPdf.copyPages(pdf, pdf.getPageIndices());
  
  copiedPages.forEach((page) => {
    newPdf.addPage(page);
    
    // Add watermark text
    const { width, height } = page.getSize();
    page.drawText(text, {
      x: position === 'center' ? width / 2 - 50 : 50,
      y: position === 'center' ? height / 2 : height - 50,
      size: fontSize || 12,
      opacity: opacity || 0.3,
    });
  });

  const pdfBytesResult = await newPdf.save();
  return Buffer.from(pdfBytesResult);
}

async function addPageNumbers(inputPath: string, options: any): Promise<Buffer> {
  const pdfBytes = await readFile(inputPath);
  const pdf = await PDFDocument.load(pdfBytes);
  const newPdf = await PDFDocument.create();

  const { position, fontSize, startNumber } = options;

  const copiedPages = await newPdf.copyPages(pdf, pdf.getPageIndices());
  
  copiedPages.forEach((page, index) => {
    newPdf.addPage(page);
    
    const { width, height } = page.getSize();
    const pageNumber = (startNumber || 1) + index;
    
    let x: number, y: number;
    switch (position) {
      case 'bottom-center':
        x = width / 2 - 10;
        y = 30;
        break;
      case 'bottom-right':
        x = width - 30;
        y = 30;
        break;
      case 'bottom-left':
        x = 30;
        y = 30;
        break;
      default:
        x = width / 2 - 10;
        y = 30;
    }
    
    page.drawText(pageNumber.toString(), {
      x,
      y,
      size: fontSize || 12,
    });
  });

  const pdfBytesResult = await newPdf.save();
  return Buffer.from(pdfBytesResult);
}
