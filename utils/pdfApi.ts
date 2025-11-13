'use client';

type OperationEndpointMap = Record<string, string>;

const OPERATION_ENDPOINTS: OperationEndpointMap = {
  'pdf-to-word': '/api/pdf/convert',
  'pdf-to-ppt': '/api/pdf/convert',
  'pdf-to-excel': '/api/pdf/convert',
  'pdf-to-jpg': '/api/pdf/convert',
  'word-to-pdf': '/api/pdf/convert',
  'excel-to-pdf': '/api/pdf/convert',
  'powerpoint-to-pdf': '/api/pdf/convert',
  'jpg-to-pdf': '/api/pdf/convert',
  'html-to-pdf': '/api/pdf/convert',
  merge: '/api/pdf/process',
  split: '/api/pdf/process',
  'extract-pages': '/api/pdf/process',
  'remove-pages': '/api/pdf/process',
  'organize': '/api/pdf/process',
  'watermark': '/api/pdf/process',
  'rotate': '/api/pdf/process',
  crop: '/api/pdf/process',
  'page-numbers': '/api/pdf/process',
  repair: '/api/pdf/process',
  ocr: '/api/pdf/process',
};

export async function convertFile(file: File, operation: string): Promise<Blob> {
  return processPDF(file, operation);
}

export async function processPDF(file: File, operation: string, options: any = {}): Promise<Blob> {
  const endpoint = OPERATION_ENDPOINTS[operation] || '/api/pdf/process';
  const formData = new FormData();

  formData.append('file', file);
  formData.append('operation', operation);
  if (options && Object.keys(options).length > 0) {
    formData.append('options', JSON.stringify(options));
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let message = `Server responded with ${response.status}`;
    try {
      const data = await response.json();
      message = data.error || message;
    } catch {}
    throw new Error(message);
  }

  const blob = await response.blob();
  if (blob.size === 0) {
    throw new Error('Processing failed: Empty file returned.');
  }
  return blob;
}

export function downloadFile(blob: Blob, filename: string, mimeType?: string) {
  const fileBlob = mimeType ? new Blob([blob], { type: mimeType }) : blob;
  const url = URL.createObjectURL(fileBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}