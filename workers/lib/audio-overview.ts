import type {
  Env,
  AudioOverviewRequest,
  AudioOverviewResponse,
  Speaker,
  SpeakerSegment,
} from '../types/env';
import { searchRelevantChunks } from './embeddings';
import { generateJSON, generateText } from './llm';

/**
 * Generate NotebookLM-style audio overview
 * Creates podcast-like conversations discussing the content
 * Uses Cloudflare Workers AI MeloTTS for text-to-speech
 */
export async function generateAudioOverview(
  request: AudioOverviewRequest,
  env: Env
): Promise<AudioOverviewResponse> {
  const { sourceId, style = 'conversational', duration = 300 } = request; // 5 min default

  try {
    // 1. Get comprehensive content overview
    const chunks = await searchRelevantChunks('main topics, key concepts, and interesting points', sourceId, 25, env);
    const content = chunks.map((c) => c.content).join('\n\n');

    if (!content || content.trim().length === 0) {
      throw new Error('No content available to generate audio overview');
    }

    // 2. Generate dialogue script using Llama 3.3
    const script = await generateDialogueScript(content, style, duration, env);

    // 3. Generate audio from script using MeloTTS
    const audioResult = await synthesizeSpeech(script, env);

    return {
      audioUrl: audioResult.audioUrl,
      transcript: script.fullTranscript,
      speakers: script.speakers,
      duration: audioResult.duration,
    };
  } catch (error) {
    console.error('Audio overview generation error:', error);
    throw error;
  }
}

/**
 * Generate dialogue script for audio overview
 */
async function generateDialogueScript(
  content: string,
  style: string,
  targetDuration: number,
  env: Env
): Promise<{
  speakers: Speaker[];
  fullTranscript: string;
}> {
  const wordsPerMinute = 150; // Average speaking pace
  const targetWords = (targetDuration / 60) * wordsPerMinute;

  let systemPrompt = '';

  switch (style) {
    case 'conversational':
      systemPrompt = `Create an engaging podcast-style conversation between two hosts discussing this content.

Hosts:
- Alex (curious learner, asks questions)
- Jamie (knowledgeable guide, explains concepts)

Guidelines:
- Natural, conversational tone
- Use "we", "you know", "actually" naturally
- Ask clarifying questions
- Make connections to real-world examples
- Show enthusiasm for interesting points
- Target approximately ${Math.floor(targetWords)} words
- Break complex ideas into digestible explanations
- Use analogies and metaphors

Format each line as:
SPEAKER: dialogue text`;
      break;

    case 'lecture':
      systemPrompt = `Create an educational lecture presentation on this content.

Speaker: Professor Morgan (expert educator)

Guidelines:
- Structured and organized
- Clear explanations with examples
- Build from fundamentals to complex ideas
- Emphasize key takeaways
- Target approximately ${Math.floor(targetWords)} words
- Professional but accessible tone

Format each line as:
PROFESSOR: lecture text`;
      break;

    case 'debate':
      systemPrompt = `Create a friendly debate between two perspectives on this content.

Debaters:
- Riley (Perspective A)
- Sam (Perspective B)

Guidelines:
- Present different viewpoints or interpretations
- Support arguments with evidence from material
- Respectful disagreement
- Find common ground
- Target approximately ${Math.floor(targetWords)} words

Format each line as:
SPEAKER: dialogue text`;
      break;
  }

  const prompt = `Content to discuss:\n\n${content.substring(0, 10000)}`;

  const dialogue = await generateText(prompt, systemPrompt, env, {
    temperature: 0.9, // Higher temperature for more natural conversation
    maxTokens: Math.ceil(targetWords * 1.5),
  });

  // Parse dialogue into structured format
  const lines = dialogue.split('\n').filter((line) => line.trim());
  const segments: Map<string, SpeakerSegment[]> = new Map();

  let timestamp = 0;
  for (const line of lines) {
    const match = line.match(/^([A-Z]+):\s*(.+)$/);
    if (!match) continue;

    const [, speaker, text] = match;
    const words = text.split(/\s+/).length;
    const segmentDuration = (words / wordsPerMinute) * 60; // seconds

    if (!segments.has(speaker)) {
      segments.set(speaker, []);
    }

    segments.get(speaker)!.push({
      timestamp,
      text: text.trim(),
    });

    timestamp += segmentDuration;
  }

  // Create speakers array
  const speakers: Speaker[] = Array.from(segments.entries()).map(([name, segs], idx) => ({
    name,
    voice: getVoiceForSpeaker(name, idx),
    segments: segs,
  }));

  return {
    speakers,
    fullTranscript: dialogue,
  };
}

/**
 * Synthesize speech from dialogue script using MeloTTS
 * MeloTTS is a high-quality multi-lingual TTS model available on Cloudflare Workers AI
 */
async function synthesizeSpeech(
  script: { speakers: Speaker[]; fullTranscript: string },
  env: Env
): Promise<{ audioUrl: string; duration: number }> {
  // Merge all segments in chronological order
  const allSegments: Array<{
    timestamp: number;
    text: string;
    voice: string;
    speakerName: string;
  }> = [];

  for (const speaker of script.speakers) {
    for (const segment of speaker.segments) {
      allSegments.push({
        timestamp: segment.timestamp,
        text: segment.text,
        voice: speaker.voice,
        speakerName: speaker.name,
      });
    }
  }

  allSegments.sort((a, b) => a.timestamp - b.timestamp);

  // Generate audio for each segment using MeloTTS
  const audioChunks: ArrayBuffer[] = [];
  let totalDuration = 0;

  for (const segment of allSegments) {
    try {
      // Skip empty segments
      if (!segment.text || segment.text.trim().length === 0) continue;

      // Use Cloudflare Workers AI MeloTTS for text-to-speech
      // MeloTTS supports: 'en' (English), 'fr' (French)
      // IMPORTANT: MeloTTS uses 'prompt' parameter, NOT 'text'
      const ttsResponse = await env.AI.run('@cf/myshell-ai/melotts', {
        prompt: segment.text,
        lang: 'en', // English language
      });

      // MeloTTS returns { audio: base64string } for MP3 format
      // Handle both new format (base64 string) and legacy format (ArrayBuffer)
      if (ttsResponse && typeof ttsResponse === 'object') {
        let audioBuffer: ArrayBuffer | null = null;

        // New MeloTTS format: { audio: base64string } - MP3 format
        if ('audio' in ttsResponse && typeof ttsResponse.audio === 'string') {
          // Decode base64 string to ArrayBuffer
          const base64 = ttsResponse.audio as string;
          const binaryString = atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          audioBuffer = bytes.buffer;
        } else if (ttsResponse instanceof ArrayBuffer) {
          // Legacy format: direct ArrayBuffer
          audioBuffer = ttsResponse;
        } else if (ArrayBuffer.isView(ttsResponse)) {
          // Legacy format: TypedArray view
          audioBuffer = ttsResponse.buffer.slice(
            ttsResponse.byteOffset,
            ttsResponse.byteOffset + ttsResponse.byteLength
          );
        } else if ('audio' in ttsResponse && ttsResponse.audio instanceof ArrayBuffer) {
          // Legacy format: { audio: ArrayBuffer }
          audioBuffer = ttsResponse.audio as ArrayBuffer;
        } else {
          console.warn('Unexpected TTS response format:', typeof ttsResponse, Object.keys(ttsResponse));
          continue;
        }

        if (audioBuffer && audioBuffer.byteLength > 0) {
          audioChunks.push(audioBuffer);
        }
      }

      // Estimate duration (rough calculation: 150 WPM average)
      const words = segment.text.split(/\s+/).length;
      totalDuration += (words / 150) * 60; // seconds
    } catch (error) {
      console.error('TTS error for segment:', error, segment.text.substring(0, 50));
      // Continue with other segments - don't fail the entire generation
    }
  }

  // Combine audio chunks into single audio file
  const combinedAudio = combineAudioBuffers(audioChunks);
  let audioUrl = '';

  // Upload to R2 if available, otherwise return base64 data URL
  // Note: MeloTTS returns MP3 format audio
  const MAX_BASE64_SIZE = 5 * 1024 * 1024; // 5MB limit for base64 fallback

  if (env.AUDIO_BUCKET && combinedAudio.byteLength > 0) {
    try {
      const audioKey = `audio-overviews/${crypto.randomUUID()}.mp3`;
      await env.AUDIO_BUCKET.put(audioKey, combinedAudio, {
        httpMetadata: {
          contentType: 'audio/mpeg',
        },
      });
      // TODO: Replace with your actual R2 public domain or use env variable
      audioUrl = `https://audio.edufeed.com/${audioKey}`;
    } catch (r2Error) {
      console.error('R2 upload error:', r2Error);
      // Fall back to base64 if audio is not too large
      if (combinedAudio.byteLength < MAX_BASE64_SIZE) {
        audioUrl = createBase64AudioUrl(combinedAudio);
      } else {
        console.error('Audio too large for base64 fallback');
        audioUrl = '';
      }
    }
  } else if (combinedAudio.byteLength > 0 && combinedAudio.byteLength < MAX_BASE64_SIZE) {
    // R2 not enabled - return base64 data URL if not too large
    audioUrl = createBase64AudioUrl(combinedAudio);
  } else if (combinedAudio.byteLength >= MAX_BASE64_SIZE) {
    console.error('Audio too large for base64, R2 not configured');
    audioUrl = '';
  } else {
    // No audio generated - return transcript-only response
    audioUrl = '';
  }

  return {
    audioUrl,
    duration: totalDuration,
  };
}

/**
 * Create a base64 data URL from audio buffer
 */
function createBase64AudioUrl(audioBuffer: ArrayBuffer): string {
  if (audioBuffer.byteLength === 0) return '';

  // Convert to base64 in chunks to avoid call stack issues
  const bytes = new Uint8Array(audioBuffer);
  const chunkSize = 8192;
  let base64 = '';

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    base64 += String.fromCharCode(...chunk);
  }

  // MeloTTS returns MP3 format
  return `data:audio/mpeg;base64,${btoa(base64)}`;
}


/**
 * Combine multiple audio buffers into one
 */
function combineAudioBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
  // Calculate total length
  const totalLength = buffers.reduce((sum, buf) => sum + buf.byteLength, 0);

  // Create combined buffer
  const combined = new Uint8Array(totalLength);
  let offset = 0;

  for (const buffer of buffers) {
    combined.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  }

  return combined.buffer;
}

/**
 * Get appropriate voice for speaker
 */
function getVoiceForSpeaker(name: string, index: number): string {
  // Map speaker names to voice IDs
  // These would be actual voice IDs from your TTS provider

  const voiceMap: Record<string, string> = {
    ALEX: 'voice_id_casual_curious',
    JAMIE: 'voice_id_knowledgeable_friendly',
    PROFESSOR: 'voice_id_authoritative_clear',
    RILEY: 'voice_id_thoughtful_articulate',
    SAM: 'voice_id_analytical_engaging',
  };

  return voiceMap[name] || `voice_${index}`;
}

/**
 * Generate chapter markers for audio
 */
export async function generateAudioChapters(
  transcript: string,
  env: Env
): Promise<Array<{ time: number; title: string }>> {
  const systemPrompt = `Analyze this audio transcript and create chapter markers.
Identify natural topic transitions and create descriptive chapter titles.

Return JSON array:
[{
  "time": 0,
  "title": "Introduction to Topic"
}, ...]

Time should be in seconds, estimated from transcript flow.`;

  const schema = `[{"time": 0, "title": "..."}]`;

  return generateJSON(transcript, systemPrompt, schema, env);
}

/**
 * Generate show notes / summary for audio
 */
export async function generateShowNotes(
  transcript: string,
  env: Env
): Promise<{
  summary: string;
  keyPoints: string[];
  resources: string[];
}> {
  const systemPrompt = `Create show notes for this audio overview.
Include:
- Brief summary (2-3 sentences)
- Key points discussed (bullet points)
- Resources mentioned or recommended

Return as JSON.`;

  const schema = `{
    "summary": "...",
    "keyPoints": ["point 1", "point 2"],
    "resources": ["resource 1", "resource 2"]
  }`;

  return generateJSON(transcript, systemPrompt, schema, env);
}
