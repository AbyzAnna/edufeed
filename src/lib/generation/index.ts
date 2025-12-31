// Re-export all generation utilities
export * from "./parser";
export * from "./summarizer";
export * from "./tts";
export * from "./slideshow";
export * from "./wan";

import prisma from "@/lib/prisma";
import { parsePDF, parseURL, parseText } from "./parser";
import { generateVideoScript, generateSummary, extractKeyConcepts } from "./summarizer";
import { generateAndUploadSpeech, estimateAudioDuration } from "./tts";
import {
  generateSlidesFromScript,
  createSlideshowConfig,
  generateThumbnail,
  calculateTotalDuration,
} from "./slideshow";
import { generateWanVideo, createEducationalVideoPrompt } from "./wan";

export interface GenerationResult {
  success: boolean;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  error?: string;
}

/**
 * Main video generation pipeline
 */
export async function generateVideo(
  videoId: string,
  sourceId: string,
  generationType: "SLIDESHOW" | "AI_VIDEO" | "AVATAR" | "WAN_VIDEO"
): Promise<GenerationResult> {
  try {
    // Update status to processing
    await prisma.video.update({
      where: { id: videoId },
      data: { status: "PROCESSING" },
    });

    // Get source content
    const source = await prisma.source.findUnique({
      where: { id: sourceId },
    });

    if (!source) {
      throw new Error("Source not found");
    }

    // Get content based on source type
    let content = source.content || "";

    if (!content && source.type === "URL" && source.originalUrl) {
      const parsed = await parseURL(source.originalUrl);
      content = parsed.content;

      // Update source with extracted content
      await prisma.source.update({
        where: { id: sourceId },
        data: { content },
      });
    }

    if (!content) {
      throw new Error("No content available for video generation");
    }

    // Generate video script
    const script = await generateVideoScript(content, source.title, 60);

    // Generate based on type
    let result: GenerationResult;

    switch (generationType) {
      case "SLIDESHOW":
        result = await generateSlideshowVideo(videoId, script);
        break;
      case "AVATAR":
        // For now, fall back to slideshow
        // In production, integrate with HeyGen or D-ID
        result = await generateSlideshowVideo(videoId, script);
        break;
      case "AI_VIDEO":
        // For now, fall back to slideshow
        // In production, integrate with Runway or Pika
        result = await generateSlideshowVideo(videoId, script);
        break;
      case "WAN_VIDEO":
        result = await generateWanAIVideo(videoId, source.title, script);
        break;
      default:
        result = await generateSlideshowVideo(videoId, script);
    }

    // Update video record
    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: result.success ? "COMPLETED" : "FAILED",
        videoUrl: result.videoUrl,
        thumbnailUrl: result.thumbnailUrl,
        duration: result.duration,
        script: script.fullScript,
        description: await generateSummary(content, 200),
      },
    });

    return result;
  } catch (error) {
    console.error("Video generation error:", error);

    await prisma.video.update({
      where: { id: videoId },
      data: { status: "FAILED" },
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate slideshow-style video
 */
async function generateSlideshowVideo(
  videoId: string,
  script: import("./summarizer").VideoScript
): Promise<GenerationResult> {
  try {
    // Generate slides
    const slides = generateSlidesFromScript(script);
    const config = createSlideshowConfig(slides);

    // Generate thumbnail from first slide
    const thumbnailUrl = await generateThumbnail(slides[0], videoId);

    // Generate audio narration
    let audioUrl: string | undefined;
    try {
      audioUrl = await generateAndUploadSpeech(
        script.fullScript,
        `narration-${videoId}`,
        { voice: "nova", speed: 1.0 }
      );
    } catch (error) {
      console.error("TTS generation failed:", error);
      // Continue without audio
    }

    // Calculate duration
    const duration = audioUrl
      ? estimateAudioDuration(script.fullScript)
      : calculateTotalDuration(slides);

    // In a full implementation, you would:
    // 1. Use Remotion or FFmpeg to render the actual video
    // 2. Combine slides with audio
    // 3. Upload the final video to blob storage

    // For now, we'll store the config and return a placeholder
    // The frontend can render the slideshow dynamically

    return {
      success: true,
      videoUrl: audioUrl, // Using audio URL as placeholder
      thumbnailUrl,
      duration,
    };
  } catch (error) {
    console.error("Slideshow generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Slideshow generation failed",
    };
  }
}

/**
 * Generate AI video using WAN 2.1 model
 */
async function generateWanAIVideo(
  videoId: string,
  title: string,
  script: import("./summarizer").VideoScript
): Promise<GenerationResult> {
  try {
    console.log(`[WAN] Starting AI video generation for: ${title}`);

    // Use key points from the script for the video prompt
    const keyPoints = script.mainPoints.length > 0
      ? script.mainPoints
      : [script.hook, script.conclusion].filter(Boolean);

    // Generate the AI video with WAN 2.1
    const { videoUrl, duration } = await generateWanVideo(
      videoId,
      title,
      keyPoints,
      {
        resolution: "480p", // Use 480p for faster generation
        style: "animated", // Educational animated style
      }
    );

    // Generate thumbnail from the video title
    const thumbnailUrl = await generateThumbnail(
      {
        text: script.title || title,
        duration: 3,
        backgroundColor: "#1a1a2e",
        textColor: "#e94560",
        fontSize: "large",
        animation: "fade",
      },
      videoId
    );

    console.log(`[WAN] Video generated successfully: ${videoUrl}`);

    return {
      success: true,
      videoUrl,
      thumbnailUrl,
      duration,
    };
  } catch (error) {
    console.error("[WAN] Video generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "WAN video generation failed",
    };
  }
}
