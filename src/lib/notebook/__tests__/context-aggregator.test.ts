import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatContextForLLM, buildSimpleContext } from '../context-aggregator';
import type { NotebookContext } from '../context-aggregator';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    notebook: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Context Aggregator', () => {
  const mockContext: NotebookContext = {
    notebook: {
      id: 'notebook-1',
      title: 'Test Notebook',
      description: 'A test notebook for unit testing',
      emoji: '📚',
    },
    sources: [
      {
        id: 'source-1',
        title: 'First Source',
        type: 'PDF',
        content: 'This is the content of the first source. It contains important information.',
        wordCount: 100,
        metadata: { author: 'John Doe' },
      },
      {
        id: 'source-2',
        title: 'Second Source',
        type: 'URL',
        content: 'Content from a website that was scraped and processed.',
        wordCount: 50,
        metadata: null,
      },
    ],
    outputs: [
      {
        id: 'output-1',
        type: 'SUMMARY',
        title: 'Overall Summary',
        content: { text: 'This is a summary of all sources.' },
      },
    ],
    recentMessages: [
      {
        role: 'USER',
        content: 'What is this notebook about?',
        createdAt: new Date('2024-01-01'),
      },
      {
        role: 'ASSISTANT',
        content: 'This notebook is about testing.',
        createdAt: new Date('2024-01-01'),
      },
    ],
    stats: {
      totalSources: 2,
      totalWords: 150,
      sourcesByType: { PDF: 1, URL: 1 },
      hasOutputs: true,
    },
  };

  describe('formatContextForLLM', () => {
    it('should return formatted context with system prompt', () => {
      const result = formatContextForLLM(mockContext);

      expect(result.systemPrompt).toBeDefined();
      expect(result.systemPrompt).toContain('Test Notebook');
      expect(result.systemPrompt).toContain('GROUND YOUR RESPONSES');
      expect(result.systemPrompt).toContain('CITE SOURCES');
    });

    it('should include notebook metadata in context', () => {
      const result = formatContextForLLM(mockContext);

      expect(result.contextText).toContain('# Notebook: Test Notebook');
      expect(result.contextText).toContain('Total Sources: 2');
      expect(result.contextText).toContain('Total Words: 150');
    });

    it('should include source content', () => {
      const result = formatContextForLLM(mockContext);

      expect(result.contextText).toContain('## Source: First Source');
      expect(result.contextText).toContain('This is the content of the first source');
      expect(result.contextText).toContain('## Source: Second Source');
    });

    it('should include source metadata', () => {
      const result = formatContextForLLM(mockContext);

      expect(result.contextText).toContain('Type: PDF');
      expect(result.contextText).toContain('author');
    });

    it('should include outputs when requested', () => {
      const result = formatContextForLLM(mockContext, { includeOutputs: true });

      expect(result.contextText).toContain('# Generated Content');
      expect(result.contextText).toContain('SUMMARY');
    });

    it('should exclude outputs when not requested', () => {
      const result = formatContextForLLM(mockContext, { includeOutputs: false });

      expect(result.contextText).not.toContain('# Generated Content');
    });

    it('should format conversation history', () => {
      const result = formatContextForLLM(mockContext);

      expect(result.conversationHistory).toHaveLength(2);
      expect(result.conversationHistory[0].role).toBe('user');
      expect(result.conversationHistory[1].role).toBe('assistant');
    });

    it('should respect maxTokenEstimate', () => {
      // Create context with large content
      const largeContext: NotebookContext = {
        ...mockContext,
        sources: [
          {
            id: 'large-source',
            title: 'Large Source',
            type: 'TEXT',
            content: 'A'.repeat(50000), // Very large content
            wordCount: 50000,
            metadata: null,
          },
        ],
        stats: {
          totalSources: 1,
          totalWords: 50000,
          sourcesByType: { TEXT: 1 },
          hasOutputs: false,
        },
      };

      const result = formatContextForLLM(largeContext, { maxTokenEstimate: 1000 });

      // Context should be truncated
      expect(result.contextText.length).toBeLessThan(50000);
      expect(result.contextText).toContain('truncated');
    });

    it('should prioritize larger sources', () => {
      const contextWithPriority: NotebookContext = {
        ...mockContext,
        sources: [
          { id: '1', title: 'Small', type: 'TEXT', content: 'Short', wordCount: 10, metadata: null },
          { id: '2', title: 'Large', type: 'TEXT', content: 'Very long content here', wordCount: 1000, metadata: null },
        ],
        stats: {
          totalSources: 2,
          totalWords: 1010,
          sourcesByType: { TEXT: 2 },
          hasOutputs: false,
        },
      };

      const result = formatContextForLLM(contextWithPriority);

      // Large source should appear first (they're sorted by word count)
      const largeIndex = result.contextText.indexOf('Large');
      const smallIndex = result.contextText.indexOf('Small');

      expect(largeIndex).toBeLessThan(smallIndex);
    });
  });

  describe('buildSimpleContext', () => {
    it('should create simple context string', () => {
      const result = buildSimpleContext(mockContext);

      expect(result).toContain('Notebook: Test Notebook');
      expect(result).toContain('Description: A test notebook for unit testing');
      expect(result).toContain('[Source: First Source]');
      expect(result).toContain('This is the content of the first source');
    });

    it('should include all sources', () => {
      const result = buildSimpleContext(mockContext);

      expect(result).toContain('[Source: First Source]');
      expect(result).toContain('[Source: Second Source]');
    });

    it('should skip sources without content', () => {
      const contextWithEmptySource: NotebookContext = {
        ...mockContext,
        sources: [
          { id: '1', title: 'Empty', type: 'TEXT', content: null, wordCount: 0, metadata: null },
          { id: '2', title: 'Full', type: 'TEXT', content: 'Has content', wordCount: 2, metadata: null },
        ],
      };

      const result = buildSimpleContext(contextWithEmptySource);

      expect(result).not.toContain('[Source: Empty]');
      expect(result).toContain('[Source: Full]');
    });
  });

  describe('system prompt content', () => {
    it('should include source type breakdown', () => {
      const result = formatContextForLLM(mockContext);

      expect(result.systemPrompt).toContain('PDF');
      expect(result.systemPrompt).toContain('URL');
    });

    it('should mention generated outputs if available', () => {
      const result = formatContextForLLM(mockContext);

      expect(result.systemPrompt).toContain('GENERATED CONTENT');
    });

    it('should not mention outputs if none exist', () => {
      const contextWithoutOutputs: NotebookContext = {
        ...mockContext,
        outputs: [],
        stats: { ...mockContext.stats, hasOutputs: false },
      };

      const result = formatContextForLLM(contextWithoutOutputs);

      expect(result.systemPrompt).not.toContain('GENERATED CONTENT');
    });
  });
});
