import React, { useCallback } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesSelected }) => {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Filter for images only
      // Explicitly type 'f' as File to avoid 'unknown' type error
      const imageFiles = Array.from(e.dataTransfer.files).filter((f: File) => f.type.startsWith('image/'));
      onFilesSelected(imageFiles);
    }
  }, [onFilesSelected]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Explicitly type 'f' as File to avoid 'unknown' type error
      const imageFiles = Array.from(e.target.files).filter((f: File) => f.type.startsWith('image/'));
      onFilesSelected(imageFiles);
      // Reset value so the same file can be selected again if needed
      e.target.value = '';
    }
  };

  return (
    <div 
      className="group relative w-full h-full min-h-[400px] border-2 border-dashed border-slate-300 rounded-2xl bg-white hover:bg-blue-50/30 hover:border-blue-400 transition-all duration-300 flex flex-col items-center justify-center p-10 cursor-pointer overflow-hidden"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
      />
      
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]"></div>

      <div className="relative z-10 flex flex-col items-center pointer-events-none">
        <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 ease-out">
          <Upload strokeWidth={1.5} className="w-10 h-10" />
        </div>
        
        <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-blue-700 transition-colors">
          Upload Images
        </h3>
        
        <p className="text-slate-500 text-center max-w-sm mb-8 leading-relaxed">
          Drag & drop your images here to start batch cropping.
          <br />
          <span className="text-sm">Or click anywhere to browse files.</span>
        </p>
        
        <div className="flex flex-wrap justify-center gap-3">
           <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold uppercase tracking-wide">
             <ImageIcon className="w-3.5 h-3.5" />
             JPG, PNG, WEBP
           </div>
           <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold uppercase tracking-wide">
             Batch Processing
           </div>
        </div>
      </div>
    </div>
  );
};