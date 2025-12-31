import type { Env } from './types/env';
import { chatWithDocument, continueChatConversation } from './lib/chat';
import { generateStudyGuide, generateStudyPlan } from './lib/study-guide';
import { generateFlashcards, generateClozeCards } from './lib/flashcards';
import { generateAudioOverview } from './lib/audio-overview';
import { storeDocumentEmbeddings, deleteSourceEmbeddings, generateEmbedding } from './lib/embeddings';
import { generateDirectSummary, generateDirectFlashcards, generateDirectTable } from './lib/direct-content';

/**
 * Main Cloudflare Workers entry point
 * Handles all AI generation endpoints for EduFeed
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // Route handling
      switch (true) {
        // Health check
        case path === '/health':
          return jsonResponse({ status: 'ok', timestamp: Date.now() }, 200, corsHeaders);

        // Simple AI test endpoint
        case path === '/api/test-ai' && request.method === 'POST':
          return handleTestAI(request, env, corsHeaders);

        // Embeddings endpoints
        case path === '/api/embeddings/store' && request.method === 'POST':
          return handleStoreEmbeddings(request, env, corsHeaders);

        case path === '/api/embeddings/delete' && request.method === 'DELETE':
          return handleDeleteEmbeddings(request, env, corsHeaders);

        // Chat endpoints
        case path === '/api/chat' && request.method === 'POST':
          return handleChat(request, env, corsHeaders);

        case path === '/api/chat/continue' && request.method === 'POST':
          return handleContinueChat(request, env, corsHeaders);

        // Study guide endpoints
        case path === '/api/study-guide/generate' && request.method === 'POST':
          return handleGenerateStudyGuide(request, env, corsHeaders);

        case path === '/api/study-guide/plan' && request.method === 'POST':
          return handleGenerateStudyPlan(request, env, corsHeaders);

        // Flashcard endpoints
        case path === '/api/flashcards/generate' && request.method === 'POST':
          return handleGenerateFlashcards(request, env, corsHeaders);

        case path === '/api/flashcards/generate-cloze' && request.method === 'POST':
          return handleGenerateClozeCards(request, env, corsHeaders);

        // Audio overview endpoints
        case path === '/api/audio-overview/generate' && request.method === 'POST':
          return handleGenerateAudioOverview(request, env, corsHeaders);

        // YouTube endpoints
        case path === '/api/youtube/key-moments' && request.method === 'POST':
          return handleYouTubeKeyMoments(request, env, corsHeaders);

        case path === '/api/youtube/transcript' && request.method === 'POST':
          return handleYouTubeTranscript(request, env, corsHeaders);

        // Embedding endpoint
        case path === '/api/embed' && request.method === 'POST':
          return handleEmbed(request, env, corsHeaders);

        // OCR endpoint (image to text)
        case path === '/api/ocr' && request.method === 'POST':
          return handleOCR(request, env, corsHeaders);

        // Audio transcription endpoint
        case path === '/api/transcribe' && request.method === 'POST':
          return handleTranscribe(request, env, corsHeaders);

        // Direct content generation (no embeddings required)
        case path === '/api/content/summary' && request.method === 'POST':
          return handleDirectSummary(request, env, corsHeaders);

        case path === '/api/content/flashcards' && request.method === 'POST':
          return handleDirectFlashcards(request, env, corsHeaders);

        case path === '/api/content/table' && request.method === 'POST':
          return handleDirectTable(request, env, corsHeaders);

        // Universal generate endpoint for notebook outputs
        case path === '/api/generate' && request.method === 'POST':
          return handleGenerate(request, env, corsHeaders);

        default:
          return jsonResponse({ error: 'Not found' }, 404, corsHeaders);
      }
    } catch (error) {
      console.error('Error handling request:', error);
      return jsonResponse(
        {
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500,
        corsHeaders
      );
    }
  },
};

// ==================== Handler Functions ====================

/**
 * Store document embeddings
 */
async function handleStoreEmbeddings(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { sourceId, content, metadata } = await request.json();

  if (!sourceId || !content) {
    return jsonResponse({ error: 'Missing required fields' }, 400, corsHeaders);
  }

  await storeDocumentEmbeddings(sourceId, content, metadata, env);

  return jsonResponse(
    { success: true, message: 'Embeddings stored successfully' },
    200,
    corsHeaders
  );
}

/**
 * Delete document embeddings
 */
async function handleDeleteEmbeddings(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { sourceId } = await request.json();

  if (!sourceId) {
    return jsonResponse({ error: 'Missing sourceId' }, 400, corsHeaders);
  }

  await deleteSourceEmbeddings(sourceId, env);

  return jsonResponse(
    { success: true, message: 'Embeddings deleted successfully' },
    200,
    corsHeaders
  );
}

/**
 * Handle chat request
 */
async function handleChat(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const chatRequest = await request.json();

  if (!chatRequest.sourceId || !chatRequest.message) {
    return jsonResponse({ error: 'Missing required fields' }, 400, corsHeaders);
  }

  const response = await chatWithDocument(chatRequest, env);

  return jsonResponse(response, 200, corsHeaders);
}

/**
 * Handle continue chat
 */
async function handleContinueChat(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { conversationId, message } = await request.json();

  if (!conversationId || !message) {
    return jsonResponse({ error: 'Missing required fields' }, 400, corsHeaders);
  }

  const response = await continueChatConversation(conversationId, message, env);

  return jsonResponse(response, 200, corsHeaders);
}

/**
 * Handle study guide generation
 */
async function handleGenerateStudyGuide(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const studyGuideRequest = await request.json();

  if (!studyGuideRequest.sourceId) {
    return jsonResponse({ error: 'Missing sourceId' }, 400, corsHeaders);
  }

  const studyGuide = await generateStudyGuide(studyGuideRequest, env);

  return jsonResponse(studyGuide, 200, corsHeaders);
}

/**
 * Handle study plan generation
 */
async function handleGenerateStudyPlan(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { studyGuide, targetDays } = await request.json();

  if (!studyGuide || !targetDays) {
    return jsonResponse({ error: 'Missing required fields' }, 400, corsHeaders);
  }

  const plan = await generateStudyPlan(studyGuide, targetDays, env);

  return jsonResponse(plan, 200, corsHeaders);
}

/**
 * Handle flashcard generation
 */
async function handleGenerateFlashcards(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const flashcardRequest = await request.json();

  if (!flashcardRequest.sourceId) {
    return jsonResponse({ error: 'Missing sourceId' }, 400, corsHeaders);
  }

  const flashcards = await generateFlashcards(flashcardRequest, env);

  return jsonResponse(flashcards, 200, corsHeaders);
}

/**
 * Handle cloze card generation
 */
async function handleGenerateClozeCards(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { sourceId, count } = await request.json();

  if (!sourceId) {
    return jsonResponse({ error: 'Missing sourceId' }, 400, corsHeaders);
  }

  const cards = await generateClozeCards(sourceId, count || 10, env);

  return jsonResponse({ cards }, 200, corsHeaders);
}

/**
 * Handle audio overview generation
 */
async function handleGenerateAudioOverview(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const audioRequest = await request.json();

  if (!audioRequest.sourceId) {
    return jsonResponse({ error: 'Missing sourceId' }, 400, corsHeaders);
  }

  const audioOverview = await generateAudioOverview(audioRequest, env);

  return jsonResponse(audioOverview, 200, corsHeaders);
}

// ==================== YouTube Handlers ====================

/**
 * Handle YouTube key moments generation
 */
async function handleYouTubeKeyMoments(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const { title, description, targetDuration = 60 } = await request.json() as {
      title: string;
      description?: string;
      targetDuration?: number;
    };

    if (!title) {
      return jsonResponse({ error: 'Missing title' }, 400, corsHeaders);
    }

    const systemPrompt = `You are an expert at identifying educational moments in video content.
Based on a video's title and description, suggest 3-5 clip timestamps that would make great short-form educational content.

Return JSON with this exact format:
{
  "keyMoments": [
    {
      "startTime": 0,
      "endTime": ${targetDuration},
      "title": "Hook/Introduction",
      "description": "Brief description",
      "importance": 9
    }
  ]
}

Only respond with valid JSON, no other text.`;

    const prompt = `Video Title: ${title}
Description: ${description || 'No description available'}

Generate key moments for ${targetDuration}-second clips.`;

    const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    // Extract JSON from response
    const responseText = response.response || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return jsonResponse(parsed, 200, corsHeaders);
    }

    // Fallback if no JSON found
    return jsonResponse({
      keyMoments: [
        {
          startTime: 0,
          endTime: targetDuration,
          title: `Introduction: ${title.slice(0, 40)}`,
          description: 'Opening segment',
          importance: 9,
        },
        {
          startTime: targetDuration,
          endTime: targetDuration * 2,
          title: 'Main Content',
          description: 'Core concepts',
          importance: 8,
        },
        {
          startTime: targetDuration * 2,
          endTime: targetDuration * 3,
          title: 'Key Takeaways',
          description: 'Summary points',
          importance: 7,
        },
      ],
    }, 200, corsHeaders);
  } catch (error) {
    console.error('Error generating key moments:', error);
    // Return default moments on error
    const { title = 'Video', targetDuration = 60 } = await request.json().catch(() => ({})) as {
      title?: string;
      targetDuration?: number;
    };
    return jsonResponse({
      keyMoments: [
        {
          startTime: 0,
          endTime: targetDuration,
          title: `Introduction: ${(title || 'Video').slice(0, 40)}`,
          description: 'Opening segment',
          importance: 9,
        },
        {
          startTime: targetDuration,
          endTime: targetDuration * 2,
          title: 'Main Content',
          description: 'Core concepts',
          importance: 8,
        },
      ],
    }, 200, corsHeaders);
  }
}

// ==================== YouTube Transcript Handler ====================

/**
 * Handle YouTube transcript extraction
 * Uses YouTube's timedtext API with proper URL handling
 */
async function handleYouTubeTranscript(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const { videoId } = await request.json() as { videoId: string };

    if (!videoId) {
      return jsonResponse({ error: 'Missing videoId' }, 400, corsHeaders);
    }

    // Get video metadata via oEmbed first
    let title = 'Unknown Title';
    let channelName = 'Unknown';

    try {
      const oEmbedResponse = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (oEmbedResponse.ok) {
        const oEmbed = await oEmbedResponse.json() as { title?: string; author_name?: string };
        title = oEmbed.title || title;
        channelName = oEmbed.author_name || channelName;
      }
    } catch {
      // Ignore oEmbed errors
    }

    // Try to get captions via timedtext API directly
    // This is YouTube's public API for captions
    const languages = ['en', 'en-US', 'en-GB', 'a.en']; // Try different English variants
    let transcript = '';
    let duration: number | undefined;

    for (const lang of languages) {
      try {
        // Try auto-generated captions format
        const timedtextUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=json3`;
        const response = await fetch(timedtextUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        if (response.ok) {
          const text = await response.text();
          if (text && text.trim().startsWith('{')) {
            const data = JSON.parse(text) as { events?: Array<{ segs?: Array<{ utf8?: string }>; dDurationMs?: number }> };
            if (data.events && data.events.length > 0) {
              const parts: string[] = [];
              let totalDuration = 0;

              for (const event of data.events) {
                if (event.dDurationMs) {
                  totalDuration = Math.max(totalDuration, event.dDurationMs);
                }
                if (event.segs) {
                  for (const seg of event.segs) {
                    if (seg.utf8 && seg.utf8.trim() && seg.utf8.trim() !== '\n') {
                      parts.push(seg.utf8.replace(/\n/g, ' ').trim());
                    }
                  }
                }
              }

              transcript = parts.join(' ').replace(/\s+/g, ' ').trim();
              duration = Math.floor(totalDuration / 1000);
              break;
            }
          }
        }
      } catch {
        // Try next language
      }
    }

    // If no transcript found via API, try scraping the page
    if (!transcript) {
      try {
        const videoPageResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        });

        const html = await videoPageResponse.text();

        // Extract title from page if not already set
        if (title === 'Unknown Title') {
          const titleMatch = html.match(/<title>([^<]+)<\/title>/);
          if (titleMatch) {
            title = titleMatch[1].replace(' - YouTube', '').trim();
          }
        }

        // Extract duration
        if (!duration) {
          const durationMatch = html.match(/"lengthSeconds":"(\d+)"/);
          if (durationMatch) {
            duration = parseInt(durationMatch[1]);
          }
        }

        // Try to find caption tracks in the page
        const captionMatch = html.match(/"captionTracks":\s*(\[[\s\S]*?\])/);

        if (captionMatch) {
          try {
            const tracks = JSON.parse(captionMatch[1].replace(/\\"/g, '"')) as Array<{ baseUrl: string; languageCode: string }>;
            const engTrack = tracks.find(t => t.languageCode === 'en' || t.languageCode.startsWith('en')) || tracks[0];

            if (engTrack && engTrack.baseUrl) {
              let captionUrl = engTrack.baseUrl
                .replace(/\\u0026/g, '&')
                .replace(/\\u003d/g, '=');

              if (!captionUrl.includes('fmt=')) {
                captionUrl += '&fmt=json3';
              }

              const captionRes = await fetch(captionUrl);
              if (captionRes.ok) {
                const captionText = await captionRes.text();
                const captionData = JSON.parse(captionText) as { events?: Array<{ segs?: Array<{ utf8?: string }> }> };

                if (captionData.events) {
                  const parts: string[] = [];
                  for (const event of captionData.events) {
                    if (event.segs) {
                      for (const seg of event.segs) {
                        if (seg.utf8 && seg.utf8.trim() && seg.utf8 !== '\n') {
                          parts.push(seg.utf8.replace(/\n/g, ' ').trim());
                        }
                      }
                    }
                  }
                  transcript = parts.join(' ').replace(/\s+/g, ' ').trim();
                }
              }
            }
          } catch {
            // Parsing failed
          }
        }
      } catch {
        // Page scraping failed
      }
    }

    // If still no transcript, use AI to generate a summary from title/description
    if (!transcript) {
      // Try to generate content summary using AI
      const aiPrompt = `Video Title: "${title}" by ${channelName}. This is a YouTube video. Since the transcript is not available, please provide a brief summary of what this video might be about based on the title, and note that the full transcript was not available.`;

      try {
        const aiResponse = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
          messages: [
            { role: 'system', content: 'You are a helpful assistant. Generate a brief educational summary based on video metadata.' },
            { role: 'user', content: aiPrompt },
          ],
          temperature: 0.7,
          max_tokens: 500,
        });

        transcript = `[Note: Auto-generated captions not available for this video]\n\n${aiResponse.response || ''}\n\nOriginal video: ${title} by ${channelName}`;
      } catch {
        transcript = `[Video: ${title} by ${channelName}]\n\nTranscript not available. This video does not have auto-generated captions enabled. Please try a different video or add the content manually.`;
      }

      return jsonResponse({
        transcript,
        title,
        duration,
        channelName,
        hasTranscript: false,
        wordCount: transcript.split(/\s+/).length,
      }, 200, corsHeaders);
    }

    return jsonResponse({
      transcript,
      title,
      duration,
      channelName,
      hasTranscript: true,
      wordCount: transcript.split(/\s+/).length,
    }, 200, corsHeaders);
  } catch (error) {
    console.error('YouTube transcript error:', error);
    return jsonResponse({
      error: 'Failed to extract transcript',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500, corsHeaders);
  }
}

// ==================== Embed Handler ====================

/**
 * Generate embeddings for text
 */
async function handleEmbed(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const { text, sourceId, chunkIndex } = await request.json() as {
      text: string;
      sourceId: string;
      chunkIndex: number;
    };

    if (!text || !sourceId) {
      return jsonResponse({ error: 'Missing text or sourceId' }, 400, corsHeaders);
    }

    // Generate embedding using the existing function
    const embedding = await generateEmbedding(text, env);

    // Store in Vectorize
    const vectorId = `${sourceId}-chunk-${chunkIndex}`;
    await env.VECTORIZE.upsert([{
      id: vectorId,
      values: embedding,
      metadata: {
        sourceId,
        content: text.slice(0, 1000), // Store first 1000 chars as metadata
        chunkIndex,
      },
    }]);

    return jsonResponse({
      success: true,
      vectorId,
    }, 200, corsHeaders);
  } catch (error) {
    console.error('Embed error:', error);
    return jsonResponse({
      error: 'Failed to generate embedding',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500, corsHeaders);
  }
}

// ==================== OCR Handler ====================

/**
 * Extract text from images using AI vision
 */
async function handleOCR(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const { imageUrl } = await request.json() as { imageUrl: string };

    if (!imageUrl) {
      return jsonResponse({ error: 'Missing imageUrl' }, 400, corsHeaders);
    }

    // Fetch the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Use Llama 3.2 Vision for OCR
    const response = await env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please extract all text from this image. If there is no text, describe what you see. Format the output as plain text, preserving the original structure as much as possible.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 2000,
    });

    const text = response.response || '';

    return jsonResponse({
      text,
      success: true,
    }, 200, corsHeaders);
  } catch (error) {
    console.error('OCR error:', error);
    return jsonResponse({
      error: 'Failed to extract text from image',
      message: error instanceof Error ? error.message : 'Unknown error',
      text: '',
    }, 500, corsHeaders);
  }
}

// ==================== Transcription Handler ====================

/**
 * Transcribe audio files
 */
async function handleTranscribe(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const { audioUrl } = await request.json() as { audioUrl: string };

    if (!audioUrl) {
      return jsonResponse({ error: 'Missing audioUrl' }, 400, corsHeaders);
    }

    // Fetch the audio file
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch audio: ${audioResponse.status}`);
    }

    const audioBuffer = await audioResponse.arrayBuffer();

    // Use Whisper for transcription
    const response = await env.AI.run('@cf/openai/whisper', {
      audio: [...new Uint8Array(audioBuffer)],
    });

    const transcript = response.text || '';

    return jsonResponse({
      transcript,
      success: true,
      duration: response.duration,
    }, 200, corsHeaders);
  } catch (error) {
    console.error('Transcription error:', error);
    return jsonResponse({
      error: 'Failed to transcribe audio',
      message: error instanceof Error ? error.message : 'Unknown error',
      transcript: '',
    }, 500, corsHeaders);
  }
}

// ==================== Test AI Handler ====================

/**
 * Simple test endpoint to verify AI is working
 */
async function handleTestAI(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const { prompt = 'Say hello in JSON format: {"message": "hello"}' } = await request.json() as { prompt?: string };

    const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        { role: 'system', content: 'You are a helpful assistant. Respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 256,
    });

    return jsonResponse({
      success: true,
      response: response.response,
    }, 200, corsHeaders);
  } catch (error) {
    console.error('Test AI error:', error);
    return jsonResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, 500, corsHeaders);
  }
}

// ==================== Direct Content Handlers ====================

/**
 * Handle direct summary generation
 */
async function handleDirectSummary(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const summaryRequest = await request.json();

    if (!summaryRequest.content || !summaryRequest.title) {
      return jsonResponse({ error: 'Missing content or title' }, 400, corsHeaders);
    }

    const summary = await generateDirectSummary(summaryRequest, env);

    return jsonResponse(summary, 200, corsHeaders);
  } catch (error) {
    console.error('Direct summary error:', error);
    return jsonResponse({
      error: 'Summary generation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500, corsHeaders);
  }
}

/**
 * Handle direct flashcard generation
 */
async function handleDirectFlashcards(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const flashcardRequest = await request.json();

    if (!flashcardRequest.content || !flashcardRequest.title) {
      return jsonResponse({ error: 'Missing content or title' }, 400, corsHeaders);
    }

    const flashcards = await generateDirectFlashcards(flashcardRequest, env);

    return jsonResponse(flashcards, 200, corsHeaders);
  } catch (error) {
    console.error('Direct flashcard error:', error);
    return jsonResponse({
      error: 'Flashcard generation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500, corsHeaders);
  }
}

/**
 * Handle direct table generation
 */
async function handleDirectTable(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const tableRequest = await request.json();

    if (!tableRequest.content || !tableRequest.title) {
      return jsonResponse({ error: 'Missing content or title' }, 400, corsHeaders);
    }

    const tables = await generateDirectTable(tableRequest, env);

    return jsonResponse(tables, 200, corsHeaders);
  } catch (error) {
    console.error('Direct table error:', error);
    return jsonResponse({
      error: 'Table generation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500, corsHeaders);
  }
}

// ==================== Universal Generate Handler ====================

/**
 * Universal generate endpoint for notebook outputs
 * Handles all output types: SUMMARY, STUDY_GUIDE, FAQ, FLASHCARD_DECK, QUIZ, MIND_MAP, AUDIO_OVERVIEW, etc.
 */
async function handleGenerate(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const body = await request.json() as {
      prompt: string;
      context: string;
      outputType: string;
      options?: Record<string, unknown>;
    };

    const { prompt, context, outputType, options } = body;

    if (!context) {
      return jsonResponse({ error: 'Missing context' }, 400, corsHeaders);
    }

    // Truncate context if too long (Llama has context limits)
    const maxContextLength = 12000;
    const truncatedContext = context.length > maxContextLength
      ? context.substring(0, maxContextLength) + '\n\n[Content truncated...]'
      : context;

    // Build system prompt based on output type
    const systemPrompt = `You are an expert educational content generator.
${prompt}

CRITICAL: You MUST respond with ONLY valid JSON. No markdown formatting, no code blocks, no explanations. Just pure JSON.`;

    // Generate content using Llama 3.3
    const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Here is the source content:\n\n${truncatedContext}` },
      ],
      temperature: 0.5,
      max_tokens: 4096,
    });

    // Parse response
    const responseText = response.response || '';

    // Try to extract JSON from response
    let content: Record<string, unknown> = {};

    try {
      // Try direct parse first
      content = JSON.parse(responseText);
    } catch {
      // Try to extract JSON from markdown code block
      const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        try {
          content = JSON.parse(codeBlockMatch[1].trim());
        } catch {
          // Try to find any JSON object or array
          const jsonMatch = responseText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
          if (jsonMatch) {
            try {
              content = JSON.parse(jsonMatch[1]);
            } catch {
              // Return raw text if all parsing fails
              content = { raw: responseText, parseError: true };
            }
          } else {
            content = { raw: responseText, parseError: true };
          }
        }
      } else {
        // Try to find any JSON object or array
        const jsonMatch = responseText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
        if (jsonMatch) {
          try {
            content = JSON.parse(jsonMatch[1]);
          } catch {
            content = { raw: responseText, parseError: true };
          }
        } else {
          content = { raw: responseText, parseError: true };
        }
      }
    }

    // For AUDIO_OVERVIEW, we need to also generate the audio
    if (outputType === 'AUDIO_OVERVIEW') {
      try {
        // Extract script from content if available
        const script = content.script as Array<{ speaker: string; text: string }> | undefined;

        if (script && Array.isArray(script)) {
          // Generate audio using MeloTTS for the combined script
          const fullText = script.map(s => `${s.speaker}: ${s.text}`).join(' ');

          // Limit text for TTS (MeloTTS has limits)
          const ttsText = fullText.substring(0, 3000);

          const ttsResponse = await env.AI.run('@cf/myshell-ai/melotts', {
            text: ttsText,
            lang: 'en',
          });

          // Convert response to base64 audio URL
          if (ttsResponse && ttsResponse instanceof ArrayBuffer) {
            const bytes = new Uint8Array(ttsResponse);
            const chunkSize = 8192;
            let base64 = '';
            for (let i = 0; i < bytes.length; i += chunkSize) {
              const chunk = bytes.slice(i, i + chunkSize);
              base64 += String.fromCharCode(...chunk);
            }
            content.audioUrl = `data:audio/wav;base64,${btoa(base64)}`;
          }
        }
      } catch (ttsError) {
        console.error('TTS generation error:', ttsError);
        // Continue without audio - transcript is still valuable
      }
    }

    return jsonResponse({ content }, 200, corsHeaders);
  } catch (error) {
    console.error('Generate error:', error);
    return jsonResponse({
      error: 'Generation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500, corsHeaders);
  }
}

// ==================== Utility Functions ====================

/**
 * Create JSON response with CORS headers
 */
function jsonResponse(
  data: unknown,
  status: number = 200,
  corsHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}
