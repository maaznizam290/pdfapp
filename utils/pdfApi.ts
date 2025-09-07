// Utility functions for PDF processing API calls

export interface PDFProcessingOptions {
  [key: string]: any;
}

export async function processPDF(
  file: File,
  operation: string,
  options: PDFProcessingOptions = {}
): Promise<Blob> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('operation', operation);
  formData.append('options', JSON.stringify(options));

  const response = await fetch('/api/pdf/process', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Failed to ${operation} PDF`);
  }

  return response.blob();
}

export async function convertFile(
  file: File,
  operation: string,
  options: PDFProcessingOptions = {}
): Promise<Blob> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('operation', operation);
  formData.append('options', JSON.stringify(options));

  const response = await fetch('/api/pdf/convert', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Failed to convert ${operation}`);
  }

  return response.blob();
}

export function downloadFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export async function processMultipleFiles(
  files: File[],
  operation: string,
  options: PDFProcessingOptions = {}
): Promise<Blob> {
  console.log(`Processing ${files.length} files for operation: ${operation}`);
  
  const formData = new FormData();
  formData.append('operation', operation);
  formData.append('options', JSON.stringify(options));
  
  files.forEach((file, index) => {
    console.log(`Adding file ${index + 1}: ${file.name} (${file.size} bytes)`);
    formData.append('files', file);
  });

  try {
    const response = await fetch('/api/pdf/process', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error:', errorData);
      throw new Error(errorData.error || `Failed to ${operation} PDFs`);
    }

    const blob = await response.blob();
    console.log(`Received blob: ${blob.size} bytes, type: ${blob.type}`);
    
    if (blob.size === 0) {
      throw new Error('Received empty file from server');
    }
    
    return blob;
  } catch (error) {
    console.error('Error in processMultipleFiles:', error);
    throw error;
  }
}

