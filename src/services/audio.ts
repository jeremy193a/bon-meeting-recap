import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface CompressResult {
  readonly audioPath: string;
  readonly mimeType: string;
  readonly isCompressed: boolean;
  readonly originalSize: number;
  readonly compressedSize: number;
}

let ffmpegChecked: boolean | null = null;

/**
 * Checks if ffmpeg is available on system PATH.
 */
export async function isFfmpegAvailable(): Promise<boolean> {
  if (ffmpegChecked !== null) return ffmpegChecked;
  try {
    await execFileAsync('ffmpeg', ['-version']);
    ffmpegChecked = true;
  } catch {
    ffmpegChecked = false;
    console.warn('[Audio] ffmpeg is not found on system PATH. Compression will be skipped.');
  }
  return ffmpegChecked;
}

/**
 * Maps common audio file extensions to MIME types.
 */
export function getMimeTypeFromExt(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    '.mp3': 'audio/mp3',
    '.wav': 'audio/wav',
    '.m4a': 'audio/m4a',
    '.webm': 'audio/webm',
    '.weba': 'audio/webm',
    '.ogg': 'audio/ogg',
    '.flac': 'audio/flac',
    '.aac': 'audio/aac',
    '.mp4': 'audio/mp4',
  };
  return map[ext] || 'audio/mp4';
}

/**
 * Compresses an audio file using ffmpeg to 16kHz mono 48kbps MP3.
 * Returns the compressed file info, or the original file if compression is unavailable/fails/not beneficial.
 */
export async function compressAudio(inputPath: string): Promise<CompressResult> {
  const stat = await fs.stat(inputPath).catch(() => null);
  const originalSize = stat ? stat.size : 0;

  const hasFfmpeg = await isFfmpegAvailable();
  if (!hasFfmpeg || originalSize === 0) {
    return {
      audioPath: inputPath,
      mimeType: getMimeTypeFromExt(inputPath),
      isCompressed: false,
      originalSize,
      compressedSize: originalSize,
    };
  }

  const dir = path.dirname(inputPath);
  const ext = path.extname(inputPath);
  const baseName = path.basename(inputPath, ext);
  const outputPath = path.join(dir, `${baseName}-compressed.mp3`);

  try {
    console.log(`[Audio] Compressing ${path.basename(inputPath)} (${(originalSize / 1024 / 1024).toFixed(1)} MB) with ffmpeg...`);
    const startTime = Date.now();

    await execFileAsync('ffmpeg', [
      '-y',
      '-i', inputPath,
      '-vn',
      '-ar', '16000',
      '-ac', '1',
      '-b:a', '48k',
      '-f', 'mp3',
      outputPath,
    ]);

    const outStat = await fs.stat(outputPath).catch(() => null);
    if (!outStat || outStat.size === 0) {
      throw new Error('Compressed output file is empty or missing');
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const compressedSize = outStat.size;
    const ratio = (((originalSize - compressedSize) / originalSize) * 100).toFixed(0);

    console.log(
      `[Audio] Compression finished in ${elapsed}s: ${(originalSize / 1024 / 1024).toFixed(1)} MB -> ${(compressedSize / 1024 / 1024).toFixed(1)} MB (reduced ${ratio}%)`,
    );

    // If compressed file is smaller, remove original uncompressed file to save disk space
    if (compressedSize < originalSize && inputPath !== outputPath) {
      await fs.unlink(inputPath).catch(() => {});
      return {
        audioPath: outputPath,
        mimeType: 'audio/mp3',
        isCompressed: true,
        originalSize,
        compressedSize,
      };
    }

    // If not smaller, clean up output and keep original
    await fs.unlink(outputPath).catch(() => {});
    return {
      audioPath: inputPath,
      mimeType: getMimeTypeFromExt(inputPath),
      isCompressed: false,
      originalSize,
      compressedSize: originalSize,
    };
  } catch (err) {
    console.warn('[Audio] Compression failed, falling back to original file:', err instanceof Error ? err.message : err);
    await fs.unlink(outputPath).catch(() => {});
    return {
      audioPath: inputPath,
      mimeType: getMimeTypeFromExt(inputPath),
      isCompressed: false,
      originalSize,
      compressedSize: originalSize,
    };
  }
}
