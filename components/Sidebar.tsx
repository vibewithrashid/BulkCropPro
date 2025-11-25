import React from 'react';
import { UploadedFile } from '../types';
import { Trash2, Image as ImageIcon } from 'lucide-react';

interface SidebarProps {
  files: UploadedFile[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onRemove: (id: string) => void;
  onAddMore: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  files, 
  currentIndex, 
  onSelect, 
  onRemove,
  onAddMore 
}) => {
  return (
    <div className="w-64 bg-white border-l border-slate-200 flex flex-col h-full shadow-lg z-20">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h2 className="font-semibold text-slate-700 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-blue-500" />
          Queue ({files.length})
        </h2>
        <button 
          onClick={onAddMore}
          className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          Add more
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
        {files.map((file, index) => (
          <div 
            key={file.id}
            className={`
              relative group flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border
              ${index === currentIndex 
                ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100' 
                : 'hover:bg-slate-50 border-transparent hover:border-slate-200'
              }
            `}
            onClick={() => onSelect(index)}
          >
            <div className="w-12 h-12 rounded bg-slate-200 overflow-hidden flex-shrink-0 border border-slate-100">
              <img 
                src={file.previewUrl} 
                alt="thumb" 
                className="w-full h-full object-cover" 
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${index === currentIndex ? 'text-blue-700' : 'text-slate-700'}`}>
                {file.file.name}
              </p>
              <p className="text-xs text-slate-400">
                {(file.file.size / 1024).toFixed(0)} KB
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(file.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
