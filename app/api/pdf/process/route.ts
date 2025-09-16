import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
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
    const supportedOperations = ['merge', 'split', 'extract-pages', 'remove-pages'];
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
    
    return NextResponse.json(
      { error: 'Processing failed', details: error.message },
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
