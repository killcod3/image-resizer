"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImageDropzone from "@/components/image-resizer/image-dropzone";
import ImageUrlImporter from "@/components/image-resizer/image-url-importer";
import ImageProcessingPanel from "@/components/image-resizer/image-processing-panel";
import { ImageData } from "@/lib/image-types";
import Footer from "@/components/footer";

export default function ResizePage() {
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [processedImage, setProcessedImage] = useState<ImageData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageLoaded = (data: ImageData) => {
    setImageData(data);
    setProcessedImage(null);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto py-6 px-4 flex-grow">
        <h1 className="text-3xl font-bold mb-6 text-center">Image Resizer</h1>
        
        {!imageData ? (
          <div className="max-w-2xl mx-auto">
            <Tabs defaultValue="dropzone" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="dropzone">Upload Image</TabsTrigger>
                <TabsTrigger value="url">Import from URL</TabsTrigger>
              </TabsList>
              
              <TabsContent value="dropzone" className="mt-0">
                <ImageDropzone onImageLoaded={handleImageLoaded} />
              </TabsContent>
              
              <TabsContent value="url" className="mt-0">
                <ImageUrlImporter onImageLoaded={handleImageLoaded} />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <ImageProcessingPanel 
            originalImage={imageData} 
            processedImage={processedImage}
            setProcessedImage={setProcessedImage}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
            onReset={() => {
              setImageData(null);
              setProcessedImage(null);
            }}
          />
        )}
      </div>
      
      <Footer />
    </div>
  );
}