"use client";

import { ImageData } from "./image-types";

// Load image from a File object
export async function loadImageFromFile(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      if (!event.target?.result) {
        reject(new Error("Failed to read file"));
        return;
      }
      
      try {
        const dataUrl = event.target.result as string;
        const image = await createImageBitmap(file);
        
        resolve({
          dataUrl,
          file,
          filename: file.name,
          type: file.type || 'image/jpeg',
          size: file.size,
          width: image.width,
          height: image.height
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error("Error reading file"));
    reader.readAsDataURL(file);
  });
}

// Load image from a URL
export async function loadImageFromUrl(url: string): Promise<ImageData> {
  // First, fetch the image to get its data
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }
  
  const blob = await response.blob();
  
  // Create a File object from the blob
  // Extract filename from URL
  const urlParts = url.split('/');
  const filename = urlParts[urlParts.length - 1].split('?')[0] || 'image';
  const file = new File([blob], filename, { type: blob.type });
  
  // Use the existing loadImageFromFile function
  return loadImageFromFile(file);
}

// Convert a canvas to a Blob with the specified type and quality
export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to create blob from canvas"));
        }
      },
      type,
      quality / 100
    );
  });
}

// Format bytes to human-readable string
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Calculate new dimensions while maintaining aspect ratio
export function calculateNewDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth?: number,
  maxHeight?: number,
  maintainAspectRatio: boolean = true
): { width: number; height: number } {
  let newWidth = originalWidth;
  let newHeight = originalHeight;
  
  if (maintainAspectRatio) {
    const aspectRatio = originalWidth / originalHeight;
    
    if (maxWidth && maxHeight) {
      if (originalWidth > maxWidth || originalHeight > maxHeight) {
        // Check which constraint is more restrictive
        if (maxWidth / maxHeight > aspectRatio) {
          // Height is the limiting factor
          newHeight = maxHeight;
          newWidth = Math.round(newHeight * aspectRatio);
        } else {
          // Width is the limiting factor
          newWidth = maxWidth;
          newHeight = Math.round(newWidth / aspectRatio);
        }
      }
    } else if (maxWidth && originalWidth > maxWidth) {
      newWidth = maxWidth;
      newHeight = Math.round(newWidth / aspectRatio);
    } else if (maxHeight && originalHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = Math.round(newHeight * aspectRatio);
    }
  } else {
    if (maxWidth && originalWidth > maxWidth) {
      newWidth = maxWidth;
    }
    if (maxHeight && originalHeight > maxHeight) {
      newHeight = maxHeight;
    }
  }
  
  return { width: Math.round(newWidth), height: Math.round(newHeight) };
}

// Get appropriate MIME type from format string
export function getImageTypeFromFormat(format: string): string {
  switch (format.toLowerCase()) {
    case 'jpeg':
    case 'jpg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'avif':
      return 'image/avif';
    case 'gif':
      return 'image/gif';
    default:
      return 'image/jpeg'; // Default fallback
  }
}

// Create a canvas element with the image rendered on it
export function createCanvasFromImage(
  image: HTMLImageElement | ImageBitmap,
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas 2D context');
  }
  
  // Use higher quality image rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  ctx.drawImage(image, 0, 0, width, height);
  
  return canvas;
}

// Convert a Blob to a data URL
export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Failed to convert blob to data URL'));
    reader.readAsDataURL(blob);
  });
}