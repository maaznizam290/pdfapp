import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const secret = 'J5pccF6XgSKfVhG6XYxvtS4KTk9iBVWS';

    // Convert File to Buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Create FormData for ConvertAPI using native FormData
    const convertFormData = new FormData();
    convertFormData.append('File', new Blob([fileBuffer]), file.name);

    // Step 1: Convert PDF to PPTX using ConvertAPI
    const response = await fetch(
      `https://v2.convertapi.com/convert/pdf/to/pptx?Secret=${secret}`,
      {
        method: 'POST',
        body: convertFormData,
      }
    );

    const result = await response.json();
    console.log('ConvertAPI response:', result);

    if (!result.Files || !result.Files[0].FileData) {
      return NextResponse.json(
        { error: result.Message || JSON.stringify(result) || 'Conversion failed' },
        { status: 500 }
      );
    }

    // Step 2: Decode base64 PPTX and send as file
    const pptxBuffer = Buffer.from(result.Files[0].FileData, 'base64');

    const headers = new Headers();
    headers.set(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    );
    headers.set(
      'Content-Disposition',
      'attachment; filename="converted-presentation.pptx"'
    );

    return new NextResponse(pptxBuffer, { headers });
  } catch (error: any) {
    console.error('Conversion error:', error);
    return NextResponse.json(
      { error: error.message || 'Conversion failed' },
      { status: 500 }
    );
  }
}
