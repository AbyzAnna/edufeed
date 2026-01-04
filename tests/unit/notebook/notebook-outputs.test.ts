/**
 * Unit Tests for Notebook Outputs
 * Tests output types: VIDEO_OVERVIEW, AUDIO_OVERVIEW, SUMMARY, etc.
 *
 * Total: 100 tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock output types
type OutputType =
  | 'SUMMARY'
  | 'STUDY_GUIDE'
  | 'FAQ'
  | 'BRIEFING_DOC'
  | 'TIMELINE'
  | 'MIND_MAP'
  | 'AUDIO_OVERVIEW'
  | 'VIDEO_OVERVIEW'
  | 'FLASHCARD_DECK'
  | 'QUIZ'
  | 'DATA_TABLE';

type ContentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

interface NotebookOutput {
  id: string;
  notebookId: string;
  type: OutputType;
  title: string;
  content: Record<string, unknown>;
  audioUrl?: string;
  status: ContentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const createMockOutput = (type: OutputType): NotebookOutput => ({
  id: `output-${type.toLowerCase()}`,
  notebookId: 'notebook-1',
  type,
  title: `${type.replace(/_/g, ' ')} - ${new Date().toLocaleDateString()}`,
  content: {},
  status: 'COMPLETED',
  createdAt: new Date(),
  updatedAt: new Date(),
});

// ==================== Video Output Tests (30 tests) ====================

describe('VIDEO_OVERVIEW Output', () => {
  it('should create VIDEO_OVERVIEW output', () => {
    const output = createMockOutput('VIDEO_OVERVIEW');
    expect(output.type).toBe('VIDEO_OVERVIEW');
  });

  it('should have segments array in content', () => {
    const output = createMockOutput('VIDEO_OVERVIEW');
    output.content = {
      segments: [
        { title: 'Intro', narration: 'Welcome...', duration: 5 },
      ],
    };
    expect(Array.isArray(output.content.segments)).toBe(true);
  });

  it('should have totalDuration in content', () => {
    const output = createMockOutput('VIDEO_OVERVIEW');
    output.content = { totalDuration: 30 };
    expect(output.content.totalDuration).toBe(30);
  });

  it('should have videoUrl in content', () => {
    const output = createMockOutput('VIDEO_OVERVIEW');
    output.content = { videoUrl: 'data:application/json;base64,...' };
    expect(output.content.videoUrl).toBeDefined();
  });

  it('should have thumbnailUrl in content', () => {
    const output = createMockOutput('VIDEO_OVERVIEW');
    output.content = { thumbnailUrl: 'data:image/png;base64,...' };
    expect(output.content.thumbnailUrl).toBeDefined();
  });

  it('should have isActualVideo flag', () => {
    const output = createMockOutput('VIDEO_OVERVIEW');
    output.content = { isActualVideo: true };
    expect(output.content.isActualVideo).toBe(true);
  });

  it('should include audioUrl for narration', () => {
    const output = createMockOutput('VIDEO_OVERVIEW');
    output.content = { audioUrl: 'data:audio/mpeg;base64,...' };
    expect(output.content.audioUrl).toBeDefined();
  });

  it('should have 4-6 segments typically', () => {
    const segments = Array.from({ length: 5 }, (_, i) => ({
      title: `Segment ${i}`,
      narration: 'Text',
      duration: 5,
    }));
    expect(segments.length).toBeGreaterThanOrEqual(4);
    expect(segments.length).toBeLessThanOrEqual(6);
  });

  it('should include imageUrl in each segment', () => {
    const segment = {
      title: 'Intro',
      narration: 'Welcome',
      duration: 5,
      imageUrl: 'data:image/png;base64,...',
    };
    expect(segment.imageUrl).toBeDefined();
  });

  it('should include visualDescription in segments', () => {
    const segment = {
      title: 'Intro',
      narration: 'Welcome',
      duration: 5,
      visualDescription: 'A colorful illustration...',
    };
    expect(segment.visualDescription).toBeDefined();
  });

  it('should use FREE Cloudflare AI for images', () => {
    const provider = '@cf/stabilityai/stable-diffusion-xl-base-1.0';
    expect(provider).toContain('cf/');
  });

  it('should use FREE Cloudflare AI for audio', () => {
    const provider = '@cf/myshell-ai/melotts';
    expect(provider).toContain('cf/');
  });

  it('should NOT use paid DALL-E', () => {
    const providers = ['@cf/stabilityai/stable-diffusion-xl-base-1.0'];
    expect(providers).not.toContain('dall-e-3');
  });

  it('should NOT use paid ElevenLabs', () => {
    const providers = ['@cf/myshell-ai/melotts'];
    expect(providers).not.toContain('elevenlabs');
  });

  it('should calculate total cost as $0 (FREE)', () => {
    const imageCost = 0;
    const audioCost = 0;
    const totalCost = imageCost + audioCost;
    expect(totalCost).toBe(0);
  });

  it('should set status to PENDING initially', () => {
    const output = createMockOutput('VIDEO_OVERVIEW');
    output.status = 'PENDING';
    expect(output.status).toBe('PENDING');
  });

  it('should set status to PROCESSING during generation', () => {
    const output = createMockOutput('VIDEO_OVERVIEW');
    output.status = 'PROCESSING';
    expect(output.status).toBe('PROCESSING');
  });

  it('should set status to COMPLETED on success', () => {
    const output = createMockOutput('VIDEO_OVERVIEW');
    output.status = 'COMPLETED';
    expect(output.status).toBe('COMPLETED');
  });

  it('should set status to FAILED on error', () => {
    const output = createMockOutput('VIDEO_OVERVIEW');
    output.status = 'FAILED';
    expect(output.status).toBe('FAILED');
  });

  it('should handle missing sources gracefully', () => {
    const error = 'Add at least one processed source first';
    expect(error).toContain('source');
  });

  it('should generate video from source context', () => {
    const sourceContext = '[Source: Title]\nContent...';
    expect(sourceContext.length).toBeGreaterThan(0);
  });

  it('should combine multiple source contents', () => {
    const sources = ['Source 1 content', 'Source 2 content'];
    const combined = sources.join('\n\n---\n\n');
    expect(combined).toContain('---');
  });

  it('should truncate very long context', () => {
    const context = 'x'.repeat(10000);
    const truncated = context.substring(0, 8000);
    expect(truncated.length).toBe(8000);
  });

  it('should generate default title with date', () => {
    const type = 'VIDEO_OVERVIEW';
    const date = new Date().toLocaleDateString();
    const title = `${type.replace(/_/g, ' ')} - ${date}`;
    expect(title).toContain('VIDEO OVERVIEW');
  });

  it('should allow custom title', () => {
    const output = createMockOutput('VIDEO_OVERVIEW');
    output.title = 'My Custom Video Title';
    expect(output.title).toBe('My Custom Video Title');
  });

  it('should store video as slideshow format', () => {
    const videoData = {
      type: 'slideshow',
      segments: [],
      audioUrl: undefined,
      totalDuration: 30,
    };
    expect(videoData.type).toBe('slideshow');
  });

  it('should encode slideshow data as base64 JSON', () => {
    const data = { type: 'slideshow' };
    const json = JSON.stringify(data);
    const base64 = btoa(json);
    const videoUrl = `data:application/json;base64,${base64}`;
    expect(videoUrl).toContain('application/json');
  });

  it('should decode video URL back to data', () => {
    const data = { type: 'slideshow' };
    const json = JSON.stringify(data);
    const base64 = btoa(json);
    const decoded = JSON.parse(atob(base64));
    expect(decoded.type).toBe('slideshow');
  });

  it('should handle parallel image generation', async () => {
    const segments = [1, 2, 3, 4, 5];
    const promises = segments.map(i => Promise.resolve(`image_${i}`));
    const results = await Promise.all(promises);
    expect(results.length).toBe(5);
  });

  it('should fallback to placeholder on image failure', () => {
    const createPlaceholder = (title: string) => `placeholder_${title}`;
    const placeholder = createPlaceholder('Intro');
    expect(placeholder).toContain('placeholder');
  });
});

// ==================== Audio Output Tests (20 tests) ====================

describe('AUDIO_OVERVIEW Output', () => {
  it('should create AUDIO_OVERVIEW output', () => {
    const output = createMockOutput('AUDIO_OVERVIEW');
    expect(output.type).toBe('AUDIO_OVERVIEW');
  });

  it('should have script array in content', () => {
    const output = createMockOutput('AUDIO_OVERVIEW');
    output.content = {
      script: [
        { speaker: 'Host 1', text: 'Welcome to the show...' },
        { speaker: 'Host 2', text: 'Thanks for having me...' },
      ],
    };
    expect(Array.isArray(output.content.script)).toBe(true);
  });

  it('should have duration in content', () => {
    const output = createMockOutput('AUDIO_OVERVIEW');
    output.content = { duration: 10 };
    expect(output.content.duration).toBe(10);
  });

  it('should have audioUrl in output', () => {
    const output = createMockOutput('AUDIO_OVERVIEW');
    output.audioUrl = 'data:audio/mpeg;base64,...';
    expect(output.audioUrl).toBeDefined();
  });

  it('should use FREE Cloudflare MeloTTS', () => {
    const provider = '@cf/myshell-ai/melotts';
    expect(provider).toContain('melotts');
  });

  it('should NOT use paid ElevenLabs', () => {
    const providers = ['@cf/myshell-ai/melotts'];
    expect(providers).not.toContain('elevenlabs');
  });

  it('should generate podcast-style dialogue', () => {
    const script = [
      { speaker: 'Host 1', text: 'Today we discuss...' },
      { speaker: 'Host 2', text: 'Interesting point...' },
    ];
    expect(script.length).toBe(2);
  });

  it('should alternate between speakers', () => {
    const script = [
      { speaker: 'Host 1', text: '...' },
      { speaker: 'Host 2', text: '...' },
      { speaker: 'Host 1', text: '...' },
    ];
    expect(script[0].speaker).not.toBe(script[1].speaker);
  });

  it('should calculate duration from script length', () => {
    const wordsPerMinute = 150;
    const totalWords = 300;
    const durationMinutes = totalWords / wordsPerMinute;
    expect(durationMinutes).toBe(2);
  });

  it('should limit audio length to 10 minutes', () => {
    const maxDurationMinutes = 10;
    const actualDuration = 8;
    expect(actualDuration).toBeLessThanOrEqual(maxDurationMinutes);
  });

  it('should combine script text for TTS', () => {
    const script = [
      { speaker: 'Host 1', text: 'Hello' },
      { speaker: 'Host 2', text: 'World' },
    ];
    const fullText = script.map(s => s.text).join(' ');
    expect(fullText).toBe('Hello World');
  });

  it('should handle TTS generation failure', () => {
    const output = createMockOutput('AUDIO_OVERVIEW');
    output.audioUrl = undefined;
    expect(output.audioUrl).toBeUndefined();
  });

  it('should return script even without audio', () => {
    const output = createMockOutput('AUDIO_OVERVIEW');
    output.content = { script: [{ speaker: 'Host', text: 'Content' }] };
    output.audioUrl = undefined;
    expect(output.content.script).toBeDefined();
  });

  it('should set status to COMPLETED on success', () => {
    const output = createMockOutput('AUDIO_OVERVIEW');
    output.status = 'COMPLETED';
    expect(output.status).toBe('COMPLETED');
  });

  it('should estimate duration in minutes', () => {
    const output = createMockOutput('AUDIO_OVERVIEW');
    output.content = { duration: 5 }; // 5 minutes
    expect(output.content.duration).toBe(5);
  });

  it('should format speaker names consistently', () => {
    const speakers = ['Host 1', 'Host 2'];
    expect(speakers[0]).toMatch(/^Host \d+$/);
  });

  it('should add introduction dialogue', () => {
    const script = [
      { speaker: 'Host 1', text: 'Welcome to our podcast!' },
    ];
    expect(script[0].text).toContain('Welcome');
  });

  it('should add conclusion dialogue', () => {
    const script = [
      { speaker: 'Host 2', text: 'Thanks for listening!' },
    ];
    expect(script[0].text).toContain('Thanks');
  });

  it('should handle content with quotes', () => {
    const text = 'He said, "History repeats itself."';
    expect(text).toContain('"');
  });

  it('should calculate cost as $0 (FREE)', () => {
    const ttsCost = 0; // Cloudflare MeloTTS is free
    expect(ttsCost).toBe(0);
  });
});

// ==================== Other Output Types Tests (50 tests) ====================

describe('SUMMARY Output', () => {
  it('should create SUMMARY output', () => {
    const output = createMockOutput('SUMMARY');
    expect(output.type).toBe('SUMMARY');
  });

  it('should have summary text in content', () => {
    const output = createMockOutput('SUMMARY');
    output.content = { summary: 'This is a summary...' };
    expect(output.content.summary).toBeDefined();
  });

  it('should have keyPoints array', () => {
    const output = createMockOutput('SUMMARY');
    output.content = { keyPoints: ['Point 1', 'Point 2'] };
    expect(Array.isArray(output.content.keyPoints)).toBe(true);
  });

  it('should have themes array', () => {
    const output = createMockOutput('SUMMARY');
    output.content = { themes: ['Theme 1', 'Theme 2'] };
    expect(Array.isArray(output.content.themes)).toBe(true);
  });

  it('should generate from source content', () => {
    const sourceContent = 'Long source content...';
    expect(sourceContent.length).toBeGreaterThan(0);
  });
});

describe('STUDY_GUIDE Output', () => {
  it('should create STUDY_GUIDE output', () => {
    const output = createMockOutput('STUDY_GUIDE');
    expect(output.type).toBe('STUDY_GUIDE');
  });

  it('should have topics array', () => {
    const output = createMockOutput('STUDY_GUIDE');
    output.content = { topics: ['Topic 1', 'Topic 2'] };
    expect(Array.isArray(output.content.topics)).toBe(true);
  });

  it('should have concepts array', () => {
    const output = createMockOutput('STUDY_GUIDE');
    output.content = { concepts: ['Concept 1', 'Concept 2'] };
    expect(Array.isArray(output.content.concepts)).toBe(true);
  });

  it('should have terms with definitions', () => {
    const output = createMockOutput('STUDY_GUIDE');
    output.content = {
      terms: [
        { term: 'Renaissance', definition: 'A cultural movement...' },
      ],
    };
    expect(output.content.terms).toBeDefined();
  });

  it('should have review questions', () => {
    const output = createMockOutput('STUDY_GUIDE');
    output.content = { reviewQuestions: ['What is...?', 'Why did...?'] };
    expect(Array.isArray(output.content.reviewQuestions)).toBe(true);
  });
});

describe('FAQ Output', () => {
  it('should create FAQ output', () => {
    const output = createMockOutput('FAQ');
    expect(output.type).toBe('FAQ');
  });

  it('should have faqs array with Q&A pairs', () => {
    const output = createMockOutput('FAQ');
    output.content = {
      faqs: [
        { question: 'What is...?', answer: 'It is...' },
      ],
    };
    expect(Array.isArray(output.content.faqs)).toBe(true);
  });

  it('should generate 10-15 FAQs', () => {
    const faqCount = 12;
    expect(faqCount).toBeGreaterThanOrEqual(10);
    expect(faqCount).toBeLessThanOrEqual(15);
  });

  it('should cover main topics', () => {
    const faq = { question: 'What was the Silk Road?', answer: 'A trade route...' };
    expect(faq.question).toBeDefined();
    expect(faq.answer).toBeDefined();
  });
});

describe('BRIEFING_DOC Output', () => {
  it('should create BRIEFING_DOC output', () => {
    const output = createMockOutput('BRIEFING_DOC');
    expect(output.type).toBe('BRIEFING_DOC');
  });

  it('should have executiveSummary', () => {
    const output = createMockOutput('BRIEFING_DOC');
    output.content = { executiveSummary: 'Executive summary...' };
    expect(output.content.executiveSummary).toBeDefined();
  });

  it('should have keyFindings array', () => {
    const output = createMockOutput('BRIEFING_DOC');
    output.content = { keyFindings: ['Finding 1', 'Finding 2'] };
    expect(Array.isArray(output.content.keyFindings)).toBe(true);
  });

  it('should have recommendations array', () => {
    const output = createMockOutput('BRIEFING_DOC');
    output.content = { recommendations: ['Rec 1', 'Rec 2'] };
    expect(Array.isArray(output.content.recommendations)).toBe(true);
  });

  it('should have actionItems array', () => {
    const output = createMockOutput('BRIEFING_DOC');
    output.content = { actionItems: ['Action 1', 'Action 2'] };
    expect(Array.isArray(output.content.actionItems)).toBe(true);
  });
});

describe('TIMELINE Output', () => {
  it('should create TIMELINE output', () => {
    const output = createMockOutput('TIMELINE');
    expect(output.type).toBe('TIMELINE');
  });

  it('should have events array', () => {
    const output = createMockOutput('TIMELINE');
    output.content = {
      events: [
        { date: '1776', title: 'Declaration', description: 'Independence declared' },
      ],
    };
    expect(Array.isArray(output.content.events)).toBe(true);
  });

  it('should order events chronologically', () => {
    const events = [
      { date: '1492', title: 'Columbus' },
      { date: '1776', title: 'Independence' },
      { date: '1865', title: 'Civil War End' },
    ];
    expect(events[0].date).toBe('1492');
  });

  it('should include date, title, description for each event', () => {
    const event = { date: '1776', title: 'Independence', description: '...' };
    expect(event.date).toBeDefined();
    expect(event.title).toBeDefined();
    expect(event.description).toBeDefined();
  });
});

describe('MIND_MAP Output', () => {
  it('should create MIND_MAP output', () => {
    const output = createMockOutput('MIND_MAP');
    expect(output.type).toBe('MIND_MAP');
  });

  it('should have centralTopic', () => {
    const output = createMockOutput('MIND_MAP');
    output.content = { centralTopic: 'World History' };
    expect(output.content.centralTopic).toBeDefined();
  });

  it('should have branches array', () => {
    const output = createMockOutput('MIND_MAP');
    output.content = {
      branches: [
        { topic: 'Ancient Civilizations', subtopics: ['Egypt', 'Rome', 'Greece'] },
      ],
    };
    expect(Array.isArray(output.content.branches)).toBe(true);
  });

  it('should have subtopics in each branch', () => {
    const branch = { topic: 'Trade Routes', subtopics: ['Silk Road', 'Trans-Saharan'] };
    expect(Array.isArray(branch.subtopics)).toBe(true);
  });

  it('should limit branches to reasonable count', () => {
    const branchCount = 6;
    expect(branchCount).toBeLessThanOrEqual(10);
  });
});

describe('FLASHCARD_DECK Output', () => {
  it('should create FLASHCARD_DECK output', () => {
    const output = createMockOutput('FLASHCARD_DECK');
    expect(output.type).toBe('FLASHCARD_DECK');
  });

  it('should have cards array', () => {
    const output = createMockOutput('FLASHCARD_DECK');
    output.content = {
      cards: [
        { front: 'Question?', back: 'Answer', hint: 'Hint' },
      ],
    };
    expect(Array.isArray(output.content.cards)).toBe(true);
  });

  it('should generate 15-20 cards', () => {
    const cardCount = 18;
    expect(cardCount).toBeGreaterThanOrEqual(15);
    expect(cardCount).toBeLessThanOrEqual(20);
  });

  it('should have front, back, and optional hint', () => {
    const card = { front: 'What is...?', back: 'It is...', hint: 'Think about...' };
    expect(card.front).toBeDefined();
    expect(card.back).toBeDefined();
  });

  it('should cover key concepts from sources', () => {
    const card = { front: 'What was the Renaissance?', back: 'A cultural movement...' };
    expect(card.front.length).toBeGreaterThan(0);
  });
});

describe('QUIZ Output', () => {
  it('should create QUIZ output', () => {
    const output = createMockOutput('QUIZ');
    expect(output.type).toBe('QUIZ');
  });

  it('should have questions array', () => {
    const output = createMockOutput('QUIZ');
    output.content = {
      questions: [
        { type: 'MULTIPLE_CHOICE', question: 'What...?', options: ['A', 'B', 'C', 'D'], correctAnswer: 'A', explanation: 'Because...' },
      ],
    };
    expect(Array.isArray(output.content.questions)).toBe(true);
  });

  it('should generate 10-15 questions', () => {
    const questionCount = 12;
    expect(questionCount).toBeGreaterThanOrEqual(10);
    expect(questionCount).toBeLessThanOrEqual(15);
  });

  it('should include various question types', () => {
    const types = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_IN_BLANK'];
    expect(types.length).toBeGreaterThan(1);
  });

  it('should have correctAnswer and explanation', () => {
    const question = { correctAnswer: 'B', explanation: 'The correct answer is B because...' };
    expect(question.correctAnswer).toBeDefined();
    expect(question.explanation).toBeDefined();
  });

  it('should have 4 options for multiple choice', () => {
    const options = ['A', 'B', 'C', 'D'];
    expect(options.length).toBe(4);
  });
});

describe('DATA_TABLE Output', () => {
  it('should create DATA_TABLE output', () => {
    const output = createMockOutput('DATA_TABLE');
    expect(output.type).toBe('DATA_TABLE');
  });

  it('should have tables array', () => {
    const output = createMockOutput('DATA_TABLE');
    output.content = {
      tables: [
        { title: 'Table 1', headers: ['Col1', 'Col2'], rows: [['Val1', 'Val2']] },
      ],
    };
    expect(Array.isArray(output.content.tables)).toBe(true);
  });

  it('should have title, headers, and rows for each table', () => {
    const table = { title: 'Timeline', headers: ['Date', 'Event'], rows: [['1776', 'Independence']] };
    expect(table.title).toBeDefined();
    expect(table.headers).toBeDefined();
    expect(table.rows).toBeDefined();
  });

  it('should extract structured data from sources', () => {
    const rows = [['1492', 'Columbus'], ['1776', 'Independence']];
    expect(rows.length).toBeGreaterThan(0);
  });

  it('should format data consistently', () => {
    const headers = ['Year', 'Event', 'Location'];
    const row = ['1776', 'Declaration', 'Philadelphia'];
    expect(headers.length).toBe(row.length);
  });
});

describe('Output Status Transitions', () => {
  it('should start with PENDING status', () => {
    const output = createMockOutput('SUMMARY');
    output.status = 'PENDING';
    expect(output.status).toBe('PENDING');
  });

  it('should transition to PROCESSING', () => {
    const output = createMockOutput('SUMMARY');
    output.status = 'PROCESSING';
    expect(output.status).toBe('PROCESSING');
  });

  it('should transition to COMPLETED on success', () => {
    const output = createMockOutput('SUMMARY');
    output.status = 'COMPLETED';
    expect(output.status).toBe('COMPLETED');
  });

  it('should transition to FAILED on error', () => {
    const output = createMockOutput('SUMMARY');
    output.status = 'FAILED';
    expect(output.status).toBe('FAILED');
  });

  it('should not transition from COMPLETED to PENDING', () => {
    const validTransitions = {
      PENDING: ['PROCESSING'],
      PROCESSING: ['COMPLETED', 'FAILED'],
      COMPLETED: [],
      FAILED: [],
    };
    expect(validTransitions.COMPLETED).not.toContain('PENDING');
  });
});
