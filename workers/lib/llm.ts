import type { Env, Message } from '../types/env';

/**
 * Call Llama 3.3 70B model via Cloudflare Workers AI
 */
export async function generateText(
  prompt: string,
  systemPrompt?: string,
  env?: Env,
  options: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  } = {}
): Promise<string> {
  if (!env) {
    throw new Error('Environment not provided');
  }

  const messages: Message[] = [];

  if (systemPrompt) {
    messages.push({
      role: 'system',
      content: systemPrompt,
    });
  }

  messages.push({
    role: 'user',
    content: prompt,
  });

  const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 2048,
    stream: options.stream ?? false,
  });

  if (options.stream) {
    // Handle streaming response
    return response as unknown as string;
  }

  // Handle different response formats from Workers AI
  if (typeof response === 'string') {
    return response;
  }

  if (typeof response === 'object' && response !== null) {
    const respObj = response as Record<string, unknown>;
    // Try common response properties
    if (typeof respObj.response === 'string') {
      return respObj.response;
    }
    if (typeof respObj.result === 'string') {
      return respObj.result;
    }
    if (typeof respObj.text === 'string') {
      return respObj.text;
    }
    if (typeof respObj.content === 'string') {
      return respObj.content;
    }
    // Last resort: stringify the object
    console.log('Unknown response format:', JSON.stringify(respObj).substring(0, 500));
    return JSON.stringify(respObj);
  }

  console.log('Unknown response type:', typeof response);
  return String(response || '');
}

/**
 * Generate with conversation history
 */
export async function generateWithHistory(
  messages: Message[],
  env: Env,
  options: {
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<string> {
  const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 2048,
  });

  return response.response;
}

/**
 * Generate structured JSON output
 */
export async function generateJSON<T>(
  prompt: string,
  systemPrompt: string,
  jsonSchema: string,
  env: Env
): Promise<T> {
  const fullPrompt = `${prompt}\n\nIMPORTANT: You MUST respond with ONLY valid JSON matching this schema (no markdown, no explanation, just JSON):\n${jsonSchema}`;

  const response = await generateText(fullPrompt, systemPrompt + '\nRespond with valid JSON only. No markdown code blocks, no explanations.', env, {
    temperature: 0.3, // Lower temperature for more structured output
    maxTokens: 4096,
  });

  // Ensure response is a string
  if (!response || typeof response !== 'string') {
    console.error('Invalid response type:', typeof response, response);
    throw new Error('Invalid response from AI model');
  }

  // Extract JSON from response (sometimes LLMs add markdown formatting)
  let jsonStr = response.trim();

  // Try to extract from markdown code block first
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  // Try to find JSON object or array
  const jsonObjectMatch = jsonStr.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonObjectMatch) {
    jsonStr = jsonObjectMatch[1];
  }

  if (!jsonStr || (!jsonStr.startsWith('{') && !jsonStr.startsWith('['))) {
    console.error('Failed to extract JSON from response:', response.substring(0, 200));
    throw new Error('Failed to extract JSON from response');
  }

  try {
    return JSON.parse(jsonStr) as T;
  } catch (parseError) {
    console.error('JSON parse error:', parseError, 'Response:', jsonStr.substring(0, 200));
    throw new Error('Failed to parse JSON response');
  }
}

/**
 * Summarize text
 */
export async function summarize(
  text: string,
  maxLength: number = 500,
  env: Env
): Promise<string> {
  const systemPrompt = `You are an expert at creating concise, informative summaries.
Summarize the following text in approximately ${maxLength} characters.
Focus on key points, main ideas, and important details.`;

  return generateText(text, systemPrompt, env, {
    temperature: 0.5,
    maxTokens: Math.ceil(maxLength / 3), // Rough token estimate
  });
}

/**
 * Extract key points from text
 */
export async function extractKeyPoints(
  text: string,
  count: number = 5,
  env: Env
): Promise<string[]> {
  const systemPrompt = `You are an expert at identifying key information.
Extract exactly ${count} key points from the following text.
Return only a JSON array of strings, each representing one key point.`;

  const prompt = `Text to analyze:\n\n${text}`;

  const jsonSchema = `["key point 1", "key point 2", ...]`;

  return generateJSON<string[]>(prompt, systemPrompt, jsonSchema, env);
}

/**
 * Generate questions from content
 */
export async function generateQuestions(
  content: string,
  count: number = 5,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  env: Env
): Promise<Array<{ question: string; answer: string }>> {
  const systemPrompt = `You are an expert educator creating study questions.
Generate exactly ${count} ${difficulty} difficulty questions based on the content.
Each question should have a clear, concise answer.`;

  const jsonSchema = `[{"question": "...", "answer": "..."}]`;

  return generateJSON(content, systemPrompt, jsonSchema, env);
}

/**
 * Detect language and translate if needed
 */
export async function detectAndTranslate(
  text: string,
  targetLanguage: string = 'en',
  env: Env
): Promise<{ detected: string; translated?: string }> {
  const systemPrompt = `Detect the language of the following text.
If it's not ${targetLanguage}, translate it to ${targetLanguage}.
Respond with JSON: {"language": "detected_language", "translation": "translated_text_if_needed"}`;

  return generateJSON(text, systemPrompt, '{"language": "en", "translation": "..."}', env);
}
