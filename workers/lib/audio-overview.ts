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
 */
export async function generateAudioOverview(
  request: AudioOverviewRequest,
  env: Env
): Promise<AudioOverviewResponse> {
  const { sourceId, style = 'conversational', duration = 300 } = request; // 5 min default

  // 1. Get comprehensive content overview
  const chunks = await searchRelevantChunks('main topics, key concepts, and interesting points', sourceId, 25, env);
  const content = chunks.map((c) => c.content).join('\n\n');

  // 2. Generate dialogue script
  const script = await generateDialogueScript(content, style, duration, env);

  // 3. Generate audio from script using TTS
  const audioResult = await synthesizeSpeech(script, env);

  return {
    audioUrl: audioResult.audioUrl,
    transcript: script.fullTranscript,
    speakers: script.speakers,
    duration: audioResult.duration,
  };
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
 * Synthesize speech from dialogue script
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
  }> = [];

  for (const speaker of script.speakers) {
    for (const segment of speaker.segments) {
      allSegments.push({
        timestamp: segment.timestamp,
        text: segment.text,
        voice: speaker.voice,
      });
    }
  }

  allSegments.sort((a, b) => a.timestamp - b.timestamp);

  // Generate audio for each segment
  const audioChunks: ArrayBuffer[] = [];
  let totalDuration = 0;

  for (const segment of allSegments) {
    try {
      // Use Cloudflare Workers AI TTS
      // Note: As of Dec 2024, Workers AI supports text-to-speech
      const ttsResponse = await env.AI.run('@cf/meta/m2m100-1.2b', {
        text: segment.text,
        source_lang: 'en',
        target_lang: 'en',
      });

      // This is a placeholder - actual TTS model selection depends on availability
      // You might need to use external TTS APIs like:
      // - ElevenLabs (high quality, paid)
      // - Google Cloud TTS
      // - Azure TTS
      // - Coqui TTS (open source)

      // For now, we'll create a reference to external TTS
      const audioBuffer = await synthesizeWithExternalTTS(segment.text, segment.voice, env);
      audioChunks.push(audioBuffer);

      // Estimate duration (rough calculation)
      const words = segment.text.split(/\s+/).length;
      totalDuration += (words / 150) * 60; // 150 WPM average
    } catch (error) {
      console.error('TTS error:', error);
      // Continue with other segments
    }
  }

  // Combine audio chunks
  const combinedAudio = combineAudioBuffers(audioChunks);

  // Upload to R2 (if available)
  let audioUrl = '';

  if (env.AUDIO_BUCKET) {
    const audioKey = `audio-overviews/${crypto.randomUUID()}.mp3`;
    await env.AUDIO_BUCKET.put(audioKey, combinedAudio, {
      httpMetadata: {
        contentType: 'audio/mpeg',
      },
    });
    audioUrl = `https://audio.edufeed.com/${audioKey}`;
  } else {
    // R2 not enabled - return base64 data URL for now
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(combinedAudio)));
    audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
  }

  return {
    audioUrl,
    duration: totalDuration,
  };
}

/**
 * External TTS synthesis (placeholder for actual implementation)
 */
async function synthesizeWithExternalTTS(
  text: string,
  voice: string,
  env: Env
): Promise<ArrayBuffer> {
  // This would integrate with external TTS service
  // For example, ElevenLabs API:
  /*
  const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/voice_id', {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': env.ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5,
      },
    }),
  });

  return await response.arrayBuffer();
  */

  // Placeholder: return empty buffer
  return new ArrayBuffer(0);
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
