import type {
  Env,
  StudyGuideRequest,
  StudyGuideResponse,
  KeyTopic,
  TimelineEvent,
  VocabularyTerm,
} from '../types/env';
import { searchRelevantChunks } from './embeddings';
import { generateJSON, generateText } from './llm';

/**
 * Generate comprehensive study guide from source material
 * Inspired by NotebookLM's study guide feature
 */
export async function generateStudyGuide(
  request: StudyGuideRequest,
  env: Env
): Promise<StudyGuideResponse> {
  const { sourceId, focusAreas = [], difficulty = 'intermediate' } = request;

  // 1. Get all relevant content chunks
  const allChunks = await searchRelevantChunks('main topics and key concepts', sourceId, 20, env);

  const fullContent = allChunks.map((c) => c.content).join('\n\n');

  // 2. Generate overview
  const overview = await generateOverview(fullContent, difficulty, env);

  // 3. Extract key topics with hierarchy
  const keyTopics = await extractKeyTopics(fullContent, focusAreas, env);

  // 4. Generate timeline if content is chronological/historical
  const timeline = await generateTimeline(fullContent, env);

  // 5. Extract important vocabulary
  const vocabulary = await extractVocabulary(fullContent, env);

  // 6. Generate practice questions
  const practiceQuestions = await generatePracticeQuestions(fullContent, difficulty, env);

  // 7. Generate title
  const title = await generateTitle(fullContent, env);

  return {
    title,
    overview,
    keyTopics,
    timeline,
    vocabulary,
    practiceQuestions,
  };
}

/**
 * Generate overview summary
 */
async function generateOverview(
  content: string,
  difficulty: string,
  env: Env
): Promise<string> {
  const systemPrompt = `Create a comprehensive overview of this content suitable for ${difficulty} level learners.
The overview should:
- Summarize the main themes and ideas
- Explain the significance and context
- Be 200-300 words
- Use clear, accessible language`;

  return generateText(content, systemPrompt, env, {
    temperature: 0.6,
    maxTokens: 500,
  });
}

/**
 * Extract key topics with hierarchical structure
 */
async function extractKeyTopics(
  content: string,
  focusAreas: string[],
  env: Env
): Promise<KeyTopic[]> {
  const systemPrompt = `Identify and organize the key topics from this content.
${focusAreas.length > 0 ? `Focus particularly on: ${focusAreas.join(', ')}` : ''}

For each topic, provide:
- Main topic name
- Concise summary (2-3 sentences)
- List of subtopics
- Importance score (1-10)

Return as JSON array following this schema:
[{
  "topic": "Main Topic Name",
  "summary": "Brief explanation...",
  "subtopics": ["subtopic1", "subtopic2"],
  "importance": 8
}]`;

  const prompt = `Content to analyze:\n\n${content.substring(0, 8000)}`; // Limit content length

  const schema = `[{"topic": "...", "summary": "...", "subtopics": [...], "importance": 1-10}]`;

  const topics = await generateJSON<KeyTopic[]>(prompt, systemPrompt, schema, env);

  // Sort by importance
  return topics.sort((a, b) => b.importance - a.importance);
}

/**
 * Generate chronological timeline
 */
async function generateTimeline(content: string, env: Env): Promise<TimelineEvent[] | undefined> {
  const systemPrompt = `Analyze if this content contains chronological/historical events.
If yes, create a timeline of key events.
If no, return empty array.

For each event, provide:
- Date (if mentioned, otherwise null)
- Event name
- Brief description
- Why it's significant

Return as JSON array:
[{
  "date": "1969-07-20" or null,
  "event": "Event name",
  "description": "What happened...",
  "significance": "Why it matters..."
}]`;

  const prompt = `Content to analyze for timeline:\n\n${content.substring(0, 6000)}`;

  try {
    const timeline = await generateJSON<TimelineEvent[]>(
      prompt,
      systemPrompt,
      '[{"date": "...", "event": "...", "description": "...", "significance": "..."}]',
      env
    );

    // Only return timeline if it has events
    return timeline.length > 0 ? timeline : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Extract vocabulary terms with definitions
 */
async function extractVocabulary(content: string, env: Env): Promise<VocabularyTerm[]> {
  const systemPrompt = `Identify important vocabulary terms and concepts from this content.
Focus on:
- Technical terms
- Specialized vocabulary
- Key concepts
- Terms that might be unfamiliar to learners

For each term, provide:
- The term itself
- Clear, concise definition
- Context/example from the source material

Return top 10-15 most important terms as JSON:
[{
  "term": "Term name",
  "definition": "Clear definition...",
  "context": "How it's used in the content..."
}]`;

  const prompt = `Content to analyze:\n\n${content.substring(0, 6000)}`;

  const schema = `[{"term": "...", "definition": "...", "context": "..."}]`;

  return generateJSON<VocabularyTerm[]>(prompt, systemPrompt, schema, env);
}

/**
 * Generate practice questions
 */
async function generatePracticeQuestions(
  content: string,
  difficulty: string,
  env: Env
): Promise<string[]> {
  const systemPrompt = `Generate 8-10 practice questions based on this content.
Difficulty level: ${difficulty}

Questions should:
- Cover different aspects of the material
- Vary in type (recall, analysis, application)
- Be clear and specific
- Encourage deep thinking

Return only a JSON array of question strings (no answers).`;

  const prompt = `Content for questions:\n\n${content.substring(0, 6000)}`;

  const schema = `["Question 1?", "Question 2?", ...]`;

  return generateJSON<string[]>(prompt, systemPrompt, schema, env);
}

/**
 * Generate appropriate title for study guide
 */
async function generateTitle(content: string, env: Env): Promise<string> {
  const systemPrompt = `Generate a clear, descriptive title for a study guide based on this content.
The title should be:
- 5-10 words
- Descriptive of the main topic
- Professional and academic in tone

Return only the title text, nothing else.`;

  const prompt = content.substring(0, 1000);

  return generateText(prompt, systemPrompt, env, {
    temperature: 0.5,
    maxTokens: 50,
  });
}

/**
 * Generate study plan based on content
 */
export async function generateStudyPlan(
  studyGuide: StudyGuideResponse,
  targetDays: number,
  env: Env
): Promise<
  Array<{
    day: number;
    topics: string[];
    tasks: string[];
    estimatedHours: number;
  }>
> {
  const systemPrompt = `Create a ${targetDays}-day study plan based on this study guide.
Distribute topics logically across days, starting with fundamentals.

Return JSON array:
[{
  "day": 1,
  "topics": ["Topic to cover"],
  "tasks": ["Specific task 1", "Specific task 2"],
  "estimatedHours": 2
}]`;

  const prompt = `Study Guide Summary:
Title: ${studyGuide.title}
Key Topics: ${studyGuide.keyTopics.map((t) => t.topic).join(', ')}
Number of vocabulary terms: ${studyGuide.vocabulary.length}
Practice questions: ${studyGuide.practiceQuestions.length}`;

  const schema = `[{"day": 1, "topics": [...], "tasks": [...], "estimatedHours": 1}]`;

  return generateJSON(prompt, systemPrompt, schema, env);
}
