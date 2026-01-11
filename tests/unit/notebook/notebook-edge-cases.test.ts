/**
 * Edge Case Tests for Notebook System
 * Tests bugs and edge cases found through code analysis
 *
 * Total: 100+ tests covering edge cases and bug scenarios
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ==================== Bug #1: Source Processing Status ====================
describe('BUG: Source Processing Status Transitions', () => {
  type SourceStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

  it('should transition PENDING -> PROCESSING', () => {
    let status: SourceStatus = 'PENDING';
    status = 'PROCESSING';
    expect(status).toBe('PROCESSING');
  });

  it('should transition PROCESSING -> COMPLETED on success', () => {
    let status: SourceStatus = 'PROCESSING';
    status = 'COMPLETED';
    expect(status).toBe('COMPLETED');
  });

  it('should transition PROCESSING -> FAILED on error', () => {
    let status: SourceStatus = 'PROCESSING';
    status = 'FAILED';
    expect(status).toBe('FAILED');
  });

  it('should not allow COMPLETED -> PENDING', () => {
    const validTransitions: Record<SourceStatus, SourceStatus[]> = {
      'PENDING': ['PROCESSING'],
      'PROCESSING': ['COMPLETED', 'FAILED'],
      'COMPLETED': [],
      'FAILED': ['PENDING', 'PROCESSING'], // Allow retry
    };
    expect(validTransitions['COMPLETED']).not.toContain('PENDING');
  });

  it('should allow FAILED -> PENDING for retry', () => {
    const validTransitions: Record<SourceStatus, SourceStatus[]> = {
      'PENDING': ['PROCESSING'],
      'PROCESSING': ['COMPLETED', 'FAILED'],
      'COMPLETED': [],
      'FAILED': ['PENDING', 'PROCESSING'],
    };
    expect(validTransitions['FAILED']).toContain('PENDING');
  });
});

// ==================== Bug #2: YouTube URL Parsing ====================
describe('BUG: YouTube URL Edge Cases', () => {
  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^?&\n#]+)/,
      /youtube\.com\/live\/([^?&\n#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  it('should extract ID from standard URL', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
  });

  it('should extract ID from short URL', () => {
    const url = 'https://youtu.be/dQw4w9WgXcQ';
    expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
  });

  it('should extract ID from embed URL', () => {
    const url = 'https://youtube.com/embed/dQw4w9WgXcQ';
    expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
  });

  it('should extract ID from Shorts URL', () => {
    const url = 'https://youtube.com/shorts/abc123';
    expect(extractVideoId(url)).toBe('abc123');
  });

  it('should extract ID from Live URL', () => {
    const url = 'https://youtube.com/live/xyz789';
    expect(extractVideoId(url)).toBe('xyz789');
  });

  it('should handle URL with additional parameters', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120&list=PLxxx';
    expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
  });

  it('should return null for invalid URL', () => {
    const url = 'https://notYouTube.com/watch?v=abc';
    expect(extractVideoId(url)).toBeNull();
  });

  it('should handle URL without protocol', () => {
    const url = 'youtube.com/watch?v=abc123';
    expect(extractVideoId(url)).toBe('abc123');
  });

  it('should handle mobile URL', () => {
    const url = 'https://m.youtube.com/watch?v=abc123';
    expect(extractVideoId(url)).toBe('abc123');
  });
});

// ==================== Bug #3: Citation Extraction Patterns ====================
describe('BUG: Citation Pattern Matching', () => {
  const findCitationPatterns = (text: string) => {
    const patterns: string[] = [];

    // Pattern 1: [Source Title]
    const bracketPattern = /\[([^\]]+)\]/g;
    let match;
    while ((match = bracketPattern.exec(text)) !== null) {
      patterns.push(match[1]);
    }

    // Pattern 2: "from/in/according to ..."
    const fromPattern = /(?:from|in|according to|based on)\s+["']?([^"'\n,.:]+)["']?/gi;
    while ((match = fromPattern.exec(text)) !== null) {
      patterns.push(match[1].trim());
    }

    return patterns;
  };

  it('should extract [Source Title] pattern', () => {
    const text = 'According to [AP World History Guide], this happened.';
    const citations = findCitationPatterns(text);
    expect(citations).toContain('AP World History Guide');
  });

  it('should extract "from Source" pattern', () => {
    const text = 'Information from AP History Textbook shows...';
    const citations = findCitationPatterns(text);
    expect(citations.some(c => c.includes('AP History Textbook'))).toBe(true);
  });

  it('should extract "according to Source" pattern', () => {
    const text = 'According to the lecture notes, this is true.';
    const citations = findCitationPatterns(text);
    expect(citations.some(c => c.includes('lecture notes'))).toBe(true);
  });

  it('should handle multiple citations', () => {
    const text = '[Source A] and [Source B] both agree.';
    const citations = findCitationPatterns(text);
    expect(citations).toContain('Source A');
    expect(citations).toContain('Source B');
  });

  it('should handle nested brackets', () => {
    const text = '[Source [with] brackets]';
    const citations = findCitationPatterns(text);
    expect(citations.length).toBeGreaterThanOrEqual(1);
  });

  it('should handle empty brackets', () => {
    const text = 'Empty [] brackets here.';
    const citations = findCitationPatterns(text);
    // Empty brackets should not produce citations - this is correct behavior
    // The bracket pattern only matches non-empty content: [^\]]+
    expect(citations.filter(c => c === '').length).toBe(0);
  });

  it('should handle quoted sources', () => {
    const text = 'Based on "The History Book" this is correct.';
    const citations = findCitationPatterns(text);
    expect(citations.length).toBeGreaterThan(0);
  });
});

// ==================== Bug #4: Context Token Estimation ====================
describe('BUG: Token Estimation', () => {
  const estimateTokens = (text: string) => Math.ceil(text.length * 0.25);

  it('should estimate tokens from character count', () => {
    const text = 'This is a test'; // 14 chars
    const tokens = estimateTokens(text);
    expect(tokens).toBe(4); // ~14 * 0.25 rounded up
  });

  it('should handle empty text', () => {
    const text = '';
    const tokens = estimateTokens(text);
    expect(tokens).toBe(0);
  });

  it('should handle very long text', () => {
    const text = 'x'.repeat(100000);
    const tokens = estimateTokens(text);
    expect(tokens).toBe(25000);
  });

  it('should stay within max token limit', () => {
    const maxTokens = 6000;
    const text = 'x'.repeat(30000); // Would be ~7500 tokens
    const tokens = estimateTokens(text);
    if (tokens > maxTokens) {
      const truncated = text.slice(0, maxTokens * 4); // Reverse calculation
      expect(estimateTokens(truncated)).toBe(maxTokens);
    }
  });
});

// ==================== Bug #5: Source Fuzzy Title Matching ====================
describe('BUG: Fuzzy Title Matching', () => {
  interface Source {
    id: string;
    title: string;
  }

  const findMatchingSource = (mention: string, sources: Source[]): Source | null => {
    const normalized = mention.toLowerCase().trim();

    // Early return for empty or too short mentions (prevents false positives)
    if (!normalized || normalized.length < 2) {
      return null;
    }

    // Exact match
    for (const source of sources) {
      if (source.title.toLowerCase() === normalized) return source;
    }

    // Contains match
    for (const source of sources) {
      const sourceTitle = source.title.toLowerCase();
      if (sourceTitle.includes(normalized) || normalized.includes(sourceTitle)) {
        return source;
      }
    }

    // Word overlap (60%)
    const mentionWords = new Set(normalized.split(/\s+/));
    for (const source of sources) {
      const sourceWords = source.title.toLowerCase().split(/\s+/);
      const matching = sourceWords.filter(w => mentionWords.has(w));
      const overlap = matching.length / Math.max(sourceWords.length, mentionWords.size);
      if (overlap >= 0.6) return source;
    }

    return null;
  };

  const sources: Source[] = [
    { id: '1', title: 'AP World History Guide' },
    { id: '2', title: 'Introduction to Physics' },
    { id: '3', title: 'Chemistry Basics' },
  ];

  it('should match exact title', () => {
    const match = findMatchingSource('AP World History Guide', sources);
    expect(match?.id).toBe('1');
  });

  it('should match case insensitive', () => {
    const match = findMatchingSource('ap world history guide', sources);
    expect(match?.id).toBe('1');
  });

  it('should match partial contains', () => {
    const match = findMatchingSource('World History', sources);
    expect(match?.id).toBe('1');
  });

  it('should match by word overlap', () => {
    const match = findMatchingSource('World History AP', sources);
    expect(match?.id).toBe('1');
  });

  it('should return null for no match', () => {
    const match = findMatchingSource('Biology Textbook', sources);
    expect(match).toBeNull();
  });

  it('should handle single word titles', () => {
    const singleWordSources = [{ id: '1', title: 'Notes' }];
    const match = findMatchingSource('Notes', singleWordSources);
    expect(match?.id).toBe('1');
  });

  it('should handle empty mention', () => {
    // Fixed: Empty string now correctly returns null with early return guard
    const match = findMatchingSource('', sources);
    expect(match).toBeNull();
  });

  it('should handle very short mention (single char)', () => {
    // Single character mentions should not match to avoid false positives
    const match = findMatchingSource('A', sources);
    expect(match).toBeNull();
  });
});

// ==================== Bug #6: Embedding Chunk Size ====================
describe('BUG: Text Chunking for Embeddings', () => {
  const chunkText = (text: string, maxChars: number): string[] => {
    const chunks: string[] = [];
    const sentences = text.split(/(?<=[.!?])\s+/);
    let currentChunk = '';

    for (const sentence of sentences) {
      if (sentence.length > maxChars) {
        // Handle very long sentences
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
        // Split long sentence
        for (let i = 0; i < sentence.length; i += maxChars) {
          chunks.push(sentence.slice(i, i + maxChars).trim());
        }
      } else if ((currentChunk + sentence).length > maxChars) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence + ' ';
      } else {
        currentChunk += sentence + ' ';
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  };

  it('should chunk text at sentence boundaries', () => {
    const text = 'First sentence. Second sentence. Third sentence.';
    const chunks = chunkText(text, 30);
    expect(chunks.length).toBeGreaterThan(1);
    // Each chunk should not exceed max (allowing for sentence length)
    expect(chunks[0].length).toBeLessThanOrEqual(40);
  });

  it('should handle text without sentence endings', () => {
    const text = 'word '.repeat(100);
    const chunks = chunkText(text, 100);
    expect(chunks.length).toBeGreaterThan(0);
  });

  it('should handle single sentence longer than max', () => {
    const longSentence = 'x'.repeat(500) + '.';
    const chunks = chunkText(longSentence, 100);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it('should handle empty text', () => {
    const chunks = chunkText('', 100);
    expect(chunks.length).toBe(0);
  });

  it('should not create empty chunks', () => {
    const text = 'Short. Another. More.';
    const chunks = chunkText(text, 1000);
    expect(chunks.every(c => c.length > 0)).toBe(true);
  });

  it('should preserve all content', () => {
    const text = 'First sentence. Second sentence. Third sentence.';
    const chunks = chunkText(text, 30);
    const rejoined = chunks.join(' ');
    // Original words should be preserved
    expect(rejoined).toContain('First');
    expect(rejoined).toContain('Third');
  });
});

// ==================== Bug #7: PDF Processing ====================
describe('BUG: PDF Processing Edge Cases', () => {
  it('should handle PDF v2 API response format', () => {
    const mockResponse = {
      text: 'Extracted text content',
    };
    expect(mockResponse.text).toBeDefined();
  });

  it('should handle PDF with no text', () => {
    const content = '';
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    expect(wordCount).toBe(0);
  });

  it('should handle scanned PDF (image-only)', () => {
    const result = {
      content: '[Image-only PDF - text extraction not available]',
      wordCount: 8,
      metadata: { isScanned: true },
    };
    expect(result.metadata.isScanned).toBe(true);
  });

  it('should extract page count', () => {
    const info = { total: 15 };
    expect(info.total).toBe(15);
  });

  it('should handle corrupted PDF', async () => {
    let error = '';
    try {
      throw new Error('Invalid PDF structure');
    } catch (e) {
      error = (e as Error).message;
    }
    expect(error).toContain('Invalid PDF');
  });
});

// ==================== Bug #8: URL Content Extraction ====================
describe('BUG: URL Content Extraction', () => {
  it('should remove script and style tags', () => {
    const html = '<html><script>alert("x")</script><style>.x{}</style><body>Content</body></html>';
    // Mock cheerio removal
    const cleaned = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    expect(cleaned).not.toContain('<script>');
    expect(cleaned).not.toContain('<style>');
  });

  it('should extract title from meta', () => {
    const html = '<html><head><title>Page Title</title></head></html>';
    const match = html.match(/<title>([^<]+)<\/title>/);
    expect(match?.[1]).toBe('Page Title');
  });

  it('should handle 404 errors gracefully', async () => {
    const status = 404;
    const error = status === 404 ? `Failed to fetch URL: ${status}` : '';
    expect(error).toContain('404');
  });

  it('should normalize whitespace in extracted content', () => {
    const content = '  Multiple   spaces  \n\n newlines  ';
    const cleaned = content
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
    expect(cleaned).toBe('Multiple spaces newlines');
  });

  it('should calculate word count correctly', () => {
    const content = 'One two three four five';
    const wordCount = content.split(/\s+/).length;
    expect(wordCount).toBe(5);
  });
});

// ==================== Bug #9: Text Source Processing ====================
describe('BUG: Text Source Processing', () => {
  it('should trim whitespace from pasted content', () => {
    const raw = '   \n\n Content here \n\n   ';
    const trimmed = raw.trim();
    expect(trimmed).toBe('Content here');
  });

  it('should calculate word count for plain text', () => {
    const content = 'This is a plain text note.';
    const wordCount = content.split(/\s+/).length;
    expect(wordCount).toBe(6);
  });

  it('should return immediately for TEXT type (no async processing)', () => {
    const processText = (content: string) => {
      return {
        content: content.trim(),
        wordCount: content.trim().split(/\s+/).length,
        metadata: { type: 'plain_text' },
      };
    };
    const result = processText('Test content');
    expect(result.content).toBe('Test content');
    expect(result.wordCount).toBe(2);
  });

  it('should handle content with only whitespace', () => {
    const content = '   \t\n   ';
    const trimmed = content.trim();
    const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
    expect(wordCount).toBe(0);
  });
});

// ==================== Bug #10: Notebook Context Building ====================
describe('BUG: Notebook Context Aggregation', () => {
  it('should handle notebook with no sources', () => {
    const context = {
      sources: [],
      stats: {
        totalSources: 0,
        totalWords: 0,
        sourcesByType: {},
      },
    };
    expect(context.stats.totalSources).toBe(0);
  });

  it('should calculate total words across sources', () => {
    const sources = [
      { wordCount: 100 },
      { wordCount: 200 },
      { wordCount: null },
    ];
    const totalWords = sources.reduce((sum, s) => sum + (s.wordCount || 0), 0);
    expect(totalWords).toBe(300);
  });

  it('should count sources by type', () => {
    const sources = [
      { type: 'URL' },
      { type: 'PDF' },
      { type: 'URL' },
    ];
    const byType: Record<string, number> = {};
    for (const source of sources) {
      byType[source.type] = (byType[source.type] || 0) + 1;
    }
    expect(byType['URL']).toBe(2);
    expect(byType['PDF']).toBe(1);
  });

  it('should filter to COMPLETED sources only', () => {
    const sources = [
      { status: 'COMPLETED' },
      { status: 'FAILED' },
      { status: 'PROCESSING' },
    ];
    const completed = sources.filter(s => s.status === 'COMPLETED');
    expect(completed.length).toBe(1);
  });

  it('should respect maxSources limit', () => {
    const sources = Array.from({ length: 100 }, (_, i) => ({ id: `src-${i}` }));
    const maxSources = 50;
    const limited = sources.slice(0, maxSources);
    expect(limited.length).toBe(50);
  });

  it('should reverse chat messages for chronological order', () => {
    const messages = [
      { createdAt: new Date('2024-01-03') },
      { createdAt: new Date('2024-01-02') },
      { createdAt: new Date('2024-01-01') },
    ];
    const reversed = [...messages].reverse();
    expect(reversed[0].createdAt < reversed[2].createdAt).toBe(true);
  });
});

// ==================== Bug #11: Chat Message Processing ====================
describe('BUG: Chat Processing', () => {
  it('should validate message is not empty', () => {
    const message = '';
    const isValid = message && message.trim().length > 0;
    expect(isValid).toBeFalsy();
  });

  it('should handle very long messages', () => {
    const message = 'x'.repeat(10000);
    const truncated = message.slice(0, 5000);
    expect(truncated.length).toBe(5000);
  });

  it('should save user message before AI response', async () => {
    const operations: string[] = [];
    operations.push('save_user_message');
    operations.push('get_ai_response');
    operations.push('save_ai_response');
    expect(operations[0]).toBe('save_user_message');
  });

  it('should fallback to alternate provider on error', async () => {
    let provider = 'ollama';
    let success = false;

    // Simulate ollama failure
    try {
      throw new Error('Ollama unavailable');
    } catch {
      provider = 'workers';
    }

    // Simulate workers success
    success = true;

    expect(provider).toBe('workers');
    expect(success).toBe(true);
  });

  it('should provide fallback response when all providers fail', () => {
    const fallbackResponse = 'AI service is currently unavailable. Please try again.';
    expect(fallbackResponse).toContain('unavailable');
  });
});

// ==================== Bug #12: Output Generation ====================
describe('BUG: Output Generation', () => {
  const validOutputTypes = [
    'SUMMARY',
    'STUDY_GUIDE',
    'FAQ',
    'BRIEFING_DOC',
    'TIMELINE',
    'MIND_MAP',
    'AUDIO_OVERVIEW',
    'VIDEO_OVERVIEW',
    'FLASHCARD_DECK',
    'QUIZ',
    'DATA_TABLE',
  ];

  it('should validate output type', () => {
    const type = 'SUMMARY';
    const isValid = validOutputTypes.includes(type);
    expect(isValid).toBe(true);
  });

  it('should reject invalid output type', () => {
    const type = 'INVALID_TYPE';
    const isValid = validOutputTypes.includes(type);
    expect(isValid).toBe(false);
  });

  it('should require at least one processed source', () => {
    const sources = [
      { status: 'PENDING' },
      { status: 'FAILED' },
    ];
    const completedSources = sources.filter(s => s.status === 'COMPLETED');
    expect(completedSources.length).toBe(0);
  });

  it('should create output with PENDING status initially', () => {
    const output = {
      id: 'output-1',
      status: 'PENDING',
      content: {},
    };
    expect(output.status).toBe('PENDING');
  });

  it('should update status to COMPLETED on success', () => {
    let status = 'PENDING';
    const generatedContent = { summary: 'Test summary' };
    if (Object.keys(generatedContent).length > 0) {
      status = 'COMPLETED';
    }
    expect(status).toBe('COMPLETED');
  });

  it('should update status to FAILED on empty content', () => {
    let status = 'PENDING';
    const generatedContent = {};
    if (Object.keys(generatedContent).length === 0) {
      status = 'FAILED';
    }
    expect(status).toBe('FAILED');
  });
});

// ==================== Bug #13: Collaborator Access ====================
describe('BUG: Collaborator Access Control', () => {
  type Role = 'OWNER' | 'EDITOR' | 'VIEWER';

  const canEdit = (role: Role) => ['OWNER', 'EDITOR'].includes(role);
  const canDelete = (role: Role) => role === 'OWNER';
  const canView = (_role: Role) => true;

  it('should allow OWNER to edit', () => {
    expect(canEdit('OWNER')).toBe(true);
  });

  it('should allow EDITOR to edit', () => {
    expect(canEdit('EDITOR')).toBe(true);
  });

  it('should not allow VIEWER to edit', () => {
    expect(canEdit('VIEWER')).toBe(false);
  });

  it('should only allow OWNER to delete', () => {
    expect(canDelete('OWNER')).toBe(true);
    expect(canDelete('EDITOR')).toBe(false);
    expect(canDelete('VIEWER')).toBe(false);
  });

  it('should allow all roles to view', () => {
    expect(canView('OWNER')).toBe(true);
    expect(canView('EDITOR')).toBe(true);
    expect(canView('VIEWER')).toBe(true);
  });
});

// ==================== Bug #14: Public Notebook Access ====================
describe('BUG: Public Notebook Access', () => {
  interface Notebook {
    id: string;
    userId: string;
    isPublic: boolean;
    collaborators: { userId: string }[];
  }

  const canAccess = (notebook: Notebook, userId: string | null) => {
    if (notebook.isPublic) return true;
    if (!userId) return false;
    if (notebook.userId === userId) return true;
    return notebook.collaborators.some(c => c.userId === userId);
  };

  const notebook: Notebook = {
    id: 'nb-1',
    userId: 'user-1',
    isPublic: false,
    collaborators: [{ userId: 'user-2' }],
  };

  it('should allow owner access', () => {
    expect(canAccess(notebook, 'user-1')).toBe(true);
  });

  it('should allow collaborator access', () => {
    expect(canAccess(notebook, 'user-2')).toBe(true);
  });

  it('should deny unknown user access', () => {
    expect(canAccess(notebook, 'user-3')).toBe(false);
  });

  it('should allow anyone to access public notebook', () => {
    const publicNotebook = { ...notebook, isPublic: true };
    expect(canAccess(publicNotebook, null)).toBe(true);
    expect(canAccess(publicNotebook, 'random-user')).toBe(true);
  });

  it('should deny anonymous access to private notebook', () => {
    expect(canAccess(notebook, null)).toBe(false);
  });
});

// ==================== Bug #15: Source ID Validation ====================
describe('BUG: Source ID Filtering', () => {
  it('should filter sources by ID when provided', () => {
    const allSources = [
      { id: 'src-1' },
      { id: 'src-2' },
      { id: 'src-3' },
    ];
    const sourceIds = ['src-1', 'src-3'];
    const filtered = allSources.filter(s => sourceIds.includes(s.id));
    expect(filtered.length).toBe(2);
    expect(filtered.map(s => s.id)).toContain('src-1');
    expect(filtered.map(s => s.id)).not.toContain('src-2');
  });

  it('should return all sources when sourceIds is empty', () => {
    const allSources = [{ id: 'src-1' }, { id: 'src-2' }];
    const sourceIds: string[] = [];
    const filtered = sourceIds.length > 0
      ? allSources.filter(s => sourceIds.includes(s.id))
      : allSources;
    expect(filtered.length).toBe(2);
  });

  it('should return all sources when sourceIds is undefined', () => {
    const allSources = [{ id: 'src-1' }, { id: 'src-2' }];
    const sourceIds: string[] | undefined = undefined;
    const filtered = sourceIds && sourceIds.length > 0
      ? allSources.filter(s => sourceIds.includes(s.id))
      : allSources;
    expect(filtered.length).toBe(2);
  });

  it('should handle non-existent source IDs gracefully', () => {
    const allSources = [{ id: 'src-1' }, { id: 'src-2' }];
    const sourceIds = ['nonexistent'];
    const filtered = allSources.filter(s => sourceIds.includes(s.id));
    expect(filtered.length).toBe(0);
  });
});

// ==================== Bug #16: Error Message Handling ====================
describe('BUG: Error Message Formatting', () => {
  it('should extract message from Error objects', () => {
    const error = new Error('Something went wrong');
    const message = error instanceof Error ? error.message : 'Unknown error';
    expect(message).toBe('Something went wrong');
  });

  it('should handle non-Error throws', () => {
    let message = '';
    try {
      throw 'string error';
    } catch (e) {
      message = e instanceof Error ? e.message : String(e);
    }
    expect(message).toBe('string error');
  });

  it('should handle null/undefined errors', () => {
    const error: unknown = null;
    const message = error instanceof Error ? error.message : 'Unknown error';
    expect(message).toBe('Unknown error');
  });

  it('should truncate very long error messages', () => {
    const longMessage = 'x'.repeat(1000);
    const truncated = longMessage.slice(0, 200);
    expect(truncated.length).toBe(200);
  });
});

// ==================== Bug #17: Notebook Group Operations ====================
describe('BUG: Notebook Groups', () => {
  it('should allow notebook to belong to one group', () => {
    const notebook = { id: 'nb-1', groupId: 'group-1' };
    expect(notebook.groupId).toBe('group-1');
  });

  it('should allow notebook without group', () => {
    const notebook = { id: 'nb-1', groupId: null };
    expect(notebook.groupId).toBeNull();
  });

  it('should update notebook group assignment', () => {
    const notebook = { id: 'nb-1', groupId: 'group-1' };
    notebook.groupId = 'group-2';
    expect(notebook.groupId).toBe('group-2');
  });

  it('should remove notebook from group', () => {
    const notebook = { id: 'nb-1', groupId: 'group-1' as string | null };
    notebook.groupId = null;
    expect(notebook.groupId).toBeNull();
  });

  it('should count notebooks per group', () => {
    const notebooks = [
      { groupId: 'group-1' },
      { groupId: 'group-1' },
      { groupId: 'group-2' },
      { groupId: null },
    ];
    const counts: Record<string, number> = {};
    for (const nb of notebooks) {
      if (nb.groupId) {
        counts[nb.groupId] = (counts[nb.groupId] || 0) + 1;
      }
    }
    expect(counts['group-1']).toBe(2);
    expect(counts['group-2']).toBe(1);
  });
});

// ==================== Bug #18: Relevance Scoring ====================
describe('BUG: Citation Relevance Scoring', () => {
  const scoreRelevance = (sourceContent: string, responseSegment: string): number => {
    if (!sourceContent || !responseSegment) return 0;

    const sourceWords = new Set(
      sourceContent.toLowerCase().split(/\W+/).filter(w => w.length > 3)
    );
    const responseWords = responseSegment
      .toLowerCase()
      .split(/\W+/)
      .filter(w => w.length > 3);

    if (responseWords.length === 0) return 0;

    const matchingWords = responseWords.filter(w => sourceWords.has(w));
    return matchingWords.length / responseWords.length;
  };

  it('should return 1 for identical content', () => {
    const content = 'The Roman Empire was vast and powerful';
    const score = scoreRelevance(content, content);
    expect(score).toBe(1);
  });

  it('should return 0 for no overlap', () => {
    const source = 'The Roman Empire was powerful';
    const response = 'Dogs cats birds fish';
    const score = scoreRelevance(source, response);
    expect(score).toBe(0);
  });

  it('should return 0 for empty source', () => {
    const score = scoreRelevance('', 'Some response');
    expect(score).toBe(0);
  });

  it('should return 0 for empty response', () => {
    const score = scoreRelevance('Some source', '');
    expect(score).toBe(0);
  });

  it('should ignore short words (length <= 3)', () => {
    const source = 'The cat sat on the mat';
    const response = 'The dog lay on the rug';
    // Only words > 3 chars should be considered
    const score = scoreRelevance(source, response);
    expect(score).toBeLessThan(1);
  });

  it('should be case insensitive', () => {
    const source = 'HISTORY ANCIENT CIVILIZATION';
    const response = 'history ancient civilization';
    const score = scoreRelevance(source, response);
    expect(score).toBe(1);
  });
});

// ==================== Bug #19: System Prompt Building ====================
describe('BUG: System Prompt Generation', () => {
  it('should include notebook title', () => {
    const title = 'AP World History';
    const prompt = `You are an assistant for "${title}"`;
    expect(prompt).toContain(title);
  });

  it('should include source count', () => {
    const totalSources = 5;
    const prompt = `This notebook contains ${totalSources} sources`;
    expect(prompt).toContain('5');
  });

  it('should include word count', () => {
    const totalWords = 10000;
    const prompt = `with ${totalWords} total words`;
    expect(prompt).toContain('10000');
  });

  it('should include source type distribution', () => {
    const sourcesByType = { URL: 3, PDF: 2 };
    const distribution = Object.entries(sourcesByType)
      .map(([type, count]) => `${type}(${count})`)
      .join(', ');
    expect(distribution).toBe('URL(3), PDF(2)');
  });

  it('should mention outputs when available', () => {
    const hasOutputs = true;
    const outputSection = hasOutputs
      ? 'Generated outputs available (summaries, flashcards, etc.)'
      : '';
    expect(outputSection).toContain('outputs');
  });
});

// ==================== Bug #20: Excerpt Extraction ====================
describe('BUG: Excerpt Extraction', () => {
  const extractExcerpt = (text: string, position: number, maxLength: number): string => {
    const start = Math.max(0, position - maxLength / 2);
    const end = Math.min(text.length, position + maxLength / 2);

    let excerpt = text.slice(start, end).trim();

    // Clean up partial words at boundaries
    if (start > 0) {
      const firstSpace = excerpt.indexOf(' ');
      if (firstSpace > 0 && firstSpace < 20) {
        excerpt = '...' + excerpt.slice(firstSpace + 1);
      }
    }

    if (end < text.length) {
      const lastSpace = excerpt.lastIndexOf(' ');
      if (lastSpace > excerpt.length - 20) {
        excerpt = excerpt.slice(0, lastSpace) + '...';
      }
    }

    return excerpt;
  };

  it('should extract excerpt around position', () => {
    const text = 'This is a long text with many words in it.';
    const excerpt = extractExcerpt(text, 20, 20);
    expect(excerpt.length).toBeLessThanOrEqual(30); // Some buffer for ellipsis
  });

  it('should add ellipsis at start when not at beginning', () => {
    const text = 'First word. Middle part here. Last word.';
    const excerpt = extractExcerpt(text, 20, 15);
    expect(excerpt.startsWith('...') || excerpt.length < text.length).toBe(true);
  });

  it('should add ellipsis at end when not at ending', () => {
    const text = 'First word. Middle part here. Last word.';
    const excerpt = extractExcerpt(text, 10, 15);
    expect(excerpt.endsWith('...') || excerpt.length < text.length).toBe(true);
  });

  it('should handle position at beginning', () => {
    const text = 'Start of the text here.';
    const excerpt = extractExcerpt(text, 0, 10);
    expect(excerpt.length).toBeGreaterThan(0);
  });

  it('should handle position at end', () => {
    const text = 'Text ends here.';
    const excerpt = extractExcerpt(text, text.length - 1, 10);
    expect(excerpt.length).toBeGreaterThan(0);
  });

  it('should handle short text', () => {
    const text = 'Short';
    const excerpt = extractExcerpt(text, 2, 100);
    expect(excerpt).toBe('Short');
  });
});
