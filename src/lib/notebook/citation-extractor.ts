/**
 * Citation Extractor
 * Extracts and maps source citations from AI responses
 */

import type { NotebookContextSource } from "./context-aggregator";

export interface ExtractedCitation {
  sourceId: string;
  sourceTitle: string;
  excerpt: string;
  confidence: number;
}

/**
 * Extract citations from AI response by matching source references
 */
export function extractCitations(
  response: string,
  sources: NotebookContextSource[]
): ExtractedCitation[] {
  const citations: ExtractedCitation[] = [];
  const seenSourceIds = new Set<string>();

  // Pattern 1: "[Source Title]" or "According to [Source Title]"
  const bracketPattern = /\[([^\]]+)\]/g;
  let match;

  while ((match = bracketPattern.exec(response)) !== null) {
    const mentionedTitle = match[1].toLowerCase().trim();
    const source = findMatchingSource(mentionedTitle, sources);

    if (source && !seenSourceIds.has(source.id)) {
      seenSourceIds.add(source.id);
      const excerpt = extractExcerpt(response, match.index, 200);
      citations.push({
        sourceId: source.id,
        sourceTitle: source.title,
        excerpt,
        confidence: 0.9,
      });
    }
  }

  // Pattern 2: "from [Source Name]" or "in [Source Name]"
  const fromPattern = /(?:from|in|according to|based on)\s+["']?([^"'\n,.:]+)["']?/gi;

  while ((match = fromPattern.exec(response)) !== null) {
    const mentionedTitle = match[1].toLowerCase().trim();
    const source = findMatchingSource(mentionedTitle, sources);

    if (source && !seenSourceIds.has(source.id)) {
      seenSourceIds.add(source.id);
      const excerpt = extractExcerpt(response, match.index, 200);
      citations.push({
        sourceId: source.id,
        sourceTitle: source.title,
        excerpt,
        confidence: 0.7,
      });
    }
  }

  // Pattern 3: Direct title mentions
  for (const source of sources) {
    if (seenSourceIds.has(source.id)) continue;

    const titleWords = source.title.toLowerCase().split(/\s+/);
    if (titleWords.length < 2) continue;

    // Look for at least 2 consecutive words from the title
    const titlePattern = titleWords.slice(0, 3).join("\\s+");
    const regex = new RegExp(titlePattern, "gi");

    if (regex.test(response)) {
      seenSourceIds.add(source.id);
      const matchIndex = response.toLowerCase().indexOf(titleWords.join(" "));
      const excerpt = extractExcerpt(response, matchIndex, 200);
      citations.push({
        sourceId: source.id,
        sourceTitle: source.title,
        excerpt,
        confidence: 0.6,
      });
    }
  }

  // Sort by confidence
  return citations.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Find matching source by fuzzy title matching
 */
function findMatchingSource(
  mentionedTitle: string,
  sources: NotebookContextSource[]
): NotebookContextSource | null {
  const normalizedMention = mentionedTitle.toLowerCase().trim();

  // Early return for empty or too short mentions (prevents false positives)
  if (!normalizedMention || normalizedMention.length < 2) {
    return null;
  }

  // Exact match
  for (const source of sources) {
    if (source.title.toLowerCase() === normalizedMention) {
      return source;
    }
  }

  // Contains match - require minimum length to avoid false positives
  for (const source of sources) {
    const sourceTitle = source.title.toLowerCase();
    if (sourceTitle.includes(normalizedMention) || normalizedMention.includes(sourceTitle)) {
      return source;
    }
  }

  // Word overlap match (at least 60% of words match)
  const mentionWords = new Set(normalizedMention.split(/\s+/));
  for (const source of sources) {
    const sourceWords = source.title.toLowerCase().split(/\s+/);
    const matchingWords = sourceWords.filter((w) => mentionWords.has(w));
    const overlapRatio = matchingWords.length / Math.max(sourceWords.length, mentionWords.size);

    if (overlapRatio >= 0.6) {
      return source;
    }
  }

  return null;
}

/**
 * Extract excerpt around a match position
 */
function extractExcerpt(text: string, position: number, maxLength: number): string {
  const start = Math.max(0, position - maxLength / 2);
  const end = Math.min(text.length, position + maxLength / 2);

  let excerpt = text.slice(start, end).trim();

  // Clean up partial words at boundaries
  if (start > 0) {
    const firstSpace = excerpt.indexOf(" ");
    if (firstSpace > 0 && firstSpace < 20) {
      excerpt = "..." + excerpt.slice(firstSpace + 1);
    }
  }

  if (end < text.length) {
    const lastSpace = excerpt.lastIndexOf(" ");
    if (lastSpace > excerpt.length - 20) {
      excerpt = excerpt.slice(0, lastSpace) + "...";
    }
  }

  return excerpt;
}

/**
 * Score content relevance between source and response segment
 */
export function scoreRelevance(sourceContent: string, responseSegment: string): number {
  if (!sourceContent || !responseSegment) return 0;

  const sourceWords = new Set(
    sourceContent
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3)
  );
  const responseWords = responseSegment
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 3);

  if (responseWords.length === 0) return 0;

  const matchingWords = responseWords.filter((w) => sourceWords.has(w));
  return matchingWords.length / responseWords.length;
}

export default {
  extractCitations,
  scoreRelevance,
};
