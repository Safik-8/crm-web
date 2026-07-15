import React, { useState, useRef } from 'react';
import { Upload, File, AlertCircle, RefreshCw } from 'lucide-react';

export const UploadArea = ({
  onFileSelect,
  accept = '.xlsx,.xls,.csv',
  maxSizeMB = 10,
  error = null,
  isLoading = false,
  uploadProgress = null
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [localError, setLocalError] = useState(null);
  const inputRef = useRef(null);

  const validateAndSelectFile = (file) => {
    setLocalError(null);
    if (!file) return;

    // Check size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setLocalError(`File size exceeds the limit of ${maxSizeMB}MB.`);
      return;
    }

    // Check extension
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    const acceptedExtensions = accept.split(',').map((e) => e.trim().toLowerCase());
    if (accept !== '*' && !acceptedExtensions.includes(ext)) {
      setLocalError(`Invalid file format. Only ${accept} files are allowed.`);
      return;
    }

    setSelectedFile(file);
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    inputRef.current.click();
  };

  const handleClear = () => {
    setSelectedFile(null);
    setLocalError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    if (onFileSelect) {
      onFileSelect(null);
    }
  };

  const displayError = error || localError;

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center min-h-[180px] p-6 border-2 border-dashed rounded-2xl transition-all ${
          dragActive
            ? 'border-orange-500 bg-orange-50/50'
            : selectedFile
            ? 'border-emerald-500 bg-emerald-50/30'
            : displayError
            ? 'border-red-400 bg-red-50/20'
            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          disabled={isLoading}
          className="hidden"
        />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-10 h-10 text-orange-500 animate-spin" />
            <p className="text-sm font-semibold text-slate-600">Processing file...</p>
            {uploadProgress !== null && (
              <div className="w-48 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-orange-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
          </div>
        ) : selectedFile ? (
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
              <File className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 max-w-[280px] truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-500">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onButtonClick}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Change File
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-3 bg-orange-100 text-orange-500 rounded-2xl">
              <Upload className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">
                Drag and drop your file here, or{' '}
                <button
                  type="button"
                  onClick={onButtonClick}
                  className="text-orange-500 hover:underline font-bold focus:outline-none cursor-pointer"
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports Excel (.xlsx, .xls) and CSV (.csv) up to {maxSizeMB}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {displayError && (
        <div className="flex items-start gap-2 mt-2 text-red-600 text-xs font-semibold bg-red-50/50 p-2.5 rounded-xl border border-red-100 animate-fadeIn">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
};

export default UploadArea;
