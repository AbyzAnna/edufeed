import type { Env } from '../types/env';
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
  type: 'intro' | 'content' | 'transition' | 'outro';
  onScreenText?: string;
  mood?: string;
}

/**
 * Full video script structure
 */
export interface VideoScript {
  title: string;
  hook: string;
  segments: VideoSegment[];
  totalDuration: number;
  targetAudience: string;
  tone: string;
  callToAction: string;
  metadata: {
    topic: string;
    complexity: 'beginner' | 'intermediate' | 'advanced';
    category: string;
  };
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
  script?: VideoScript;
  isActualVideo: boolean;
}

/**
 * Generate professional video overview using AI images and audio
 * Creates a YouTube-quality video with AI-generated visuals and narration
 */
export async function generateVideoOverview(
  sourceId: string,
  context: string,
  env: Env
): Promise<VideoOverviewResponse> {
  try {
    console.log('[VideoOverview] Starting professional video generation');

    // 1. Generate professional video script
    const script = await generateProfessionalVideoScript(context, env);
    console.log(`[VideoOverview] Script generated with ${script.segments.length} segments`);

    // 2. Generate AI images for each segment (parallel with rate limiting)
    const segmentsWithImages = await generateSegmentImages(script.segments, env);
    console.log('[VideoOverview] Images generated for all segments');

    // 3. Generate narration audio using professional TTS
    const fullNarration = script.segments
      .map(s => s.narration)
      .join(' [PAUSE] ');

    let audioUrl: string | undefined;
    try {
      audioUrl = await generateNarrationAudio(fullNarration, env);
      console.log('[VideoOverview] Audio narration generated');
    } catch (error) {
      console.error('[VideoOverview] Audio generation error:', error);
      // Continue without audio - frontend can generate later
    }

    // 4. Create professional thumbnail from intro segment
    const introSegment = segmentsWithImages.find(s => s.type === 'intro') || segmentsWithImages[0];
    const thumbnailUrl = await generateThumbnail(script.title, introSegment, env);

    // 5. Calculate total duration from segments
    const totalDuration = segmentsWithImages.reduce((sum, s) => sum + (s.duration || 8), 0);

    // 6. Create video data URL (structured for frontend rendering)
    const videoData = {
      type: 'professional-slideshow',
      version: '2.0',
      segments: segmentsWithImages.map(s => ({
        imageUrl: s.imageUrl,
        duration: s.duration || 8,
        narration: s.narration,
        title: s.title,
        type: s.type,
        onScreenText: s.onScreenText,
        mood: s.mood,
        visualDescription: s.visualDescription,
      })),
      audioUrl,
      totalDuration,
      script: {
        title: script.title,
        hook: script.hook,
        callToAction: script.callToAction,
        tone: script.tone,
      },
    };

    // Encode video data as JSON for the frontend to render
    const videoUrl = `data:application/json;base64,${btoa(JSON.stringify(videoData))}`;

    return {
      videoUrl,
      thumbnailUrl,
      segments: segmentsWithImages,
      totalDuration,
      audioUrl,
      script,
      isActualVideo: true,
    };
  } catch (error) {
    console.error('[VideoOverview] Generation error:', error);
    throw error;
  }
}

/**
 * Generate professional YouTube-quality video script
 */
async function generateProfessionalVideoScript(
  context: string,
  env: Env
): Promise<VideoScript> {
  const targetDuration = 90; // 90 seconds for quality content
  const wordsPerSecond = 2.5;
  const targetWords = Math.round(targetDuration * wordsPerSecond);

  const systemPrompt = `You are a world-class educational video scriptwriter who creates viral YouTube content.

Your scripts are known for:
- Captivating hooks that create immediate curiosity
- Clear, memorable explanations of complex topics
- Dynamic pacing that maintains viewer attention
- Professional narration that sounds natural when spoken
- Strategic use of visual cues

SCRIPT REQUIREMENTS:
- Total duration: ~${targetDuration} seconds (~${targetWords} words for narration)
- Structure: 5-7 segments including intro and outro
- Format: Professional YouTube educational video

STRUCTURE GUIDELINES:

1. INTRO SEGMENT (8-10 seconds):
   - Pattern-interrupt hook (surprising fact, bold question, or counterintuitive statement)
   - Create a "curiosity gap" - make viewers NEED the answer
   - NO generic openings like "Hey guys" or "In this video..."

2. CONTENT SEGMENTS (3-5 segments, 12-18 seconds each):
   - Each teaches ONE clear concept
   - Use specific examples, numbers, or analogies
   - Build logically from previous segment
   - Include micro-hooks between segments

3. OUTRO SEGMENT (8-10 seconds):
   - Summarize the key transformation/insight
   - Strong call-to-action (specific, not generic)
   - Memorable closing statement or callback to hook

NARRATION STYLE:
- Conversational but authoritative
- Use "you" to address viewer directly
- Vary sentence length for natural rhythm
- Use power words: discover, secret, proven, essential, transform, unlock
- NO filler phrases like "So, let's dive in"

VISUAL DESCRIPTIONS:
For AI image generation, describe:
- Educational illustration style (modern, clean, colorful)
- Specific objects, diagrams, or metaphors
- Mood: cinematic, energetic, calm, dramatic, inspiring
- NO text in images - that's added as overlay

Return ONLY valid JSON in this exact format:
{
  "title": "Compelling YouTube-style title (creates curiosity)",
  "hook": "Opening 2-3 sentences that stop the scroll",
  "segments": [
    {
      "title": "Segment title",
      "narration": "Full narration text for this segment (natural speaking)",
      "visualDescription": "Detailed description for AI image generation",
      "duration": 10,
      "type": "intro|content|outro",
      "onScreenText": "Key text to display (max 8 words)",
      "mood": "cinematic|energetic|calm|dramatic|inspiring"
    }
  ],
  "totalDuration": ${targetDuration},
  "targetAudience": "Who this video is for",
  "tone": "professional|casual|inspiring|educational",
  "callToAction": "What viewers should do",
  "metadata": {
    "topic": "Main topic",
    "complexity": "beginner|intermediate|advanced",
    "category": "education|science|history|technology|lifestyle"
  }
}

CRITICAL RULES:
1. Every sentence must add value - cut ruthlessly
2. Make complex things simple without dumbing down
3. The viewer should feel SMARTER after watching`;

  const userPrompt = `Create a professional YouTube educational video script from this content:

${context.substring(0, 10000)}

Remember: This is a REAL video people will watch. Make it engaging, educational, and memorable.`;

  try {
    const result = await generateJSON(
      userPrompt,
      systemPrompt,
      createDefaultScript().toString(),
      env
    );

    // Validate and ensure proper structure
    return validateAndFixScript(result, context);
  } catch (error) {
    console.error('[VideoOverview] Script generation error:', error);
    return createDefaultScript(context);
  }
}

/**
 * Validate script structure and fix any issues
 */
function validateAndFixScript(result: Record<string, unknown>, context: string): VideoScript {
  const segments = (result?.segments as VideoSegment[]) || [];

  // Ensure we have valid segments
  if (!Array.isArray(segments) || segments.length < 3) {
    return createDefaultScript(context);
  }

  // Ensure each segment has required fields
  const validatedSegments: VideoSegment[] = segments.map((seg, idx) => ({
    title: seg.title || `Section ${idx + 1}`,
    narration: seg.narration || '',
    visualDescription: seg.visualDescription || 'Educational illustration with modern design',
    duration: seg.duration || 10,
    type: seg.type || (idx === 0 ? 'intro' : idx === segments.length - 1 ? 'outro' : 'content'),
    onScreenText: seg.onScreenText || seg.title,
    mood: seg.mood || 'cinematic',
  }));

  // Ensure we have intro and outro
  if (validatedSegments[0].type !== 'intro') {
    validatedSegments[0].type = 'intro';
  }
  if (validatedSegments[validatedSegments.length - 1].type !== 'outro') {
    validatedSegments[validatedSegments.length - 1].type = 'outro';
  }

  return {
    title: (result.title as string) || 'Educational Video',
    hook: (result.hook as string) || validatedSegments[0]?.narration || '',
    segments: validatedSegments,
    totalDuration: validatedSegments.reduce((sum, s) => sum + s.duration, 0),
    targetAudience: (result.targetAudience as string) || 'Curious learners',
    tone: (result.tone as string) || 'educational',
    callToAction: (result.callToAction as string) || 'Subscribe for more insights',
    metadata: {
      topic: (result.metadata as Record<string, string>)?.topic || 'Education',
      complexity: ((result.metadata as Record<string, string>)?.complexity as 'beginner' | 'intermediate' | 'advanced') || 'intermediate',
      category: (result.metadata as Record<string, string>)?.category || 'education',
    },
  };
}

/**
 * Create default script structure
 */
function createDefaultScript(context?: string): VideoScript {
  const contentPreview = context?.substring(0, 300) || 'educational content';

  return {
    title: 'Key Insights You Need to Know',
    hook: 'What if everything you thought you knew about this topic was only half the story?',
    segments: [
      {
        title: 'Introduction',
        narration: 'What if everything you thought you knew about this topic was only half the story? In the next few minutes, you will discover insights that most people never learn. Stay with me.',
        visualDescription: 'Dynamic opening visual with bold typography, dramatic lighting, gradient background from deep purple to vibrant blue, educational icons floating in space',
        duration: 10,
        type: 'intro',
        onScreenText: 'The Truth Revealed',
        mood: 'dramatic',
      },
      {
        title: 'Key Concept 1',
        narration: `Here is the first key insight. ${contentPreview}... This fundamentally changes how we understand the subject.`,
        visualDescription: 'Clean modern infographic showing the concept, professional educational illustration with icons and connecting lines, soft blue and white color scheme',
        duration: 15,
        type: 'content',
        onScreenText: 'Key Insight #1',
        mood: 'energetic',
      },
      {
        title: 'Key Concept 2',
        narration: 'Building on that foundation, here is where it gets really interesting. The connection between these ideas is what separates surface understanding from true mastery.',
        visualDescription: 'Visual metaphor illustration showing connections and relationships, neural network style design with glowing nodes, warm orange and yellow tones',
        duration: 15,
        type: 'content',
        onScreenText: 'The Connection',
        mood: 'inspiring',
      },
      {
        title: 'The Deeper Truth',
        narration: 'Now here is what most sources will not tell you. This perspective transforms how you approach everything we have discussed. Remember this principle.',
        visualDescription: 'Dramatic reveal visual with light breakthrough effect, person having eureka moment, golden hour lighting, inspirational atmosphere',
        duration: 15,
        type: 'content',
        onScreenText: 'The Hidden Truth',
        mood: 'dramatic',
      },
      {
        title: 'Summary',
        narration: 'So what does all this mean for you? You now understand something that took experts years to figure out. Use this knowledge wisely, and share it with someone who needs to hear it.',
        visualDescription: 'Summary visual with key takeaways displayed as icons, clean minimal design with plenty of white space, professional and confident atmosphere',
        duration: 12,
        type: 'outro',
        onScreenText: 'Your Next Step',
        mood: 'inspiring',
      },
    ],
    totalDuration: 67,
    targetAudience: 'Curious learners seeking to expand their knowledge',
    tone: 'educational',
    callToAction: 'Subscribe for more insights',
    metadata: {
      topic: 'Education',
      complexity: 'intermediate',
      category: 'education',
    },
  };
}

/**
 * Generate images for all segments with rate limiting
 */
async function generateSegmentImages(
  segments: VideoSegment[],
  env: Env
): Promise<VideoSegment[]> {
  const results: VideoSegment[] = [];

  // Process images with small delay to avoid rate limits
  for (const segment of segments) {
    try {
      const imageUrl = await generateSegmentImage(segment, env);
      results.push({ ...segment, imageUrl });
    } catch (error) {
      console.error(`[VideoOverview] Image error for "${segment.title}":`, error);
      results.push({ ...segment, imageUrl: createColorPlaceholder(segment.title, segment.mood) });
    }
    // Small delay between image generations
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return results;
}

/**
 * Generate AI image for a segment using Cloudflare AI
 */
async function generateSegmentImage(
  segment: VideoSegment,
  env: Env
): Promise<string> {
  // Create an optimized prompt for educational content
  const moodStyles: Record<string, string> = {
    cinematic: 'cinematic lighting, dramatic shadows, professional color grading',
    energetic: 'vibrant colors, dynamic composition, high contrast',
    calm: 'soft lighting, muted colors, serene atmosphere',
    dramatic: 'high contrast, bold shadows, intense atmosphere',
    inspiring: 'golden hour lighting, warm tones, uplifting atmosphere',
  };

  const moodStyle = moodStyles[segment.mood || 'cinematic'] || moodStyles.cinematic;

  const prompt = `${segment.visualDescription}, ${moodStyle}, educational content, professional illustration, modern design, clean composition, high quality 4K, no text or words in the image`;

  const negativePrompt = 'text, words, letters, numbers, watermark, signature, logo, blurry, low quality, distorted, pixelated, ugly, deformed, amateur, unprofessional';

  try {
    // Use Cloudflare AI Stable Diffusion for image generation
    const response = await env.AI.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', {
      prompt,
      negative_prompt: negativePrompt,
      width: 1024,
      height: 576, // 16:9 aspect ratio for video
      num_steps: 25, // Slightly higher for better quality
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
    console.error('[VideoOverview] Image generation error:', segment.title, error);
    throw error;
  }
}

/**
 * Generate professional thumbnail
 */
async function generateThumbnail(
  title: string,
  introSegment: VideoSegment,
  env: Env
): Promise<string> {
  // If intro segment has an image, use it as thumbnail base
  if (introSegment.imageUrl && !introSegment.imageUrl.startsWith('data:image/svg')) {
    return introSegment.imageUrl;
  }

  // Generate a dedicated thumbnail
  const thumbnailPrompt = `YouTube video thumbnail for "${title}", eye-catching design, bold and vibrant colors, professional educational content, clean composition, high contrast, attention-grabbing, modern design, 4K quality`;

  try {
    const response = await env.AI.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', {
      prompt: thumbnailPrompt,
      negative_prompt: 'text, words, letters, watermark, blurry, low quality, amateur',
      width: 1280,
      height: 720,
      num_steps: 20,
    });

    if (response instanceof ArrayBuffer) {
      const base64 = arrayBufferToBase64(response);
      return `data:image/png;base64,${base64}`;
    } else if (ArrayBuffer.isView(response)) {
      const base64 = arrayBufferToBase64(
        response.buffer.slice(
          response.byteOffset,
          response.byteOffset + response.byteLength
        )
      );
      return `data:image/png;base64,${base64}`;
    }
  } catch (error) {
    console.error('[VideoOverview] Thumbnail generation error:', error);
  }

  // Fallback to color placeholder
  return createColorPlaceholder(title, 'dramatic');
}

/**
 * Generate narration audio using MeloTTS or fallback
 */
async function generateNarrationAudio(
  text: string,
  env: Env
): Promise<string> {
  // Clean and prepare text for TTS
  const cleanText = text
    .replace(/\[PAUSE\]/gi, '...')
    .replace(/\[.*?\]/g, '')
    .substring(0, 4000); // Respect TTS limit

  try {
    // MeloTTS uses 'prompt' parameter
    const response = await env.AI.run('@cf/myshell-ai/melotts', {
      prompt: cleanText,
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
  } catch (error) {
    console.error('[VideoOverview] TTS error:', error);
    throw error;
  }
}

/**
 * Create a professional color placeholder image
 */
function createColorPlaceholder(title: string, mood?: string): string {
  // Generate colors based on mood
  const moodColors: Record<string, { start: string; end: string }> = {
    cinematic: { start: '#1a1a2e', end: '#16213e' },
    energetic: { start: '#e94560', end: '#ff6b6b' },
    calm: { start: '#2c3e50', end: '#3498db' },
    dramatic: { start: '#0f0f0f', end: '#434343' },
    inspiring: { start: '#f39c12', end: '#e74c3c' },
  };

  const colors = moodColors[mood || 'cinematic'] || moodColors.cinematic;

  // Create a professional SVG placeholder
  const svg = `
    <svg width="1024" height="576" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.start};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors.end};stop-opacity:1" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color:rgba(255,255,255,0.1);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgba(255,255,255,0);stop-opacity:0" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
      <ellipse cx="512" cy="288" rx="400" ry="200" fill="url(#glow)"/>
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
