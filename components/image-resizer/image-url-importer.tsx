"use client";

import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageData } from "@/lib/image-types";
import { loadImageFromUrl } from "@/lib/image-utils";

interface ImageUrlImporterProps {
  onImageLoaded: (imageData: ImageData) => void;
}

export default function ImageUrlImporter({ onImageLoaded }: ImageUrlImporterProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    if (!url.trim()) {
      setErrorMessage("Please enter an image URL");
      return;
    }
    
    try {
      setIsLoading(true);
      const imageData = await loadImageFromUrl(url);
      onImageLoaded(imageData);
    } catch (error) {
      setErrorMessage("Failed to load image from URL. Please check the URL and try again.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-2">
          <Input
            type="url"
            placeholder="Enter image URL (https://...)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
            className="w-full"
          />
          {errorMessage && (
            <p className="text-sm font-medium text-destructive">{errorMessage}</p>
          )}
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="mr-2">Loading</span>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
            </>
          ) : (
            "Import Image"
          )}
        </Button>
      </form>
      
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          The image URL must be publicly accessible and from a source that allows cross-origin requests
        </p>
      </div>
    </div>
  );
}