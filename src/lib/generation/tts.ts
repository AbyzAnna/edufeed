import OpenAI from "openai";
import { put } from "@vercel/blob";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type Voice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

export interface TTSOptions {
  voice?: Voice;
  speed?: number; // 0.25 to 4.0
  model?: "tts-1" | "tts-1-hd"; // Standard or HD quality
}

// Voice characteristics for content matching
const VOICE_PROFILES: Record<Voice, { style: string; bestFor: string[] }> = {
  alloy: { style: "neutral, balanced", bestFor: ["general", "educational", "business"] },
  echo: { style: "warm, conversational", bestFor: ["storytelling", "casual", "friendly"] },
  fable: { style: "expressive, British accent", bestFor: ["narrative", "documentary", "historical"] },
  onyx: { style: "deep, authoritative", bestFor: ["professional", "serious", "corporate"] },
  nova: { style: "warm, engaging female", bestFor: ["educational", "lifestyle", "inspirational"] },
  shimmer: { style: "clear, upbeat female", bestFor: ["energetic", "tech", "modern"] },
};

/**
 * Select the best voice for the content type
 */
export function selectVoiceForContent(
  category: string,
  tone: string
): Voice {
  const categoryMap: Record<string, Voice> = {
    education: "nova",
    science: "onyx",
    history: "fable",
    technology: "shimmer",
    lifestyle: "echo",
    business: "alloy",
    documentary: "fable",
    tutorial: "nova",
  };

  const toneMap: Record<string, Voice> = {
    professional: "onyx",
    casual: "echo",
    inspiring: "nova",
    educational: "nova",
    entertaining: "shimmer",
    serious: "onyx",
    friendly: "echo",
  };

  // Priority: tone > category > default
  return toneMap[tone] || categoryMap[category] || "nova";
}

/**
 * Generate speech audio from text using OpenAI TTS
 */
export async function generateSpeech(
  text: string,
  options: TTSOptions = {},
  retryCount: number = 0
): Promise<Buffer | undefined> {
  const MAX_RETRIES = 3;
  const {
    voice = "nova",
    speed = 1.0,
    model = "tts-1-hd" // Use HD by default for quality
  } = options;

  if (!text || text.trim().length === 0) {
    console.warn("Empty text provided to TTS");
    return undefined;
  }

  // Clean the text for TTS
  const cleanedText = cleanTextForTTS(text);

  if (cleanedText.length === 0) {
    console.warn("Text is empty after cleaning");
    return undefined;
  }

  try {
    console.log(`[TTS] Generating speech with voice "${voice}", speed ${speed}, model "${model}"`);
    console.log(`[TTS] Text length: ${cleanedText.length} characters`);

    const response = await openai.audio.speech.create({
      model,
      voice,
      input: cleanedText,
      speed: Math.max(0.25, Math.min(4.0, speed)), // Clamp speed
      response_format: "mp3",
    });

    // Convert response to Buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`[TTS] Generated ${buffer.length} bytes of audio`);
    return buffer;
  } catch (error) {
    console.error("[TTS] Error generating speech:", error);
    if (error instanceof Error) {
      if (error.message.includes("api_key")) {
        console.error("[TTS] OpenAI API key issue - check OPENAI_API_KEY in .env");
      }
      if (error.message.includes("rate_limit") && retryCount < MAX_RETRIES) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.error(`[TTS] Rate limited - waiting ${delay}ms and retrying (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return generateSpeech(text, options, retryCount + 1);
      }
    }
    return undefined;
  }
}

/**
 * Generate speech and upload to Vercel Blob storage
 */
export async function generateAndUploadSpeech(
  text: string,
  filename: string,
  options: TTSOptions = {}
): Promise<string | undefined> {
  const buffer = await generateSpeech(text, options);

  if (!buffer) {
    console.error("[TTS] No audio buffer generated");
    return undefined;
  }

  try {
    // Upload to Vercel Blob
    const blob = await put(`audio/${filename}.mp3`, buffer, {
      access: "public",
      contentType: "audio/mpeg",
    });

    console.log(`[TTS] Uploaded audio to: ${blob.url}`);
    return blob.url;
  } catch (error) {
    console.error("[TTS] Error uploading audio:", error);
    return undefined;
  }
}

/**
 * Generate speech and return as base64 data URL (for client-side use)
 */
export async function generateSpeechAsDataUrl(
  text: string,
  options: TTSOptions = {}
): Promise<string | undefined> {
  const buffer = await generateSpeech(text, options);

  if (!buffer) {
    return undefined;
  }

  const base64 = buffer.toString("base64");
  return `data:audio/mpeg;base64,${base64}`;
}

/**
 * Clean text for TTS processing
 * Removes markers, normalizes spacing, handles special characters
 */
function cleanTextForTTS(text: string): string {
  return text
    // Remove script markers
    .replace(/\[PAUSE\]/gi, "...")
    .replace(/\[.*?\]/g, "")
    // Remove markdown formatting
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    // Normalize quotes
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    // Remove excessive whitespace
    .replace(/\s+/g, " ")
    .replace(/\n+/g, " ")
    // Fix common issues
    .replace(/\.{3,}/g, "...") // Normalize ellipsis
    .replace(/\s+\./g, ".") // Remove space before period
    .replace(/\s+,/g, ",") // Remove space before comma
    .replace(/\s+\?/g, "?") // Remove space before question mark
    .replace(/\s+!/g, "!") // Remove space before exclamation
    .trim();
}

/**
 * Estimate audio duration from text
 */
export function estimateAudioDuration(text: string, speed: number = 1.0): number {
  // Average speaking rate is about 150 words per minute at normal speed
  const words = text.split(/\s+/).length;
  const baseMinutes = words / 150;
  const adjustedMinutes = baseMinutes / speed;

  // Add time for pauses
  const pauseCount = (text.match(/\.\.\./g) || []).length;
  const pauseTime = pauseCount * 0.5; // 0.5 seconds per pause

  return Math.round(adjustedMinutes * 60 + pauseTime);
}

/**
 * Split long text into chunks for TTS (OpenAI has a 4096 character limit)
 */
export function splitTextForTTS(text: string, maxChars: number = 4000): string[] {
  if (text.length <= maxChars) {
    return [text];
  }

  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let currentChunk = "";

  for (const sentence of sentences) {
    // If a single sentence is too long, split it further
    if (sentence.length > maxChars) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }
      // Split long sentence by commas or at maxChars
      const parts = sentence.split(/,\s*/);
      for (const part of parts) {
        if (part.length > maxChars) {
          // Force split at maxChars
          for (let i = 0; i < part.length; i += maxChars) {
            chunks.push(part.slice(i, i + maxChars).trim());
          }
        } else if ((currentChunk + part).length > maxChars) {
          chunks.push(currentChunk.trim());
          currentChunk = part + ", ";
        } else {
          currentChunk += part + ", ";
        }
      }
    } else if ((currentChunk + sentence).length > maxChars) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence + " ";
    } else {
      currentChunk += sentence + " ";
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Generate speech for long text by splitting into chunks and combining
 */
export async function generateLongSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<Buffer | undefined> {
  const chunks = splitTextForTTS(text);
  const audioBuffers: Buffer[] = [];

  console.log(`[TTS] Generating speech for ${chunks.length} chunks`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`[TTS] Processing chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`);

    const buffer = await generateSpeech(chunk, options);
    if (buffer) {
      audioBuffers.push(buffer);
    }

    // Small delay between chunks to avoid rate limiting
    if (i < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  if (audioBuffers.length === 0) {
    return undefined;
  }

  // Combine all buffers
  return Buffer.concat(audioBuffers);
}

/**
 * Generate and upload long speech
 */
export async function generateAndUploadLongSpeech(
  text: string,
  filename: string,
  options: TTSOptions = {}
): Promise<string | undefined> {
  const buffer = await generateLongSpeech(text, options);

  if (!buffer) {
    console.error("[TTS] No audio buffer generated for long speech");
    return undefined;
  }

  try {
    const blob = await put(`audio/${filename}.mp3`, buffer, {
      access: "public",
      contentType: "audio/mpeg",
    });

    console.log(`[TTS] Uploaded long audio to: ${blob.url}`);
    return blob.url;
  } catch (error) {
    console.error("[TTS] Error uploading long audio:", error);
    return undefined;
  }
}

/**
 * Generate speech for each segment separately (for better sync)
 */
export async function generateSegmentAudio(
  segments: Array<{ narration: string; duration?: number }>,
  baseFilename: string,
  options: TTSOptions = {}
): Promise<Array<{ url: string; duration: number }>> {
  const results: Array<{ url: string; duration: number }> = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const filename = `${baseFilename}_segment_${i.toString().padStart(2, "0")}`;

    console.log(`[TTS] Generating audio for segment ${i + 1}/${segments.length}`);

    const url = await generateAndUploadSpeech(segment.narration, filename, options);

    if (url) {
      const duration = estimateAudioDuration(segment.narration, options.speed || 1.0);
      results.push({ url, duration });
    } else {
      // Use estimated duration if audio generation fails
      results.push({
        url: "",
        duration: segment.duration || estimateAudioDuration(segment.narration),
      });
    }

    // Small delay between segments
    if (i < segments.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  return results;
}
