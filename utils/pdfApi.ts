/**
 * Maps conversion operations to backend endpoints.
 */
const OPERATION_ENDPOINTS: Record<string, string> = {
  "pdf-to-word": "/api/pdf/convert",
  "pdf-to-ppt": "/api/pdf/convert",
  "pdf-to-excel": "/api/pdf/convert",
  "merge": "/api/pdf/process",
  "split": "/api/pdf/process",
  "extract": "/api/pdf/process",
  "secure-download": "/api/pdf/secure-download",
  // Add more as needed
};

/**
 * Sends a file to the backend API for conversion.
 * Supports operations like 'pdf-to-word', 'pdf-to-ppt', etc.
 * @param file The file to convert.
 * @param operation The conversion operation.
 * @returns A promise that resolves with the converted file as a Blob.
 */
export async function convertFile(file: File, operation: string): Promise<Blob> {
  const endpoint = OPERATION_ENDPOINTS[operation] || "/api/pdf/convert";
  const formData = new FormData();
  formData.append("file", file);
  formData.append("operation", operation);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `Server responded with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData?.error || errorMessage;
      } catch {}
      throw new Error(errorMessage);
    }

    // Check for empty response
    const blob = await response.blob();
    if (blob.size === 0) {
      throw new Error("Conversion failed: Empty file returned.");
    }
    return blob;
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
  const endpoint = OPERATION_ENDPOINTS[operation] || "/api/pdf/process";
  const formData = new FormData();

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
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `Server responded with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData?.error || errorMessage;
      } catch {}
      throw new Error(errorMessage);
    }

    const blob = await response.blob();
    if (blob.size === 0) {
      throw new Error("Processing failed: Empty file returned.");
    }
    return blob;
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
  const endpoint = OPERATION_ENDPOINTS["secure-download"];
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  formData.append('operation', operation);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `Server responded with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData?.error || errorMessage;
      } catch {}
      throw new Error(errorMessage);
    }

    const blob = await response.blob();
    if (blob.size === 0) {
      throw new Error("Download failed: Empty file returned.");
    }
    return blob;
  } catch (error) {
    console.error('Download processed file error:', error);
    throw new Error(`Failed to download processed file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Triggers a file download in the user's browser.
 * @param blob The file data to download.
 * @param filename The desired name for the downloaded file.
 * @param mimeType Optional MIME type for the file.
 */
export function downloadFile(blob: Blob, filename: string, mimeType?: string) {
  const fileBlob = mimeType ? new Blob([blob], { type: mimeType }) : blob;
  const url = URL.createObjectURL(fileBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}



// utils folder ma hai ye file 