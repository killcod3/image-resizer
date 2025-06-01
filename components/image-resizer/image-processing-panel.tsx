"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Download, RefreshCw, ArrowLeft, Info, 
  CheckCircle, Image as ImageIcon, Lock
} from "lucide-react";
import { ImageData, ProcessingOptions, OutputFormat } from "@/lib/image-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { processImage } from "@/lib/image-processor";
import { formatBytes, getImageTypeFromFormat } from "@/lib/image-utils";

interface ImageProcessingPanelProps {
  originalImage: ImageData;
  processedImage: ImageData | null;
  setProcessedImage: (image: ImageData | null) => void;
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
  onReset: () => void;
}

export default function ImageProcessingPanel({
  originalImage,
  processedImage,
  setProcessedImage,
  isProcessing,
  setIsProcessing,
  onReset,
}: ImageProcessingPanelProps) {
  const [targetSizeValue, setTargetSizeValue] = useState<string>("");
  const [targetUnit, setTargetUnit] = useState<"KB" | "MB">("MB");
  const [targetSizeInBytes, setTargetSizeInBytes] = useState<number>(0);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("auto");
  const [quality, setQuality] = useState(80);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [maxWidth, setMaxWidth] = useState<string>(originalImage.width.toString());
  const [maxHeight, setMaxHeight] = useState<string>(originalImage.height.toString());
  const [validationError, setValidationError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("basic");
  const [compressionLevel, setCompressionLevel] = useState<number>(6); // 0-9
  
  // Tolerance settings
  const [lowerBoundTolerance, setLowerBoundTolerance] = useState<number>(10);
  const [upperBoundTolerance, setUpperBoundTolerance] = useState<number>(10);
  const [strictUpperLimit, setStrictUpperLimit] = useState<boolean>(false);
  const [previousUpperBoundTolerance, setPreviousUpperBoundTolerance] = useState<number>(10);

  useEffect(() => {
    // Set default target size to 70% of original
    const defaultTarget = Math.round(originalImage.size * 0.7);
    
    // Determine appropriate unit based on size
    let defaultValue: string;
    let defaultUnit: "KB" | "MB";
    
    if (defaultTarget >= 1024 * 1024) {
      // Use MB for larger files
      defaultValue = (defaultTarget / (1024 * 1024)).toFixed(2);
      defaultUnit = "MB";
    } else {
      // Use KB for smaller files
      defaultValue = (defaultTarget / 1024).toFixed(2);
      defaultUnit = "KB";
    }
    
    setTargetSizeValue(defaultValue);
    setTargetUnit(defaultUnit);
    setTargetSizeInBytes(defaultTarget);
  }, [originalImage.size]);

  // Effect for handling strict upper limit toggling
  useEffect(() => {
    if (strictUpperLimit) {
      // Save current upper bound before setting it to 0
      setPreviousUpperBoundTolerance(upperBoundTolerance);
      setUpperBoundTolerance(0);
    } else {
      // Restore previous upper bound value
      setUpperBoundTolerance(previousUpperBoundTolerance);
    }
  }, [strictUpperLimit]);

  const calculateSizeInBytes = useCallback((value: string, unit: "KB" | "MB"): number => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return 0;
    
    if (unit === "KB") {
      return Math.round(numValue * 1024);
    } else {
      return Math.round(numValue * 1024 * 1024);
    }
  }, []);

  const validateSettings = useCallback((): boolean => {
    // Validate target size
    if (!targetSizeValue) {
      setValidationError("Please enter a target size");
      return false;
    }

    const numericValue = parseFloat(targetSizeValue);
    if (isNaN(numericValue) || numericValue <= 0) {
      setValidationError("Target size must be a positive number");
      return false;
    }

    const sizeInBytes = calculateSizeInBytes(targetSizeValue, targetUnit);
    if (sizeInBytes >= originalImage.size) {
      setValidationError("Target size must be smaller than original size");
      return false;
    }

    if (sizeInBytes < 1024) { // 1KB minimum
      setValidationError("Target size is too small (minimum 1KB)");
      return false;
    }

    // Validate dimensions if provided
    const parsedWidth = parseInt(maxWidth);
    const parsedHeight = parseInt(maxHeight);
    
    if (maxWidth && (isNaN(parsedWidth) || parsedWidth <= 0)) {
      setValidationError("Width must be a positive number");
      return false;
    }
    
    if (maxHeight && (isNaN(parsedHeight) || parsedHeight <= 0)) {
      setValidationError("Height must be a positive number");
      return false;
    }

    // Validate tolerance settings
    if (lowerBoundTolerance < 10) {
      setValidationError("Lower bound tolerance must be at least 10%");
      return false;
    }

    if (!strictUpperLimit && (upperBoundTolerance < 0 || upperBoundTolerance > 50)) {
      setValidationError("Upper bound tolerance must be between 0% and 50%");
      return false;
    }

    setValidationError(null);
    return true;
  }, [targetSizeValue, targetUnit, maxWidth, maxHeight, originalImage.size, calculateSizeInBytes, lowerBoundTolerance, upperBoundTolerance, strictUpperLimit]);

  const handleTargetSizeValueChange = (value: string) => {
    // Only allow numbers and decimal points
    const cleanedValue = value.replace(/[^\d.]/g, '');
    setTargetSizeValue(cleanedValue);
    
    // Update the byte value
    const sizeInBytes = calculateSizeInBytes(cleanedValue, targetUnit);
    setTargetSizeInBytes(sizeInBytes);
  };
  
  const handleTargetUnitChange = (unit: "KB" | "MB") => {
    setTargetUnit(unit);
    
    // Recalculate bytes based on new unit
    const sizeInBytes = calculateSizeInBytes(targetSizeValue, unit);
    setTargetSizeInBytes(sizeInBytes);
  };

  const handleLowerBoundToleranceChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 10) {
      setLowerBoundTolerance(numValue);
    }
  };

  const handleUpperBoundToleranceChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 50) {
      setUpperBoundTolerance(numValue);
      setPreviousUpperBoundTolerance(numValue);
    }
  };

  const handleProcessImage = async () => {
    if (!validateSettings()) return;
    
    try {
      setIsProcessing(true);
      
      const options: ProcessingOptions = {
        targetSizeBytes: targetSizeInBytes,
        outputFormat,
        quality,
        maxWidth: maxWidth ? parseInt(maxWidth) : undefined,
        maxHeight: maxHeight ? parseInt(maxHeight) : undefined,
        maintainAspectRatio,
        compressionLevel,
        lowerBoundTolerance,
        upperBoundTolerance,
        strictUpperLimit
      };
      
      const result = await processImage(originalImage, options);
      setProcessedImage(result);
    } catch (error) {
      console.error("Image processing failed:", error);
      setValidationError("Failed to process image. Please try different settings.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;
    
    const link = document.createElement("a");
    link.href = processedImage.dataUrl;
    
    // Create filename with format and size info
    const originalExt = originalImage.filename.split('.').pop() || '';
    const newExt = processedImage.type.split('/').pop() || originalExt;
    const filename = `${originalImage.filename.split('.')[0]}_resized.${newExt}`;
    
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleWidthChange = (value: string) => {
    setMaxWidth(value);
    
    if (maintainAspectRatio && originalImage.width && originalImage.height) {
      const numValue = parseInt(value) || 0;
      if (numValue > 0) {
        const aspectRatio = originalImage.width / originalImage.height;
        setMaxHeight(Math.round(numValue / aspectRatio).toString());
      }
    }
  };

  const handleHeightChange = (value: string) => {
    setMaxHeight(value);
    
    if (maintainAspectRatio && originalImage.width && originalImage.height) {
      const numValue = parseInt(value) || 0;
      if (numValue > 0) {
        const aspectRatio = originalImage.width / originalImage.height;
        setMaxWidth(Math.round(numValue * aspectRatio).toString());
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Original Image Panel */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span>Original Image</span>
            <Button variant="outline" size="sm" onClick={onReset}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </CardTitle>
          <CardDescription>
            {originalImage.filename} • {formatBytes(originalImage.size)}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative bg-muted flex items-center justify-center p-2 min-h-[300px] overflow-hidden">
            <img 
              src={originalImage.dataUrl} 
              alt="Original" 
              className="max-w-full max-h-[400px] object-contain shadow-sm"
            />
          </div>
          <div className="p-4 bg-card border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Dimensions:</span>{" "}
                {originalImage.width} x {originalImage.height}
              </div>
              <div>
                <span className="text-muted-foreground">Format:</span>{" "}
                {originalImage.type.split('/')[1].toUpperCase()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processed Image Panel */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle>
            {processedImage ? "Processed Image" : "Output Preview"}
          </CardTitle>
          <CardDescription>
            {processedImage 
              ? `${formatBytes(processedImage.size)} (${Math.round((processedImage.size / originalImage.size) * 100)}% of original)`
              : "Configure settings and process your image"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative bg-muted flex items-center justify-center p-2 min-h-[300px] overflow-hidden">
            {processedImage ? (
              <img 
                src={processedImage.dataUrl} 
                alt="Processed" 
                className="max-w-full max-h-[400px] object-contain shadow-sm"
              />
            ) : isProcessing ? (
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-muted-foreground">Processing image...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImageIcon className="h-16 w-16 opacity-20" />
                <p>Process the image to see the result</p>
              </div>
            )}
          </div>
          {processedImage && (
            <div className="p-4 bg-card border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Dimensions:</span>{" "}
                  {processedImage.width} x {processedImage.height}
                </div>
                <div>
                  <span className="text-muted-foreground">Format:</span>{" "}
                  {processedImage.type.split('/')[1].toUpperCase()}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Controls */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Processing Settings</CardTitle>
          <CardDescription>
            Configure how your image will be processed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Settings</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Options</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-6 pt-4">
              {/* Target Size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="targetSize" className="text-base">
                    Target Size
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Enter the desired size for the output image</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <div className="flex gap-2">
                  <Input
                    id="targetSize"
                    type="text"
                    value={targetSizeValue}
                    onChange={(e) => handleTargetSizeValueChange(e.target.value)}
                    placeholder="Enter value"
                    className="flex-1"
                  />
                  
                  <Select
                    value={targetUnit}
                    onValueChange={(val) => handleTargetUnitChange(val as "KB" | "MB")}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KB">KB</SelectItem>
                      <SelectItem value="MB">MB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Original size: {formatBytes(originalImage.size)}
                </p>
              </div>
              
              {/* Strictly Under Target Value (moved from Advanced tab) */}
              <div className="space-y-2 p-3 border rounded-md bg-muted/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" />
                    <Label htmlFor="strictUpperLimit" className="text-base">
                      Strictly Under Target Value
                    </Label>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>When enabled, ensures the final size never exceeds the target size you specified</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    When enabled, ensures the final size is never larger than the target
                  </p>
                  <Switch
                    id="strictUpperLimit"
                    checked={strictUpperLimit}
                    onCheckedChange={setStrictUpperLimit}
                  />
                </div>
              </div>

              {/* Dimensions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Maximum Dimensions</Label>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="maintainAspectRatio" className="text-sm">
                      Maintain aspect ratio
                    </Label>
                    <Switch
                      id="maintainAspectRatio"
                      checked={maintainAspectRatio}
                      onCheckedChange={setMaintainAspectRatio}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxWidth">Width (px)</Label>
                    <Input
                      id="maxWidth"
                      type="number"
                      value={maxWidth}
                      onChange={(e) => handleWidthChange(e.target.value)}
                      placeholder="Width in pixels"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxHeight">Height (px)</Label>
                    <Input
                      id="maxHeight"
                      type="number"
                      value={maxHeight}
                      onChange={(e) => handleHeightChange(e.target.value)}
                      placeholder="Height in pixels"
                    />
                  </div>
                </div>
              </div>
              
              {/* Output Format */}
              <div className="space-y-2">
                <Label htmlFor="outputFormat" className="text-base">Output Format</Label>
                <Select
                  value={outputFormat}
                  onValueChange={(val) => setOutputFormat(val as OutputFormat)}
                >
                  <SelectTrigger id="outputFormat">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (Recommended)</SelectItem>
                    <SelectItem value="jpeg">JPEG</SelectItem>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="webp">WebP</SelectItem>
                    <SelectItem value="avif">AVIF</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {outputFormat === "auto" 
                    ? "Automatically selects the best format based on your target size"
                    : `Output will be converted to ${outputFormat.toUpperCase()}`}
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="advanced" className="space-y-6 pt-4">
              {/* Tolerance Settings */}
              <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                <h3 className="font-medium">Size Tolerance Settings</h3>
                
                {/* Lower Bound Tolerance */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="lowerBoundTolerance" className="text-sm">
                      Lower Bound Tolerance (%)
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Allows the final size to be smaller than the target by this percentage</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="lowerBoundTolerance"
                    type="number"
                    min={10}
                    value={lowerBoundTolerance}
                    onChange={(e) => handleLowerBoundToleranceChange(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum: 10%, allows the image to be up to {lowerBoundTolerance}% smaller than target
                  </p>
                </div>
                
                {/* Upper Bound Tolerance */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="upperBoundTolerance" className="text-sm">
                      Upper Bound Tolerance (%)
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Allows the final size to be larger than the target by this percentage</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="upperBoundTolerance"
                    type="number"
                    min={0}
                    max={50}
                    value={upperBoundTolerance}
                    onChange={(e) => handleUpperBoundToleranceChange(e.target.value)}
                    disabled={strictUpperLimit}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    {strictUpperLimit 
                      ? "Disabled when strict upper limit is enabled" 
                      : `Maximum: 50%, allows the image to be up to ${upperBoundTolerance}% larger than target`}
                  </p>
                </div>
              </div>

              {/* Quality Setting */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Quality</Label>
                  <span className="text-sm">{quality}%</span>
                </div>
                <Slider
                  value={[quality]}
                  min={5}
                  max={100}
                  step={1}
                  onValueChange={(vals) => setQuality(vals[0])}
                />
                <p className="text-xs text-muted-foreground">
                  Lower quality = smaller file size, but may introduce artifacts
                </p>
              </div>

              {/* Compression Level */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Compression Effort</Label>
                  <span className="text-sm">
                    {compressionLevel < 4 ? 'Fast' : compressionLevel < 7 ? 'Balanced' : 'Maximum'}
                  </span>
                </div>
                <Slider
                  value={[compressionLevel]}
                  min={1}
                  max={9}
                  step={1}
                  onValueChange={(vals) => setCompressionLevel(vals[0])}
                />
                <p className="text-xs text-muted-foreground">
                  Higher values = better compression but slower processing
                </p>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 text-sm">
                <p className="font-medium">Advanced Format Information:</p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li><span className="font-medium">WebP:</span> Modern format with good compression, widely supported</li>
                  <li><span className="font-medium">AVIF:</span> Best compression, but newer with limited support</li>
                  <li><span className="font-medium">JPEG:</span> Universal support, good for photos</li>
                  <li><span className="font-medium">PNG:</span> Lossless quality, best for graphics with transparency</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>

          {validationError && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive rounded text-sm text-destructive">
              {validationError}
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <Button 
              className="flex-1"
              onClick={handleProcessImage}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Process Image</>
              )}
            </Button>
            
            {processedImage && (
              <Button 
                className="flex-1" 
                variant="secondary"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Card (when both images are available) */}
      {processedImage && (
        <Card className="lg:col-span-2 bg-muted/40">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-primary" />
              Compression Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6 text-center">
              <div>
                <p className="font-medium mb-2">Original Size</p>
                <p className="text-2xl font-bold">{formatBytes(originalImage.size)}</p>
                <p className="text-muted-foreground">{originalImage.width} × {originalImage.height}</p>
              </div>
              <div>
                <p className="font-medium mb-2">New Size</p>
                <p className="text-2xl font-bold">{formatBytes(processedImage.size)}</p>
                <p className="text-muted-foreground">{processedImage.width} × {processedImage.height}</p>
              </div>
              <div className="col-span-2">
                <p className="font-medium mb-2">Size Reduction</p>
                <div className="relative pt-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs font-semibold inline-block text-primary">
                        {Math.round((1 - processedImage.size / originalImage.size) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-muted">
                    <div
                      style={{ width: `${Math.round((1 - processedImage.size / originalImage.size) * 100)}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}