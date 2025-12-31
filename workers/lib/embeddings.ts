import type { Env, DocumentChunk } from '../types/env';

/**
 * Generate embeddings for text using Cloudflare Workers AI
 * Uses @cf/baai/bge-large-en-v1.5 model (1024 dimensions)
 */
export async function generateEmbedding(
  text: string,
  env: Env
): Promise<number[]> {
  const response = await env.AI.run('@cf/baai/bge-large-en-v1.5', {
    text: [text],
  });

  return response.data[0];
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddings(
  texts: string[],
  env: Env
): Promise<number[][]> {
  // Workers AI supports batch processing
  const response = await env.AI.run('@cf/baai/bge-large-en-v1.5', {
    text: texts,
  });

  return response.data;
}

/**
 * Chunk document into smaller pieces for embedding
 * Uses recursive character text splitting
 */
export function chunkDocument(
  content: string,
  chunkSize: number = 1000,
  chunkOverlap: number = 200
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < content.length) {
    const end = Math.min(start + chunkSize, content.length);
    const chunk = content.slice(start, end);

    // Try to break at sentence boundaries
    if (end < content.length) {
      const lastPeriod = chunk.lastIndexOf('.');
      const lastNewline = chunk.lastIndexOf('\n');
      const breakPoint = Math.max(lastPeriod, lastNewline);

      if (breakPoint > chunkSize * 0.5) {
        chunks.push(content.slice(start, start + breakPoint + 1));
        start += breakPoint + 1 - chunkOverlap;
        continue;
      }
    }

    chunks.push(chunk);
    start += chunkSize - chunkOverlap;
  }

  return chunks;
}

/**
 * Store document chunks with embeddings in Vectorize
 */
export async function storeDocumentEmbeddings(
  sourceId: string,
  content: string,
  metadata: { title: string; type: string },
  env: Env
): Promise<void> {
  // Chunk the document
  const chunks = chunkDocument(content);

  // Generate embeddings in batches
  const batchSize = 10;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const embeddings = await generateEmbeddings(batch, env);

    // Prepare vectors for insertion
    const vectors = batch.map((chunk, idx) => ({
      id: `${sourceId}-chunk-${i + idx}`,
      values: embeddings[idx],
      metadata: {
        sourceId,
        content: chunk,
        chunkIndex: i + idx,
        title: metadata.title,
        type: metadata.type,
      },
    }));

    // Insert into Vectorize
    await env.VECTORIZE.upsert(vectors);
  }
}

/**
 * Search for relevant document chunks using semantic search
 */
export async function searchRelevantChunks(
  query: string,
  sourceId: string | null,
  topK: number = 5,
  env: Env
): Promise<DocumentChunk[]> {
  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query, env);

  // Search in Vectorize
  const results = await env.VECTORIZE.query(queryEmbedding, {
    topK,
    filter: sourceId ? { sourceId } : undefined,
  });

  // Convert results to DocumentChunk format
  return results.matches.map((match) => ({
    id: match.id,
    sourceId: match.metadata.sourceId as string,
    content: match.metadata.content as string,
    embedding: match.vector,
    metadata: {
      page: match.metadata.page as number | undefined,
      timestamp: match.metadata.timestamp as number | undefined,
      section: match.metadata.section as string | undefined,
    },
  }));
}

/**
 * Delete all embeddings for a source
 */
export async function deleteSourceEmbeddings(
  sourceId: string,
  env: Env
): Promise<void> {
  // Vectorize doesn't have direct delete by metadata yet
  // We'll need to fetch all IDs first then delete
  const results = await env.VECTORIZE.query(new Array(1024).fill(0), {
    topK: 1000,
    filter: { sourceId },
  });

  const ids = results.matches.map((m) => m.id);
  if (ids.length > 0) {
    await env.VECTORIZE.deleteByIds(ids);
  }
}
