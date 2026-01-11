/**
 * FFmpeg.wasm Video Generator - Enhanced with Professional Effects
 * Compiles AI-generated images and audio into a real MP4 video file
 *
 * Features:
 * - Ken Burns effect (zoom/pan animation on images)
 * - Smooth crossfade transitions between segments
 * - Text title overlays
 * - Progress bar overlay
 * - Professional video quality
 *
 * Uses WebAssembly to run FFmpeg directly in the browser - 100% FREE
 */

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export interface VideoSegment {
  title: string;
  narration: string;
  visualDescription?: string;
  duration: number;
  imageUrl?: string;
}

export interface VideoGenerationInput {
  segments: VideoSegment[];
  audioUrl?: string;
  totalDuration: number;
  style?: VideoStyle;
}

export interface VideoStyle {
  kenBurns?: boolean;           // Enable zoom/pan animation (default: true)
  transitions?: "crossfade" | "slide" | "none";  // Transition type (default: crossfade)
  transitionDuration?: number;  // Transition duration in seconds (default: 0.5)
  showTitles?: boolean;         // Show segment titles (default: true)
  showProgressBar?: boolean;    // Show bottom progress bar (default: true)
  resolution?: "720p" | "1080p"; // Output resolution (default: 720p)
}

export interface VideoGenerationProgress {
  stage: "loading" | "preparing" | "processing" | "encoding" | "finalizing" | "complete" | "error";
  progress: number; // 0-100
  message: string;
}

export interface VideoGenerationResult {
  videoUrl: string; // Blob URL for the generated video
  videoBlob: Blob;
  duration: number;
}

// Singleton FFmpeg instance
let ffmpeg: FFmpeg | null = null;
let isLoaded = false;

// Resolution presets
const RESOLUTIONS = {
  "720p": { width: 1280, height: 720 },
  "1080p": { width: 1920, height: 1080 },
};

// Ken Burns effect patterns (alternating zoom directions for variety)
const KEN_BURNS_PATTERNS = [
  { startScale: 1.0, endScale: 1.15, startX: 0, startY: 0, endX: -0.05, endY: -0.05 },  // Zoom in, drift up-left
  { startScale: 1.15, endScale: 1.0, startX: -0.05, startY: -0.05, endX: 0, endY: 0 },  // Zoom out, drift down-right
  { startScale: 1.0, endScale: 1.12, startX: 0, startY: 0, endX: 0.05, endY: -0.03 },   // Zoom in, drift up-right
  { startScale: 1.12, endScale: 1.0, startX: 0.05, startY: -0.03, endX: 0, endY: 0 },   // Zoom out, drift center
  { startScale: 1.0, endScale: 1.1, startX: 0, startY: 0, endX: -0.03, endY: 0.03 },    // Zoom in, drift down-left
];

/**
 * Initialize FFmpeg.wasm
 * Must be called before any video generation
 */
export async function initFFmpeg(
  onProgress?: (progress: VideoGenerationProgress) => void
): Promise<boolean> {
  if (isLoaded && ffmpeg) {
    return true;
  }

  try {
    onProgress?.({
      stage: "loading",
      progress: 0,
      message: "Loading video encoder...",
    });

    ffmpeg = new FFmpeg();

    // Log FFmpeg output for debugging
    ffmpeg.on("log", ({ message }) => {
      console.log("[FFmpeg]", message);
    });

    // Track encoding progress
    ffmpeg.on("progress", ({ progress }) => {
      const percent = Math.round(progress * 100);
      onProgress?.({
        stage: "encoding",
        progress: Math.min(90, 30 + percent * 0.6), // Scale to 30-90%
        message: `Encoding video... ${percent}%`,
      });
    });

    // Load FFmpeg core from CDN with fallback options
    // Try jsdelivr first (better CORS support), then unpkg as fallback
    const cdnOptions = [
      "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd",
      "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd",
    ];

    let loadError: Error | null = null;
    for (const baseURL of cdnOptions) {
      try {
        console.log(`[FFmpeg] Trying to load from: ${baseURL}`);
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        });
        console.log(`[FFmpeg] Successfully loaded from: ${baseURL}`);
        loadError = null;
        break;
      } catch (err) {
        console.warn(`[FFmpeg] Failed to load from ${baseURL}:`, err);
        loadError = err instanceof Error ? err : new Error(String(err));
      }
    }

    if (loadError) {
      throw loadError;
    }

    isLoaded = true;
    onProgress?.({
      stage: "loading",
      progress: 15,
      message: "Video encoder ready",
    });

    return true;
  } catch (error) {
    console.error("Failed to load FFmpeg:", error);
    onProgress?.({
      stage: "error",
      progress: 0,
      message: `Failed to load video encoder: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
    return false;
  }
}

/**
 * Convert base64 data URL to Uint8Array
 */
function base64ToUint8Array(base64DataUrl: string): Uint8Array {
  // Remove data URL prefix
  const base64 = base64DataUrl.split(",")[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convert SVG to PNG using Canvas
 * FFmpeg.wasm doesn't handle SVG well, so we convert to PNG first
 */
async function svgToPng(svgDataUrl: string, width: number = 1024, height: number = 576): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Failed to convert SVG to PNG"));
          return;
        }
        blob.arrayBuffer().then((buffer) => {
          resolve(new Uint8Array(buffer));
        }).catch(reject);
      }, "image/png");
    };
    img.onerror = () => reject(new Error("Failed to load SVG image"));
    img.src = svgDataUrl;
  });
}

/**
 * Generate Ken Burns filter expression for a segment
 */
function getKenBurnsFilter(
  segmentIndex: number,
  duration: number,
  width: number,
  height: number
): string {
  const pattern = KEN_BURNS_PATTERNS[segmentIndex % KEN_BURNS_PATTERNS.length];
  const fps = 30;
  const totalFrames = duration * fps;

  // Calculate zoom and pan expressions using FFmpeg's expression syntax
  // zoompan filter: z=zoom, x=pan_x, y=pan_y, d=duration_frames, s=output_size
  const zoomExpr = `'${pattern.startScale}+(${pattern.endScale - pattern.startScale})*on/${totalFrames}'`;
  const xExpr = `'iw*${pattern.startX}+(${pattern.endX - pattern.startX})*iw*on/${totalFrames}'`;
  const yExpr = `'ih*${pattern.startY}+(${pattern.endY - pattern.startY})*ih*on/${totalFrames}'`;

  return `zoompan=z=${zoomExpr}:x=${xExpr}:y=${yExpr}:d=${totalFrames}:s=${width}x${height}:fps=${fps}`;
}

/**
 * Escape text for FFmpeg drawtext filter
 */
function escapeTextForFFmpeg(text: string): string {
  return text
    .replace(/\\/g, "\\\\\\\\")
    .replace(/'/g, "\\'")
    .replace(/:/g, "\\:")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/%/g, "\\%");
}

/**
 * Generate a real MP4 video from AI-generated images and audio
 * Enhanced with Ken Burns effects, transitions, and overlays
 */
export async function generateVideo(
  input: VideoGenerationInput,
  onProgress?: (progress: VideoGenerationProgress) => void
): Promise<VideoGenerationResult> {
  // Initialize FFmpeg if not already loaded
  if (!isLoaded || !ffmpeg) {
    const loaded = await initFFmpeg(onProgress);
    if (!loaded || !ffmpeg) {
      throw new Error("Failed to initialize video encoder");
    }
  }

  // Default style options
  const style: VideoStyle = {
    kenBurns: true,
    transitions: "crossfade",
    transitionDuration: 0.5,
    showTitles: true,
    showProgressBar: true,
    resolution: "720p",
    ...input.style,
  };

  const { width, height } = RESOLUTIONS[style.resolution || "720p"];

  try {
    onProgress?.({
      stage: "preparing",
      progress: 15,
      message: "Preparing images...",
    });

    // Filter segments that have images
    const validSegments = input.segments.filter(
      (s) => s.imageUrl && s.imageUrl.length > 0
    );

    if (validSegments.length === 0) {
      throw new Error("No valid images found for video generation");
    }

    // Write images to FFmpeg virtual filesystem
    const imagePaths: string[] = [];
    for (let i = 0; i < validSegments.length; i++) {
      const segment = validSegments[i];
      const imagePath = `image_${i.toString().padStart(3, "0")}.png`;

      try {
        if (segment.imageUrl?.startsWith("data:image/svg")) {
          // SVG data URL - convert to PNG first (FFmpeg doesn't handle SVG well)
          console.log(`[FFmpeg] Converting SVG image ${i + 1}/${validSegments.length} to PNG`);
          const imageData = await svgToPng(segment.imageUrl, width, height);
          console.log(`[FFmpeg] Converted SVG ${i + 1} to PNG: ${imageData.length} bytes`);
          await ffmpeg.writeFile(imagePath, imageData);
        } else if (segment.imageUrl?.startsWith("data:")) {
          // Base64 data URL (PNG/JPEG) - convert to binary
          console.log(`[FFmpeg] Processing base64 image ${i + 1}/${validSegments.length}`);
          const imageData = base64ToUint8Array(segment.imageUrl);
          if (imageData.length === 0) {
            throw new Error(`Image ${i + 1} has empty data`);
          }
          console.log(`[FFmpeg] Image ${i + 1} size: ${imageData.length} bytes`);
          await ffmpeg.writeFile(imagePath, imageData);
        } else if (segment.imageUrl) {
          // Remote URL - fetch and write
          console.log(`[FFmpeg] Fetching remote image ${i + 1}: ${segment.imageUrl.substring(0, 50)}...`);
          const imageData = await fetchFile(segment.imageUrl);
          await ffmpeg.writeFile(imagePath, imageData);
        } else {
          throw new Error(`Image ${i + 1} has no valid URL`);
        }
      } catch (imageError) {
        console.error(`[FFmpeg] Failed to process image ${i + 1}:`, imageError);
        throw new Error(`Failed to load image ${i + 1}: ${imageError instanceof Error ? imageError.message : "Unknown error"}`);
      }

      imagePaths.push(imagePath);

      onProgress?.({
        stage: "preparing",
        progress: 15 + (i / validSegments.length) * 10,
        message: `Preparing image ${i + 1}/${validSegments.length}...`,
      });
    }

    // Write audio if available
    let hasAudio = false;
    if (input.audioUrl && input.audioUrl.length > 0) {
      try {
        onProgress?.({
          stage: "preparing",
          progress: 25,
          message: "Preparing audio...",
        });

        if (input.audioUrl.startsWith("data:")) {
          const audioData = base64ToUint8Array(input.audioUrl);
          await ffmpeg.writeFile("audio.mp3", audioData);
          hasAudio = true;
        } else {
          const audioData = await fetchFile(input.audioUrl);
          await ffmpeg.writeFile("audio.mp3", audioData);
          hasAudio = true;
        }
      } catch (error) {
        console.warn("Failed to load audio, proceeding without audio:", error);
      }
    }

    onProgress?.({
      stage: "processing",
      progress: 28,
      message: "Applying video effects...",
    });

    // ============================================================
    // Strategy: Process each segment individually, then concatenate
    // This allows per-segment Ken Burns and title overlays
    // ============================================================

    const segmentVideos: string[] = [];
    const transitionDuration = style.transitions !== "none" ? (style.transitionDuration || 0.5) : 0;

    for (let i = 0; i < validSegments.length; i++) {
      const segment = validSegments[i];
      const segmentDuration = segment.duration || 5;
      const inputPath = imagePaths[i];
      const outputPath = `segment_${i.toString().padStart(3, "0")}.mp4`;

      // Build filter chain for this segment
      const filters: string[] = [];

      // 1. Scale image to fit output resolution with padding
      filters.push(`scale=${width}:${height}:force_original_aspect_ratio=decrease`);
      filters.push(`pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black`);

      // 2. Ken Burns effect (zoom/pan animation)
      if (style.kenBurns) {
        const kenBurnsFilter = getKenBurnsFilter(i, segmentDuration, width, height);

        // For Ken Burns, we need to use zoompan which produces frames
        // We'll process this separately
        const kbArgs = [
          "-loop", "1",
          "-i", inputPath,
          "-vf", `scale=${width * 1.2}:${height * 1.2}:force_original_aspect_ratio=increase,${kenBurnsFilter}`,
          "-t", segmentDuration.toString(),
          "-c:v", "libx264",
          "-preset", "ultrafast",
          "-pix_fmt", "yuv420p",
          "-an",
          `kb_${i}.mp4`,
        ];

        await ffmpeg.exec(kbArgs);

        // Now add title overlay to the Ken Burns output
        const titleFilters: string[] = [];

        if (style.showTitles && segment.title) {
          const escapedTitle = escapeTextForFFmpeg(segment.title);
          // Fade in title for first 0.5s, fade out for last 0.5s
          titleFilters.push(
            `drawtext=text='${escapedTitle}':fontsize=42:fontcolor=white:` +
            `x=(w-text_w)/2:y=h-80:` +
            `shadowcolor=black@0.7:shadowx=2:shadowy=2:` +
            `enable='between(t,0.3,${segmentDuration - 0.3})'`
          );
        }

        if (style.showProgressBar) {
          // Calculate progress at this segment
          let elapsedBefore = 0;
          for (let j = 0; j < i; j++) {
            elapsedBefore += validSegments[j].duration || 5;
          }
          const totalDur = input.totalDuration || validSegments.reduce((sum, s) => sum + (s.duration || 5), 0);
          const progressStart = elapsedBefore / totalDur;
          const progressEnd = (elapsedBefore + segmentDuration) / totalDur;

          // Animated progress bar
          titleFilters.push(
            `drawbox=x=40:y=h-20:w=(w-80)*${progressStart}+(w-80)*${(progressEnd - progressStart)}*t/${segmentDuration}:h=4:color=white@0.8:t=fill`
          );
          // Background bar
          titleFilters.push(
            `drawbox=x=40:y=h-20:w=w-80:h=4:color=white@0.3:t=fill`
          );
        }

        if (titleFilters.length > 0) {
          await ffmpeg.exec([
            "-i", `kb_${i}.mp4`,
            "-vf", titleFilters.join(","),
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-pix_fmt", "yuv420p",
            "-an",
            outputPath,
          ]);
          await ffmpeg.deleteFile(`kb_${i}.mp4`);
        } else {
          await ffmpeg.exec([
            "-i", `kb_${i}.mp4`,
            "-c", "copy",
            outputPath,
          ]);
          await ffmpeg.deleteFile(`kb_${i}.mp4`);
        }
      } else {
        // No Ken Burns - just static image with effects
        const filterChain = [
          `scale=${width}:${height}:force_original_aspect_ratio=decrease`,
          `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black`,
        ];

        if (style.showTitles && segment.title) {
          const escapedTitle = escapeTextForFFmpeg(segment.title);
          filterChain.push(
            `drawtext=text='${escapedTitle}':fontsize=42:fontcolor=white:` +
            `x=(w-text_w)/2:y=h-80:shadowcolor=black@0.7:shadowx=2:shadowy=2`
          );
        }

        await ffmpeg.exec([
          "-loop", "1",
          "-i", inputPath,
          "-vf", filterChain.join(","),
          "-t", segmentDuration.toString(),
          "-c:v", "libx264",
          "-preset", "ultrafast",
          "-pix_fmt", "yuv420p",
          "-r", "30",
          "-an",
          outputPath,
        ]);
      }

      segmentVideos.push(outputPath);

      onProgress?.({
        stage: "processing",
        progress: 28 + ((i + 1) / validSegments.length) * 25,
        message: `Processing segment ${i + 1}/${validSegments.length}...`,
      });
    }

    onProgress?.({
      stage: "encoding",
      progress: 55,
      message: "Combining segments...",
    });

    // ============================================================
    // Concatenate segments with transitions
    // ============================================================

    let finalVideoPath = "final_video.mp4";

    if (style.transitions === "crossfade" && segmentVideos.length > 1) {
      // Use xfade filter for crossfade transitions
      // Build complex filter graph for crossfade between all segments

      // For crossfade, we need to process sequentially
      // Start with first two, then add third, etc.
      let currentVideo = segmentVideos[0];

      for (let i = 1; i < segmentVideos.length; i++) {
        const nextVideo = segmentVideos[i];
        const outputVideo = i === segmentVideos.length - 1 ? "combined.mp4" : `xfade_${i}.mp4`;

        // Get duration of current video for offset calculation
        // Offset = duration of first video - transition duration
        const prevDuration = validSegments[i - 1].duration || 5;
        const offset = Math.max(0, prevDuration - transitionDuration);

        await ffmpeg.exec([
          "-i", currentVideo,
          "-i", nextVideo,
          "-filter_complex",
          `[0:v][1:v]xfade=transition=fade:duration=${transitionDuration}:offset=${offset}[v]`,
          "-map", "[v]",
          "-c:v", "libx264",
          "-preset", "fast",
          "-pix_fmt", "yuv420p",
          "-an",
          outputVideo,
        ]);

        // Clean up intermediate files
        if (i > 1) {
          await ffmpeg.deleteFile(currentVideo);
        }

        currentVideo = outputVideo;
      }

      finalVideoPath = "combined.mp4";
    } else {
      // Simple concatenation without transitions
      let concatContent = "";
      for (const segmentPath of segmentVideos) {
        concatContent += `file '${segmentPath}'\n`;
      }
      await ffmpeg.writeFile("segments.txt", concatContent);

      await ffmpeg.exec([
        "-f", "concat",
        "-safe", "0",
        "-i", "segments.txt",
        "-c", "copy",
        "-an",
        "combined.mp4",
      ]);

      finalVideoPath = "combined.mp4";
      await ffmpeg.deleteFile("segments.txt");
    }

    onProgress?.({
      stage: "encoding",
      progress: 75,
      message: "Adding audio track...",
    });

    // ============================================================
    // Add audio track to final video
    // ============================================================

    if (hasAudio) {
      await ffmpeg.exec([
        "-i", finalVideoPath,
        "-i", "audio.mp3",
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "128k",
        "-shortest",
        "-movflags", "+faststart",
        "output.mp4",
      ]);
      await ffmpeg.deleteFile(finalVideoPath);
    } else {
      // No audio - just rename
      await ffmpeg.exec([
        "-i", finalVideoPath,
        "-c", "copy",
        "-movflags", "+faststart",
        "output.mp4",
      ]);
      await ffmpeg.deleteFile(finalVideoPath);
    }

    onProgress?.({
      stage: "finalizing",
      progress: 95,
      message: "Finalizing video...",
    });

    // Read the output file
    const outputData = await ffmpeg.readFile("output.mp4");

    // Convert FileData to ArrayBuffer for Blob compatibility
    let videoBlob: Blob;
    if (outputData instanceof Uint8Array) {
      // Copy to a new ArrayBuffer to avoid SharedArrayBuffer issues
      const buffer = new ArrayBuffer(outputData.byteLength);
      new Uint8Array(buffer).set(outputData);
      videoBlob = new Blob([buffer], { type: "video/mp4" });
    } else if (typeof outputData === "string") {
      videoBlob = new Blob([outputData], { type: "video/mp4" });
    } else {
      videoBlob = new Blob([outputData as BlobPart], { type: "video/mp4" });
    }
    const videoUrl = URL.createObjectURL(videoBlob);

    // Cleanup virtual filesystem
    const filesToDelete = [
      ...imagePaths,
      ...segmentVideos,
      "output.mp4",
      "audio.mp3",
    ];

    for (const file of filesToDelete) {
      try {
        await ffmpeg.deleteFile(file);
      } catch {
        // Ignore cleanup errors
      }
    }

    onProgress?.({
      stage: "complete",
      progress: 100,
      message: "Video ready!",
    });

    return {
      videoUrl,
      videoBlob,
      duration: input.totalDuration,
    };
  } catch (error) {
    console.error("Video generation failed:", error);
    onProgress?.({
      stage: "error",
      progress: 0,
      message: `Video generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
    throw error;
  }
}

/**
 * Generate video with simpler approach (faster, less memory)
 * Uses concat with basic transitions instead of complex filters
 */
export async function generateVideoSimple(
  input: VideoGenerationInput,
  onProgress?: (progress: VideoGenerationProgress) => void
): Promise<VideoGenerationResult> {
  // Initialize FFmpeg if not already loaded
  if (!isLoaded || !ffmpeg) {
    const loaded = await initFFmpeg(onProgress);
    if (!loaded || !ffmpeg) {
      throw new Error("Failed to initialize video encoder");
    }
  }

  try {
    onProgress?.({
      stage: "preparing",
      progress: 20,
      message: "Preparing images...",
    });

    // Filter segments that have images
    const validSegments = input.segments.filter(
      (s) => s.imageUrl && s.imageUrl.length > 0
    );

    if (validSegments.length === 0) {
      throw new Error("No valid images found for video generation");
    }

    // Write images to FFmpeg virtual filesystem
    const imagePaths: string[] = [];
    for (let i = 0; i < validSegments.length; i++) {
      const segment = validSegments[i];
      const imagePath = `image_${i.toString().padStart(3, "0")}.png`;

      try {
        if (segment.imageUrl?.startsWith("data:image/svg")) {
          // SVG - convert to PNG first
          console.log(`[FFmpeg Simple] Converting SVG image ${i + 1} to PNG`);
          const imageData = await svgToPng(segment.imageUrl, 1280, 720);
          await ffmpeg.writeFile(imagePath, imageData);
        } else if (segment.imageUrl?.startsWith("data:")) {
          const imageData = base64ToUint8Array(segment.imageUrl);
          await ffmpeg.writeFile(imagePath, imageData);
        } else if (segment.imageUrl) {
          const imageData = await fetchFile(segment.imageUrl);
          await ffmpeg.writeFile(imagePath, imageData);
        }
      } catch (error) {
        console.error(`[FFmpeg Simple] Failed to process image ${i + 1}:`, error);
        throw new Error(`Failed to load image ${i + 1}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }

      imagePaths.push(imagePath);
    }

    // Create concat file
    let concatContent = "";
    for (let i = 0; i < validSegments.length; i++) {
      const segment = validSegments[i];
      const duration = segment.duration || 5;
      concatContent += `file 'image_${i.toString().padStart(3, "0")}.png'\n`;
      concatContent += `duration ${duration}\n`;
    }
    if (validSegments.length > 0) {
      concatContent += `file 'image_${(validSegments.length - 1).toString().padStart(3, "0")}.png'\n`;
    }
    await ffmpeg.writeFile("concat.txt", concatContent);

    // Write audio if available
    let hasAudio = false;
    if (input.audioUrl && input.audioUrl.length > 0) {
      try {
        if (input.audioUrl.startsWith("data:")) {
          const audioData = base64ToUint8Array(input.audioUrl);
          await ffmpeg.writeFile("audio.mp3", audioData);
          hasAudio = true;
        } else {
          const audioData = await fetchFile(input.audioUrl);
          await ffmpeg.writeFile("audio.mp3", audioData);
          hasAudio = true;
        }
      } catch (error) {
        console.warn("Failed to load audio:", error);
      }
    }

    onProgress?.({
      stage: "encoding",
      progress: 30,
      message: "Encoding video...",
    });

    // Build FFmpeg command
    const ffmpegArgs = [
      "-f", "concat",
      "-safe", "0",
      "-i", "concat.txt",
    ];

    if (hasAudio) {
      ffmpegArgs.push("-i", "audio.mp3");
    }

    ffmpegArgs.push(
      "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black",
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "23",
      "-pix_fmt", "yuv420p",
    );

    if (hasAudio) {
      ffmpegArgs.push(
        "-c:a", "aac",
        "-b:a", "128k",
        "-shortest",
      );
    }

    ffmpegArgs.push(
      "-movflags", "+faststart",
      "output.mp4"
    );

    await ffmpeg.exec(ffmpegArgs);

    onProgress?.({
      stage: "finalizing",
      progress: 95,
      message: "Finalizing video...",
    });

    // Read output
    const outputData = await ffmpeg.readFile("output.mp4");
    let videoBlob: Blob;
    if (outputData instanceof Uint8Array) {
      const buffer = new ArrayBuffer(outputData.byteLength);
      new Uint8Array(buffer).set(outputData);
      videoBlob = new Blob([buffer], { type: "video/mp4" });
    } else {
      videoBlob = new Blob([outputData as BlobPart], { type: "video/mp4" });
    }
    const videoUrl = URL.createObjectURL(videoBlob);

    // Cleanup
    for (const imagePath of imagePaths) {
      try { await ffmpeg.deleteFile(imagePath); } catch {}
    }
    try {
      await ffmpeg.deleteFile("concat.txt");
      await ffmpeg.deleteFile("output.mp4");
      if (hasAudio) await ffmpeg.deleteFile("audio.mp3");
    } catch {}

    onProgress?.({
      stage: "complete",
      progress: 100,
      message: "Video ready!",
    });

    return {
      videoUrl,
      videoBlob,
      duration: input.totalDuration,
    };
  } catch (error) {
    console.error("Video generation failed:", error);
    onProgress?.({
      stage: "error",
      progress: 0,
      message: `Video generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
    throw error;
  }
}

/**
 * Release FFmpeg resources
 */
export function terminateFFmpeg(): void {
  if (ffmpeg) {
    ffmpeg.terminate();
    ffmpeg = null;
    isLoaded = false;
  }
}

/**
 * Check if FFmpeg is supported in the current browser
 * Requires SharedArrayBuffer which needs specific CORS headers
 */
export function isFFmpegSupported(): boolean {
  // Check for SharedArrayBuffer support (required for FFmpeg.wasm)
  if (typeof SharedArrayBuffer === "undefined") {
    console.warn(
      "SharedArrayBuffer not available. Video generation requires CORS headers: " +
        "Cross-Origin-Opener-Policy: same-origin and " +
        "Cross-Origin-Embedder-Policy: require-corp"
    );
    return false;
  }
  return true;
}
