'use client';

import { cn } from '@/lib/utils';
import { useCallback, useState } from 'react';
import { Upload, File } from 'lucide-react';

interface FileUploadProps {
  onFile: (file: File) => void;
  accept?: string;
  className?: string;
}

export function FileUpload({ onFile, accept = '.xlsx,.csv,.xls', className }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    onFile(file);
  }, [onFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      className={cn(
        'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
        dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
        className
      )}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-upload-input')?.click()}
    >
      <input
        id="file-upload-input"
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      {fileName ? (
        <div className="flex items-center justify-center gap-3 text-gray-700">
          <File className="w-8 h-8 text-blue-500" />
          <div className="text-left">
            <p className="font-medium">{fileName}</p>
            <p className="text-sm text-gray-500">点击重新选择</p>
          </div>
        </div>
      ) : (
        <div>
          <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">拖拽文件到这里，或点击上传</p>
          <p className="text-sm text-gray-500 mt-1">支持 .xlsx、.csv、.xls 格式</p>
        </div>
      )}
    </div>
  );
}
