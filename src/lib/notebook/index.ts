export {
  getNotebookContext,
  formatContextForLLM,
  buildSimpleContext,
} from "./context-aggregator";
export type {
  NotebookContext,
  NotebookContextSource,
  NotebookContextOutput,
  NotebookContextMessage,
  FormattedContext,
} from "./context-aggregator";

export { extractCitations, scoreRelevance } from "./citation-extractor";
export type { ExtractedCitation } from "./citation-extractor";

// Re-export source processor
export { processSource } from "./source-processor";
