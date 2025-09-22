import { NextRequest, NextResponse } from 'next/server';

// Map operations to ConvertAPI endpoints
const CONVERSION_ENDPOINTS: Record<string, { endpoint: string; contentType: string; filename: string }> = {
  'pdf-to-ppt': {
    endpoint: 'pdf/to/pptx',
    contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    filename: 'converted-presentation.pptx'
  },
  'pdf-to-excel': {
    endpoint: 'pdf/to/xlsx',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    filename: 'converted-spreadsheet.xlsx'
  },
  'pdf-to-word': {
    endpoint: 'pdf/to/docx',
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    filename: 'converted-document.docx'
  },
  'pdf-to-jpg': {
    endpoint: 'pdf/to/jpg',
    contentType: 'application/zip',
    filename: 'converted-images.zip'
  },
  'pdf-to-png': {
    endpoint: 'pdf/to/png',
    contentType: 'application/zip',
    filename: 'converted-images.zip'
  },
  'pdf-to-webp': {
    endpoint: 'pdf/to/webp',
    contentType: 'application/zip',
    filename: 'converted-images.zip'
  }
};

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const operation = formData.get('operation') as string;
    const optionsStr = formData.get('options') as string | null;
    const options = optionsStr ? JSON.parse(optionsStr) : {};

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!operation) {
      return NextResponse.json({ error: 'No operation specified' }, { status: 400 });
    }

    // File size validation (50MB limit)
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxFileSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum file size is 50MB.',
        code: 'FILE_TOO_LARGE'
      }, { status: 400 });
    }

    // File type validation
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload a PDF file.',
        code: 'INVALID_FILE_TYPE'
      }, { status: 400 });
    }

    const conversionConfig = CONVERSION_ENDPOINTS[operation];
    if (!conversionConfig) {
      return NextResponse.json({ error: `Unsupported operation: ${operation}` }, { status: 400 });
    }

    const secret = 'J5pccF6XgSKfVhG6XYxvtS4KTk9iBVWS';
    
    // Check if ConvertAPI secret is valid
    if (!secret || secret.length < 10) {
      return NextResponse.json(
        { error: 'ConvertAPI secret is not configured properly' },
        { status: 500 }
      );
    }

    // Convert File to Buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Create FormData for ConvertAPI using native FormData
    const convertFormData = new FormData();
    convertFormData.append('File', new Blob([fileBuffer]), file.name);

      // Add conversion options for image formats
      if (operation.includes('pdf-to-')) {
        const imageFormat = operation.replace('pdf-to-', '');
        
        // Add quality settings (only for lossy formats)
        if (options.quality && (imageFormat === 'jpg' || imageFormat === 'webp')) {
          const qualityMap: Record<string, number> = { low: 50, medium: 75, high: 90 };
          convertFormData.append('ImageQuality', (qualityMap[options.quality] || 75).toString());
        }
        
        // Add resolution settings
        if (options.resolution) {
          convertFormData.append('ImageResolution', options.resolution);
        }
        
        // Add extract mode
        if (options.extractMode === 'images') {
          convertFormData.append('ExtractImages', 'true');
        }
        
        // Add compression settings for PNG (lossless but can control compression level)
        if (imageFormat === 'png') {
          // PNG compression level (0-9, where 9 is maximum compression)
          const compressionMap: Record<string, number> = { low: 1, medium: 5, high: 9 };
          convertFormData.append('ImageCompression', (compressionMap[options.quality] || 5).toString());
        }
        
        // Add additional ConvertAPI parameters for image conversion
        convertFormData.append('StoreFile', 'true');
        convertFormData.append('ImageFormat', imageFormat.toUpperCase());
      }

    // Convert PDF using ConvertAPI
    const convertApiUrl = `https://v2.convertapi.com/convert/${conversionConfig.endpoint}?Secret=${secret}`;
    console.log('ConvertAPI URL:', convertApiUrl);
    console.log('Operation:', operation);
    console.log('Options:', options);
    
    const response = await fetch(convertApiUrl, {
      method: 'POST',
      body: convertFormData,
    });
    
    console.log('ConvertAPI response status:', response.status);
    console.log('ConvertAPI response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ConvertAPI error response:', errorText);
      return NextResponse.json(
        { error: `ConvertAPI error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('ConvertAPI response:', result);
    console.log('Number of files returned:', result.Files?.length || 0);
    if (result.Files && result.Files.length > 0) {
      console.log('First file info:', {
        fileName: result.Files[0].FileName,
        fileExt: result.Files[0].FileExt,
        fileSize: result.Files[0].FileSize
      });
    }

    // Check for specific ConvertAPI error messages
    if (result.Message && result.Message.includes('no tables to extract')) {
      return NextResponse.json(
        { 
          error: 'This PDF does not contain extractable tables. PDF to Excel conversion works best with PDFs that contain structured data in table format.',
          code: 'NO_TABLES_FOUND'
        },
        { status: 400 }
      );
    }

    // Check for image conversion specific errors
    if (result.Message && result.Message.includes('no images')) {
      return NextResponse.json(
        { 
          error: 'This PDF does not contain extractable images. Try converting pages to images instead.',
          code: 'NO_IMAGES_FOUND'
        },
        { status: 400 }
      );
    }

    // Check for conversion cost limits
    if (result.Message && result.Message.includes('conversion cost')) {
      return NextResponse.json(
        { 
          error: 'Conversion limit reached. Please try again later or contact support.',
          code: 'CONVERSION_LIMIT'
        },
        { status: 429 }
      );
    }

    if (!result.Files || result.Files.length === 0) {
      return NextResponse.json(
        { error: result.Message || JSON.stringify(result) || 'Conversion failed' },
        { status: 500 }
      );
    }

    // Handle different conversion types
    let convertedBuffer: Buffer;
    let contentType: string;
    let filename: string;

    // Check if we have multiple files (multi-page PDF)
    const isMultiPage = result.Files.length > 1;
    console.log(`Processing ${result.Files.length} file(s) - Multi-page: ${isMultiPage}`);

    if (isMultiPage) {
      // For multi-page PDFs, create a ZIP file containing all pages
      console.log('Creating ZIP file for multiple pages...');
      
      try {
        // Import JSZip dynamically
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        
        // Fetch all files and add them to ZIP
        for (let i = 0; i < result.Files.length; i++) {
          const file = result.Files[i];
          console.log(`Fetching file ${i + 1}/${result.Files.length}: ${file.FileName}`);
          
          if (file.Url) {
            const fileResponse = await fetch(file.Url);
            if (!fileResponse.ok) {
              throw new Error(`Failed to fetch file ${file.FileName}: ${fileResponse.status}`);
            }
            
            const fileArrayBuffer = await fileResponse.arrayBuffer();
            zip.file(file.FileName, fileArrayBuffer);
          } else if (file.FileData) {
            zip.file(file.FileName, file.FileData, { base64: true });
          }
        }
        
        // Generate ZIP file
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
        convertedBuffer = zipBuffer;
        contentType = 'application/zip';
        
        // Create filename based on original PDF name
        const baseName = file.name.replace(/\.pdf$/i, '');
        filename = `${baseName}-pages.zip`;
        
        console.log('Successfully created ZIP file:', {
          size: convertedBuffer.length,
          filesCount: result.Files.length,
          filename
        });
        
      } catch (zipError) {
        console.error('Error creating ZIP file:', zipError);
        return NextResponse.json(
          { error: `Failed to create ZIP file: ${zipError instanceof Error ? zipError.message : 'Unknown error'}` },
          { status: 500 }
        );
      }
    } else {
      // Single file conversion
      const firstFile = result.Files[0];
      
      if (firstFile.FileData) {
        // ConvertAPI returned base64 data
        convertedBuffer = Buffer.from(firstFile.FileData, 'base64');
        contentType = conversionConfig.contentType;
        filename = firstFile.FileName || conversionConfig.filename;
      } else if (firstFile.Url) {
        // ConvertAPI returned a URL, need to fetch the file
        console.log('Fetching single file from ConvertAPI URL:', firstFile.Url);
        
        try {
          const fileResponse = await fetch(firstFile.Url);
          if (!fileResponse.ok) {
            throw new Error(`Failed to fetch file from ConvertAPI: ${fileResponse.status}`);
          }
          
          const fileArrayBuffer = await fileResponse.arrayBuffer();
          convertedBuffer = Buffer.from(fileArrayBuffer);
          
          // Determine content type based on file extension
          const fileExt = firstFile.FileExt || 'jpg';
          contentType = fileExt === 'jpg' ? 'image/jpeg' : 
                       fileExt === 'png' ? 'image/png' : 
                       fileExt === 'webp' ? 'image/webp' : 
                       'application/zip';
          
          filename = firstFile.FileName || conversionConfig.filename;
          
          console.log('Successfully fetched single file:', {
            size: convertedBuffer.length,
            contentType,
            filename
          });
        } catch (fetchError) {
          console.error('Error fetching file from ConvertAPI URL:', fetchError);
          return NextResponse.json(
            { error: `Failed to fetch converted file: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}` },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'ConvertAPI response missing both FileData and Url' },
          { status: 500 }
        );
      }
    }

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Add security headers for secure downloads
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    // Add CORS headers for secure cross-origin requests
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return new NextResponse(new Uint8Array(convertedBuffer), { headers });
  } catch (error: any) {
    console.error('Conversion error:', error);
    return NextResponse.json(
      { error: error.message || 'Conversion failed' },
      { status: 500 }
    );
  }
}
