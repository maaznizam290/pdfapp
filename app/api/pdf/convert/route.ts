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
  }
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const operation = formData.get('operation') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!operation) {
      return NextResponse.json({ error: 'No operation specified' }, { status: 400 });
    }

    const conversionConfig = CONVERSION_ENDPOINTS[operation];
    if (!conversionConfig) {
      return NextResponse.json({ error: `Unsupported operation: ${operation}` }, { status: 400 });
    }

    const secret = 'J5pccF6XgSKfVhG6XYxvtS4KTk9iBVWS';

    // Convert File to Buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Create FormData for ConvertAPI using native FormData
    const convertFormData = new FormData();
    convertFormData.append('File', new Blob([fileBuffer]), file.name);

    // Convert PDF using ConvertAPI
    const response = await fetch(
      `https://v2.convertapi.com/convert/${conversionConfig.endpoint}?Secret=${secret}`,
      {
        method: 'POST',
        body: convertFormData,
      }
    );

    const result = await response.json();
    console.log('ConvertAPI response:', result);

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

    if (!result.Files || !result.Files[0].FileData) {
      return NextResponse.json(
        { error: result.Message || JSON.stringify(result) || 'Conversion failed' },
        { status: 500 }
      );
    }

    // Decode base64 file and send as response
    const convertedBuffer = Buffer.from(result.Files[0].FileData, 'base64');

    const headers = new Headers();
    headers.set('Content-Type', conversionConfig.contentType);
    headers.set('Content-Disposition', `attachment; filename="${conversionConfig.filename}"`);

    return new NextResponse(convertedBuffer, { headers });
  } catch (error: any) {
    console.error('Conversion error:', error);
    return NextResponse.json(
      { error: error.message || 'Conversion failed' },
      { status: 500 }
    );
  }
}
