export interface UploadedFile {
  id: string;
  file: File;
  previewUrl: string;
  originalWidth?: number;
  originalHeight?: number;
}

export interface CropArea {
  unit: 'px' | '%';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ProcessingStatus {
  total: number;
  current: number;
  isProcessing: boolean;
}
