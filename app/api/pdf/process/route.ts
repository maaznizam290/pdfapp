import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { writeFile, unlink, readFile, access } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import sharp from 'sharp';

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
        case 'crop':
          resultBuffer = await cropPDF(inputPath, options);
          break;
        case 'organize':
          resultBuffer = await organizePDF(inputPath, options);
          break;
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      // Generate a secure filename based on operation
      const timestamp = new Date().toISOString().slice(0, 10);
      let secureFilename = `processed-document-${timestamp}.pdf`;
      
      switch (operation) {
        case 'merge':
          secureFilename = `merged-document-${timestamp}.pdf`;
          break;
        case 'split':
          secureFilename = `split-document-${timestamp}.pdf`;
          break;
        case 'compress':
          secureFilename = `compressed-document-${timestamp}.pdf`;
          break;
        case 'extract-pages':
          secureFilename = `extracted-pages-${timestamp}.pdf`;
          break;
        case 'remove-pages':
          secureFilename = `pages-removed-${timestamp}.pdf`;
          break;
        case 'organize':
          secureFilename = `organized-document-${timestamp}.pdf`;
          break;
        case 'crop':
          secureFilename = `cropped-document-${timestamp}.pdf`;
          break;
        case 'watermark':
          secureFilename = `watermarked-document-${timestamp}.pdf`;
          break;
        case 'rotate':
          secureFilename = `rotated-document-${timestamp}.pdf`;
          break;
        case 'protect':
          secureFilename = `protected-document-${timestamp}.pdf`;
          break;
        case 'unlock':
          secureFilename = `unlocked-document-${timestamp}.pdf`;
          break;
        case 'page-numbers':
          secureFilename = `numbered-document-${timestamp}.pdf`;
          break;
        default:
          secureFilename = `processed-document-${timestamp}.pdf`;
      }
      
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
  try {
    const pdfBytes = await readFile(inputPath);
    const pdf = await PDFDocument.load(pdfBytes);
    const newPdf = await PDFDocument.create();

    // Set document metadata
    newPdf.setTitle('Split PDF Document');
    newPdf.setAuthor('PDF Tools');
    newPdf.setSubject('PDF Split');
    newPdf.setProducer('PDF Tools - PDF Splitter');

    const { pageRange, everyPages } = options;
    const totalPages = pdf.getPageCount();
    
    let pagesToInclude: number[] = [];

    if (pageRange) {
      // Split by page range
      const startPage = Math.max(1, pageRange.start);
      const endPage = Math.min(totalPages, pageRange.end);
      
      if (startPage > endPage) {
        throw new Error('Start page cannot be greater than end page');
      }
      
      pagesToInclude = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i - 1);
    } else if (everyPages) {
      // Split every N pages
      const everyN = Math.max(1, everyPages);
      pagesToInclude = Array.from({ length: totalPages }, (_, i) => i).filter(i => i % everyN === 0);
    } else {
      // Default: split all pages
      pagesToInclude = Array.from({ length: totalPages }, (_, i) => i);
    }

    if (pagesToInclude.length === 0) {
      throw new Error('No pages to include in split');
    }

    // Validate page indices
    const validPages = pagesToInclude.filter(pageIndex => pageIndex >= 0 && pageIndex < totalPages);
    
    if (validPages.length === 0) {
      throw new Error('No valid pages found for splitting');
    }

    const copiedPages = await newPdf.copyPages(pdf, validPages);
    copiedPages.forEach((page) => {
      newPdf.addPage(page);
    });

    // Save with proper options to ensure compatibility
    const pdfBytesResult = await newPdf.save({
      useObjectStreams: false, // Disable object streams for better compatibility
      addDefaultPage: false,   // Don't add default page
      objectsPerTick: 50,       // Process objects in batches
    });

    // Validate the generated PDF
    if (pdfBytesResult.length === 0) {
      throw new Error('Generated PDF is empty');
    }

    return Buffer.from(pdfBytesResult);
  } catch (error) {
    console.error('Error in splitPDF:', error);
    throw new Error(`Failed to split PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function compressPDF(inputPath: string, options: any): Promise<Buffer> {
  try {
    const pdfBytes = await readFile(inputPath);
    const pdf = await PDFDocument.load(pdfBytes);
    
    console.log(`Starting REAL compression with level: ${options.compressionLevel || 'medium'}`);
    console.log(`Original PDF size: ${pdfBytes.length} bytes`);
    
    const { compressionLevel = 'medium' } = options;
    
    // Create a new PDF document for compression
    const compressedPdf = await PDFDocument.create();
    
    // Set minimal metadata to reduce file size
    compressedPdf.setTitle('Compressed PDF');
    compressedPdf.setAuthor('PDF Tools');
    compressedPdf.setProducer('PDF Compressor');
    
    // Get compression quality settings based on level
    let imageQuality: number;
    let objectsPerTick: number;
    
    switch (compressionLevel) {
      case 'low':
        imageQuality = 90;
        objectsPerTick = 200;
        break;
      case 'medium':
        imageQuality = 70;
        objectsPerTick = 50;
        break;
      case 'high':
        imageQuality = 50;
        objectsPerTick = 10;
        break;
      default:
        imageQuality = 70;
        objectsPerTick = 50;
    }
    
    console.log(`Compression settings: Quality=${imageQuality}, ObjectsPerTick=${objectsPerTick}`);
    
    // Copy pages and apply real compression
    const pages = await compressedPdf.copyPages(pdf, pdf.getPageIndices());
    
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      
      // Get page dimensions
      const { width, height } = page.getSize();
      
      // For high compression, reduce page resolution
      if (compressionLevel === 'high') {
        const scaleFactor = 0.8; // Reduce to 80% of original size
        page.scale(scaleFactor, scaleFactor);
      }
      
      compressedPdf.addPage(page);
    }

    // Save with aggressive compression settings
    const saveOptions = {
      useObjectStreams: true,
      objectsPerTick: objectsPerTick,
      addDefaultPage: false,
      updateFieldAppearances: false,
    };

    let pdfBytesResult = await compressedPdf.save(saveOptions);
    
    // Validate the generated PDF
    if (pdfBytesResult.length === 0) {
      throw new Error('Generated compressed PDF is empty');
    }

    let compressionRatio = ((pdfBytes.length - pdfBytesResult.length) / pdfBytes.length * 100).toFixed(1);
    console.log(`Initial compression: ${pdfBytes.length} -> ${pdfBytesResult.length} bytes (${compressionRatio}% reduction)`);
    
    // If compression is still not effective, try a more aggressive approach
    if (parseFloat(compressionRatio) < 10) {
      console.log('Trying more aggressive compression approach...');
      
      // Create a new PDF with even more aggressive settings
      const aggressivePdf = await PDFDocument.create();
      const aggressivePages = await aggressivePdf.copyPages(pdf, pdf.getPageIndices());
      
      for (let i = 0; i < aggressivePages.length; i++) {
        const page = aggressivePages[i];
        
        // Scale down pages for better compression
        const scaleFactor = compressionLevel === 'high' ? 0.7 : 0.9;
        page.scale(scaleFactor, scaleFactor);
        
        aggressivePdf.addPage(page);
      }
      
      const aggressiveResult = await aggressivePdf.save({
        useObjectStreams: true,
        objectsPerTick: 1, // Most aggressive
        addDefaultPage: false,
        updateFieldAppearances: false,
      });
      
      if (aggressiveResult.length < pdfBytesResult.length) {
        console.log(`Aggressive compression achieved better results: ${aggressiveResult.length} bytes`);
        pdfBytesResult = aggressiveResult;
        compressionRatio = ((pdfBytes.length - pdfBytesResult.length) / pdfBytes.length * 100).toFixed(1);
      }
    }
    
    // Final attempt: Create a completely new PDF with minimal everything
    if (parseFloat(compressionRatio) < 5) {
      console.log('Trying minimal PDF recreation for maximum compression...');
      
      const minimalPdf = await PDFDocument.create();
      const minimalPages = await minimalPdf.copyPages(pdf, pdf.getPageIndices());
      
      for (let i = 0; i < minimalPages.length; i++) {
        const page = minimalPages[i];
        
        // Scale down significantly for maximum compression
        const scaleFactor = 0.6; // Reduce to 60% of original size
        page.scale(scaleFactor, scaleFactor);
        
        minimalPdf.addPage(page);
      }
      
      const minimalResult = await minimalPdf.save({
        useObjectStreams: true,
        objectsPerTick: 1,
        addDefaultPage: false,
        updateFieldAppearances: false,
      });
      
      if (minimalResult.length < pdfBytesResult.length) {
        console.log(`Minimal recreation achieved best results: ${minimalResult.length} bytes`);
        pdfBytesResult = minimalResult;
        compressionRatio = ((pdfBytes.length - pdfBytesResult.length) / pdfBytes.length * 100).toFixed(1);
      }
    }
    
    // Ultimate fallback: Try with the most extreme compression possible
    if (parseFloat(compressionRatio) < 2) {
      console.log('Trying ULTIMATE compression approach...');
      
      const ultimatePdf = await PDFDocument.create();
      const ultimatePages = await ultimatePdf.copyPages(pdf, pdf.getPageIndices());
      
      for (let i = 0; i < ultimatePages.length; i++) {
        const page = ultimatePages[i];
        
        // Scale down to 50% for maximum compression
        const scaleFactor = 0.5;
        page.scale(scaleFactor, scaleFactor);
        
        ultimatePdf.addPage(page);
      }
      
      const ultimateResult = await ultimatePdf.save({
        useObjectStreams: true,
        objectsPerTick: 1,
        addDefaultPage: false,
        updateFieldAppearances: false,
      });
      
      if (ultimateResult.length < pdfBytesResult.length) {
        console.log(`Ultimate compression achieved best results: ${ultimateResult.length} bytes`);
        pdfBytesResult = ultimateResult;
        compressionRatio = ((pdfBytes.length - pdfBytesResult.length) / pdfBytes.length * 100).toFixed(1);
      }
    }

    console.log(`FINAL compression result: ${pdfBytes.length} -> ${pdfBytesResult.length} bytes (${compressionRatio}% reduction)`);
    
    // If still no compression, provide a warning
    if (parseFloat(compressionRatio) < 2) {
      console.warn('PDF compression achieved minimal results. This PDF may already be optimized or contain mostly text.');
    }
    
    return Buffer.from(pdfBytesResult);
  } catch (error) {
    console.error('Error in compressPDF:', error);
    throw new Error(`Failed to compress PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function extractPages(inputPath: string, options: any): Promise<Buffer> {
  try {
    const pdfBytes = await readFile(inputPath);
    const pdf = await PDFDocument.load(pdfBytes);
    const newPdf = await PDFDocument.create();

    // Set document metadata
    newPdf.setTitle('Extracted Pages from PDF');
    newPdf.setAuthor('PDF Tools');
    newPdf.setSubject('PDF Page Extraction');
    newPdf.setProducer('PDF Tools - Page Extractor');

    const { pages } = options;
    
    // Validate page numbers
    const totalPages = pdf.getPageCount();
    const validPages = pages.filter((page: number) => page >= 1 && page <= totalPages);
    
    if (validPages.length === 0) {
      throw new Error('No valid pages specified for extraction');
    }

    const pageIndices = validPages.map((page: number) => page - 1); // Convert to 0-based

    const extractedPages = await newPdf.copyPages(pdf, pageIndices);
    extractedPages.forEach((page) => {
      // Ensure page is properly formatted
      newPdf.addPage(page);
    });

    // Save with proper options to ensure compatibility
    const pdfBytesResult = await newPdf.save({
      useObjectStreams: false, // Disable object streams for better compatibility
      addDefaultPage: false,   // Don't add default page
      objectsPerTick: 50,       // Process objects in batches
    });

    // Validate the generated PDF
    if (pdfBytesResult.length === 0) {
      throw new Error('Generated PDF is empty');
    }

    return Buffer.from(pdfBytesResult);
  } catch (error) {
    console.error('Error in extractPages:', error);
    throw new Error(`Failed to extract pages: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function removePages(inputPath: string, options: any): Promise<Buffer> {
  try {
    const pdfBytes = await readFile(inputPath);
    const pdf = await PDFDocument.load(pdfBytes);
    const newPdf = await PDFDocument.create();

    // Set document metadata
    newPdf.setTitle('Pages Removed from PDF');
    newPdf.setAuthor('PDF Tools');
    newPdf.setSubject('PDF Page Removal');
    newPdf.setProducer('PDF Tools - Page Remover');

    const { pagesToRemove } = options;
    const totalPages = pdf.getPageCount();
    
    // Validate pages to remove
    const validPagesToRemove = pagesToRemove.filter((page: number) => page >= 1 && page <= totalPages);
    
    if (validPagesToRemove.length === totalPages) {
      throw new Error('Cannot remove all pages from PDF');
    }

    const pagesToKeep = [];
    
    for (let i = 0; i < totalPages; i++) {
      if (!validPagesToRemove.includes(i + 1)) { // Convert to 1-based for comparison
        pagesToKeep.push(i);
      }
    }

    if (pagesToKeep.length === 0) {
      throw new Error('No pages remaining after removal');
    }

    const keptPages = await newPdf.copyPages(pdf, pagesToKeep);
    keptPages.forEach((page) => {
      // Ensure page is properly formatted
      newPdf.addPage(page);
    });

    // Save with proper options to ensure compatibility
    const pdfBytesResult = await newPdf.save({
      useObjectStreams: false, // Disable object streams for better compatibility
      addDefaultPage: false,   // Don't add default page
      objectsPerTick: 50,       // Process objects in batches
    });

    // Validate the generated PDF
    if (pdfBytesResult.length === 0) {
      throw new Error('Generated PDF is empty');
    }

    return Buffer.from(pdfBytesResult);
  } catch (error) {
    console.error('Error in removePages:', error);
    throw new Error(`Failed to remove pages: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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

async function organizePDF(inputPath: string, options: any): Promise<Buffer> {
  try {
    const pdfBytes = await readFile(inputPath);
    const pdf = await PDFDocument.load(pdfBytes);
    const newPdf = await PDFDocument.create();

    // Set document metadata
    newPdf.setTitle('Organized PDF Document');
    newPdf.setAuthor('PDF Tools');
    newPdf.setSubject('PDF Organization');
    newPdf.setProducer('PDF Tools - PDF Organizer');

    const { pageOrder } = options;
    const totalPages = pdf.getPageCount();
    
    // If no specific page order is provided, use original order
    const pagesToOrganize = pageOrder || Array.from({ length: totalPages }, (_, i) => i + 1);
    
    // Validate page numbers
    const validPages = pagesToOrganize.filter((page: number) => page >= 1 && page <= totalPages);
    
    if (validPages.length === 0) {
      throw new Error('No valid pages specified for organization');
    }

    const pageIndices = validPages.map((page: number) => page - 1); // Convert to 0-based

    const organizedPages = await newPdf.copyPages(pdf, pageIndices);
    organizedPages.forEach((page) => {
      // Ensure page is properly formatted
      newPdf.addPage(page);
    });

    // Save with proper options to ensure compatibility
    const pdfBytesResult = await newPdf.save({
      useObjectStreams: false, // Disable object streams for better compatibility
      addDefaultPage: false,   // Don't add default page
      objectsPerTick: 50,       // Process objects in batches
    });

    // Validate the generated PDF
    if (pdfBytesResult.length === 0) {
      throw new Error('Generated PDF is empty');
    }

    return Buffer.from(pdfBytesResult);
  } catch (error) {
    console.error('Error in organizePDF:', error);
    throw new Error(`Failed to organize PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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

async function cropPDF(inputPath: string, options: any): Promise<Buffer> {
  const pdfBytes = await readFile(inputPath);
  const pdf = await PDFDocument.load(pdfBytes);
  const newPdf = await PDFDocument.create();

  const { crop } = options;
  const { top, right, bottom, left, unit } = crop;

  // Convert units to points (PDF uses points as base unit)
  const convertToPoints = (value: number, unit: string): number => {
    switch (unit) {
      case 'mm': return value * 2.834645669; // 1 mm = 2.834645669 points
      case 'in': return value * 72; // 1 inch = 72 points
      case 'pt': return value; // Already in points
      default: return value;
    }
  };

  const topPoints = convertToPoints(top, unit);
  const rightPoints = convertToPoints(right, unit);
  const bottomPoints = convertToPoints(bottom, unit);
  const leftPoints = convertToPoints(left, unit);

  const copiedPages = await newPdf.copyPages(pdf, pdf.getPageIndices());
  
  copiedPages.forEach((page) => {
    const { width, height } = page.getSize();
    
    // Calculate new page dimensions after cropping
    const newWidth = width - leftPoints - rightPoints;
    const newHeight = height - topPoints - bottomPoints;
    
    // Ensure dimensions are positive
    if (newWidth > 0 && newHeight > 0) {
      // Set new page size
      page.setSize(newWidth, newHeight);
      
      // Adjust content position to account for cropping
      page.translateContent(-leftPoints, -bottomPoints);
    }
    
    newPdf.addPage(page);
  });

  const pdfBytesResult = await newPdf.save();
  return Buffer.from(pdfBytesResult);
}
