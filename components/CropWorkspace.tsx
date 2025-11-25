import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { type Crop, PixelCrop, PercentCrop } from 'react-image-crop';
import { UploadedFile, CropArea } from '../types';
import { Wand2, Loader2, RotateCcw } from 'lucide-react';
import { getSmartCropSuggestion } from '../services/aiService';

interface CropWorkspaceProps {
  currentFile: UploadedFile;
  crop: CropArea;
  setCrop: (crop: CropArea) => void;
}

export const CropWorkspace: React.FC<CropWorkspaceProps> = ({ currentFile, crop, setCrop }) => {
  const [imgSrc, setImgSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setImgSrc(currentFile.previewUrl);
    // Reset error when file changes
    setError(null);
  }, [currentFile]);

  // Convert our unified CropArea type (which uses % internally for bulk consistency) 
  // to the type ReactCrop expects for visual rendering.
  // We prefer using percentage in ReactCrop to maintain relative positions on resize.
  const visualCrop: Crop = {
    unit: '%',
    x: crop.x,
    y: crop.y,
    width: crop.width,
    height: crop.height,
  };

  const onCropChange = (c: Crop, percentCrop: PercentCrop) => {
    // We strictly use Percentage for the source of truth to ensure bulk operations work across resolutions
    setCrop({
      unit: '%',
      x: percentCrop.x,
      y: percentCrop.y,
      width: percentCrop.width,
      height: percentCrop.height
    });
  };

  const handleSmartCrop = async () => {
    if (!process.env.API_KEY) {
      setError("API Key not found in environment.");
      return;
    }
    setIsAiLoading(true);
    setError(null);
    try {
      const suggestedCrop = await getSmartCropSuggestion(currentFile.file, process.env.API_KEY);
      if (suggestedCrop) {
        setCrop(suggestedCrop);
      } else {
        setError("Could not detect a subject.");
      }
    } catch (err) {
      setError("Failed to generate smart crop.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleReset = () => {
    setCrop({ unit: '%', x: 10, y: 10, width: 80, height: 80 });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/50 rounded-xl overflow-hidden border border-slate-200">
      {/* Toolbar */}
      <div className="bg-white p-3 border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-2">
           <span className="text-sm font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
             {currentFile.file.name}
           </span>
           <span className="text-xs text-slate-400">
             {currentFile.originalWidth ? `${currentFile.originalWidth}x${currentFile.originalHeight}px` : 'Loading...'}
           </span>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            title="Reset Crop Box"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          
          <button 
            onClick={handleSmartCrop}
            disabled={isAiLoading || !process.env.API_KEY}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all
              ${!process.env.API_KEY ? 'hidden' : ''}
              ${isAiLoading 
                ? 'bg-purple-100 text-purple-400 cursor-not-allowed' 
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-200'
              }`}
            title="Use AI to detect subject"
          >
            {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            Auto-Detect Subject
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto p-8 flex items-center justify-center bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-slate-100 relative">
        {error && (
            <div className="absolute top-4 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm border border-red-200 shadow-lg z-20">
                {error}
            </div>
        )}
        
        <div className="relative shadow-2xl rounded-lg overflow-hidden ring-1 ring-black/5 bg-white">
          <ReactCrop
            crop={visualCrop}
            onChange={onCropChange}
            aspect={undefined} // Free form cropping by default
            className="max-h-[70vh]"
          >
            <img
              ref={imgRef}
              src={imgSrc}
              alt="Crop preview"
              className="max-w-full max-h-[70vh] block object-contain"
              onLoad={(e) => {
                 // You could capture natural dimensions here if needed updates
              }}
            />
          </ReactCrop>
        </div>
      </div>
      
      <div className="bg-white p-2 text-center text-xs text-slate-400 border-t border-slate-200">
        Adjust the box above. This relative crop (percentage) will be applied to ALL images.
      </div>
    </div>
  );
};