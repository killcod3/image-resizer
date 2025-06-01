"use client";

import {
  ImageData,
  ProcessingOptions,
  OutputFormat
} from "./image-types";
import {
  calculateNewDimensions,
  canvasToBlob,
  blobToDataURL,
  getImageTypeFromFormat,
  createCanvasFromImage
} from "./image-utils";

/**
 * Process and optimize an image according to specified options
 */
export async function processImage(
  originalImage: ImageData,
  options: ProcessingOptions
): Promise<ImageData> {
  // Step 1: Load the image into an ImageBitmap
  const img = await createImageBitmap(
    originalImage.file || await fetch(originalImage.dataUrl).then(r => r.blob())
  );
  
  // Step 2: Calculate new dimensions if specified
  const { width: newWidth, height: newHeight } = calculateNewDimensions(
    img.width,
    img.height,
    options.maxWidth,
    options.maxHeight,
    options.maintainAspectRatio
  );
  
  // Step 3: Create canvas and draw image
  const canvas = createCanvasFromImage(img, newWidth, newHeight);
  
  // Step 4: Analyze image characteristics to inform format decisions
  const hasTransparency = detectTransparency(canvas);
  const imageCharacteristics = analyzeImageCharacteristics(canvas);
  
  // Step 5: Determine format sequence based on original format and options
  const formatSequence = determineFormatSequence(
    originalImage.type,
    options.outputFormat,
    hasTransparency,
    imageCharacteristics.isPhoto
  );
  
  console.log(`Format sequence: ${formatSequence.join(' -> ')}`);
  
  // Step 6: Configure tolerance settings
  const lowerBoundTolerance = options.lowerBoundTolerance || 10;
  const upperBoundTolerance = options.strictUpperLimit ? 0 : (options.upperBoundTolerance || 10);
  
  // Step 7: Find optimal format and quality through the sequence
  let finalProcessedBlob: Blob | null = null;
  let finalFormat: string = "";
  let finalQuality: number = 0;
  
  // Try each format in the sequence until we find one that works
  for (const format of formatSequence) {
    console.log(`Attempting compression with format: ${format}`);
    
    try {
      const result = await findOptimalQualityForFormat(
        canvas,
        format,
        options.targetSizeBytes,
        options.quality,
        lowerBoundTolerance,
        upperBoundTolerance,
        options.strictUpperLimit || false,
        options.compressionLevel
      );
      
      if (result) {
        finalProcessedBlob = result.blob;
        finalFormat = format;
        finalQuality = result.quality;
        console.log(`Successfully compressed with ${format} at quality ${result.quality}`);
        break;
      }
    } catch (error) {
      console.error(`Error processing with format ${format}:`, error);
      // Continue to next format in sequence
    }
  }
  
  // Step 8: If no format worked, throw an error
  if (!finalProcessedBlob) {
    throw new Error(
      "Failed to find a valid compression solution that meets the target size constraint. " +
      "Please try a larger target size or different format."
    );
  }
  
  // Log final result statistics
  const percentOfTarget = ((finalProcessedBlob.size / options.targetSizeBytes) * 100).toFixed(1);
  console.log(`Final size: ${finalProcessedBlob.size} bytes (${percentOfTarget}% of target ${options.targetSizeBytes})`);
  console.log(`Using format: ${finalFormat} at quality: ${finalQuality}`);
  
  // Step 9: Create data URL from blob
  const dataUrl = await blobToDataURL(finalProcessedBlob);
  
  // Step 10: Create ImageBitmap to get dimensions
  const processedBitmap = await createImageBitmap(finalProcessedBlob);
  
  return {
    dataUrl,
    filename: originalImage.filename,
    type: finalFormat,
    size: finalProcessedBlob.size,
    width: processedBitmap.width,
    height: processedBitmap.height
  };
}

/**
 * Determine the sequence of formats to try based on original format and image characteristics
 */
function determineFormatSequence(
  originalType: string, 
  requestedFormat: OutputFormat,
  hasTransparency: boolean,
  isPhoto: boolean
): string[] {
  // If a specific format is requested, use only that
  if (requestedFormat !== "auto") {
    return [getImageTypeFromFormat(requestedFormat)];
  }
  
  const originalFormatLower = originalType.toLowerCase();
  const isOriginalPng = originalFormatLower.includes('png');
  const isOriginalJpeg = originalFormatLower.includes('jpeg') || originalFormatLower.includes('jpg');
  const isOriginalWebP = originalFormatLower.includes('webp');
  const isOriginalAvif = originalFormatLower.includes('avif');
  
  // Format priority for PNG input (implementing the specific requirement)
  if (isOriginalPng) {
    if (hasTransparency) {
      // For transparent PNGs, we must preserve transparency
      return ["image/png", "image/webp", "image/avif"];
    } else {
      // For non-transparent PNGs, we can try all formats
      return ["image/png", "image/webp", "image/avif", "image/jpeg"];
    }
  }
  
  // Format priority for JPEG input
  if (isOriginalJpeg) {
    if (isPhoto) {
      // Photos compress well with JPEG, WebP, AVIF
      return ["image/jpeg", "image/webp", "image/avif"];
    } else {
      // For graphics originally saved as JPEG, try WebP first
      return ["image/webp", "image/jpeg", "image/avif"];
    }
  }
  
  // Modern formats
  if (isOriginalWebP) {
    return ["image/webp", "image/avif", "image/jpeg", "image/png"];
  }
  
  if (isOriginalAvif) {
    return ["image/avif", "image/webp", "image/jpeg", "image/png"];
  }
  
  // Default sequence based on transparency and content type
  if (hasTransparency) {
    return ["image/png", "image/webp", "image/avif"];
  } else if (isPhoto) {
    return ["image/webp", "image/jpeg", "image/avif", "image/png"];
  } else {
    return ["image/webp", "image/png", "image/avif", "image/jpeg"];
  }
}

/**
 * Find the optimal quality setting for a specific format to meet size constraints
 */
async function findOptimalQualityForFormat(
  canvas: HTMLCanvasElement,
  format: string,
  targetSizeBytes: number,
  initialQuality: number,
  lowerBoundTolerance: number,
  upperBoundTolerance: number,
  strictUpperLimit: boolean,
  compressionLevel: number
): Promise<{ blob: Blob, quality: number } | null> {
  // Lower bound reduction loop (progressively reduce lower bound if needed)
  for (
    let currentLowerBoundReduction = lowerBoundTolerance;
    currentLowerBoundReduction <= 50; // Maximum 50% reduction
    currentLowerBoundReduction += 5  // Increment by 5% in each iteration
  ) {
    console.log(`Trying with lower bound reduction: ${currentLowerBoundReduction}%`);
    
    // Calculate effective target range
    const effectiveLowerBound = targetSizeBytes * (1 - (currentLowerBoundReduction / 100));
    const effectiveUpperBound = strictUpperLimit ? 
      targetSizeBytes : 
      targetSizeBytes * (1 + (upperBoundTolerance / 100));
    
    // Binary search for optimal quality
    let minQuality = 1;
    let maxQuality = 100;
    let currentQuality = initialQuality;
    let bestBlob: Blob | null = null;
    let bestQuality = 0;
    let attempts = 0;
    
    while (attempts < 10 && (maxQuality >= minQuality)) {
      attempts++;
      
      try {
        const blob = await canvasToBlob(canvas, format, currentQuality);
        
        // Check if this blob meets our criteria
        const isUnderUpperBound = blob.size <= effectiveUpperBound;
        const isAboveLowerBound = blob.size >= effectiveLowerBound;
        
        if (isUnderUpperBound && isAboveLowerBound) {
          // Valid solution - save as best candidate (prefer higher quality)
          if (!bestBlob || currentQuality > bestQuality) {
            bestBlob = blob;
            bestQuality = currentQuality;
          }
          
          // Try to find even better quality
          minQuality = currentQuality;
          currentQuality = Math.min(Math.ceil((currentQuality + maxQuality) / 2), 100);
        } else if (!isUnderUpperBound) {
          // Too large - decrease quality
          maxQuality = currentQuality - 1;
          currentQuality = Math.max(Math.floor((minQuality + maxQuality) / 2), 1);
        } else { // !isAboveLowerBound
          // Too small - increase quality
          minQuality = currentQuality + 1;
          currentQuality = Math.min(Math.ceil((minQuality + maxQuality) / 2), 100);
        }
        
        // If we can't adjust quality further or found good quality
        if ((maxQuality - minQuality <= 1 && bestBlob) || minQuality > maxQuality) {
          break;
        }
      } catch (error) {
        console.error(`Error at quality ${currentQuality}:`, error);
        return null; // Format not supported or other error
      }
    }
    
    // If we found a valid solution, return it
    if (bestBlob) {
      return { blob: bestBlob, quality: bestQuality };
    }
    
    // Last resort - try minimum quality
    if (currentLowerBoundReduction >= 50) {
      try {
        const lastResortBlob = await canvasToBlob(canvas, format, 1);
        if (lastResortBlob.size <= effectiveUpperBound) {
          return { blob: lastResortBlob, quality: 1 };
        }
      } catch (error) {
        console.error("Failed even with minimum quality:", error);
      }
    }
  }
  
  // No valid solution found for this format
  return null;
}

/**
 * Detect if an image contains transparency
 */
function detectTransparency(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  
  // Check a sample of pixels for transparency
  // For performance reasons, we don't check every pixel
  const sampleSize = Math.floor(pixels.length / 4 / 100); // Check ~1% of pixels
  const stride = Math.floor(pixels.length / 4 / sampleSize);
  
  for (let i = 3; i < pixels.length; i += 4 * stride) {
    if (pixels[i] < 255) {
      return true;
    }
  }
  
  return false;
}

/**
 * Analyze image to determine if it's likely a photo or graphic
 */
function analyzeImageCharacteristics(canvas: HTMLCanvasElement): { isPhoto: boolean } {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { isPhoto: true }; // Default to photo if we can't analyze
  
  // Get image data to analyze
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  
  // We'll sample the image to analyze color variance and edge detection
  // Photos typically have smooth gradients and many colors
  // Graphics/text typically have sharp edges and fewer colors
  
  const uniqueColors = new Set();
  let colorCount = 0;
  const maxSamples = 10000; // Limit samples for performance
  const sampleRate = Math.max(1, Math.floor(pixels.length / 4 / maxSamples));
  
  let edgeCount = 0;
  let gradientCount = 0;
  
  // Sample pixels to count unique colors and detect edges
  for (let i = 0; i < pixels.length; i += 4 * sampleRate) {
    if (i + 4 * sampleRate < pixels.length) {
      // Count unique colors (simplified by ignoring alpha)
      const colorKey = `${pixels[i]},${pixels[i+1]},${pixels[i+2]}`;
      uniqueColors.add(colorKey);
      colorCount++;
      
      // Check for edges (large color differences between adjacent pixels)
      const nextIndex = i + 4 * sampleRate;
      if (nextIndex < pixels.length) {
        const colorDiff = Math.abs(pixels[i] - pixels[nextIndex]) + 
                          Math.abs(pixels[i+1] - pixels[nextIndex+1]) + 
                          Math.abs(pixels[i+2] - pixels[nextIndex+2]);
        
        if (colorDiff > 100) { // Threshold for edge detection
          edgeCount++;
        } else if (colorDiff > 10 && colorDiff <= 100) {
          gradientCount++;
        }
      }
    }
  }
  
  // Calculate metrics
  const uniqueColorRatio = uniqueColors.size / colorCount;
  const edgeRatio = edgeCount / (colorCount || 1);
  const gradientRatio = gradientCount / (colorCount || 1);
  
  // Heuristic to determine if the image is likely a photo
  // Photos have many unique colors and more gradients than sharp edges
  const isLikelyPhoto = uniqueColorRatio > 0.1 && gradientRatio > edgeRatio;
  
  return {
    isPhoto: isLikelyPhoto
  };
}