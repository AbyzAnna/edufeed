import type {
  Env,
  DirectSummaryRequest,
  DirectSummaryResponse,
  DirectFlashcardsRequest,
  DirectFlashcardsResponse,
  DirectTableRequest,
  DirectTableResponse,
} from '../types/env';
import { generateJSON, generateText } from './llm';

/**
 * Generate summary directly from content (no embeddings required)
 */
export async function generateDirectSummary(
  request: DirectSummaryRequest,
  env: Env
): Promise<DirectSummaryResponse> {
  const { content, title, includeAudio = false, length = 'medium', style = 'professional' } = request;

  const lengthGuide = {
    short: { words: 150, keyPoints: 3 },
    medium: { words: 300, keyPoints: 5 },
    long: { words: 500, keyPoints: 7 },
  };

  const styleGuide = {
    academic: 'Use formal academic language with precise terminology.',
    casual: 'Use friendly, conversational language that\'s easy to understand.',
    professional: 'Use clear, professional language suitable for learning.',
  };

  const systemPrompt = `You are an expert content summarizer. ${styleGuide[style]}
You MUST respond with ONLY valid JSON, no other text. Example:
{"title":"Summary","content":"The text...","keyPoints":["Point 1"],"highlights":["Fact 1"],"readTime":60}`;

  const userPrompt = `Summarize this content (${lengthGuide[length].words} words, ${lengthGuide[length].keyPoints} key points):

Title: ${title}
Content: ${content.slice(0, 8000)}

Respond with JSON only:
{"title":"string","content":"string","keyPoints":["string"],"highlights":["string"],"readTime":number}`;

  try {
    // Direct AI call without generateJSON wrapper
    const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 2048,
    });

    // Get response - Workers AI may return pre-parsed JSON or string
    let result: Record<string, unknown>;

    if (typeof response === 'object' && response !== null) {
      const respObj = response as Record<string, unknown>;
      // Check if response itself is the result (already parsed JSON)
      if (respObj.title || respObj.content || respObj.keyPoints) {
        result = respObj;
      } else if (typeof respObj.response === 'object') {
        // Response contains parsed JSON in .response
        result = respObj.response as Record<string, unknown>;
      } else if (typeof respObj.response === 'string') {
        // Response is a string that needs parsing
        const jsonMatch = respObj.response.match(/\{[\s\S]*\}/);
        result = JSON.parse(jsonMatch ? jsonMatch[0] : respObj.response);
      } else {
        result = respObj;
      }
    } else if (typeof response === 'string') {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      result = JSON.parse(jsonMatch ? jsonMatch[0] : response);
    } else {
      throw new Error('Invalid response type');
    }

    console.log('Parsed result:', JSON.stringify(result).substring(0, 300));

    return {
      title: result.title || title,
      content: result.content || '',
      keyPoints: result.keyPoints || [],
      highlights: result.highlights || [],
      audioScript: includeAudio ? result.audioScript : undefined,
      readTime: result.readTime || 60,
    };
  } catch (error) {
    console.error('Error in generateDirectSummary:', error);
    // Return a fallback summary
    return {
      title: `Summary: ${title}`,
      content: content.slice(0, 500) + '...',
      keyPoints: ['Key information from the content'],
      highlights: ['Main highlight'],
      readTime: 60,
    };
  }
}

/**
 * Generate flashcards directly from content (no embeddings required)
 */
export async function generateDirectFlashcards(
  request: DirectFlashcardsRequest,
  env: Env
): Promise<DirectFlashcardsResponse> {
  const { content, title, count = 10, difficulty = 'medium', cardStyle = 'mixed' } = request;

  const styleInstructions = {
    definition: 'definition-style (term on front, definition on back)',
    question: 'question-answer (question on front, answer on back)',
    cloze: 'fill-in-blank (sentence with blank on front, word on back)',
    mixed: 'mix of styles',
  };

  const systemPrompt = `You are an expert educator. Create ${count} flashcards (${difficulty} difficulty, ${styleInstructions[cardStyle]}).
Respond with ONLY valid JSON, no other text. Example:
{"flashcards":[{"front":"What is X?","back":"X is...","hint":"Think about..."}]}`;

  const userPrompt = `Create ${count} flashcards from this content:

Title: ${title}
Content: ${content.slice(0, 6000)}

JSON response format:
{"flashcards":[{"front":"question","back":"answer","hint":"optional hint or null"}]}`;

  try {
    const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 4096,
    });

    // Get response - Workers AI may return pre-parsed JSON or string
    let result: Record<string, unknown>;

    if (typeof response === 'object' && response !== null) {
      const respObj = response as Record<string, unknown>;
      // Check if response itself is the result (already parsed JSON)
      if (respObj.flashcards) {
        result = respObj;
      } else if (typeof respObj.response === 'object') {
        result = respObj.response as Record<string, unknown>;
      } else if (typeof respObj.response === 'string') {
        const jsonMatch = respObj.response.match(/\{[\s\S]*\}/);
        result = JSON.parse(jsonMatch ? jsonMatch[0] : respObj.response);
      } else {
        result = respObj;
      }
    } else if (typeof response === 'string') {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      result = JSON.parse(jsonMatch ? jsonMatch[0] : response);
    } else {
      throw new Error('Invalid response type');
    }

    console.log('Parsed flashcard result:', JSON.stringify(result).substring(0, 300));

    return {
      flashcards: result.flashcards || [],
      metadata: {
        totalGenerated: result.flashcards?.length || 0,
        difficulty,
      },
    };
  } catch (error) {
    console.error('Error in generateDirectFlashcards:', error);
    // Return fallback flashcard
    return {
      flashcards: [
        { front: `What is ${title}?`, back: content.slice(0, 200), hint: null },
      ],
      metadata: { totalGenerated: 1, difficulty },
    };
  }
}

/**
 * Generate tables directly from content (no embeddings required)
 */
export async function generateDirectTable(
  request: DirectTableRequest,
  env: Env
): Promise<DirectTableResponse> {
  const { content, title, tableType = 'auto', maxRows = 10, maxColumns = 5 } = request;

  const tableTypeGuide = {
    comparison: 'comparison (differences/similarities)',
    timeline: 'timeline (chronological events)',
    definitions: 'definitions (terms and explanations)',
    data: 'data (numerical/categorical)',
    auto: 'appropriate type for content',
  };

  const systemPrompt = `You are an expert at organizing information into tables. Create ${tableTypeGuide[tableType]} tables (max ${maxRows} rows, ${maxColumns} columns).
Respond with ONLY valid JSON, no other text. Example:
{"tables":[{"tableTitle":"Title","headers":["Col1","Col2"],"rows":[["A","B"]],"caption":"Description"}]}`;

  const userPrompt = `Create tables from this content:

Title: ${title}
Content: ${content.slice(0, 6000)}

JSON format:
{"tables":[{"tableTitle":"string","headers":["string"],"rows":[["string"]],"caption":"string"}]}`;

  try {
    const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 4096,
    });

    // Get response - Workers AI may return pre-parsed JSON or string
    let result: Record<string, unknown>;

    if (typeof response === 'object' && response !== null) {
      const respObj = response as Record<string, unknown>;
      // Check if response itself is the result (already parsed JSON)
      if (respObj.tables) {
        result = respObj;
      } else if (typeof respObj.response === 'object') {
        result = respObj.response as Record<string, unknown>;
      } else if (typeof respObj.response === 'string') {
        const jsonMatch = respObj.response.match(/\{[\s\S]*\}/);
        result = JSON.parse(jsonMatch ? jsonMatch[0] : respObj.response);
      } else {
        result = respObj;
      }
    } else if (typeof response === 'string') {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      result = JSON.parse(jsonMatch ? jsonMatch[0] : response);
    } else {
      throw new Error('Invalid response type');
    }

    console.log('Parsed table result:', JSON.stringify(result).substring(0, 300));

    return {
      tables: result.tables || [],
    };
  } catch (error) {
    console.error('Error in generateDirectTable:', error);
    // Return fallback table
    return {
      tables: [
        {
          tableTitle: `Key Information: ${title}`,
          headers: ['Topic', 'Details'],
          rows: [['Content', content.slice(0, 100)]],
          caption: 'Summary table',
        },
      ],
    };
  }
}
