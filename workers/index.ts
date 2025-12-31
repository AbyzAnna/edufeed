import type { Env } from './types/env';
import { chatWithDocument, continueChatConversation } from './lib/chat';
import { generateStudyGuide, generateStudyPlan } from './lib/study-guide';
import { generateFlashcards, generateClozeCards } from './lib/flashcards';
import { generateAudioOverview } from './lib/audio-overview';
import { storeDocumentEmbeddings, deleteSourceEmbeddings } from './lib/embeddings';
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

        // YouTube key moments generation
        case path === '/api/youtube/key-moments' && request.method === 'POST':
          return handleYouTubeKeyMoments(request, env, corsHeaders);

        // Direct content generation (no embeddings required)
        case path === '/api/content/summary' && request.method === 'POST':
          return handleDirectSummary(request, env, corsHeaders);

        case path === '/api/content/flashcards' && request.method === 'POST':
          return handleDirectFlashcards(request, env, corsHeaders);

        case path === '/api/content/table' && request.method === 'POST':
          return handleDirectTable(request, env, corsHeaders);

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
