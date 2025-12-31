# AI Infrastructure Team

Responsible for the AI processing infrastructure including Cloudflare Workers, vector embeddings, and AI model integrations. This team manages the serverless AI processing pipeline.

## Responsibilities

- Maintain Cloudflare Workers with Workers AI for serverless AI processing
- Manage vector database (Vectorize) for semantic search and RAG
- Optimize AI model inference and embedding generation
- Handle AI video generation and text-to-speech narration pipelines
- Manage Cloudflare D1, R2, and KV infrastructure

## Domain Expertise

- Serverless computing
- Vector databases and embeddings
- AI model optimization
- Edge computing with Cloudflare
- Content generation pipelines

## Technology Stack

- Cloudflare Workers
- Workers AI
- Cloudflare Vectorize
- Cloudflare D1
- Cloudflare R2
- Cloudflare KV

## Repositories

- [Website feed](../../../modules/Website feed.md)

## Integration Boundaries

Upstream: Main Next.js application. Downstream: External AI providers (OpenAI, Replicate, Hugging Face).

---
*Clustering reasoning: While part of the same repository, the Cloudflare Workers infrastructure represents a distinct architectural concern that could be owned by a specialized infrastructure team focused on AI processing at the edge.*
*Generated on 2025-12-31*