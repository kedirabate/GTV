
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { FileIcon } from './icons/FileIcon';
import type { FileType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  onAnalyze: () => void;
  file: File | null;
  fileType: FileType | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileChange, onAnalyze, file }) => {
  const [isDragging, setIsDragging] = useState(false);
  const { t } = useLanguage();

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileChange(e.dataTransfer.files[0]);
    }
  }, [onFileChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileChange(e.target.files[0]);
    }
  };
  
  const handleRemoveFile = () => {
    onFileChange(null);
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-white border border-gray-200 rounded-2xl p-6 md:p-8 text-center shadow-lg">
      <h2 className="text-2xl font-bold mb-2 text-blue-700">{t('fileUploadTitle')}</h2>
      <p className="text-gray-500 mb-6">{t('fileUploadSubtitle')}</p>
      
      {!file ? (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-10 transition-all duration-300 ${isDragging ? 'border-blue-600 bg-gradient-to-br from-blue-50 to-blue-100' : 'border-gray-300'}`}
        >
          <input
            type="file"
            id="file-upload"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileSelect}
            accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,audio/*"
          />
          <div className="flex flex-col items-center justify-center space-y-4">
            <UploadIcon className="h-12 w-12 text-gray-400" />
            <p className="text-gray-600">
              <label htmlFor="file-upload" className="font-bold text-blue-700 hover:text-blue-800 cursor-pointer">
                {t('clickToUpload')}
              </label>
              {' '}{t('orDragAndDrop')}
            </p>
            <p className="text-xs text-gray-500">{t('maxFileSize')}</p>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <FileIcon className="h-8 w-8 text-blue-700 flex-shrink-0" />
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-gray-800 truncate" title={file.name}>{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>
            <button onClick={handleRemoveFile} className="text-gray-500 hover:text-red-500 transition-colors text-2xl font-light">&times;</button>
          </div>
        </div>
      )}

      <button
        onClick={onAnalyze}
        disabled={!file}
        className="w-full mt-6 py-3 px-6 bg-blue-700 text-white font-bold rounded-lg shadow-lg hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 transform hover:scale-105"
      >
        {t('analyzeFile')}
      </button>
    </div>
  );
};