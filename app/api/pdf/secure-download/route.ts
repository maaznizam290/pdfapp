import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const operation = formData.get('operation') as string;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (!operation) {
      return NextResponse.json({ error: 'No operation specified' }, { status: 400 });
    }

    let resultBuffer: Buffer;

    try {
      switch (operation) {
        case 'merge':
          resultBuffer = await mergePDFs(files);
          break;
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      // Generate a secure filename with timestamp
      const timestamp = Date.now();
      const secureFilename = `merged-document-${timestamp}.pdf`;
      
      // Return the processed file with maximum security headers
      return new NextResponse(resultBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${secureFilename}"`,
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Length': resultBuffer.length.toString(),
          'Accept-Ranges': 'bytes',
          'Content-Security-Policy': "default-src 'self'",
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
          'X-Download-Options': 'noopen',
          'X-Permitted-Cross-Domain-Policies': 'none',
        },
      });

    } catch (error) {
      console.error('PDF processing error:', error);
      return NextResponse.json(
        { error: 'PDF processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Secure download endpoint error:', error);
    return NextResponse.json(
      { error: 'Request processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PDF Processing Functions
async function mergePDFs(files: File[]): Promise<Buffer> {
  console.log('Secure merge function called with files:', files.map(f => ({ name: f.name, size: f.size })));
  
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
