/**
 * Sends a file to the backend API for conversion.
 * @param file The file to convert.
 * @param operation The conversion operation (e.g., 'pdf-to-word').
 * @returns A promise that resolves with the converted file as a Blob.
 */
export async function convertFile(file: File, operation: string): Promise<Blob> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("operation", operation);

  try {
    const response = await fetch("/api/pdf/convert", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.error || `Server responded with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.blob();
  } catch (error) {
    console.error('Convert file error:', error);
    throw new Error(`Failed to convert file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Processes PDF files for various operations (merge, split, extract, etc.).
 * @param files Array of files to process.
 * @param operation The operation to perform.
 * @param options Additional options for the operation.
 * @returns A promise that resolves with the processed file as a Blob.
 */
export async function processPDFs(files: File[], operation: string, options: any = {}): Promise<Blob> {
  const formData = new FormData();
  
  // Add files to form data
  if (operation === 'merge') {
    files.forEach(file => formData.append('files', file));
  } else {
    if (files.length > 0) {
      formData.append('file', files[0]);
    }
  }
  
  formData.append('operation', operation);
  if (Object.keys(options).length > 0) {
    formData.append('options', JSON.stringify(options));
  }

  try {
    const response = await fetch("/api/pdf/process", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.error || `Server responded with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.blob();
  } catch (error) {
    console.error('Process PDFs error:', error);
    throw new Error(`Failed to process PDFs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Downloads a processed file securely.
 * @param files Array of files to process.
 * @param operation The operation to perform.
 * @returns A promise that resolves with the processed file as a Blob.
 */
export async function downloadProcessedFile(files: File[], operation: string): Promise<Blob> {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  formData.append('operation', operation);

  try {
    const response = await fetch("/api/pdf/secure-download", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.error || `Server responded with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.blob();
  } catch (error) {
    console.error('Download processed file error:', error);
    throw new Error(`Failed to download processed file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Triggers a file download in the user's browser.
 * @param blob The file data to download.
 * @param filename The desired name for the downloaded file.
 */
export function downloadFile(blob: Blob, filename: string) {
  // Create a temporary URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create an invisible anchor element
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  
  // Append to the DOM, click it, and then remove it
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  // Clean up the temporary URL
  URL.revokeObjectURL(url);
}