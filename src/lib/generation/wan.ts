import Replicate from "replicate";
import { InferenceClient } from "@huggingface/inference";
import { put } from "@vercel/blob";

export interface WanGenerationOptions {
  prompt: string;
  resolution?: "480p" | "720p";
  duration?: number;
  negativePrompt?: string;
  seed?: number;
}

export interface WanImageToVideoOptions extends WanGenerationOptions {
  imageUrl: string;
}

/**
 * Get the configured provider
 */
function getProvider(): "huggingface" | "replicate" {
  if (process.env.HF_API_TOKEN) return "huggingface";
  if (process.env.REPLICATE_API_TOKEN) return "replicate";
  throw new Error(
    "No AI provider configured. Set HF_API_TOKEN (free) or REPLICATE_API_TOKEN in .env"
  );
}

/**
 * Generate video using Hugging Face (FREE)
 * Uses LTX-Video or similar open models
 */
async function generateWithHuggingFace(prompt: string): Promise<Blob> {
  const client = new InferenceClient(process.env.HF_API_TOKEN);

  console.log("[HuggingFace] Generating video with LTX-Video...");
  console.log("[HuggingFace] Prompt:", prompt);

  // Use text-to-video with LTX-Video (fast, free)
  const video = await client.textToVideo({
    model: "Lightricks/LTX-Video",
    inputs: prompt,
    parameters: {
      num_frames: 49, // ~2 seconds at 24fps
      num_inference_steps: 30,
    },
  });

  return video;
}

/**
 * Generate video using Replicate (paid, higher quality)
 */
async function generateWithReplicate(
  prompt: string,
  resolution: "480p" | "720p",
  negativePrompt: string,
  seed?: number
): Promise<string> {
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });

  const model =
    resolution === "720p"
      ? "wavespeedai/wan-2.1-t2v-720p"
      : "wavespeedai/wan-2.1-t2v-480p";

  console.log(`[Replicate] Generating video with ${model}...`);
  console.log("[Replicate] Prompt:", prompt);

  const output = await replicate.run(model as `${string}/${string}`, {
    input: {
      prompt,
      negative_prompt: negativePrompt,
      ...(seed && { seed }),
    },
  });

  const videoUrl = Array.isArray(output) ? output[0] : output;

  if (typeof videoUrl !== "string") {
    throw new Error("Unexpected output format from Replicate");
  }

  return videoUrl;
}

/**
 * Generate video from text prompt
 * Automatically uses HuggingFace (free) or Replicate based on config
 */
export async function generateTextToVideo(
  options: WanGenerationOptions
): Promise<string> {
  const {
    prompt,
    resolution = "480p",
    negativePrompt = "blurry, low quality, distorted, deformed",
    seed,
  } = options;

  const provider = getProvider();

  if (provider === "huggingface") {
    // Generate with HuggingFace (returns Blob)
    const videoBlob = await generateWithHuggingFace(prompt);

    // Upload blob to storage
    const buffer = await videoBlob.arrayBuffer();
    const blob = await put(`videos/hf-${Date.now()}.mp4`, buffer, {
      access: "public",
      contentType: "video/mp4",
    });

    return blob.url;
  } else {
    // Generate with Replicate (returns URL)
    return generateWithReplicate(prompt, resolution, negativePrompt, seed);
  }
}

/**
 * Generate video from image
 */
export async function generateImageToVideo(
  options: WanImageToVideoOptions
): Promise<string> {
  const {
    imageUrl,
    prompt,
    resolution = "480p",
    negativePrompt = "blurry, low quality, distorted, deformed",
    seed,
  } = options;

  const provider = getProvider();

  if (provider === "huggingface") {
    // HuggingFace image-to-video
    const client = new InferenceClient(process.env.HF_API_TOKEN);

    console.log("[HuggingFace] Generating image-to-video...");

    const video = await client.imageToVideo({
      model: "stabilityai/stable-video-diffusion-img2vid-xt",
      inputs: new Blob(), // Will be replaced with actual image
      parameters: {
        num_frames: 25,
      },
    });

    const buffer = await video.arrayBuffer();
    const blob = await put(`videos/hf-i2v-${Date.now()}.mp4`, buffer, {
      access: "public",
      contentType: "video/mp4",
    });

    return blob.url;
  } else {
    // Replicate image-to-video
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const model =
      resolution === "720p"
        ? "wavespeedai/wan-2.1-i2v-720p"
        : "wavespeedai/wan-2.1-i2v-480p";

    const output = await replicate.run(model as `${string}/${string}`, {
      input: {
        image: imageUrl,
        prompt,
        negative_prompt: negativePrompt,
        ...(seed && { seed }),
      },
    });

    const videoUrl = Array.isArray(output) ? output[0] : output;

    if (typeof videoUrl !== "string") {
      throw new Error("Unexpected output format from Replicate");
    }

    return videoUrl;
  }
}

/**
 * Upload video from URL to Vercel Blob storage
 */
export async function uploadVideoToStorage(
  videoUrl: string,
  filename: string
): Promise<string> {
  const response = await fetch(videoUrl);
  const videoBuffer = await response.arrayBuffer();

  const blob = await put(`videos/${filename}.mp4`, videoBuffer, {
    access: "public",
    contentType: "video/mp4",
  });

  return blob.url;
}

/**
 * Generate educational video prompt from content
 */
export function createEducationalVideoPrompt(
  title: string,
  keyPoints: string[],
  style: "animated" | "realistic" | "documentary" = "animated"
): string {
  const styleDescriptions = {
    animated:
      "colorful animated educational style, smooth motion graphics, clean modern design",
    realistic:
      "realistic high quality footage, professional documentary style, clear visuals",
    documentary:
      "documentary style, informative visuals, professional narration scene",
  };

  const keyPointsText = keyPoints.slice(0, 3).join(", ");

  return `Educational video about "${title}". ${styleDescriptions[style]}. Visual representation of concepts: ${keyPointsText}. High quality, engaging, suitable for learning. Clear and focused composition.`;
}

/**
 * Generate thumbnail prompt based on video content
 */
export function createThumbnailPrompt(title: string): string {
  return `Educational thumbnail for "${title}", eye-catching design, bold text-friendly layout, vibrant colors, professional educational content style, clean background`;
}

/**
 * Full video generation pipeline
 * Uses HuggingFace (free) or Replicate based on available tokens
 */
export async function generateWanVideo(
  videoId: string,
  title: string,
  keyPoints: string[],
  options?: {
    resolution?: "480p" | "720p";
    style?: "animated" | "realistic" | "documentary";
  }
): Promise<{
  videoUrl: string;
  duration: number;
}> {
  const { resolution = "480p", style = "animated" } = options || {};

  const provider = getProvider();
  console.log(`[Video Gen] Using provider: ${provider}`);

  // Create optimized prompt for educational content
  const prompt = createEducationalVideoPrompt(title, keyPoints, style);

  // Generate video
  const tempVideoUrl = await generateTextToVideo({
    prompt,
    resolution,
  });

  // For HuggingFace, video is already uploaded
  // For Replicate, upload to our storage
  let videoUrl = tempVideoUrl;
  if (provider === "replicate") {
    videoUrl = await uploadVideoToStorage(tempVideoUrl, `wan-${videoId}`);
  }

  // Duration varies by provider
  // HuggingFace LTX-Video: ~2 seconds
  // Replicate WAN 2.1: ~5 seconds
  const duration = provider === "huggingface" ? 2 : 5;

  return {
    videoUrl,
    duration,
  };
}
