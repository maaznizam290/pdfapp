import { useState } from 'react';

interface ProcessedFileInfo {
  fileName: string;
  fileSize: number;
  downloadUrl: string;
  originalSize?: number;
}

export function useSuccessModal() {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [processedFileInfo, setProcessedFileInfo] = useState<ProcessedFileInfo | null>(null);

  const showSuccess = (fileInfo: ProcessedFileInfo) => {
    setProcessedFileInfo(fileInfo);
    setShowSuccessModal(true);
  };

  const hideSuccess = () => {
    setShowSuccessModal(false);
    if (processedFileInfo?.downloadUrl) {
      URL.revokeObjectURL(processedFileInfo.downloadUrl);
    }
    setProcessedFileInfo(null);
  };

  const createFileInfo = (blob: Blob, baseFileName: string, originalSize?: number): ProcessedFileInfo => {
    const downloadUrl = URL.createObjectURL(blob);
    const fileName = `${baseFileName}-${new Date().toISOString().slice(0, 10)}.pdf`;
    
    return {
      fileName,
      fileSize: blob.size,
      downloadUrl,
      originalSize
    };
  };

  return {
    showSuccessModal,
    processedFileInfo,
    showSuccess,
    hideSuccess,
    createFileInfo
  };
}


