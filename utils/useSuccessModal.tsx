import { useState } from 'react';

// Define the structure of the file information
interface ProcessedFileInfo {
  fileName: string;
  fileSize: number;
  downloadUrl?: string; // Optional if you need to re-download
}

/**
 * A custom React hook to manage the state and actions of a success modal.
 */
export function useSuccessModal() {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [processedFileInfo, setProcessedFileInfo] = useState<ProcessedFileInfo | null>(null);

  // Function to display the modal with specific file details
  const showSuccess = (fileInfo: ProcessedFileInfo) => {
    setProcessedFileInfo(fileInfo);
    setShowSuccessModal(true);
  };

  // Function to hide the modal
  const hideSuccess = () => {
    setShowSuccessModal(false);
    setProcessedFileInfo(null);
  };

  return {
    showSuccessModal,
    processedFileInfo,
    showSuccess,
    hideSuccess,
  };
}