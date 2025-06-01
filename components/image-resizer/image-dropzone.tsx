"use client";

import { useState, useCallback } from "react";
import { Upload, ImageIcon } from "lucide-react";
import { ImageData } from "@/lib/image-types";
import { loadImageFromFile } from "@/lib/image-utils";

interface ImageDropzoneProps {
  onImageLoaded: (imageData: ImageData) => void;
}

export default function ImageDropzone({ onImageLoaded }: ImageDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setErrorMessage(null);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processFile(file);
    }
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await processFile(file);
    }
  }, []);

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload an image file');
      return;
    }
    
    try {
      setIsLoading(true);
      const imageData = await loadImageFromFile(file);
      onImageLoaded(imageData);
    } catch (error) {
      setErrorMessage('Failed to load image. Please try another file.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div 
        className={`border-2 border-dashed rounded-lg p-8 transition-all duration-200 ${
          isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50 hover:bg-muted/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="rounded-full bg-muted p-4">
            {isLoading ? (
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            ) : (
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Drop your image here</h3>
            <p className="text-sm text-muted-foreground">
              Drop an image or click to browse files
            </p>
            {errorMessage && (
              <p className="text-sm font-medium text-destructive">{errorMessage}</p>
            )}
          </div>

          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <Upload className="h-4 w-4" />
            <span>Select Image</span>
            <input 
              type="file" 
              className="sr-only" 
              accept="image/*" 
              onChange={handleFileChange}
              disabled={isLoading}
            />
          </label>
          
          <p className="text-xs text-muted-foreground">
            Supported formats: JPG, PNG, WebP, GIF and more
          </p>
        </div>
      </div>
    </div>
  );
}