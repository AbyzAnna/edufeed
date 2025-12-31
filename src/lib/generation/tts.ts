// TTS functionality is currently disabled (requires OpenAI API key)
// Audio generation will be skipped gracefully

export type Voice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

export interface TTSOptions {
  voice?: Voice;
  speed?: number; // 0.25 to 4.0
}

/**
 * Generate speech audio from text
 * Currently disabled - returns undefined to skip audio generation
 */
export async function generateSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<Buffer | undefined> {
  // TTS is currently disabled - would require OpenAI API or alternative TTS service
  console.log("TTS is disabled - skipping audio generation");
  return undefined;
}

/**
 * Generate speech and upload to blob storage
 * Currently disabled - returns undefined to skip audio generation
 */
export async function generateAndUploadSpeech(
  text: string,
  filename: string,
  options: TTSOptions = {}
): Promise<string | undefined> {
  // TTS is currently disabled - would require OpenAI API or alternative TTS service
  console.log("TTS is disabled - skipping audio upload for:", filename);
  return undefined;
}

/**
 * Estimate audio duration from text
 */
export function estimateAudioDuration(text: string, speed: number = 1.0): number {
  // Average speaking rate is about 150 words per minute
  const words = text.split(/\s+/).length;
  const baseMinutes = words / 150;
  const adjustedMinutes = baseMinutes / speed;
  return Math.round(adjustedMinutes * 60); // Return seconds
}

/**
 * Split long text into chunks for TTS (max ~4000 chars per request)
 */
export function splitTextForTTS(text: string, maxChars: number = 4000): string[] {
  if (text.length <= maxChars) {
    return [text];
  }

  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let currentChunk = "";

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChars) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    } else {
      currentChunk += " " + sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Generate speech for long text by splitting into chunks
 */
export async function generateLongSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<Buffer[]> {
  const chunks = splitTextForTTS(text);
  const audioBuffers: Buffer[] = [];

  for (const chunk of chunks) {
    const buffer = await generateSpeech(chunk, options);
    if (buffer) {
      audioBuffers.push(buffer);
    }
  }

  return audioBuffers;
}
