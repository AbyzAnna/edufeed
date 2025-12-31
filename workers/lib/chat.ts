import type { Env, ChatRequest, ChatResponse, Message, SourceCitation } from '../types/env';
import { searchRelevantChunks } from './embeddings';
import { generateWithHistory } from './llm';

/**
 * RAG-based chat with documents
 * Implements NotebookLM-style Q&A with source citations
 */
export async function chatWithDocument(
  request: ChatRequest,
  env: Env
): Promise<ChatResponse> {
  const { sourceId, message, conversationHistory = [] } = request;

  // 1. Search for relevant chunks using semantic search
  const relevantChunks = await searchRelevantChunks(message, sourceId, 5, env);

  // 2. Build context from relevant chunks
  const context = relevantChunks
    .map((chunk, idx) => `[Source ${idx + 1}]\n${chunk.content}`)
    .join('\n\n');

  // 3. Build system prompt
  const systemPrompt = `You are a helpful AI assistant that answers questions based on provided documents.
Use the following context to answer the user's question accurately.
Always cite your sources by referencing [Source N] in your answer.
If the context doesn't contain enough information, say so clearly.

Context:
${context}

Guidelines:
- Be concise but comprehensive
- Use bullet points for lists
- Quote directly when appropriate
- Always cite sources with [Source N]
- If information is not in context, clearly state that`;

  // 4. Build conversation with context
  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: message },
  ];

  // 5. Generate response
  const response = await generateWithHistory(messages, env, {
    temperature: 0.7,
    maxTokens: 1500,
  });

  // 6. Extract source citations from response
  const sources: SourceCitation[] = relevantChunks.map((chunk, idx) => ({
    sourceId: chunk.sourceId,
    chunk: chunk.content.substring(0, 200) + '...',
    page: chunk.metadata.page,
    timestamp: chunk.metadata.timestamp,
    relevance: (5 - idx) / 5, // Simple relevance score based on ranking
  }));

  // 7. Generate conversation ID (in production, store in KV or D1)
  const conversationId = crypto.randomUUID();

  return {
    response,
    sources,
    conversationId,
  };
}

/**
 * Multi-turn conversation with context retention
 */
export async function continueChatConversation(
  conversationId: string,
  message: string,
  env: Env
): Promise<ChatResponse> {
  // Retrieve conversation history from KV
  const historyKey = `chat:${conversationId}`;
  const historyJson = await env.CACHE.get(historyKey);

  const conversationHistory: Message[] = historyJson ? JSON.parse(historyJson) : [];

  // Get the source ID from the first message metadata (stored separately)
  const metadataKey = `chat:meta:${conversationId}`;
  const metadataJson = await env.CACHE.get(metadataKey);
  const metadata = metadataJson ? JSON.parse(metadataJson) : {};

  const sourceId = metadata.sourceId;

  // Continue the conversation
  const response = await chatWithDocument(
    {
      sourceId,
      message,
      conversationHistory,
    },
    env
  );

  // Update conversation history
  conversationHistory.push(
    { role: 'user', content: message },
    { role: 'assistant', content: response.response }
  );

  // Store updated history (expire after 24 hours)
  await env.CACHE.put(historyKey, JSON.stringify(conversationHistory), {
    expirationTtl: 86400,
  });

  return response;
}

/**
 * Generate follow-up questions based on conversation
 */
export async function generateFollowUpQuestions(
  conversationHistory: Message[],
  env: Env
): Promise<string[]> {
  const systemPrompt = `Based on the conversation, generate 3 insightful follow-up questions
that would help the user learn more about the topic. Return only a JSON array of strings.`;

  const conversationText = conversationHistory
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  const response = await generateWithHistory(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: conversationText },
    ],
    env,
    { temperature: 0.8 }
  );

  // Parse JSON response
  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return [];
  }

  return JSON.parse(jsonMatch[0]) as string[];
}

/**
 * Analyze user's understanding level based on questions
 */
export async function analyzeUnderstandingLevel(
  conversationHistory: Message[],
  env: Env
): Promise<{
  level: 'beginner' | 'intermediate' | 'advanced';
  knowledgeGaps: string[];
  recommendations: string[];
}> {
  const systemPrompt = `Analyze this conversation to determine the user's understanding level.
Respond with JSON:
{
  "level": "beginner|intermediate|advanced",
  "knowledgeGaps": ["gap1", "gap2"],
  "recommendations": ["recommendation1", "recommendation2"]
}`;

  const conversationText = conversationHistory
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  const response = await generateWithHistory(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: conversationText },
    ],
    env,
    { temperature: 0.5 }
  );

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to analyze understanding level');
  }

  return JSON.parse(jsonMatch[0]);
}
