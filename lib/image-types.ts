export type OutputFormat = "auto" | "jpeg" | "png" | "webp" | "avif";

export interface ImageData {
  dataUrl: string;
  file?: File;
  filename: string;
  type: string;
  size: number;
  width: number;
  height: number;
}

export interface ProcessingOptions {
  targetSizeBytes: number;
  outputFormat: OutputFormat;
  quality: number;
  maxWidth?: number;
  maxHeight?: number;
  maintainAspectRatio: boolean;
  compressionLevel: number; // 0-9 for codecs that support it
  lowerBoundTolerance?: number; // Percentage (e.g., 10 means 10%)
  upperBoundTolerance?: number; // Percentage
  strictUpperLimit?: boolean;
}

export interface ImageCodec {
  name: string;
  mimeType: string;
  extension: string;
  encode: (imageData: ImageBitmap, options: any) => Promise<Uint8Array>;
  qualityRange: [number, number]; // Min and max quality
  supportsAlpha?: boolean;
}