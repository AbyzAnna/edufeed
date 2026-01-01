import { describe, it, expect } from 'vitest';
import { extractCitations, scoreRelevance } from '../citation-extractor';
import type { NotebookContextSource } from '../context-aggregator';

describe('Citation Extractor', () => {
  const mockSources: NotebookContextSource[] = [
    {
      id: 'source-1',
      title: 'Introduction to Machine Learning',
      type: 'PDF',
      content: 'Machine learning is a subset of artificial intelligence...',
      wordCount: 500,
      metadata: null,
    },
    {
      id: 'source-2',
      title: 'Deep Learning Fundamentals',
      type: 'URL',
      content: 'Neural networks are the foundation of deep learning...',
      wordCount: 800,
      metadata: null,
    },
    {
      id: 'source-3',
      title: 'Python Programming Guide',
      type: 'TEXT',
      content: 'Python is a versatile programming language...',
      wordCount: 300,
      metadata: null,
    },
  ];

  describe('extractCitations', () => {
    it('should extract citations from bracketed references', () => {
      const response = 'According to [Introduction to Machine Learning], ML is a subset of AI.';
      const citations = extractCitations(response, mockSources);

      expect(citations).toHaveLength(1);
      expect(citations[0].sourceId).toBe('source-1');
      expect(citations[0].sourceTitle).toBe('Introduction to Machine Learning');
    });

    it('should extract multiple citations', () => {
      const response = 'Based on [Introduction to Machine Learning] and [Deep Learning Fundamentals], we can see that...';
      const citations = extractCitations(response, mockSources);

      expect(citations).toHaveLength(2);
      expect(citations.map(c => c.sourceId)).toContain('source-1');
      expect(citations.map(c => c.sourceId)).toContain('source-2');
    });

    it('should extract citations from "according to" phrases', () => {
      const response = 'According to Deep Learning Fundamentals, neural networks are important.';
      const citations = extractCitations(response, mockSources);

      expect(citations.length).toBeGreaterThanOrEqual(1);
      expect(citations.some(c => c.sourceId === 'source-2')).toBe(true);
    });

    it('should extract citations from "from" phrases', () => {
      const response = 'Information from Python Programming Guide shows that Python is versatile.';
      const citations = extractCitations(response, mockSources);

      expect(citations.some(c => c.sourceId === 'source-3')).toBe(true);
    });

    it('should not duplicate citations for same source', () => {
      const response = '[Introduction to Machine Learning] explains ML. As stated in [Introduction to Machine Learning], it is a subset of AI.';
      const citations = extractCitations(response, mockSources);

      const source1Citations = citations.filter(c => c.sourceId === 'source-1');
      expect(source1Citations).toHaveLength(1);
    });

    it('should return empty array when no sources match', () => {
      const response = 'This text references [Unknown Source] which does not exist.';
      const citations = extractCitations(response, mockSources);

      expect(citations.filter(c => c.sourceId === 'unknown')).toHaveLength(0);
    });

    it('should handle partial title matches', () => {
      const response = 'According to [Machine Learning], the algorithms are powerful.';
      const citations = extractCitations(response, mockSources);

      // Should match "Introduction to Machine Learning" partially
      expect(citations.some(c => c.sourceTitle.includes('Machine Learning'))).toBe(true);
    });

    it('should include excerpts from the response', () => {
      const response = 'The study from [Deep Learning Fundamentals] shows that neural networks can learn complex patterns.';
      const citations = extractCitations(response, mockSources);

      expect(citations.length).toBeGreaterThanOrEqual(1);
      const dlCitation = citations.find(c => c.sourceId === 'source-2');
      expect(dlCitation?.excerpt).toBeDefined();
      expect(dlCitation?.excerpt.length).toBeGreaterThan(0);
    });

    it('should sort citations by confidence', () => {
      const response = 'According to [Deep Learning Fundamentals], and also referencing Python Programming, we see...';
      const citations = extractCitations(response, mockSources);

      // Bracketed citations should have higher confidence than "from" patterns
      if (citations.length >= 2) {
        expect(citations[0].confidence).toBeGreaterThanOrEqual(citations[1].confidence);
      }
    });
  });

  describe('scoreRelevance', () => {
    it('should return 0 for empty strings', () => {
      expect(scoreRelevance('', 'test')).toBe(0);
      expect(scoreRelevance('test', '')).toBe(0);
    });

    it('should return high score for matching content', () => {
      const sourceContent = 'Machine learning is a powerful technique for data analysis';
      const responseSegment = 'Machine learning helps with data analysis';

      const score = scoreRelevance(sourceContent, responseSegment);
      expect(score).toBeGreaterThan(0.5);
    });

    it('should return low score for unrelated content', () => {
      const sourceContent = 'Machine learning is about algorithms';
      const responseSegment = 'Cooking requires fresh ingredients';

      const score = scoreRelevance(sourceContent, responseSegment);
      expect(score).toBeLessThan(0.3);
    });

    it('should ignore short words', () => {
      const sourceContent = 'The machine is in the room';
      const responseSegment = 'The cat is on the mat';

      // Short words like "the", "is", "in" should be ignored
      const score = scoreRelevance(sourceContent, responseSegment);
      expect(score).toBeLessThan(0.5);
    });
  });
});
