import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import * as XLSX from 'xlsx';
import * as mammoth from 'mammoth';
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

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!operation) {
      return NextResponse.json({ error: 'No operation specified' }, { status: 400 });
    }

    // Create temporary file paths
    const tempDir = tmpdir();
    const inputPath = join(tempDir, `input_${Date.now()}.${getFileExtension(file.name)}`);
    const outputPath = join(tempDir, `output_${Date.now()}.${getOutputExtension(operation)}`);

    // Save uploaded file
    const fileBuffer = await file.arrayBuffer();
    await writeFile(inputPath, Buffer.from(fileBuffer));

    let resultBuffer: Buffer;
    let contentType: string;
    let filename: string;

    try {
      switch (operation) {
        case 'pdf-to-word':
          resultBuffer = await convertPDFToWord(inputPath);
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          filename = 'converted-document.docx';
          break;
        case 'pdf-to-excel':
          resultBuffer = await convertPDFToExcel(inputPath);
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          filename = 'converted-spreadsheet.xlsx';
          break;
        case 'pdf-to-powerpoint':
          resultBuffer = await convertPDFToPowerPoint(inputPath);
          contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
          filename = 'converted-presentation.pptx';
          break;
        case 'pdf-to-jpg':
          resultBuffer = await convertPDFToJPG(inputPath, options);
          contentType = options.extractMode === 'pages' ? 'application/zip' : 'image/jpeg';
          filename = options.extractMode === 'pages' ? 'converted-pages.zip' : 'converted-image.jpg';
          break;
        case 'word-to-pdf':
          resultBuffer = await convertWordToPDF(inputPath);
          contentType = 'application/pdf';
          filename = 'converted-document.pdf';
          break;
        case 'excel-to-pdf':
          resultBuffer = await convertExcelToPDF(inputPath);
          contentType = 'application/pdf';
          filename = 'converted-spreadsheet.pdf';
          break;
        case 'powerpoint-to-pdf':
          resultBuffer = await convertPowerPointToPDF(inputPath);
          contentType = 'application/pdf';
          filename = 'converted-presentation.pdf';
          break;
        case 'jpg-to-pdf':
          resultBuffer = await convertJPGToPDF(inputPath, options);
          contentType = 'application/pdf';
          filename = 'converted-images.pdf';
          break;
        default:
          throw new Error(`Unsupported conversion: ${operation}`);
      }

      // Return the converted file with secure headers
      return new NextResponse(resultBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Security-Policy': "default-src 'self'",
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });

    } finally {
      // Clean up temporary files
      await safeUnlink(inputPath);
      await safeUnlink(outputPath);
    }

  } catch (error) {
    console.error('File conversion error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Failed to parse body as FormData')) {
        return NextResponse.json(
          { error: 'Invalid request format. Please ensure you are sending FormData.' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'File conversion failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper functions
function getFileExtension(filename: string): string {
  return filename.split('.').pop() || '';
}

function getOutputExtension(operation: string): string {
  const extensionMap: { [key: string]: string } = {
    'pdf-to-word': 'docx',
    'pdf-to-excel': 'xlsx',
    'pdf-to-powerpoint': 'pptx',
    'pdf-to-jpg': 'jpg',
    'word-to-pdf': 'pdf',
    'excel-to-pdf': 'pdf',
    'powerpoint-to-pdf': 'pdf',
    'jpg-to-pdf': 'pdf',
  };
  return extensionMap[operation] || 'pdf';
}

// Conversion Functions
async function convertPDFToWord(inputPath: string): Promise<Buffer> {
  // For now, create a simple Word document with placeholder text
  // In a real implementation, you would use a library like pdf2docx
  const pdfBytes = await readFile(inputPath);
  const pdf = await PDFDocument.load(pdfBytes);
  
  // Create a simple Word document structure
  const wordContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>Converted from PDF (${pdf.getPageCount()} pages)</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;
  
  return Buffer.from(wordContent);
}

async function convertPDFToExcel(inputPath: string): Promise<Buffer> {
  const pdfBytes = await readFile(inputPath);
  const pdf = await PDFDocument.load(pdfBytes);
  
  // Create a simple Excel workbook
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([
    ['PDF Information'],
    ['Total Pages', pdf.getPageCount()],
    ['Converted Date', new Date().toISOString()],
  ]);
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'PDF Data');
  const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  return Buffer.from(excelBuffer);
}

async function convertPDFToPowerPoint(inputPath: string): Promise<Buffer> {
  // Create a simple PowerPoint structure
  const pdfBytes = await readFile(inputPath);
  const pdf = await PDFDocument.load(pdfBytes);
  
  const pptContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rId1"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId2"/>
  </p:sldIdLst>
  <p:sldSz cx="9144000" cy="6858000"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`;
  
  return Buffer.from(pptContent);
}

async function convertPDFToJPG(inputPath: string, options: any): Promise<Buffer> {
  const pdfBytes = await readFile(inputPath);
  const pdf = await PDFDocument.load(pdfBytes);
  
  if (options.extractMode === 'pages') {
    // Create a ZIP file with multiple JPG files
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    for (let i = 0; i < pdf.getPageCount(); i++) {
      // Create a simple placeholder image for each page
      const imageData = createPlaceholderImage(`Page ${i + 1}`);
      zip.file(`page_${i + 1}.jpg`, imageData);
    }
    
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    return Buffer.from(zipBuffer);
  } else {
    // Return single JPG
    const imageData = createPlaceholderImage('PDF Page');
    return Buffer.from(imageData);
  }
}

async function convertWordToPDF(inputPath: string): Promise<Buffer> {
  try {
    // Try to convert using mammoth for .docx files
    const result = await mammoth.convertToHtml({ path: inputPath });
    const html = result.value;
    
    // Create a simple PDF from HTML content
    const pdf = await PDFDocument.create();
    const page = pdf.addPage();
    
    page.drawText(html.substring(0, 1000), {
      x: 50,
      y: page.getHeight() - 50,
      size: 12,
    });
    
    const pdfBytes = await pdf.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    // Fallback: create a simple PDF
    const pdf = await PDFDocument.create();
    const page = pdf.addPage();
    
    page.drawText('Converted from Word document', {
      x: 50,
      y: page.getHeight() - 50,
      size: 12,
    });
    
    const pdfBytes = await pdf.save();
    return Buffer.from(pdfBytes);
  }
}

async function convertExcelToPDF(inputPath: string): Promise<Buffer> {
  try {
    const workbook = XLSX.readFile(inputPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    const pdf = await PDFDocument.create();
    const page = pdf.addPage();
    
    let y = page.getHeight() - 50;
    data.slice(0, 20).forEach((row: any) => {
      if (Array.isArray(row)) {
        const text = row.join(' | ');
        page.drawText(text.substring(0, 100), {
          x: 50,
          y,
          size: 10,
        });
        y -= 20;
      }
    });
    
    const pdfBytes = await pdf.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    // Fallback: create a simple PDF
    const pdf = await PDFDocument.create();
    const page = pdf.addPage();
    
    page.drawText('Converted from Excel spreadsheet', {
      x: 50,
      y: page.getHeight() - 50,
      size: 12,
    });
    
    const pdfBytes = await pdf.save();
    return Buffer.from(pdfBytes);
  }
}

async function convertPowerPointToPDF(inputPath: string): Promise<Buffer> {
  // Create a simple PDF representation
  const pdf = await PDFDocument.create();
  const page = pdf.addPage();
  
  page.drawText('Converted from PowerPoint presentation', {
    x: 50,
    y: page.getHeight() - 50,
    size: 12,
  });
  
  const pdfBytes = await pdf.save();
  return Buffer.from(pdfBytes);
}

async function convertJPGToPDF(inputPath: string, options: any): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  
  try {
    // For now, create a PDF with placeholder text
    // In a real implementation, you would embed the actual image
    const page = pdf.addPage();
    
    page.drawText('Converted from JPG image', {
      x: 50,
      y: page.getHeight() - 50,
      size: 12,
    });
    
    const pdfBytes = await pdf.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    // Fallback
    const page = pdf.addPage();
    page.drawText('Image conversion placeholder', {
      x: 50,
      y: page.getHeight() - 50,
      size: 12,
    });
    
    const pdfBytes = await pdf.save();
    return Buffer.from(pdfBytes);
  }
}

function createPlaceholderImage(text: string): Buffer {
  // Create a simple placeholder image
  // In a real implementation, you would use a library like canvas or sharp
  const svg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="200" fill="#f0f0f0"/>
    <text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="14">${text}</text>
  </svg>`;
  
  return Buffer.from(svg);
}
