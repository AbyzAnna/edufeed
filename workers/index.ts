import type { Env } from './types/env';
import { chatWithDocument, continueChatConversation } from './lib/chat';
import { generateStudyGuide, generateStudyPlan } from './lib/study-guide';
import { generateFlashcards, generateClozeCards } from './lib/flashcards';
import { generateAudioOverview } from './lib/audio-overview';
import { generateVideoOverview } from './lib/video-overview';
import { storeDocumentEmbeddings, deleteSourceEmbeddings, generateEmbedding } from './lib/embeddings';
import { generateDirectSummary, generateDirectFlashcards, generateDirectTable } from './lib/direct-content';
import { moderateContent } from './lib/moderation';

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

        // Video overview endpoints
        case path === '/api/video-overview/generate' && request.method === 'POST':
          return handleGenerateVideoOverview(request, env, corsHeaders);

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

        // Notebook chat endpoint (returns plain text responses)
        case path === '/api/notebook-chat' && request.method === 'POST':
          return handleNotebookChat(request, env, corsHeaders);

        // Content moderation endpoint
        case path === '/moderation' && request.method === 'POST':
          return handleModeration(request, env, corsHeaders);

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

/**
 * Handle video overview generation
 * Generates AI images + audio slideshow video
 */
async function handleGenerateVideoOverview(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const { sourceId, context } = await request.json() as {
      sourceId?: string;
      context: string;
    };

    if (!context) {
      return jsonResponse({ error: 'Missing context' }, 400, corsHeaders);
    }

    const videoOverview = await generateVideoOverview(
      sourceId || 'direct',
      context,
      env
    );

    return jsonResponse(videoOverview, 200, corsHeaders);
  } catch (error) {
    console.error('Video overview error:', error);
    return jsonResponse({
      error: 'Video generation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500, corsHeaders);
  }
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
 * YouTube Innertube API client configuration
 * This uses YouTube's internal API which is more reliable than the deprecated timedtext API
 */
const YOUTUBE_INNERTUBE_CONFIG = {
  client: {
    clientName: 'WEB',
    clientVersion: '2.20240101.00.00',
  },
  // Note: This is the public YouTube innertube API key used by the official YouTube web client
  // It's designed to be public but should be moved to env for easy rotation if needed
  apiKey: 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8',
};

/**
 * Extract transcript using YouTube's innertube API
 * This uses the same approach as the youtube-transcript npm package
 */
async function extractYouTubeTranscript(videoId: string): Promise<{
  transcript: string;
  title: string;
  channelName: string;
  duration?: number;
  hasTranscript: boolean;
}> {
  let title = 'Unknown Title';
  let channelName = 'Unknown';
  let duration: number | undefined;
  let transcript = '';

  // Step 1: Get video metadata via oEmbed (fast, reliable)
  try {
    const oEmbedResponse = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (oEmbedResponse.ok) {
      const oEmbed = await oEmbedResponse.json() as { title?: string; author_name?: string };
      title = oEmbed.title || title;
      channelName = oEmbed.author_name || channelName;
    }
  } catch {
    // Continue without oEmbed
  }

  // Step 2: Fetch the video page to get ytInitialPlayerResponse
  try {
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const pageResponse = await fetch(watchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Dest': 'document',
      },
    });

    const html = await pageResponse.text();

    // Extract title if not found via oEmbed
    if (title === 'Unknown Title') {
      const titleMatch = html.match(/"title":\s*"([^"]+)"/);
      if (titleMatch) {
        try {
          title = JSON.parse(`"${titleMatch[1]}"`);
        } catch {
          title = titleMatch[1];
        }
      }
    }

    // Extract duration
    const durationMatch = html.match(/"lengthSeconds":\s*"(\d+)"/);
    if (durationMatch) {
      duration = parseInt(durationMatch[1]);
    }

    // Extract channel name
    if (channelName === 'Unknown') {
      const channelMatch = html.match(/"ownerChannelName":\s*"([^"]+)"/);
      if (channelMatch) {
        try {
          channelName = JSON.parse(`"${channelMatch[1]}"`);
        } catch {
          channelName = channelMatch[1];
        }
      }
    }

    // Method 1: Extract captionTracks from ytInitialPlayerResponse
    // Look for the full captionTracks array
    const captionTracksMatch = html.match(/"captionTracks":\s*(\[.*?\])(?=\s*,\s*")/s);

    if (captionTracksMatch) {
      try {
        // Clean and parse the JSON
        let tracksJson = captionTracksMatch[1]
          .replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
          .replace(/\\u0026/g, '&')
          .replace(/\\u003d/g, '=');

        const tracks = JSON.parse(tracksJson) as Array<{
          baseUrl: string;
          languageCode: string;
          kind?: string;
          vssId?: string;
        }>;

        // Prefer English auto-generated, then English, then any
        const engAsr = tracks.find(t => t.vssId?.includes('.en') || (t.languageCode === 'en' && t.kind === 'asr'));
        const engManual = tracks.find(t => t.languageCode === 'en' && t.kind !== 'asr');
        const anyEng = tracks.find(t => t.languageCode?.startsWith('en'));
        const track = engAsr || engManual || anyEng || tracks[0];

        if (track?.baseUrl) {
          // Decode the URL properly
          let captionUrl = track.baseUrl
            .replace(/\\u0026/g, '&')
            .replace(/\\u003d/g, '=')
            .replace(/\\u002f/g, '/');

          // Request JSON format for easier parsing
          if (!captionUrl.includes('fmt=')) {
            captionUrl += '&fmt=json3';
          }

          const captionResponse = await fetch(captionUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
              'Accept': '*/*',
            },
          });

          if (captionResponse.ok) {
            const captionText = await captionResponse.text();

            if (captionText.trim().startsWith('{')) {
              const captionData = JSON.parse(captionText) as {
                events?: Array<{
                  segs?: Array<{ utf8?: string }>;
                  tStartMs?: number;
                  dDurationMs?: number;
                }>;
              };

              if (captionData.events && captionData.events.length > 0) {
                const parts: string[] = [];

                for (const event of captionData.events) {
                  if (event.segs) {
                    for (const seg of event.segs) {
                      const text = seg.utf8;
                      if (text && text.trim() && text !== '\n') {
                        parts.push(text.replace(/\n/g, ' ').trim());
                      }
                    }
                  }
                }

                transcript = parts.join(' ').replace(/\s+/g, ' ').trim();
              }
            }
          }
        }
      } catch (err) {
        console.error('Caption track parsing error:', err);
      }
    }

    // Method 2: Try using YouTube's get_transcript endpoint (innertube)
    if (!transcript) {
      try {
        // First get the transcript params from the page
        const paramsMatch = html.match(/"serializedShareEntity":"([^"]+)"/);
        const continuationMatch = html.match(/"continuation":"([^"]+)"/);

        // Use innertube player API to get caption info
        const innertubeResponse = await fetch(
          'https://www.youtube.com/youtubei/v1/player?key=' + YOUTUBE_INNERTUBE_CONFIG.apiKey + '&prettyPrint=false',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
              'Origin': 'https://www.youtube.com',
              'Referer': `https://www.youtube.com/watch?v=${videoId}`,
            },
            body: JSON.stringify({
              context: {
                client: {
                  clientName: 'WEB',
                  clientVersion: '2.20240101.00.00',
                  hl: 'en',
                  gl: 'US',
                },
              },
              videoId,
              playbackContext: {
                contentPlaybackContext: {
                  signatureTimestamp: 19950,
                },
              },
            }),
          }
        );

        if (innertubeResponse.ok) {
          const playerData = await innertubeResponse.json() as {
            captions?: {
              playerCaptionsTracklistRenderer?: {
                captionTracks?: Array<{
                  baseUrl: string;
                  languageCode: string;
                  kind?: string;
                }>;
              };
            };
            videoDetails?: {
              title?: string;
              author?: string;
              lengthSeconds?: string;
            };
          };

          // Update metadata
          if (playerData.videoDetails) {
            if (title === 'Unknown Title' && playerData.videoDetails.title) {
              title = playerData.videoDetails.title;
            }
            if (channelName === 'Unknown' && playerData.videoDetails.author) {
              channelName = playerData.videoDetails.author;
            }
            if (!duration && playerData.videoDetails.lengthSeconds) {
              duration = parseInt(playerData.videoDetails.lengthSeconds);
            }
          }

          const captionTracks = playerData.captions?.playerCaptionsTracklistRenderer?.captionTracks;
          if (captionTracks && captionTracks.length > 0) {
            const engTrack = captionTracks.find(t =>
              t.languageCode === 'en' || t.languageCode?.startsWith('en')
            ) || captionTracks[0];

            if (engTrack?.baseUrl) {
              let captionUrl = engTrack.baseUrl;
              if (!captionUrl.includes('fmt=')) {
                captionUrl += '&fmt=json3';
              }

              const captionResponse = await fetch(captionUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                },
              });

              if (captionResponse.ok) {
                const captionText = await captionResponse.text();
                if (captionText.trim().startsWith('{')) {
                  const captionData = JSON.parse(captionText) as {
                    events?: Array<{ segs?: Array<{ utf8?: string }> }>;
                  };

                  if (captionData.events) {
                    const parts: string[] = [];
                    for (const event of captionData.events) {
                      if (event.segs) {
                        for (const seg of event.segs) {
                          if (seg.utf8?.trim() && seg.utf8 !== '\n') {
                            parts.push(seg.utf8.replace(/\n/g, ' ').trim());
                          }
                        }
                      }
                    }
                    transcript = parts.join(' ').replace(/\s+/g, ' ').trim();
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Innertube API error:', err);
      }
    }
  } catch (err) {
    console.error('Video page fetch error:', err);
  }

  return {
    transcript,
    title,
    channelName,
    duration,
    hasTranscript: transcript.length > 0,
  };
}

/**
 * Handle YouTube transcript extraction
 * Uses YouTube's innertube API for reliable transcript extraction
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

    // Extract transcript using innertube API
    const result = await extractYouTubeTranscript(videoId);
    let { transcript, title, channelName, duration, hasTranscript } = result;

    // If no transcript found, use AI to generate a summary
    if (!hasTranscript) {
      const aiPrompt = `Video Title: "${title}" by ${channelName}. This is a YouTube video. Since the transcript is not available, please provide a brief educational summary of what this video might be about based on the title. Keep it concise and informative.`;

      try {
        const aiResponse = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
          messages: [
            { role: 'system', content: 'You are an educational assistant. Generate a brief, informative summary based on video metadata. Be concise and focus on educational value.' },
            { role: 'user', content: aiPrompt },
          ],
          temperature: 0.7,
          max_tokens: 500,
        });

        transcript = `[Note: Auto-generated captions not available for this video]\n\n${aiResponse.response || ''}\n\nOriginal video: ${title} by ${channelName}`;
      } catch {
        transcript = `[Video: ${title} by ${channelName}]\n\nTranscript not available. This video may not have captions enabled. You can still use the video for learning - try watching it directly or adding notes manually.`;
      }
    }

    return jsonResponse({
      transcript,
      title,
      duration,
      channelName,
      hasTranscript,
      wordCount: transcript.split(/\s+/).filter(Boolean).length,
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

    // Helper function to try parsing JSON
    const tryParseJSON = (text: string): Record<string, unknown> | null => {
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    };

    // Helper function to extract and parse JSON from text
    const extractJSON = (text: string | unknown): Record<string, unknown> | null => {
      // Handle non-string input
      if (typeof text !== 'string') {
        if (typeof text === 'object' && text !== null) {
          return text as Record<string, unknown>;
        }
        return null;
      }

      // Try direct parse first
      const direct = tryParseJSON(text);
      if (direct) return direct;

      // Clean the text - remove any leading/trailing whitespace and markdown
      const cleaned = text.trim()
        .replace(/^```(?:json)?\s*/g, '')
        .replace(/\s*```$/g, '');

      const cleanedDirect = tryParseJSON(cleaned);
      if (cleanedDirect) return cleanedDirect;

      // Try to find JSON object in the text
      const jsonObjectMatch = text.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        const parsed = tryParseJSON(jsonObjectMatch[0]);
        if (parsed) return parsed;
      }

      // Try to find JSON array
      const jsonArrayMatch = text.match(/\[[\s\S]*\]/);
      if (jsonArrayMatch) {
        const parsed = tryParseJSON(jsonArrayMatch[0]);
        if (parsed) return parsed;
      }

      return null;
    };

    const parsed = extractJSON(responseText);
    if (parsed) {
      content = parsed;
    } else {
      // Return raw text if all parsing fails
      content = { raw: responseText, parseError: true };
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

          // MeloTTS uses 'prompt' parameter, not 'text'
          // Response is an object with 'audio' property containing base64-encoded MP3
          const ttsResponse = await env.AI.run('@cf/myshell-ai/melotts', {
            prompt: ttsText,
            lang: 'en',
          }) as { audio?: string } | ArrayBuffer;

          // Handle new response format: object with audio property (base64 MP3)
          if (ttsResponse && typeof ttsResponse === 'object' && 'audio' in ttsResponse && ttsResponse.audio) {
            content.audioUrl = `data:audio/mpeg;base64,${ttsResponse.audio}`;
          } else if (ttsResponse && ttsResponse instanceof ArrayBuffer) {
            // Fallback: handle legacy ArrayBuffer response
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

// ==================== Notebook Chat Handler ====================

/**
 * Handle notebook chat - returns plain text responses for Q&A
 * This endpoint is designed for conversational Q&A, not structured output generation
 */
async function handleNotebookChat(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const body = await request.json() as {
      message: string;
      context: string;
      conversationHistory?: Array<{ role: string; content: string }>;
    };

    const { message, context, conversationHistory = [] } = body;

    if (!message) {
      return jsonResponse({ error: 'Missing message' }, 400, corsHeaders);
    }

    // Truncate context if too long
    const maxContextLength = 10000;
    const truncatedContext = context && context.length > maxContextLength
      ? context.substring(0, maxContextLength) + '\n\n[Content truncated...]'
      : context || '';

    // Build system prompt for conversational Q&A
    const systemPrompt = `You are a helpful AI study assistant. Your role is to answer questions accurately and helpfully based on the provided notebook content.

RESPONSE GUIDELINES:
- Answer questions directly and concisely
- Keep responses short (2-4 sentences for simple questions)
- Use bullet points for complex topics or lists
- If the answer is in the provided content, cite it naturally
- If asked about something not in the content, provide a helpful general answer
- Be educational and clear
- Never refuse to answer - always try to help

IMPORTANT: Respond in plain text only. Do NOT use JSON format. Just answer naturally.`;

    // Build messages array
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    // Add context as a system message if available
    if (truncatedContext) {
      messages.push({
        role: 'system',
        content: `Here is the notebook content to reference:\n\n${truncatedContext}`,
      });
    }

    // Add conversation history
    for (const msg of conversationHistory.slice(-6)) { // Last 6 messages for context
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    // Add the current message
    messages.push({ role: 'user', content: message });

    // Generate response using Llama 3.3
    const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    });

    const responseText = response.response || '';

    // Clean up the response - remove any accidental JSON formatting
    let cleanResponse = responseText.trim();

    // If the AI accidentally returned JSON, try to extract the text
    if (cleanResponse.startsWith('{') || cleanResponse.startsWith('[')) {
      try {
        const parsed = JSON.parse(cleanResponse);
        // Try to extract meaningful text from JSON
        cleanResponse =
          parsed.response ||
          parsed.answer ||
          parsed.message ||
          parsed.text ||
          parsed.content ||
          parsed.explanation ||
          (typeof parsed === 'object'
            ? Object.values(parsed).find(v => typeof v === 'string' && (v as string).length > 20)
            : null) ||
          cleanResponse;
      } catch {
        // Not valid JSON, use as-is
      }
    }

    return jsonResponse({
      response: cleanResponse,
      success: true,
    }, 200, corsHeaders);
  } catch (error) {
    console.error('Notebook chat error:', error);
    return jsonResponse({
      error: 'Chat failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500, corsHeaders);
  }
}

// ==================== Moderation ====================

/**
 * Handle content moderation request
 */
async function handleModeration(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const { content } = await request.json() as { content?: string };

    if (!content || typeof content !== 'string') {
      return jsonResponse(
        { success: false, error: 'Missing or invalid content field' },
        400,
        corsHeaders
      );
    }

    // Limit content length
    const truncatedContent = content.slice(0, 5000);

    // Run moderation
    const result = await moderateContent(truncatedContent, env);

    return jsonResponse(
      {
        success: true,
        result,
      },
      200,
      corsHeaders
    );
  } catch (error) {
    console.error('Moderation error:', error);
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Moderation failed',
      },
      500,
      corsHeaders
    );
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
