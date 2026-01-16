'use client';

import { useState, useRef, useCallback } from 'react';
import { Modal } from './Modal';

interface ImportResult {
  success: boolean;
  fileName: string;
  costSheetId?: string;
  errors: string[];
  warnings: string[];
}

interface ImportResponse {
  totalFiles: number;
  successful: number;
  failed: number;
  results: ImportResult[];
}

interface ImportCostSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export function ImportCostSheetModal({
  isOpen,
  onClose,
  onImportComplete,
}: ImportCostSheetModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResults, setImportResults] = useState<ImportResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) => {
      const ext = file.name.toLowerCase().split('.').pop();
      return ext === 'xls' || ext === 'xlsx';
    });

    if (droppedFiles.length > 0) {
      setFiles((prev) => [...prev, ...droppedFiles]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).filter((file) => {
      const ext = file.name.toLowerCase().split('.').pop();
      return ext === 'xls' || ext === 'xlsx';
    });

    if (selectedFiles.length > 0) {
      setFiles((prev) => [...prev, ...selectedFiles]);
    }

    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setFiles([]);
    setImportResults(null);
  };

  const handleImport = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setImportResults(null);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/costsheets/import', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import failed');
      }

      const results: ImportResponse = await response.json();
      setImportResults(results);

      // If any imports succeeded, notify parent
      if (results.successful > 0) {
        onImportComplete();
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportResults({
        totalFiles: files.length,
        successful: 0,
        failed: files.length,
        results: files.map((f) => ({
          success: false,
          fileName: f.name,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          warnings: [],
        })),
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setFiles([]);
      setImportResults(null);
      setUploadProgress(0);
      onClose();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Cost Sheets" size="lg">
      <div className="space-y-4">
        {/* Description */}
        <p className="text-sm text-[#A1A1A1]">
          Import cost sheets from Excel files (.xls, .xlsx). You can import multiple files at once.
        </p>

        {/* Drop Zone */}
        {!importResults && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
              ${
                isDragging
                  ? 'border-[#0070F3] bg-[#0070F3]/5'
                  : 'border-[#333333] hover:border-[#444444] hover:bg-[#111111]'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xls,.xlsx"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex flex-col items-center gap-3">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors duration-200 ${
                  isDragging ? 'bg-[#0070F3]/10' : 'bg-[#1F1F1F]'
                }`}
              >
                <svg
                  className={`w-7 h-7 ${isDragging ? 'text-[#0070F3]' : 'text-[#666666]'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>

              <div>
                <p className="text-sm font-medium text-[#EDEDED]">
                  {isDragging ? 'Drop files here' : 'Drop Excel files here or click to browse'}
                </p>
                <p className="text-xs text-[#666666] mt-1">Supports .xls and .xlsx files</p>
              </div>
            </div>
          </div>
        )}

        {/* File List */}
        {files.length > 0 && !importResults && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-[#A1A1A1]">
                {files.length} file{files.length !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={clearAll}
                className="text-xs text-[#0070F3] hover:underline"
                disabled={isUploading}
              >
                Clear all
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between bg-[#111111] rounded-lg px-3 py-2 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-emerald-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-[#EDEDED] truncate">{file.name}</p>
                      <p className="text-xs text-[#666666]">{formatFileSize(file.size)}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFile(index)}
                    className="p-1.5 text-[#666666] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    disabled={isUploading}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#A1A1A1]">Importing...</span>
              <span className="text-sm text-[#666666]">{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 bg-[#1F1F1F] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0070F3] rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Import Results */}
        {importResults && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center gap-4 p-4 bg-[#111111] rounded-xl">
              {importResults.successful > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-emerald-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-emerald-400">
                    {importResults.successful} imported successfully
                  </span>
                </div>
              )}
              {importResults.failed > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-red-400">{importResults.failed} failed</span>
                </div>
              )}
            </div>

            {/* Detailed Results */}
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {importResults.results.map((result, index) => (
                <div
                  key={`result-${index}`}
                  className={`p-3 rounded-lg ${
                    result.success ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-red-500/5 border border-red-500/20'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {result.success ? (
                      <svg
                        className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium ${
                          result.success ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {result.fileName}
                      </p>

                      {result.errors.length > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {result.errors.map((error, i) => (
                            <li key={i} className="text-xs text-red-400/80">
                              {error}
                            </li>
                          ))}
                        </ul>
                      )}

                      {result.warnings.length > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {result.warnings.map((warning, i) => (
                            <li key={i} className="text-xs text-yellow-400/80">
                              Warning: {warning}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Import More Button */}
            <button
              onClick={() => {
                setFiles([]);
                setImportResults(null);
              }}
              className="w-full px-4 py-2.5 text-sm text-[#A1A1A1] bg-[#111111] border border-[#333333] rounded-lg hover:bg-[#1A1A1A] hover:text-[#EDEDED] transition-all duration-150"
            >
              Import More Files
            </button>
          </div>
        )}

        {/* Actions */}
        {!importResults && (
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="px-4 py-2 text-[#A1A1A1] bg-[#111111] border border-[#333333] rounded text-sm font-medium hover:bg-[#1A1A1A] hover:text-[#EDEDED] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={files.length === 0 || isUploading}
              className="px-5 py-2 bg-white text-black rounded text-sm font-medium hover:bg-[#E5E5E5] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Importing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  Import {files.length > 0 ? `${files.length} File${files.length !== 1 ? 's' : ''}` : ''}
                </>
              )}
            </button>
          </div>
        )}

        {/* Close button after results */}
        {importResults && (
          <div className="flex justify-end pt-2">
            <button
              onClick={handleClose}
              className="px-5 py-2 bg-white text-black rounded text-sm font-medium hover:bg-[#E5E5E5] transition-all duration-150"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
