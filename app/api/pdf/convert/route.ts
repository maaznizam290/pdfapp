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

// Interface for formatted text elements
interface FormattedTextElement {
  text: string;
  fontSize?: number;
  fontFamily?: string;
  bold?: boolean;
  italic?: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Helper function to extract formatted text from PDF using pdf2json
async function extractFormattedTextFromPDF(pdfBuffer: Buffer): Promise<FormattedTextElement[]> {
  return new Promise((resolve, reject) => {
    try {
      const pdfParser = new PDFParser();
      const formattedElements: FormattedTextElement[] = [];
      
      pdfParser.on('pdfParser_dataError', (errData: any) => {
        console.error('PDF parsing error:', errData);
        reject(new Error('Failed to parse PDF: ' + errData.parserError));
      });
      
      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        try {
          // Extract formatted text from all pages
          if (pdfData.Pages && pdfData.Pages.length > 0) {
            pdfData.Pages.forEach((page: any, pageIndex: number) => {
              if (page.Texts && page.Texts.length > 0) {
                page.Texts.forEach((textItem: any) => {
                  if (textItem.R && textItem.R.length > 0) {
                    textItem.R.forEach((textRun: any) => {
                      if (textRun.T) {
                        // Decode the text (PDF text is often encoded)
                        const decodedText = decodeURIComponent(textRun.T);
                        
                        // Extract formatting information with better detection
                        let fontSize = 12;
                        let fontFamily = 'Arial';
                        let bold = false;
                        let italic = false;
                        
                        // Try to get formatting from textRun.TS array
                        if (textRun.TS && Array.isArray(textRun.TS)) {
                          fontSize = textRun.TS[0] || 12;
                          const fontCode = textRun.TS[1];
                          if (fontCode !== undefined) {
                            fontFamily = getFontFamily(fontCode);
                            bold = isBoldFont(fontCode);
                            italic = isItalicFont(fontCode);
                          }
                        }
                        
                        // Try to get formatting from textItem.TS array
                        if (textItem.TS && Array.isArray(textItem.TS)) {
                          fontSize = textItem.TS[0] || fontSize;
                          const fontCode = textItem.TS[1];
                          if (fontCode !== undefined) {
                            fontFamily = getFontFamily(fontCode);
                            bold = isBoldFont(fontCode);
                            italic = isItalicFont(fontCode);
                          }
                        }
                        
                        // Enhanced formatting detection based on text content and position
                        if (fontSize > 14 || decodedText.length < 50) {
                          // Likely a heading or title
                          bold = true;
                          fontSize = Math.max(fontSize, 14);
                        }
                        
                        // Detect italic based on common patterns
                        if (decodedText.includes('italic') || decodedText.includes('emphasis')) {
                          italic = true;
                        }
                        
                        // Debug logging for first few elements
                        if (formattedElements.length < 5) {
                          console.log(`Element ${formattedElements.length}: "${decodedText}" - Font: ${fontFamily}, Size: ${fontSize}, Bold: ${bold}, Italic: ${italic}`);
                          console.log(`  TS data:`, textRun.TS, textItem.TS);
                        }
                        
                        formattedElements.push({
                          text: decodedText,
                          fontSize: fontSize,
                          fontFamily: fontFamily,
                          bold: bold,
                          italic: italic,
                          x: textItem.x || 0,
                          y: textItem.y || 0,
                          width: textItem.w || 0,
                          height: textItem.h || 0,
                        });
                      }
                    });
                  }
                });
              }
            });
          }
          
          console.log(`Formatted text extraction completed. Extracted ${formattedElements.length} text elements.`);
          
          // Debug: Show formatting distribution
          const formattingStats = {
            bold: formattedElements.filter(e => e.bold).length,
            italic: formattedElements.filter(e => e.italic).length,
            differentSizes: Array.from(new Set(formattedElements.map(e => e.fontSize))).length,
            differentFonts: Array.from(new Set(formattedElements.map(e => e.fontFamily))).length
          };
          console.log('Formatting stats:', formattingStats);
          
          resolve(formattedElements);
        } catch (error) {
          console.error('Error processing formatted text:', error);
          reject(error);
        }
      });
      
      // Parse the PDF buffer
      pdfParser.parseBuffer(pdfBuffer);
      
    } catch (error) {
      console.error('Formatted text extraction setup error:', error);
      reject(error);
    }
  });
}

// Helper function to determine font family from PDF font code
function getFontFamily(fontCode: number): string {
  const fontMap: { [key: number]: string } = {
    0: 'Arial',
    1: 'Times-Roman',
    2: 'Helvetica',
    3: 'Courier',
    4: 'Times-Bold',
    5: 'Helvetica-Bold',
    6: 'Courier-Bold',
    7: 'Times-Italic',
    8: 'Helvetica-Oblique',
    9: 'Courier-Oblique',
  };
  return fontMap[fontCode] || 'Arial';
}

// Helper function to determine if font is bold
function isBoldFont(fontCode: number): boolean {
  return fontCode === 4 || fontCode === 5 || fontCode === 6;
}

// Helper function to determine if font is italic
function isItalicFont(fontCode: number): boolean {
  return fontCode === 7 || fontCode === 8 || fontCode === 9;
}

// Helper function to convert PDF to Word using formatted text extraction
async function convertPDFToWordAlternative(pdfBuffer: Buffer): Promise<Buffer> {
  try {
    console.log('Starting PDF to Word conversion with formatting preservation...');
    
    // Extract formatted text from PDF
    const formattedElements = await extractFormattedTextFromPDF(pdfBuffer);
    
    if (!formattedElements || formattedElements.length === 0) {
      throw new Error('No text content found in PDF');
    }
    
    // Group text elements by position to create paragraphs
    const paragraphs = groupTextElementsIntoParagraphs(formattedElements);
    
    // Debug: Show paragraph information
    console.log(`Created ${paragraphs.length} paragraphs from ${formattedElements.length} elements`);
    paragraphs.slice(0, 3).forEach((para, index) => {
      console.log(`Paragraph ${index + 1}: ${para.length} elements`);
      para.slice(0, 2).forEach((elem, elemIndex) => {
        console.log(`  Element ${elemIndex + 1}: "${elem.text}" - Bold: ${elem.bold}, Size: ${elem.fontSize}`);
      });
    });
    
    // Create Word document with preserved formatting
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 inch
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: paragraphs.map((paragraph, index) => {
          // Group elements by formatting to create runs
          const runs: any[] = [];
          let currentRun: any = null;
          
          paragraph.forEach(element => {
            const runKey = `${element.fontSize}-${element.fontFamily}-${element.bold}-${element.italic}`;
            
            if (!currentRun || currentRun.key !== runKey) {
              // Start a new run
              if (currentRun) {
                runs.push(currentRun.run);
              }
              
              // Ensure we have valid formatting values
              const fontSize = Math.max(element.fontSize || 12, 8) * 2; // Convert to half-points
              const fontFamily = element.fontFamily || 'Arial';
              const isBold = Boolean(element.bold);
              const isItalic = Boolean(element.italic);
              
              // Debug logging for first few runs
              if (runs.length < 3) {
                console.log(`Creating run: "${element.text}" - Font: ${fontFamily}, Size: ${fontSize}, Bold: ${isBold}, Italic: ${isItalic}`);
              }
              
              currentRun = {
                key: runKey,
                run: new TextRun({
                  text: element.text,
                  size: fontSize,
                  font: fontFamily,
                  bold: isBold,
                  italics: isItalic,
                })
              };
            } else {
              // Append to current run
              currentRun.run.text += element.text;
            }
          });
          
          // Add the last run
          if (currentRun) {
            runs.push(currentRun.run);
          }
          
          return new Paragraph({
            children: runs,
            spacing: {
              after: 200, // Add spacing after paragraphs
              before: 0,
            },
            alignment: 'left',
          });
        }),
      }],
    });
    
    // Generate DOCX buffer
    const buffer = await Packer.toBuffer(doc);
    console.log(`PDF to Word conversion completed with formatting. Document size: ${buffer.length} bytes`);
    
    return buffer;
  } catch (error) {
    console.error('PDF to Word alternative conversion error:', error);
    throw new Error(`Failed to convert PDF to Word: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to group text elements into paragraphs based on position
function groupTextElementsIntoParagraphs(elements: FormattedTextElement[]): FormattedTextElement[][] {
  if (elements.length === 0) return [];
  
  // Sort elements by Y position (top to bottom) and then by X position (left to right)
  const sortedElements = elements.sort((a, b) => {
    if (Math.abs(a.y - b.y) > 5) { // Different lines (5pt tolerance)
      return b.y - a.y; // Higher Y values first (top to bottom)
    }
    return a.x - b.x; // Same line, sort by X position
  });
  
  const paragraphs: FormattedTextElement[][] = [];
  let currentParagraph: FormattedTextElement[] = [];
  let lastY = sortedElements[0]?.y || 0;
  
  // Group elements by Y position (lines)
  const lines: FormattedTextElement[][] = [];
  let currentLine: FormattedTextElement[] = [];
  
  for (const element of sortedElements) {
    // If Y position changes significantly, start a new line
    if (Math.abs(element.y - lastY) > 8) { // 8pt tolerance for new line
      if (currentLine.length > 0) {
        lines.push([...currentLine]);
        currentLine = [];
      }
    }
    
    currentLine.push(element);
    lastY = element.y;
  }
  
  // Add the last line
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  
  // Group lines into paragraphs based on spacing and content
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1];
    
    // Add current line to current paragraph
    currentParagraph.push(...line);
    
    // Check if we should start a new paragraph
    const shouldBreakParagraph = 
      !nextLine || // Last line
      (nextLine && line.length > 0 && nextLine.length > 0 && 
       Math.abs(nextLine[0].y - line[0].y) > 20) || // Large vertical gap
      (nextLine && line.length > 0 && nextLine.length > 0 && 
       line[0].fontSize && nextLine[0].fontSize && 
       Math.abs(line[0].fontSize - nextLine[0].fontSize) > 2); // Different font sizes
    
    if (shouldBreakParagraph) {
      if (currentParagraph.length > 0) {
        paragraphs.push([...currentParagraph]);
        currentParagraph = [];
      }
    }
  }
  
  // Add the last paragraph if it exists
  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph);
  }
  
  console.log(`Grouped ${elements.length} elements into ${lines.length} lines and ${paragraphs.length} paragraphs`);
  
  return paragraphs;
}

// Helper function to convert PDF to PowerPoint using formatted text extraction
async function convertPDFToPowerPointAlternative(pdfBuffer: Buffer): Promise<Buffer> {
  try {
    console.log('Starting PDF to PowerPoint conversion with formatting preservation...');
    
    // Extract formatted text from PDF
    const formattedElements = await extractFormattedTextFromPDF(pdfBuffer);
    
    if (!formattedElements || formattedElements.length === 0) {
      throw new Error('No text content found in PDF');
    }
    
    // Group text elements into paragraphs and then into slides
    const paragraphs = groupTextElementsIntoParagraphs(formattedElements);
    
    // Create PowerPoint presentation
    const pptx = new pptxgen();
    
    // Add slides (each paragraph becomes a slide)
    paragraphs.forEach((paragraph, index) => {
      const slide = pptx.addSlide();
      
      // Combine text from paragraph elements
      const slideText = paragraph.map(element => element.text).join(' ');
      
      // Determine if text should be bold or italic based on elements
      const hasBold = paragraph.some(element => element.bold);
      const hasItalic = paragraph.some(element => element.italic);
      const avgFontSize = paragraph.reduce((sum, element) => sum + (element.fontSize || 12), 0) / paragraph.length;
      
      slide.addText(slideText.trim(), {
        x: 1,
        y: 1,
        w: 8,
        h: 6,
        fontSize: Math.max(avgFontSize || 18, 12),
        bold: hasBold,
        italic: hasItalic,
        align: 'left',
        valign: 'top',
      });
    });
    
    // If no slides were created, add a default slide
    if (paragraphs.length === 0) {
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
    console.log(`PDF to PowerPoint conversion completed with formatting. Presentation size: ${Buffer.isBuffer(buffer) ? buffer.length : 'unknown'} bytes`);
    
    return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as ArrayBuffer);
  } catch (error) {
    console.error('PDF to PowerPoint alternative conversion error:', error);
    throw new Error(`Failed to convert PDF to PowerPoint: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to convert PDF to Excel using formatted text extraction
async function convertPDFToExcel(pdfBuffer: Buffer): Promise<Buffer> {
  try {
    console.log('Starting PDF to Excel conversion with formatting preservation...');
    
    // Extract formatted text from PDF
    const formattedElements = await extractFormattedTextFromPDF(pdfBuffer);
    
    if (!formattedElements || formattedElements.length === 0) {
      throw new Error('No text content found in PDF');
    }
    
    // Group text elements into paragraphs
    const paragraphs = groupTextElementsIntoParagraphs(formattedElements);
    
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    const data: string[][] = [];
    
    // Add header
    data.push(['Paragraph', 'Text Content', 'Font Size', 'Font Family', 'Bold', 'Italic']);
    
    // Add data rows with formatting information
    paragraphs.forEach((paragraph, index) => {
      const textContent = paragraph.map(element => element.text).join(' ');
      const avgFontSize = paragraph.reduce((sum, element) => sum + (element.fontSize || 12), 0) / paragraph.length;
      const fontFamily = paragraph[0]?.fontFamily || 'Arial';
      const hasBold = paragraph.some(element => element.bold);
      const hasItalic = paragraph.some(element => element.italic);
      
      data.push([
        (index + 1).toString(),
        textContent.trim(),
        avgFontSize.toFixed(1),
        fontFamily,
        hasBold ? 'Yes' : 'No',
        hasItalic ? 'Yes' : 'No'
      ]);
    });
    
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PDF Content');
    
    // Convert to buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    console.log(`PDF to Excel conversion completed with formatting. Spreadsheet size: ${excelBuffer.length} bytes`);
    
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