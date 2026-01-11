// Re-export all generation utilities
export * from "./parser";
export * from "./summarizer";
export * from "./tts";
export * from "./slideshow";
export * from "./wan";

import prisma from "@/lib/prisma";
import { parsePDF, parseURL, parseText } from "./parser";
import { generateVideoScript, generateSummary, extractKeyConcepts, VideoScript } from "./summarizer";
import {
  generateAndUploadSpeech,
  generateAndUploadLongSpeech,
  estimateAudioDuration,
  selectVoiceForContent,
  Voice,
} from "./tts";
import {
  generateSlidesFromScript,
  createSlideshowConfig,
  generateThumbnail,
  calculateTotalDuration,
  SlideData,
} from "./slideshow";
import { generateWanVideo, createEducationalVideoPrompt } from "./wan";

export interface GenerationResult {
  success: boolean;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  error?: string;
  // Additional metadata
  scriptData?: {
    title: string;
    fullScript: string;
    segments: number;
  };
  audioUrl?: string;
}

export interface GenerationOptions {
  targetDuration?: number; // seconds (default: 90)
  aspectRatio?: "16:9" | "9:16" | "1:1";
  voice?: Voice;
  quality?: "fast" | "enhanced"; // fast = tts-1, enhanced = tts-1-hd
  includeIntro?: boolean;
  includeOutro?: boolean;
  brandColor?: string;
}

const DEFAULT_OPTIONS: GenerationOptions = {
  targetDuration: 90,
  aspectRatio: "16:9",
  quality: "enhanced",
  includeIntro: true,
  includeOutro: true,
};

/**
 * Main video generation pipeline - Professional YouTube quality
 */
export async function generateVideo(
  videoId: string,
  sourceId: string,
  generationType: "SLIDESHOW" | "AI_VIDEO" | "AVATAR" | "WAN_VIDEO",
  options: GenerationOptions = {}
): Promise<GenerationResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    console.log(`[Generation] Starting video generation for ${videoId}`);
    console.log(`[Generation] Type: ${generationType}, Duration: ${opts.targetDuration}s`);

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
      console.log(`[Generation] Extracting content from URL: ${source.originalUrl}`);
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

    console.log(`[Generation] Content length: ${content.length} characters`);

    // Generate professional video script
    console.log(`[Generation] Generating professional script...`);
    const script = await generateVideoScript(
      content,
      source.title,
      opts.targetDuration || 90
    );

    console.log(`[Generation] Script generated with ${script.segments?.length || 0} segments`);
    console.log(`[Generation] Title: ${script.title}`);

    // Generate based on type
    let result: GenerationResult;

    switch (generationType) {
      case "SLIDESHOW":
        result = await generateProfessionalSlideshowVideo(videoId, script, opts);
        break;
      case "AVATAR":
        // For now, fall back to slideshow with avatar placeholder
        // In production, integrate with HeyGen or D-ID
        result = await generateProfessionalSlideshowVideo(videoId, script, opts);
        break;
      case "AI_VIDEO":
        // For now, fall back to slideshow
        // In production, integrate with Runway or Pika
        result = await generateProfessionalSlideshowVideo(videoId, script, opts);
        break;
      case "WAN_VIDEO":
        result = await generateWanAIVideo(videoId, source.title, script);
        break;
      default:
        result = await generateProfessionalSlideshowVideo(videoId, script, opts);
    }

    // Generate professional description
    const description = await generateSummary(content, 200);

    // Update video record with all metadata
    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: result.success ? "COMPLETED" : "FAILED",
        videoUrl: result.videoUrl,
        thumbnailUrl: result.thumbnailUrl,
        duration: result.duration,
        script: script.fullScript,
        description,
      },
    });

    console.log(`[Generation] Video generation ${result.success ? "completed" : "failed"}`);
    return result;
  } catch (error) {
    console.error("[Generation] Video generation error:", error);

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
 * Generate professional slideshow-style video with TTS narration
 */
async function generateProfessionalSlideshowVideo(
  videoId: string,
  script: VideoScript,
  options: GenerationOptions
): Promise<GenerationResult> {
  try {
    console.log(`[Slideshow] Starting professional slideshow generation`);

    // Select appropriate voice based on content
    const voice = options.voice || selectVoiceForContent(
      script.metadata?.category || "education",
      script.tone || "educational"
    );
    console.log(`[Slideshow] Selected voice: ${voice}`);

    // Generate slides from script
    const slides = generateSlidesFromScript(script, {
      category: script.metadata?.category,
      brandColor: options.brandColor,
    });
    console.log(`[Slideshow] Generated ${slides.length} slides`);

    const config = createSlideshowConfig(slides, undefined, {
      aspectRatio: options.aspectRatio,
      brandColor: options.brandColor,
    });

    // Generate thumbnail from intro slide
    const introSlide = slides.find(s => s.type === "intro") || slides[0];
    const thumbnailUrl = await generateThumbnail(introSlide, videoId, {
      width: config.width,
      height: config.height,
    });
    console.log(`[Slideshow] Generated thumbnail: ${thumbnailUrl}`);

    // Generate professional TTS narration
    let audioUrl: string | undefined;
    let actualDuration: number;

    try {
      console.log(`[Slideshow] Generating TTS narration...`);
      audioUrl = await generateAndUploadLongSpeech(
        script.fullScript,
        `narration-${videoId}`,
        {
          voice,
          speed: 1.0,
          model: options.quality === "enhanced" ? "tts-1-hd" : "tts-1",
        }
      );

      if (audioUrl) {
        console.log(`[Slideshow] TTS narration generated: ${audioUrl}`);
        actualDuration = estimateAudioDuration(script.fullScript);
      } else {
        console.warn(`[Slideshow] TTS generation returned no audio`);
        actualDuration = calculateTotalDuration(slides);
      }
    } catch (error) {
      console.error("[Slideshow] TTS generation failed:", error);
      actualDuration = calculateTotalDuration(slides);
    }

    // Store slideshow config for client-side rendering
    // The actual video compilation happens in the browser using FFmpeg.wasm
    // Note: slideshowData is returned in the result and stored in the video's script field as JSON
    const slideshowData = {
      config,
      slides: slides.map(slide => ({
        ...slide,
        svg: undefined, // Don't include SVG in stored data
      })),
      audioUrl,
      duration: actualDuration,
    };

    // Log slideshow data for debugging (storage is handled by the caller updating the video record)
    console.log(`[Slideshow] Generated ${slideshowData.slides.length} slides, duration: ${actualDuration}s`);

    return {
      success: true,
      videoUrl: audioUrl, // The audio URL serves as the primary resource
      thumbnailUrl,
      duration: actualDuration,
      scriptData: {
        title: script.title,
        fullScript: script.fullScript,
        segments: slides.length,
      },
      audioUrl,
    };
  } catch (error) {
    console.error("[Slideshow] Slideshow generation error:", error);
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
  script: VideoScript
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
    const thumbnailSlide: SlideData = {
      text: script.title || title,
      duration: 3,
      backgroundColor: "#1a1a2e",
      textColor: "#e94560",
      accentColor: "#e94560",
      gradientColors: ["#e94560", "#ff6b6b"],
      fontSize: "xlarge",
      animation: "fade",
      type: "intro",
      showProgressBar: false,
    };

    const thumbnailUrl = await generateThumbnail(thumbnailSlide, videoId);

    console.log(`[WAN] Video generated successfully: ${videoUrl}`);

    return {
      success: true,
      videoUrl,
      thumbnailUrl,
      duration,
      scriptData: {
        title: script.title,
        fullScript: script.fullScript,
        segments: script.segments?.length || 0,
      },
    };
  } catch (error) {
    console.error("[WAN] Video generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "WAN video generation failed",
    };
  }
}

/**
 * Regenerate just the script for an existing video
 */
export async function regenerateScript(
  videoId: string,
  options: { targetDuration?: number } = {}
): Promise<VideoScript | null> {
  try {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: { Source: true },
    });

    if (!video || !video.Source) {
      throw new Error("Video or source not found");
    }

    const content = video.Source.content || "";
    if (!content) {
      throw new Error("No content available for script generation");
    }

    const script = await generateVideoScript(
      content,
      video.Source.title,
      options.targetDuration || 90
    );

    // Update video with new script
    await prisma.video.update({
      where: { id: videoId },
      data: {
        script: script.fullScript,
      },
    });

    return script;
  } catch (error) {
    console.error("Error regenerating script:", error);
    return null;
  }
}

/**
 * Regenerate just the audio for an existing video
 */
export async function regenerateAudio(
  videoId: string,
  script: string,
  options: { voice?: Voice; speed?: number } = {}
): Promise<string | null> {
  try {
    const audioUrl = await generateAndUploadLongSpeech(
      script,
      `narration-${videoId}-${Date.now()}`,
      {
        voice: options.voice || "nova",
        speed: options.speed || 1.0,
        model: "tts-1-hd",
      }
    );

    return audioUrl || null;
  } catch (error) {
    console.error("Error regenerating audio:", error);
    return null;
  }
}
