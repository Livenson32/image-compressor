/**
 * Results from an image optimization job.
 */
export interface OptimizationStats {
  originalSize: number;
  optimizedSize: number;
  timeTaken: number; // in milliseconds
  /** True if the optimizer decided keeping the original file was better (e.g. optimization made it larger) */
  isOriginal?: boolean;
}

export type JobStatus = 'queued' | 'processing' | 'done' | 'error';

/**
 * Resize methods supported by the Pica library.
 * 'lanczos3' is high quality (slow), 'box' is pixelated (fast).
 */
export type ResizeFilterMethod =
  | 'box'
  | 'hamming'
  | 'lanczos2'
  | 'lanczos3'
  | 'mks2013';

export interface ResizeConfiguration {
  mode: 'off' | 'scale' | 'dimensions';
  method: ResizeFilterMethod;
  /** Percentage to scale (1-200) */
  scale: number;
  width: number | null;
  height: number | null;
  maintainAspect: boolean;
  fitMethod: 'cover' | 'contain' | 'stretch';
}

/**
 * Settings for Color Quantization (Palette reduction).
 * Reducing unique colors significantly shrinks PNG file size.
 */
export interface PaletteConfiguration {
  enabled: boolean;
  /** Colors to keep (2-256) */
  colors: number;
  /** How much noise to add to smooth gradients (0-1) */
  dither: number;
}

export interface RenamingConfiguration {
  /** Pattern: {o}=original name, {n}=counter, {d}=date */
  pattern: string;
  startSequence: number;
}

export type ThemeOption = 'light' | 'dark' | 'system';

export type OutputFormat = 'png' | 'webp' | 'jpeg' | 'avif' | 'qoi' | 'jxl';

export interface WebPConfiguration {
  quality: number; // 0-100
  lossless: boolean;
  effort: number; // 0-6 (lossy) or 0-9 (lossless)
  nearLossless: number; // 0-100, used when lossless is true
}

export interface JpegConfiguration {
  quality: number; // 0-100
}

export interface AvifConfiguration {
  quality: number; // 0-100
  lossless: boolean;
  effort: number; // 0-6 (AVIF encoding is slow at high effort)
}

export interface JxlConfiguration {
  quality: number; // 0-100
  lossless: boolean;
  effort: number; // 3-9
}

/**
 * The Master Configuration Object.
 * This holds every setting user can change in the Settings Panel.
 */
export interface OptimizerConfiguration {
  outputFormat: OutputFormat;
  maintainOriginalFormat: boolean; // Auto Compress Mode

  // PNG Specific
  level: number; // 1-6
  interlace: boolean; // Progressive loading

  // Format Specifics
  webp: WebPConfiguration;
  jpeg: JpegConfiguration;
  avif: AvifConfiguration;
  jxl: JxlConfiguration;

  // General Config
  autoDownload: boolean;
  concurrency: number; // Parallel downloads
  theme: ThemeOption;

  // Transform Config
  resize: ResizeConfiguration;
  palette: PaletteConfiguration;
  renaming: RenamingConfiguration;

  // Advanced
  linearRGB: boolean; // Better color math during resize
  premultiplyAlpha: boolean; // Fixes dark halos around transparency
  stripMetadata: boolean; // Privacy (remove GPS/Exif)
  disableStorage: boolean; // Incognito mode (Prevent IndexedDB caching)
}

/**
 * Represents one image file in the UI queue.
 */
export interface ImageJob {
  id: string; // UUID
  file: File; // The raw file object
  previewUrl: string; // blob: url for <img> tag
  status: JobStatus;
  estimatedDuration?: number; // Fake progress bar duration
  progress: number; // 0-100
  stats?: OptimizationStats;
  optimizedBlob?: Blob; // The result
  error?: string;
  startedAt?: number;
  completedAt?: number;
}

/**
 * Messages sent FROM the worker TO React.
 */
export interface WorkerResponseMessage {
  type: 'SUCCESS' | 'ERROR' | 'LOG';
  buffer?: ArrayBuffer;
  time?: number;
  message?: string;
  details?: unknown;
}

/**
 * Messages sent FROM React TO the worker.
 */
export interface WorkerRequestPayload {
  buffer: ArrayBuffer;
  fileType: string;
  config: OptimizerConfiguration;
}
