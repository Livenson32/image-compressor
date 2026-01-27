import {ImageJob} from './types';
import DOMPurify from 'dompurify';

export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (
    parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i]
  );
};

export const generateFilename = (
  originalFilename: string,
  pattern: string,
  sequenceIndex: number,
): string => {
  const baseName = originalFilename.replace(/\.[^/.]+$/, '');

  const date = new Date().toISOString().split('T')[0];

  let name = pattern
    .replace(/{o}/g, baseName)
    .replace(/{n}/g, sequenceIndex.toString())
    .replace(/{d}/g, date);

  // eslint-disable-next-line no-control-regex
  name = name.replace(/[\x00-\x1f\x7f\x80-\x9f\u200B-\u200D\uFEFF]/g, '');

  name = name.replace(/[/\\?%*:|"<>]/g, '-');

  name = name.replace(/^\.+/, '').replace(/\.+$/, '');

  if (name.length > 200) {
    name = name.substring(0, 200);
  }

  if (name.trim() === '') name = 'optimized_image';

  return name;
};

export const downloadJob = (job: ImageJob, customFilename?: string): void => {
  if (!job.optimizedBlob) return;

  const url = URL.createObjectURL(job.optimizedBlob);
  const anchor = document.createElement('a');
  anchor.href = url;

  let extension = 'png';
  if (job.optimizedBlob.type === 'image/jpeg') extension = 'jpg';
  if (job.optimizedBlob.type === 'image/webp') extension = 'webp';
  if (job.optimizedBlob.type === 'image/avif') extension = 'avif';
  if (job.optimizedBlob.type === 'image/qoi') extension = 'qoi';
  if (job.optimizedBlob.type === 'image/jxl') extension = 'jxl';
  if (job.optimizedBlob.type === 'image/svg+xml') extension = 'svg';

  const filenameBase = customFilename ?? job.file.name;
  const safeBaseName = generateFilename(filenameBase, '{o}', 0);

  anchor.download = `${safeBaseName}.${extension}`;
  anchor.rel = 'noopener';

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  URL.revokeObjectURL(url);
};

export const verifyFileSignature = async (
  file: File,
): Promise<{isValid: boolean; detectedType: string | null}> => {
  try {
    const buffer = await file.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // PNG signature
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    ) {
      return {isValid: true, detectedType: 'png'};
    }

    // JPEG signature
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return {isValid: true, detectedType: 'jpg'};
    }

    // WEBP signature
    if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return {isValid: true, detectedType: 'webp'};
    }

    // AVIF signature
    if (
      bytes[4] === 0x66 &&
      bytes[5] === 0x74 &&
      bytes[6] === 0x79 &&
      bytes[7] === 0x70 &&
      bytes[8] === 0x61 &&
      bytes[9] === 0x76 &&
      bytes[10] === 0x69 &&
      bytes[11] === 0x66
    ) {
      return {isValid: true, detectedType: 'avif'};
    }

    // QOI signature
    if (
      bytes[0] === 0x71 &&
      bytes[1] === 0x6f &&
      bytes[2] === 0x69 &&
      bytes[3] === 0x66
    ) {
      return {isValid: true, detectedType: 'qoi'};
    }

    // JXL signatures
    if (bytes[0] === 0xff && bytes[1] === 0x0a) {
      return {isValid: true, detectedType: 'jxl'};
    }
    if (
      bytes[0] === 0x00 &&
      bytes[1] === 0x00 &&
      bytes[2] === 0x00 &&
      bytes[3] === 0x0c &&
      bytes[4] === 0x4a &&
      bytes[5] === 0x58 &&
      bytes[6] === 0x4c &&
      bytes[7] === 0x20
    ) {
      return {isValid: true, detectedType: 'jxl'};
    }

    // GIF signature
    if (
      bytes[0] === 0x47 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x38
    ) {
      return {isValid: true, detectedType: 'gif'};
    }

    const text = new TextDecoder().decode(bytes).trim();
    if (text.startsWith('<') && file.type.includes('svg')) {
      return {isValid: true, detectedType: 'svg'};
    }

    return {isValid: false, detectedType: null};
  } catch (e) {
    console.error('Signature verification failed', e);
    return {isValid: false, detectedType: null};
  }
};

export const sanitizeSvg = async (file: File): Promise<File> => {
  try {
    const text = await file.text();
    const cleanSvg = DOMPurify.sanitize(text, {
      USE_PROFILES: {svg: true},
      ADD_TAGS: ['use'],
    });
    return new File([cleanSvg], file.name, {type: 'image/svg+xml'});
  } catch (e) {
    console.warn(
      'SVG Sanitization failed, returning original (risky but fallback)',
      e,
    );
    return file;
  }
};

export const validateAndSanitizeFile = async (
  file: File,
): Promise<File | null> => {
  const {isValid, detectedType} = await verifyFileSignature(file);

  if (!isValid) {
    console.warn(`[Security] Rejected file "${file.name}": Invalid signature.`);
    return null;
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const isJpeg = detectedType === 'jpg' && (ext === 'jpg' || ext === 'jpeg');
  const isPng = detectedType === 'png' && ext === 'png';
  const isWebp = detectedType === 'webp' && ext === 'webp';
  const isAvif = detectedType === 'avif' && ext === 'avif';
  const isQoi = detectedType === 'qoi' && ext === 'qoi';
  const isJxl = detectedType === 'jxl' && ext === 'jxl';
  const isGif = detectedType === 'gif' && ext === 'gif';
  const isSvg = detectedType === 'svg' && ext === 'svg';

  if (
    !isJpeg &&
    !isPng &&
    !isWebp &&
    !isAvif &&
    !isQoi &&
    !isJxl &&
    !isGif &&
    !isSvg
  ) {
    console.warn(
      `[Security] Rejected file "${file.name}": Extension (.${ext}) does not match detected content (${detectedType}).`,
    );
    return null;
  }

  if (isSvg) {
    return await sanitizeSvg(file);
  }

  return file;
};
