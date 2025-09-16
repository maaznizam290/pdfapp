"use client";

import { useState } from "react";
import { convertFile, downloadFile } from "../utils/pdfApi";

export default function PdfConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [operation, setOperation] = useState("pdf-to-word");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        setError("Please select a PDF file.");
        setFile(null);
      } else {
        setFile(selectedFile);
        setError(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError("File size is too large. Please select a file smaller than 50MB.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log(`Starting conversion: ${file.name} to ${operation}`);
      const blob = await convertFile(file, operation);
      
      if (!blob || blob.size === 0) {
        throw new Error("Conversion failed - received empty file");
      }
      
      const outputFilename = `${file.name.replace(/\.pdf$/i, "")}.${getFileExtension(operation)}`;
      downloadFile(blob, outputFilename);
      setSuccess(`Successfully converted and downloaded ${outputFilename}!`);
      console.log(`Conversion completed successfully: ${outputFilename}`);
    } catch (err: any) {
      console.error('Conversion error:', err);
      
      // Provide more specific error messages
      let errorMessage = err.message;
      if (errorMessage.includes('Failed to convert file')) {
        errorMessage = "Conversion failed. The PDF might be corrupted or contain only images. Please try with a different PDF file.";
      } else if (errorMessage.includes('No text content found')) {
        errorMessage = "This PDF appears to contain only images or scanned content. Text-based PDFs work best for conversion.";
      } else if (errorMessage.includes('Network')) {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (errorMessage.includes('timeout')) {
        errorMessage = "Conversion timed out. Please try with a smaller file or try again.";
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getFileExtension = (operation: string): string => {
    switch (operation) {
      case 'pdf-to-word': return 'docx';
      case 'pdf-to-powerpoint': return 'pptx';
      case 'pdf-to-excel': return 'xlsx';
      case 'pdf-to-jpg': return 'jpg';
      default: return 'docx';
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>PDF Converter 📄</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label htmlFor="file-upload" style={styles.label}>1. Choose a PDF File</label>
          <input 
            id="file-upload"
            type="file" 
            accept="application/pdf"
            onChange={handleFileChange} 
            style={styles.input}
            required
          />
          {file && <p style={styles.fileName}>Selected: {file.name}</p>}
        </div>

        <div style={styles.inputGroup}>
          <label htmlFor="operation-select" style={styles.label}>2. Select Conversion</label>
          <select 
            id="operation-select"
            value={operation} 
            onChange={(e) => setOperation(e.target.value)} 
            style={styles.select}
          >
            <option value="pdf-to-word">PDF to Word (.docx)</option>
            <option value="pdf-to-powerpoint">PDF to PowerPoint (.pptx)</option>
            <option value="pdf-to-excel">PDF to Excel (.xlsx)</option>
            <option value="pdf-to-jpg">PDF to JPG (.jpg)</option>
          </select>
        </div>

        <button 
          type="submit" 
          disabled={isLoading || !file} 
          style={{
            ...styles.button,
            opacity: isLoading || !file ? 0.6 : 1,
            cursor: isLoading || !file ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? "🔄 Converting..." : "📄 Convert & Download"}
        </button>
      </form>

      {error && <p style={styles.errorMessage}>{error}</p>}
      {success && <p style={styles.successMessage}>{success}</p>}
    </div>
  );
}

// Basic styling for the component
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: 'Arial, sans-serif',
    maxWidth: '500px',
    margin: '40px auto',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    background: '#f9f9f9',
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '30px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '8px',
    fontWeight: 'bold',
    color: '#555',
  },
  input: {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '5px',
  },
  fileName: {
    fontSize: '14px',
    color: '#333',
    marginTop: '5px',
  },
  select: {
    padding: '12px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    background: 'white',
  },
  button: {
    padding: '15px',
    border: 'none',
    borderRadius: '5px',
    background: '#007bff',
    color: 'white',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  errorMessage: {
    color: '#d93025',
    textAlign: 'center',
    marginTop: '20px',
  },
  successMessage: {
    color: '#1e8e3e',
    textAlign: 'center',
    marginTop: '20px',
  }
};