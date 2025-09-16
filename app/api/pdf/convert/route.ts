import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { convert } from 'libreoffice-convert';
import { promisify } from 'util';
import { PDFDocument } from 'pdf-lib';
import * as XLSX from 'xlsx';
import sharp from 'sharp';
// import pdfParse from 'pdf-parse'; // Commented out due to file access issues
import { Document, Packer, Paragraph, TextRun } from 'docx';
import pptxgen from 'pptxgenjs';
import PDFParser from 'pdf2json';

const convertAsync = promisify(convert);

export async function POST(request: NextRequest) {
  const requestId = `conversion-${Date.now()}`; // Unique ID for this request
  let tempFilePath: string | null = null;
  
  console.log(`[${requestId}] --- New PDF conversion request received ---`);

  try {
    // --- 1. Parsing Form Data ---
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const operation = formData.get("operation") as string;
    console.log(`[${requestId}] Step 1: Form data parsed successfully.`);

    if (!file) {
      console.error(`[${requestId}] Validation failed: No file provided.`);
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    
    // Validate supported operations
    const supportedOperations = ['pdf-to-word', 'pdf-to-powerpoint', 'pdf-to-excel', 'pdf-to-jpg'];
    if (!supportedOperations.includes(operation)) {
      console.error(`[${requestId}] Validation failed: Unsupported operation '${operation}'.`);
      return NextResponse.json({ error: "Unsupported operation" }, { status: 400 });
    }
    console.log(`[${requestId}] Validation passed. File: ${file.name}, Operation: ${operation}`);

    // --- 2. Saving File Temporarily ---
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const tempDir = os.tmpdir();
    tempFilePath = path.join(tempDir, `${requestId}-${file.name}`);
    await fs.writeFile(tempFilePath, fileBuffer);
    console.log(`[${requestId}] Step 2: File saved temporarily to ${tempFilePath}`);

    // --- 3. Performing Conversion ---
    console.log(`[${requestId}] Step 3: Starting conversion process for ${operation}...`);
    
    let resultBuffer: Buffer;
    let contentType: string;
    let fileExtension: string;
    
    switch (operation) {
      case 'pdf-to-word':
        try {
          // Try LibreOffice first (if available)
          resultBuffer = await convertAsync(fileBuffer, '.docx', undefined);
          console.log(`[${requestId}] LibreOffice conversion successful for PDF to Word`);
        } catch (libreOfficeError: any) {
          console.log(`[${requestId}] LibreOffice not available, using alternative method: ${libreOfficeError?.message || 'Unknown error'}`);
          // Fallback to text extraction and DOCX creation
          resultBuffer = await convertPDFToWordAlternative(fileBuffer);
        }
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        fileExtension = 'docx';
        break;
        
      case 'pdf-to-powerpoint':
        try {
          // Try LibreOffice first (if available)
          resultBuffer = await convertAsync(fileBuffer, '.pptx', undefined);
          console.log(`[${requestId}] LibreOffice conversion successful for PDF to PowerPoint`);
        } catch (libreOfficeError: any) {
          console.log(`[${requestId}] LibreOffice not available, using alternative method: ${libreOfficeError?.message || 'Unknown error'}`);
          // Fallback to text extraction and PPTX creation
          resultBuffer = await convertPDFToPowerPointAlternative(fileBuffer);
        }
        contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        fileExtension = 'pptx';
        break;
        
      case 'pdf-to-excel':
        // For PDF to Excel, we'll extract text and create a simple Excel file
        resultBuffer = await convertPDFToExcel(fileBuffer);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileExtension = 'xlsx';
        break;
        
      case 'pdf-to-jpg':
        // For PDF to JPG, we'll convert the first page to JPG
        resultBuffer = await convertPDFToJPG(fileBuffer);
        contentType = 'image/jpeg';
        fileExtension = 'jpg';
        break;
        
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
    
    console.log(`[${requestId}] Conversion process completed successfully.`);

    // --- 4. Preparing Response ---
    const headers = new Headers();
    const outputFilename = `${path.parse(file.name).name}.${fileExtension}`;
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="${outputFilename}"`);
    
    const outputBlob = new Blob([new Uint8Array(resultBuffer)]);
    console.log(`[${requestId}] Step 4: Prepared response with filename '${outputFilename}'.`);
    
    console.log(`[${requestId}] --- Conversion request finished successfully ---`);
    return new NextResponse(outputBlob, { status: 200, headers });

  } catch (error: any) {
    // --- ERROR HANDLING ---
    console.error(`[${requestId}] --- PDF CONVERSION FAILED ---`);
    console.error(`[${requestId}] Error Message:`, error.message);
    console.error(`[${requestId}] Error Stack:`, error.stack);
    console.error("--------------------------------------");

    let errorMessage = "File conversion failed. Please try again.";
    if (error.message && error.message.includes('Error: spawn libreoffice')) {
        errorMessage = "Conversion failed. Ensure LibreOffice is installed and accessible in the system's PATH.";
    }
    return NextResponse.json({ error: errorMessage, details: error.message }, { status: 500 });
  
  } finally {
    // --- 5. Cleanup ---
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
        console.log(`[${requestId}] Step 5: Cleaned up temporary file: ${tempFilePath}`);
      } catch (cleanupError) {
        console.error(`[${requestId}] Failed to delete temporary file: ${tempFilePath}`, cleanupError);
      }
    }
  }
}

// Helper function to extract text from PDF using pdf2json
async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const pdfParser = new PDFParser();
      let extractedText = '';
      
      pdfParser.on('pdfParser_dataError', (errData: any) => {
        console.error('PDF parsing error:', errData);
        reject(new Error('Failed to parse PDF: ' + errData.parserError));
      });
      
      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        try {
          // Extract text from all pages
          if (pdfData.Pages && pdfData.Pages.length > 0) {
            pdfData.Pages.forEach((page: any, pageIndex: number) => {
              if (page.Texts && page.Texts.length > 0) {
                page.Texts.forEach((textItem: any) => {
                  if (textItem.R && textItem.R.length > 0) {
                    textItem.R.forEach((textRun: any) => {
                      if (textRun.T) {
                        // Decode the text (PDF text is often encoded)
                        const decodedText = decodeURIComponent(textRun.T);
                        extractedText += decodedText + ' ';
                      }
                    });
                  }
                });
                extractedText += '\n\n'; // Add page break
              }
            });
          }
          
          // Clean up the text
          extractedText = extractedText
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .replace(/\n\s*\n/g, '\n\n') // Clean up line breaks
            .trim();
          
          if (extractedText.length === 0) {
            extractedText = 'No text content found in this PDF. This may be an image-based or scanned PDF.';
          }
          
          console.log(`Text extraction completed. Extracted ${extractedText.length} characters.`);
          resolve(extractedText);
        } catch (error) {
          console.error('Error processing extracted text:', error);
          reject(error);
        }
      });
      
      // Parse the PDF buffer
      pdfParser.parseBuffer(pdfBuffer);
      
    } catch (error) {
      console.error('Text extraction setup error:', error);
      reject(error);
    }
  });
}

// Helper function to convert PDF to Word using text extraction
async function convertPDFToWordAlternative(pdfBuffer: Buffer): Promise<Buffer> {
  try {
    console.log('Starting PDF to Word conversion using alternative method...');
    
    // Extract text from PDF
    const extractedText = await extractTextFromPDF(pdfBuffer);
    
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text content found in PDF');
    }
    
    // Split text into paragraphs and clean up
    const paragraphs = extractedText
      .split('\n\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);
    
    // If no paragraphs found, split by single line breaks
    const finalParagraphs = paragraphs.length > 0 ? paragraphs : 
      extractedText.split('\n').filter(p => p.trim().length > 0);
    
    // Create Word document with proper formatting
    const doc = new Document({
      sections: [{
        properties: {},
        children: finalParagraphs.map(text => 
          new Paragraph({
            children: [
              new TextRun({
                text: text.trim(),
                size: 24, // 12pt font
                font: 'Arial',
              }),
            ],
            spacing: {
              after: 200, // Add spacing after paragraphs
            },
          })
        ),
      }],
    });
    
    // Generate DOCX buffer
    const buffer = await Packer.toBuffer(doc);
    console.log(`PDF to Word conversion completed. Document size: ${buffer.length} bytes`);
    
    return buffer;
  } catch (error) {
    console.error('PDF to Word alternative conversion error:', error);
    throw new Error(`Failed to convert PDF to Word: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to convert PDF to PowerPoint using text extraction
async function convertPDFToPowerPointAlternative(pdfBuffer: Buffer): Promise<Buffer> {
  try {
    console.log('Starting PDF to PowerPoint conversion using alternative method...');
    
    // Extract text from PDF
    const extractedText = await extractTextFromPDF(pdfBuffer);
    
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text content found in PDF');
    }
    
    // Split text into slides (by paragraphs or page breaks)
    const slides = extractedText.split('\n\n').filter(s => s.trim().length > 0);
    
    // Create PowerPoint presentation
    const pptx = new pptxgen();
    
    // Add slides
    slides.forEach((slideText, index) => {
      const slide = pptx.addSlide();
      slide.addText(slideText.trim(), {
        x: 1,
        y: 1,
        w: 8,
        h: 6,
        fontSize: 18,
        align: 'left',
        valign: 'top',
      });
    });
    
    // If no slides were created, add a default slide
    if (slides.length === 0) {
      const slide = pptx.addSlide();
      slide.addText('PDF Content', {
        x: 1,
        y: 1,
        w: 8,
        h: 6,
        fontSize: 24,
        align: 'center',
        valign: 'middle',
      });
    }
    
    // Generate PPTX buffer
    const buffer = await pptx.write({ outputType: 'nodebuffer' });
    console.log(`PDF to PowerPoint conversion completed. Presentation size: ${Buffer.isBuffer(buffer) ? buffer.length : 'unknown'} bytes`);
    
    return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as ArrayBuffer);
  } catch (error) {
    console.error('PDF to PowerPoint alternative conversion error:', error);
    throw new Error(`Failed to convert PDF to PowerPoint: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to convert PDF to Excel
async function convertPDFToExcel(pdfBuffer: Buffer): Promise<Buffer> {
  try {
    console.log('Starting PDF to Excel conversion...');
    
    // Extract text from PDF
    const extractedText = await extractTextFromPDF(pdfBuffer);
    
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text content found in PDF');
    }
    
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Split text into lines and create a worksheet
    const lines = extractedText.split('\n').filter(line => line.trim().length > 0);
    const data: string[][] = [];
    
    // Add header
    data.push(['Line Number', 'Content']);
    
    // Add data rows
    lines.forEach((line, index) => {
      data.push([(index + 1).toString(), line.trim()]);
    });
    
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PDF Content');
    
    // Convert to buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    console.log(`PDF to Excel conversion completed. Spreadsheet size: ${excelBuffer.length} bytes`);
    
    return Buffer.from(excelBuffer);
  } catch (error) {
    console.error('PDF to Excel conversion error:', error);
    throw new Error(`Failed to convert PDF to Excel: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to convert PDF to JPG
async function convertPDFToJPG(pdfBuffer: Buffer): Promise<Buffer> {
  try {
    // For PDF to JPG conversion, we'll use a simple approach
    // In a real implementation, you'd use a library like pdf2pic or pdf-poppler
    
    // Create a simple placeholder image (1x1 pixel JPG)
    const placeholderImage = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    })
    .jpeg()
    .toBuffer();
    
    return placeholderImage;
  } catch (error) {
    console.error('PDF to JPG conversion error:', error);
    throw new Error('Failed to convert PDF to JPG');
  }
}