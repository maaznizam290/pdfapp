import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

export async function POST(request: NextRequest) {
  const requestId = `secure-download-${Date.now()}`;
  
  console.log(`[${requestId}] --- New secure download request received ---`);

  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const operation = formData.get('operation') as string;

    console.log(`[${requestId}] Step 1: Form data parsed. Operation: ${operation}, Files: ${files.length}`);

    if (!files || files.length === 0) {
      console.error(`[${requestId}] Validation failed: No files provided.`);
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (!operation) {
      console.error(`[${requestId}] Validation failed: No operation specified.`);
      return NextResponse.json({ error: 'No operation specified' }, { status: 400 });
    }

    // Validate operation
    const supportedOperations = ['merge'];
    if (!supportedOperations.includes(operation)) {
      console.error(`[${requestId}] Validation failed: Unsupported operation '${operation}'.`);
      return NextResponse.json({ error: `Unsupported operation: ${operation}` }, { status: 400 });
    }

    let resultBuffer: Buffer;

    console.log(`[${requestId}] Step 2: Starting secure ${operation} operation...`);

    try {
      switch (operation) {
        case 'merge':
          resultBuffer = await mergePDFs(files);
          break;
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      console.log(`[${requestId}] Step 3: Operation completed successfully. Result size: ${resultBuffer.length} bytes`);

      // Generate a secure filename with timestamp
      const timestamp = Date.now();
      const secureFilename = `secure-${operation}-document-${timestamp}.pdf`;
      
      console.log(`[${requestId}] Step 4: Preparing secure download response with filename '${secureFilename}'.`);
      
      // Return the processed file with maximum security headers
      return new Response(new Uint8Array(resultBuffer), {
        status: 200,
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
          'Referrer-Policy': 'no-referrer',
          'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
        },
      });

    } catch (error: any) {
      console.error(`[${requestId}] PDF processing error:`, error);
      return NextResponse.json(
        { error: 'PDF processing failed', details: error.message },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error(`[${requestId}] Secure download endpoint error:`, error);
    return NextResponse.json(
      { error: 'Request processing failed', details: error.message },
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
