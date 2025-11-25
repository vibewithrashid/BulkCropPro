import JSZip from 'jszip';
import FileSaver from 'file-saver';
import { UploadedFile, CropArea } from '../types';

/**
 * Loads an image from a URL and returns the HTMLImageElement
 */
export const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
  });
};

/**
 * Crops a single image based on percentage crop area
 */
export const cropImage = async (
  image: HTMLImageElement,
  crop: CropArea,
  mimeType: string = 'image/jpeg',
  quality: number = 0.9
): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  // Calculate pixel values from percentages
  // If unit is '%', x/y/w/h are 0-100
  // We need to normalize them to 0-1 for calculation if they are strictly stored as 0-100
  
  // Assuming the crop object passed here is strictly in PERCENTAGE (0-100) as intended for bulk ops
  const pixelX = (crop.x / 100) * image.naturalWidth;
  const pixelY = (crop.y / 100) * image.naturalHeight;
  const pixelWidth = (crop.width / 100) * image.naturalWidth;
  const pixelHeight = (crop.height / 100) * image.naturalHeight;

  canvas.width = pixelWidth;
  canvas.height = pixelHeight;

  ctx.drawImage(
    image,
    pixelX,
    pixelY,
    pixelWidth,
    pixelHeight,
    0,
    0,
    pixelWidth,
    pixelHeight
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality
    );
  });
};

/**
 * Bulk processes images and downloads a ZIP
 */
export const processAndDownloadBatch = async (
  files: UploadedFile[],
  crop: CropArea,
  onProgress: (current: number, total: number) => void
) => {
  const zip = new JSZip();
  const folder = zip.folder("cropped_images");

  let processedCount = 0;

  for (const fileObj of files) {
    try {
      const img = await loadImage(fileObj.previewUrl);
      
      // Default to JPEG if original type is weird, or preserve original
      const mimeType = fileObj.file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const extension = mimeType === 'image/png' ? 'png' : 'jpg';
      
      const blob = await cropImage(img, crop, mimeType);
      
      // Create a unique filename
      const originalName = fileObj.file.name.substring(0, fileObj.file.name.lastIndexOf('.')) || fileObj.file.name;
      const filename = `${originalName}_cropped.${extension}`;

      folder?.file(filename, blob);
    } catch (error) {
      console.error(`Failed to crop ${fileObj.file.name}`, error);
    }

    processedCount++;
    onProgress(processedCount, files.length);
  }

  const content = await zip.generateAsync({ type: "blob" });
  // Handle file-saver import variation
  const saveAs = FileSaver.saveAs || (FileSaver as any).default?.saveAs || FileSaver;
  saveAs(content, "bulk_cropped_images.zip");
};