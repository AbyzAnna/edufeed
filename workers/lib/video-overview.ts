import type { Env } from '../types/env';
import { searchRelevantChunks } from './embeddings';
import { generateJSON, generateText } from './llm';

/**
 * Video segment with AI-generated image and narration
 */
export interface VideoSegment {
  title: string;
  narration: string;
  visualDescription: string;
  duration: number;
  imageUrl?: string;
}

/**
 * Video overview response
 */
export interface VideoOverviewResponse {
  videoUrl: string;
  thumbnailUrl: string;
  segments: VideoSegment[];
  totalDuration: number;
  audioUrl?: string;
}

/**
 * Generate video overview using AI images and audio
 * Creates a slideshow-style video with AI-generated visuals
 */
export async function generateVideoOverview(
  sourceId: string,
  context: string,
  env: Env
): Promise<VideoOverviewResponse> {
  try {
    // 1. Generate video script with segments
    const script = await generateVideoScript(context, env);

    // 2. Generate AI images for each segment (parallel)
    const segmentsWithImages = await Promise.all(
      script.segments.map(async (segment) => {
        try {
          const imageUrl = await generateSegmentImage(segment, env);
          return { ...segment, imageUrl };
        } catch (error) {
          console.error('Image generation error:', error);
          // Use a placeholder color image if generation fails
          return { ...segment, imageUrl: createColorPlaceholder(segment.title) };
        }
      })
    );

    // 3. Generate narration audio for the full script
    const fullNarration = segmentsWithImages
      .map(s => s.narration)
      .join(' ');

    let audioUrl: string | undefined;
    try {
      audioUrl = await generateNarrationAudio(fullNarration, env);
    } catch (error) {
      console.error('Audio generation error:', error);
      // Continue without audio
    }

    // 4. Create thumbnail from first segment
    const thumbnailUrl = segmentsWithImages[0]?.imageUrl || createColorPlaceholder('Video');

    // 5. Calculate total duration
    const totalDuration = segmentsWithImages.reduce((sum, s) => sum + (s.duration || 5), 0);

    // 6. Create video data URL (slideshow format)
    // Since we can't render actual video in Workers, we return a structured
    // response that the frontend can use to create an animated slideshow
    const videoData = {
      type: 'slideshow',
      segments: segmentsWithImages.map(s => ({
        imageUrl: s.imageUrl,
        duration: s.duration || 5,
        narration: s.narration,
        title: s.title,
      })),
      audioUrl,
      totalDuration,
    };

    // Encode video data as JSON for the frontend to render
    const videoUrl = `data:application/json;base64,${btoa(JSON.stringify(videoData))}`;

    return {
      videoUrl,
      thumbnailUrl,
      segments: segmentsWithImages,
      totalDuration,
      audioUrl,
    };
  } catch (error) {
    console.error('Video overview generation error:', error);
    throw error;
  }
}

/**
 * Generate video script with segments
 */
async function generateVideoScript(
  context: string,
  env: Env
): Promise<{ segments: VideoSegment[] }> {
  const systemPrompt = `You are an expert educational video script writer.
Create a compelling video script from the provided content.

Generate 4-6 segments that tell a visual story. Each segment should:
- Have a clear title
- Have engaging narration (30-60 words per segment)
- Have a vivid visual description for AI image generation
- Suggest an appropriate duration (5-10 seconds)

IMPORTANT for visual descriptions:
- Be specific about scene, objects, colors, and style
- Use words like: "illustration of", "diagram showing", "infographic of"
- Avoid text in images - describe visuals only
- Suggest educational, professional visual style

Return ONLY valid JSON in this format:
{
  "segments": [
    {
      "title": "Introduction",
      "narration": "What you would say...",
      "visualDescription": "A colorful illustration of...",
      "duration": 8
    }
  ]
}`;

  const truncatedContext = context.substring(0, 8000);

  const result = await generateJSON(
    truncatedContext,
    systemPrompt,
    '{"segments": [{"title": "", "narration": "", "visualDescription": "", "duration": 5}]}',
    env
  );

  // Ensure we have segments
  const segments = result?.segments || [];

  if (!Array.isArray(segments) || segments.length === 0) {
    // Fallback: create default segments from content
    return {
      segments: [
        {
          title: 'Introduction',
          narration: 'Let\'s explore this topic together.',
          visualDescription: 'A colorful educational illustration with learning icons and books',
          duration: 5,
        },
        {
          title: 'Key Concepts',
          narration: truncatedContext.substring(0, 200),
          visualDescription: 'A professional infographic with key concepts and connected ideas',
          duration: 8,
        },
        {
          title: 'Summary',
          narration: 'Those are the main points to remember.',
          visualDescription: 'A summary diagram with checkmarks and key takeaways',
          duration: 5,
        },
      ],
    };
  }

  return { segments };
}

/**
 * Generate AI image for a segment using Cloudflare AI
 */
async function generateSegmentImage(
  segment: VideoSegment,
  env: Env
): Promise<string> {
  // Create an optimized prompt for educational content
  const prompt = `${segment.visualDescription}, educational style, clean modern design, professional illustration, high quality, vibrant colors, suitable for learning video`;

  try {
    // Use Cloudflare AI Stable Diffusion for image generation
    const response = await env.AI.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', {
      prompt,
      negative_prompt: 'text, words, letters, watermark, signature, blurry, low quality, distorted',
      width: 1024,
      height: 576, // 16:9 aspect ratio for video
      num_steps: 20,
    });

    // Convert response to base64 image URL
    if (response && response instanceof ReadableStream) {
      const chunks: Uint8Array[] = [];
      const reader = response.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }

      const base64 = arrayBufferToBase64(combined.buffer);
      return `data:image/png;base64,${base64}`;
    } else if (response && ArrayBuffer.isView(response)) {
      const base64 = arrayBufferToBase64(
        response.buffer.slice(
          response.byteOffset,
          response.byteOffset + response.byteLength
        )
      );
      return `data:image/png;base64,${base64}`;
    } else if (response instanceof ArrayBuffer) {
      const base64 = arrayBufferToBase64(response);
      return `data:image/png;base64,${base64}`;
    }

    throw new Error('Unexpected image response format');
  } catch (error) {
    console.error('Image generation error for segment:', segment.title, error);
    throw error;
  }
}

/**
 * Generate narration audio using MeloTTS
 */
async function generateNarrationAudio(
  text: string,
  env: Env
): Promise<string> {
  // Limit text length for TTS
  const ttsText = text.substring(0, 3000);

  // MeloTTS uses 'prompt' parameter, not 'text'
  // Response is an object with 'audio' property containing base64-encoded MP3
  const response = await env.AI.run('@cf/myshell-ai/melotts', {
    prompt: ttsText,
    lang: 'en',
  }) as { audio?: string } | ArrayBuffer | Uint8Array;

  // Handle new response format: object with audio property (base64 MP3)
  if (response && typeof response === 'object' && 'audio' in response && response.audio) {
    return `data:audio/mpeg;base64,${response.audio}`;
  }

  // Fallback: handle legacy ArrayBuffer response
  if (response instanceof ArrayBuffer) {
    const base64 = arrayBufferToBase64(response);
    return `data:audio/wav;base64,${base64}`;
  } else if (ArrayBuffer.isView(response)) {
    const base64 = arrayBufferToBase64(
      response.buffer.slice(
        response.byteOffset,
        response.byteOffset + response.byteLength
      )
    );
    return `data:audio/wav;base64,${base64}`;
  }

  throw new Error('Unexpected audio response format');
}

/**
 * Create a color placeholder image
 */
function createColorPlaceholder(title: string): string {
  // Generate a consistent color based on the title
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = ((hash << 5) - hash) + title.charCodeAt(i);
    hash = hash & hash;
  }

  const hue = Math.abs(hash) % 360;

  // Create a simple SVG placeholder
  const svg = `
    <svg width="1024" height="576" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:hsl(${hue}, 70%, 40%);stop-opacity:1" />
          <stop offset="100%" style="stop-color:hsl(${(hue + 60) % 360}, 70%, 30%);stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192;
  let base64 = '';

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    base64 += String.fromCharCode(...chunk);
  }

  return btoa(base64);
}
