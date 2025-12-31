import { put, del, list } from "@vercel/blob";

export interface UploadResult {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
}

/**
 * Upload a file to blob storage
 */
export async function uploadFile(
  file: File | Buffer,
  pathname: string,
  contentType?: string
): Promise<UploadResult> {
  const blob = await put(pathname, file, {
    access: "public",
    contentType,
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
    contentType: blob.contentType,
    size: file instanceof File ? file.size : file.length,
  };
}

/**
 * Upload a PDF file
 */
export async function uploadPDF(file: File, userId: string): Promise<string> {
  const filename = `pdfs/${userId}/${Date.now()}-${file.name}`;
  const result = await uploadFile(file, filename, "application/pdf");
  return result.url;
}

/**
 * Upload an audio file
 */
export async function uploadAudio(
  buffer: Buffer,
  videoId: string
): Promise<string> {
  const filename = `audio/${videoId}.mp3`;
  const result = await uploadFile(buffer, filename, "audio/mpeg");
  return result.url;
}

/**
 * Upload a video file
 */
export async function uploadVideo(
  buffer: Buffer,
  videoId: string
): Promise<string> {
  const filename = `videos/${videoId}.mp4`;
  const result = await uploadFile(buffer, filename, "video/mp4");
  return result.url;
}

/**
 * Upload a thumbnail image
 */
export async function uploadThumbnail(
  buffer: Buffer,
  videoId: string,
  format: "png" | "jpg" | "svg" = "png"
): Promise<string> {
  const contentTypes = {
    png: "image/png",
    jpg: "image/jpeg",
    svg: "image/svg+xml",
  };
  const filename = `thumbnails/${videoId}.${format}`;
  const result = await uploadFile(buffer, filename, contentTypes[format]);
  return result.url;
}

/**
 * Delete a file from blob storage
 */
export async function deleteFile(url: string): Promise<void> {
  await del(url);
}

/**
 * List files in a directory
 */
export async function listFiles(prefix: string) {
  const result = await list({ prefix });
  return result.blobs;
}

/**
 * Get file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
