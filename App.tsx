import React, { useState, useEffect } from 'react';
import { DropZone } from './components/DropZone';
import { CropWorkspace } from './components/CropWorkspace';
import { Sidebar } from './components/Sidebar';
import { UploadedFile, CropArea, ProcessingStatus } from './types';
import { processAndDownloadBatch } from './utils/imageProcessing';
import { Download, Loader2, Scissors } from 'lucide-react';

// Simple ID generator to avoid adding uuid dependency
const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  
  // Default Crop Area (Percentage based) - 80% center
  const [crop, setCrop] = useState<CropArea>({
    unit: '%',
    x: 10,
    y: 10,
    width: 80,
    height: 80
  });

  const [status, setStatus] = useState<ProcessingStatus>({
    total: 0,
    current: 0,
    isProcessing: false
  });

  // Handle file selection
  const handleFilesSelected = (selectedFiles: File[]) => {
    const newFiles: UploadedFile[] = selectedFiles.map(file => ({
      id: generateId(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setFiles(prev => [...prev, ...newFiles]);
  };

  // Load image dimensions for new files to display metadata
  useEffect(() => {
    files.forEach((fileObj, index) => {
      if (!fileObj.originalWidth) {
        const img = new Image();
        img.src = fileObj.previewUrl;
        img.onload = () => {
          setFiles(prev => {
             const updated = [...prev];
             if (updated[index]) {
                 updated[index] = {
                     ...updated[index],
                     originalWidth: img.naturalWidth,
                     originalHeight: img.naturalHeight
                 };
             }
             return updated;
          });
        };
      }
    });
  }, [files]);

  const handleRemove = (id: string) => {
    setFiles(prev => {
      const newFiles = prev.filter(f => f.id !== id);
      if (currentImageIndex >= newFiles.length) {
        setCurrentImageIndex(Math.max(0, newFiles.length - 1));
      }
      return newFiles;
    });
  };

  const handleDownloadAll = async () => {
    if (files.length === 0) return;
    
    setStatus({
      isProcessing: true,
      total: files.length,
      current: 0
    });

    try {
      await processAndDownloadBatch(files, crop, (current, total) => {
        setStatus({ isProcessing: true, current, total });
      });
    } catch (e) {
      console.error("Batch failed", e);
      alert("Something went wrong during batch processing.");
    } finally {
      setStatus(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach(f => URL.revokeObjectURL(f.previewUrl));
    };
  }, []); // Empty dependency mainly cleans up when component dies, strictly speaking should track files but this is okay for SPA

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <Scissors size={20} />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">BulkCrop <span className="text-blue-600">Pro</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
           {files.length > 0 && (
            <button
              onClick={handleDownloadAll}
              disabled={status.isProcessing}
              className={`
                flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white shadow-lg shadow-blue-500/20 transition-all
                ${status.isProcessing 
                  ? 'bg-blue-400 cursor-wait' 
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-600/30 hover:-translate-y-0.5 active:translate-y-0'
                }
              `}
            >
              {status.isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing {status.current}/{status.total}
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Crop & Download All ({files.length})
                </>
              )}
            </button>
           )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {files.length === 0 ? (
          <div className="flex-1 p-8 flex items-center justify-center">
            <div className="w-full max-w-2xl h-96">
              <DropZone onFilesSelected={handleFilesSelected} />
            </div>
          </div>
        ) : (
          <>
            {/* Editor Area */}
            <div className="flex-1 p-4 flex flex-col min-w-0">
               <CropWorkspace 
                 currentFile={files[currentImageIndex]} 
                 crop={crop}
                 setCrop={setCrop}
               />
               
               {/* Mobile/Quick view of selection stats */}
               <div className="mt-3 grid grid-cols-4 gap-4 px-1">
                 <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                   <p className="text-xs text-slate-500 uppercase font-semibold">Selection X</p>
                   <p className="text-lg font-mono text-slate-700">{Math.round(crop.x)}%</p>
                 </div>
                 <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                   <p className="text-xs text-slate-500 uppercase font-semibold">Selection Y</p>
                   <p className="text-lg font-mono text-slate-700">{Math.round(crop.y)}%</p>
                 </div>
                 <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                   <p className="text-xs text-slate-500 uppercase font-semibold">Width</p>
                   <p className="text-lg font-mono text-slate-700">{Math.round(crop.width)}%</p>
                 </div>
                 <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                   <p className="text-xs text-slate-500 uppercase font-semibold">Height</p>
                   <p className="text-lg font-mono text-slate-700">{Math.round(crop.height)}%</p>
                 </div>
               </div>
            </div>

            {/* Sidebar */}
            <Sidebar 
              files={files}
              currentIndex={currentImageIndex}
              onSelect={setCurrentImageIndex}
              onRemove={handleRemove}
              onAddMore={() => document.getElementById('hidden-add-more')?.click()}
            />
            {/* Hidden input for sidebar add more */}
            <input 
              type="file" 
              id="hidden-add-more" 
              multiple 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files) handleFilesSelected(Array.from(e.target.files));
              }} 
            />
          </>
        )}
      </main>
    </div>
  );
};

export default App;