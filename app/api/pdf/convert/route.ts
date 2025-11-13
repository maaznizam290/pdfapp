import { NextRequest, NextResponse } from 'next/server';

type ConversionConfig = {
  endpoint: string;
  contentType: string;
  filename: string;
};

// Map operations to ConvertAPI endpoints
const CONVERSION_ENDPOINTS: Record<string, ConversionConfig> = {
  'pdf-to-word': {
    endpoint: 'pdf/to/docx',
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    filename: 'converted-document.docx',
  },
  'pdf-to-ppt': {
    endpoint: 'pdf/to/pptx',
    contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    filename: 'converted-presentation.pptx',
  },
  'pdf-to-excel': {
    endpoint: 'pdf/to/xlsx',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    filename: 'converted-spreadsheet.xlsx',
  },
  'pdf-to-jpg': {
    endpoint: 'pdf/to/jpg',
    contentType: 'application/zip',
    filename: 'converted-images.zip',
  },
  'pdf-to-png': {
    endpoint: 'pdf/to/png',
    contentType: 'application/zip',
    filename: 'converted-images.zip',
  },
  'pdf-to-webp': {
    endpoint: 'pdf/to/webp',
    contentType: 'application/zip',
    filename: 'converted-images.zip',
  },
  'word-to-pdf': {
    endpoint: 'docx/to/pdf',
    contentType: 'application/pdf',
    filename: 'converted-document.pdf',
  },
  'excel-to-pdf': {
    endpoint: 'xlsx/to/pdf',
    contentType: 'application/pdf',
    filename: 'converted-spreadsheet.pdf',
  },
  'powerpoint-to-pdf': {
    endpoint: 'pptx/to/pdf',
    contentType: 'application/pdf',
    filename: 'converted-presentation.pdf',
  },
  'jpg-to-pdf': {
    endpoint: 'jpg/to/pdf',
    contentType: 'application/pdf',
    filename: 'converted-images.pdf',
  },
  'html-to-pdf': {
    endpoint: 'html/to/pdf',
    contentType: 'application/pdf',
    filename: 'converted-document.pdf',
  },
};

const PDFREST_ENDPOINTS: Record<
  string,
  { url: string; contentType: string; extension: string }
> = {
  'pdf-to-word': {
    url: 'https://api.pdfrest.com/word',
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extension: '.docx',
  },
  'pdf-to-ppt': {
    url: 'https://api.pdfrest.com/powerpoint',
    contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    extension: '.pptx',
  },
  'pdf-to-excel': {
    url: 'https://api.pdfrest.com/excel',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extension: '.xlsx',
  },
  'pdf-to-jpg': {
    url: 'https://api.pdfrest.com/jpg',
    contentType: 'application/zip',
    extension: '.zip',
  },
};

export async function POST(request: NextRequest) {
  const formData    = await request.formData();
  const file        = formData.get('file') as File | null;
  const operation   = formData.get('operation') as string;
  const options     = JSON.parse(formData.get('options') as string ?? '{}');

  if (!file)      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  if (!operation) return NextResponse.json({ error: 'No operation specified' }, { status: 400 });

  // Validate size & type quickly
  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (50MB max)' }, { status: 400 });
  }
  if (operation === 'pdf-to-word' && file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
  }

  const conversionConfig = CONVERSION_ENDPOINTS[operation];
  if (!conversionConfig) {
    return NextResponse.json({ error: `Unsupported operation: ${operation}` }, { status: 400 });
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer());

  if (PDFREST_ENDPOINTS[operation]) {
    const pdfRestConfig = PDFREST_ENDPOINTS[operation];
    const pdfRestApiKey = process.env.PDFREST_API_KEY || '52e0933c-4aff-48c0-ab1d-9b0a463474a8';
    if (!pdfRestApiKey) {
      console.warn('PDFRest API key not configured. Skipping PDFRest conversion.');
    } else {
      try {
        const pdfRestForm = new FormData();
        pdfRestForm.append('file', new Blob([fileBuffer]), file.name);

        const pdfRestResponse = await fetch(pdfRestConfig.url, {
          method: 'POST',
          headers: {
            'Api-Key': pdfRestApiKey,
            Accept: 'application/json',
          },
          body: pdfRestForm,
        });

        if (!pdfRestResponse.ok) {
          const errorText = await pdfRestResponse.text();
          throw new Error(`PDFRest error: ${pdfRestResponse.status} - ${errorText}`);
        }

        const json = await pdfRestResponse.json();

        const downloadUrl =
          json?.output_url ||
          json?.download_url ||
          json?.outputUrl ||
          json?.links?.[0]?.href ||
          json?.result?.url;

        let convertedBuffer: Buffer | null = null;

        if (downloadUrl) {
          const fileResp = await fetch(downloadUrl);
          if (!fileResp.ok) {
            throw new Error(`Failed to download converted file from PDFRest: ${fileResp.status}`);
          }
          const arrBuf = await fileResp.arrayBuffer();
          convertedBuffer = Buffer.from(arrBuf);
        } else if (json?.file_data) {
          convertedBuffer = Buffer.from(json.file_data, 'base64');
        } else if (json?.files?.[0]?.fileData) {
          convertedBuffer = Buffer.from(json.files[0].fileData, 'base64');
        }

        if (convertedBuffer && convertedBuffer.length > 0) {
          const headers = new Headers();
          headers.set('Content-Type', pdfRestConfig.contentType);
          headers.set(
            'Content-Disposition',
            `attachment; filename="${file.name.replace(/\.pdf$/i, pdfRestConfig.extension)}"`
          );
          console.log(`PDFRest conversion succeeded for ${operation}.`);
          return new NextResponse(new Uint8Array(convertedBuffer), { headers });
        }

        throw new Error('PDFRest response missing converted file data.');
      } catch (error: any) {
        console.warn('PDFRest conversion failed, falling back to ConvertAPI:', error.message || error);
      }
    }
  }

  if (operation === 'word-to-pdf') {
    const apyToken = process.env.APYHUB_API_TOKEN;
    if (!apyToken) {
      return NextResponse.json(
        { error: 'APYHub API token not configured on server.' },
        { status: 500 },
      );
    }

    try {
      const fileNameBase = file.name.replace(/\.[^/.]+$/, '') || 'converted';
      const apyUrl = `https://api.apyhub.com/convert/word-file/pdf-file?output=${encodeURIComponent(
        `${fileNameBase}.pdf`,
      )}&landscape=false`;

      const apyForm = new FormData();
      apyForm.append('file', new Blob([fileBuffer]), file.name);

      const apyResponse = await fetch(apyUrl, {
        method: 'POST',
        headers: {
          'apy-token': apyToken,
        },
        body: apyForm,
      });

      if (!apyResponse.ok) {
        const errorText = await apyResponse.text();
        return NextResponse.json(
          { error: `APYHub error: ${apyResponse.status} - ${errorText}` },
          { status: apyResponse.status },
        );
      }

      const apyBuffer = Buffer.from(await apyResponse.arrayBuffer());
      if (apyBuffer.length === 0) {
        return NextResponse.json(
          { error: 'APYHub returned an empty PDF.' },
          { status: 500 },
        );
      }

      const headers = new Headers();
      headers.set('Content-Type', conversionConfig.contentType);
      headers.set(
        'Content-Disposition',
        `attachment; filename="${fileNameBase || 'converted-document'}.pdf"`,
      );
      console.log('APYHub Word to PDF conversion succeeded.');
      return new NextResponse(new Uint8Array(apyBuffer), { headers });
    } catch (error: any) {
      return NextResponse.json(
        { error: `APYHub conversion failed: ${error.message || error}` },
        { status: 500 },
      );
    }
  }

  const secret = process.env.CONVERT_API_SECRET || 'J5pccF6XgSKfVhG6XYxvtS4KTk9iBVWS';

  if (!secret || secret.length < 10) {
    return NextResponse.json({ error: 'ConvertAPI secret not configured' }, { status: 500 });
  }

  const convertFormData = new FormData();
  convertFormData.append('File', new Blob([fileBuffer]), file.name);

  const convertApiUrl = `https://v2.convertapi.com/convert/${conversionConfig.endpoint}?Secret=${secret}`;
  const response = await fetch(convertApiUrl, {
    method: 'POST',
    body: convertFormData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      { error: `ConvertAPI error: ${response.status} - ${errorText}` },
      { status: response.status },
    );
  }

  const result = await response.json();
  if (!result.Files || result.Files.length === 0) {
    return NextResponse.json(
      { error: result.Message || 'Conversion failed' },
      { status: 500 },
    );
  }

  const docxFile = result.Files[0];

  let convertedBuffer: Buffer;
  if (docxFile.Url) {
    const fileResponse = await fetch(docxFile.Url);
    if (!fileResponse.ok) {
      return NextResponse.json({ error: 'Failed to download converted file' }, { status: 500 });
    }
    const arrayBuffer = await fileResponse.arrayBuffer();
    convertedBuffer = Buffer.from(arrayBuffer);
  } else if (docxFile.FileData) {
    convertedBuffer = Buffer.from(docxFile.FileData, 'base64');
  } else {
    return NextResponse.json({ error: 'Converted file is missing data' }, { status: 500 });
  }

  const headers = new Headers();
  headers.set('Content-Type', conversionConfig.contentType);
  headers.set(
    'Content-Disposition',
    `attachment; filename="${docxFile.FileName || conversionConfig.filename}"`
  );

  return new NextResponse(new Uint8Array(convertedBuffer), { headers });
}