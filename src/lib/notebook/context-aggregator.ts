/**
 * Notebook Context Aggregator
 * Builds comprehensive context from all notebook data for NotebookLM-style chat
 */

import { prisma } from "@/lib/prisma";

export interface NotebookContextSource {
  id: string;
  title: string;
  type: string;
  content: string | null;
  wordCount: number | null;
  metadata: Record<string, unknown> | null;
}

export interface NotebookContextOutput {
  id: string;
  type: string;
  title: string | null;
  content: Record<string, unknown> | null;
}

export interface NotebookContextMessage {
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  createdAt: Date;
}

export interface NotebookContext {
  notebook: {
    id: string;
    title: string;
    description: string | null;
    emoji: string | null;
  };
  sources: NotebookContextSource[];
  outputs: NotebookContextOutput[];
  recentMessages: NotebookContextMessage[];
  stats: {
    totalSources: number;
    totalWords: number;
    sourcesByType: Record<string, number>;
    hasOutputs: boolean;
  };
}

export interface FormattedContext {
  systemPrompt: string;
  contextText: string;
  conversationHistory: { role: string; content: string }[];
}

/**
 * Fetch comprehensive notebook context for AI chat
 */
export async function getNotebookContext(
  notebookId: string,
  options?: {
    includeOutputs?: boolean;
    maxSources?: number;
    maxMessages?: number;
    sourceIds?: string[];
  }
): Promise<NotebookContext | null> {
  const { includeOutputs = true, maxSources = 50, maxMessages = 10, sourceIds } = options || {};

  const notebook = await prisma.notebook.findUnique({
    where: { id: notebookId },
    include: {
      NotebookSource: {
        where: {
          status: "COMPLETED",
          ...(sourceIds && sourceIds.length > 0 ? { id: { in: sourceIds } } : {}),
        },
        select: {
          id: true,
          title: true,
          type: true,
          content: true,
          wordCount: true,
          metadata: true,
        },
        take: maxSources,
        orderBy: { createdAt: "desc" },
      },
      NotebookOutput: includeOutputs
        ? {
            where: { status: "COMPLETED" },
            select: {
              id: true,
              type: true,
              title: true,
              content: true,
            },
            take: 10,
            orderBy: { createdAt: "desc" },
          }
        : undefined,
      NotebookChat: {
        select: {
          role: true,
          content: true,
          createdAt: true,
        },
        take: maxMessages,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!notebook) {
    return null;
  }

  // Calculate stats
  const totalWords = notebook.NotebookSource.reduce((sum, s) => sum + (s.wordCount || 0), 0);
  const sourcesByType: Record<string, number> = {};
  for (const source of notebook.NotebookSource) {
    sourcesByType[source.type] = (sourcesByType[source.type] || 0) + 1;
  }

  return {
    notebook: {
      id: notebook.id,
      title: notebook.title,
      description: notebook.description,
      emoji: notebook.emoji,
    },
    sources: notebook.NotebookSource.map((s) => ({
      id: s.id,
      title: s.title,
      type: s.type,
      content: s.content,
      wordCount: s.wordCount,
      metadata: s.metadata as Record<string, unknown> | null,
    })),
    outputs: includeOutputs
      ? (notebook.NotebookOutput || []).map((o) => ({
          id: o.id,
          type: o.type,
          title: o.title,
          content: o.content as Record<string, unknown> | null,
        }))
      : [],
    recentMessages: notebook.NotebookChat.reverse().map((m) => ({
      role: m.role as "USER" | "ASSISTANT" | "SYSTEM",
      content: m.content,
      createdAt: m.createdAt,
    })),
    stats: {
      totalSources: notebook.NotebookSource.length,
      totalWords,
      sourcesByType,
      hasOutputs: (notebook.NotebookOutput?.length || 0) > 0,
    },
  };
}

/**
 * Format notebook context for LLM consumption
 */
export function formatContextForLLM(
  context: NotebookContext,
  options?: {
    maxTokenEstimate?: number;
    includeOutputs?: boolean;
  }
): FormattedContext {
  const { maxTokenEstimate = 6000, includeOutputs = true } = options || {};

  // Build system prompt
  const systemPrompt = buildSystemPrompt(context);

  // Build context text with sources
  let contextText = "";
  let estimatedTokens = 0;
  const tokensPerChar = 0.25; // Rough estimate: 4 chars = 1 token

  // Add notebook metadata
  const metadataSection = `# Notebook: ${context.notebook.title}
${context.notebook.description ? `Description: ${context.notebook.description}\n` : ""}
Total Sources: ${context.stats.totalSources}
Total Words: ${context.stats.totalWords}
Source Types: ${Object.entries(context.stats.sourcesByType)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ")}

---

`;
  contextText += metadataSection;
  estimatedTokens += metadataSection.length * tokensPerChar;

  // Add sources (prioritize by recency and word count)
  const sortedSources = [...context.sources].sort((a, b) => (b.wordCount || 0) - (a.wordCount || 0));

  for (const source of sortedSources) {
    if (!source.content) continue;

    const sourceSection = `## Source: ${source.title}
Type: ${source.type}
${source.metadata ? `Metadata: ${JSON.stringify(source.metadata, null, 0)}\n` : ""}
Content:
${source.content}

---

`;
    const sectionTokens = sourceSection.length * tokensPerChar;

    if (estimatedTokens + sectionTokens > maxTokenEstimate) {
      // Truncate content if needed
      const remainingTokens = maxTokenEstimate - estimatedTokens;
      const truncatedContent = source.content.slice(0, Math.floor(remainingTokens / tokensPerChar));
      contextText += `## Source: ${source.title} (truncated)
Type: ${source.type}
Content:
${truncatedContent}...

---

`;
      break;
    }

    contextText += sourceSection;
    estimatedTokens += sectionTokens;
  }

  // Add outputs if requested and within token budget
  if (includeOutputs && context.outputs.length > 0 && estimatedTokens < maxTokenEstimate * 0.9) {
    contextText += "\n# Generated Content\n\n";

    for (const output of context.outputs) {
      const outputContent = output.content ? JSON.stringify(output.content, null, 2) : "";
      const outputSection = `## ${output.type}: ${output.title || "Untitled"}
${outputContent.slice(0, 500)}${outputContent.length > 500 ? "..." : ""}

`;
      const sectionTokens = outputSection.length * tokensPerChar;

      if (estimatedTokens + sectionTokens > maxTokenEstimate) {
        break;
      }

      contextText += outputSection;
      estimatedTokens += sectionTokens;
    }
  }

  // Format conversation history for Ollama
  const conversationHistory = context.recentMessages.map((m) => ({
    role: m.role.toLowerCase(),
    content: m.content,
  }));

  return {
    systemPrompt,
    contextText,
    conversationHistory,
  };
}

/**
 * Build system prompt for NotebookLM-style behavior
 */
function buildSystemPrompt(context: NotebookContext): string {
  return `You are an intelligent research assistant for the notebook "${context.notebook.title}".

Your primary role is to help the user understand, analyze, and learn from the content in this notebook.

IMPORTANT GUIDELINES:
1. GROUND YOUR RESPONSES: Only answer based on information from the notebook's sources. If the information isn't in the sources, say so clearly.

2. CITE SOURCES: When you reference information, mention which source it comes from (e.g., "According to [Source Title]...").

3. BE ACCURATE: Do not hallucinate or make up information. If you're unsure, say so.

4. BE HELPFUL: Provide clear, educational explanations. Help the user learn and understand the material.

5. MULTI-TURN CONTEXT: Remember what was discussed earlier in this conversation and build on it.

6. SOURCE TYPES: This notebook contains ${context.stats.totalSources} sources with ${context.stats.totalWords} total words.
   Types: ${Object.entries(context.stats.sourcesByType)
     .map(([type, count]) => `${type}(${count})`)
     .join(", ")}

${context.stats.hasOutputs ? "7. GENERATED CONTENT: The notebook also contains AI-generated summaries, flashcards, or other study materials you can reference." : ""}

When the user asks a question:
- First, identify which sources contain relevant information
- Synthesize the information clearly
- Cite your sources
- Offer to explore related topics if appropriate`;
}

/**
 * Build a single context string for simpler use cases
 */
export function buildSimpleContext(context: NotebookContext): string {
  const parts: string[] = [];

  // Notebook info
  parts.push(`Notebook: ${context.notebook.title}`);
  if (context.notebook.description) {
    parts.push(`Description: ${context.notebook.description}`);
  }
  parts.push("");

  // Sources
  for (const source of context.sources) {
    if (source.content) {
      parts.push(`[Source: ${source.title}]`);
      parts.push(source.content);
      parts.push("");
    }
  }

  return parts.join("\n");
}

export default {
  getNotebookContext,
  formatContextForLLM,
  buildSimpleContext,
};
