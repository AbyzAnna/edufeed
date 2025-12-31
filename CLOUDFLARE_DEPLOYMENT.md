# Cloudflare Workers Deployment Guide

Complete guide for deploying EduFeed's AI generation features to Cloudflare Workers with Llama 3.3.

## 🚀 Features Implemented

### NotebookLM-Style Capabilities
1. **RAG-based Q&A Chat** - Semantic search + Llama 3.3 for document chat
2. **Study Guide Generation** - Comprehensive guides with timelines and vocabulary
3. **Advanced Flashcard Generation** - Context-aware cards with difficulty adaptation
4. **Audio Overview** - Podcast-style conversational overviews (like NotebookLM)

### Technology Stack
- **LLM**: Meta Llama 3.3 70B (via Cloudflare Workers AI)
- **Embeddings**: BGE-large-en-v1.5 (1024 dimensions)
- **Vector DB**: Cloudflare Vectorize
- **Storage**: R2 for audio files
- **Cache**: KV for conversation history
- **Database**: Continue using Supabase PostgreSQL

## 📋 Prerequisites

1. Cloudflare account (free tier works!)
2. Wrangler CLI installed (already done via `npm install`)
3. Cloudflare API token

## 🔧 Setup Instructions

### Step 1: Authenticate with Cloudflare

```bash
npx wrangler login
```

This opens a browser for authentication.

### Step 2: Create Required Resources

Run these commands to create all necessary Cloudflare resources:

```bash
# Create KV namespace for caching
npm run workers:kv:create

# Create R2 bucket for audio storage
npm run workers:r2:create

# Create D1 database for sessions (optional)
npm run workers:d1:create

# Create Vectorize index for embeddings
npm run workers:vectorize:create
```

### Step 3: Update wrangler.toml

After creating resources, update `wrangler.toml` with the returned IDs:

```toml
[[kv_namespaces]]
binding = "CACHE"
id = "YOUR_KV_NAMESPACE_ID"  # From step 2

[[d1_databases]]
binding = "DB_SESSIONS"
database_name = "edufeed-sessions"
database_id = "YOUR_D1_DATABASE_ID"  # From step 2
```

### Step 4: Set Secrets

Set your Supabase credentials as secrets:

```bash
# Supabase connection (for accessing your existing database)
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put DATABASE_URL

# Optional: If using external TTS for audio overviews
npx wrangler secret put ELEVENLABS_API_KEY
```

### Step 5: Deploy!

```bash
npm run workers:deploy
```

Your Worker will be deployed to: `https://edufeed-ai-worker.YOUR_SUBDOMAIN.workers.dev`

## 🧪 Local Development

Run Workers locally:

```bash
npm run workers:dev
```

This starts a local server at `http://localhost:8787`

Test endpoints:
```bash
# Health check
curl http://localhost:8787/health

# Generate flashcards
curl -X POST http://localhost:8787/api/flashcards/generate \
  -H "Content-Type: application/json" \
  -d '{"sourceId": "your-source-id", "count": 10}'
```

## 📡 API Endpoints

### Embeddings
- `POST /api/embeddings/store` - Store document embeddings
- `DELETE /api/embeddings/delete` - Delete document embeddings

### Chat (RAG-based Q&A)
- `POST /api/chat` - Start new chat conversation
- `POST /api/chat/continue` - Continue existing conversation

### Study Guides
- `POST /api/study-guide/generate` - Generate comprehensive study guide
- `POST /api/study-guide/plan` - Create study plan from guide

### Flashcards
- `POST /api/flashcards/generate` - Generate flashcards
- `POST /api/flashcards/generate-cloze` - Generate cloze deletion cards

### Audio Overviews
- `POST /api/audio-overview/generate` - Generate podcast-style audio

## 🔌 Integration with Next.js App

Create a helper in your Next.js app to call Workers:

```typescript
// src/lib/workers-client.ts
const WORKERS_URL = process.env.NEXT_PUBLIC_WORKERS_URL || 'http://localhost:8787';

export async function generateFlashcardsWithAI(sourceId: string, count: number = 20) {
  const response = await fetch(`${WORKERS_URL}/api/flashcards/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceId, count }),
  });

  return response.json();
}

export async function chatWithDocument(sourceId: string, message: string) {
  const response = await fetch(`${WORKERS_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceId, message }),
  });

  return response.json();
}

export async function generateStudyGuide(sourceId: string) {
  const response = await fetch(`${WORKERS_URL}/api/study-guide/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceId }),
  });

  return response.json();
}

export async function generateAudioOverview(sourceId: string, style = 'conversational') {
  const response = await fetch(`${WORKERS_URL}/api/audio-overview/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceId, style }),
  });

  return response.json();
}
```

## 🔄 Workflow: Adding a New Source

When a user uploads a PDF or adds a URL:

1. **Store in Supabase** (existing flow)
   ```typescript
   const source = await prisma.source.create({
     data: { userId, type: 'PDF', title, content }
   });
   ```

2. **Generate embeddings** (new step)
   ```typescript
   await fetch(`${WORKERS_URL}/api/embeddings/store`, {
     method: 'POST',
     body: JSON.stringify({
       sourceId: source.id,
       content: source.content,
       metadata: { title: source.title, type: source.type }
     })
   });
   ```

3. **Now available for AI features**
   - User can chat with document
   - Generate study guides
   - Create flashcards
   - Generate audio overviews

## 💰 Cost Estimation

Cloudflare Workers AI is extremely cost-effective:

### Free Tier (Generous!)
- **Workers AI**: 10,000 neurons/day free (roughly 1,000-2,000 generations)
- **Vectorize**: 30M queried vectors/month + 5M stored vectors
- **R2**: 10 GB storage free
- **KV**: 100,000 reads/day, 1,000 writes/day

### Paid Tier (if needed)
- **Workers AI**: $0.011 per 1,000 neurons (~$0.01 per generation)
- **Vectorize**: $0.04 per 1M queries
- **R2**: $0.015 per GB/month

**Example**: 10,000 flashcard generations/month ≈ $10-20/month

Compare to OpenAI GPT-4: Same would cost $200-400/month!

## 🎯 NotebookLM Feature Comparison

| Feature | NotebookLM | EduFeed (This Implementation) |
|---------|-----------|-------------------------------|
| Chat with documents | ✅ | ✅ RAG-based with citations |
| Study guides | ✅ | ✅ With timelines + vocabulary |
| Flashcards | ❌ | ✅ Advanced with spaced repetition |
| Audio overviews | ✅ | ✅ Multi-style (conversational, lecture, debate) |
| Source citations | ✅ | ✅ Chunk-level citations |
| Multi-document | ✅ | ✅ Via semantic search |
| Quiz generation | ❌ | ✅ (Already in your app) |
| Spaced repetition | ❌ | ✅ (SM-2 algorithm) |

## 🔍 Monitoring & Debugging

### View logs
```bash
npm run workers:tail
```

### Check Workers dashboard
https://dash.cloudflare.com/ → Workers & Pages → edufeed-ai-worker

### Check Vectorize index
```bash
npx wrangler vectorize get edufeed-embeddings
```

## 🚨 Troubleshooting

### "AI binding not found"
- Make sure you're on a Workers Paid plan for AI access
- Or contact Cloudflare support to enable Workers AI beta

### "Vectorize quota exceeded"
- Free tier: 5M vectors, 30M queries/month
- Upgrade to paid or optimize by deleting old embeddings

### "R2 bucket not accessible"
- Make sure bucket is created: `npm run workers:r2:create`
- Check bucket name matches in wrangler.toml

### CORS errors
- Workers are configured with `Access-Control-Allow-Origin: *`
- If using custom domain, update CORS headers in `workers/index.ts`

## 🎨 Customization

### Change LLM model
Edit `workers/lib/llm.ts`:
```typescript
// Current: Llama 3.3 70B
await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', ...)

// Alternative: Llama 3.1 8B (faster, cheaper)
await env.AI.run('@cf/meta/llama-3.1-8b-instruct-fast', ...)
```

### Adjust generation parameters
Edit temperature, max_tokens in individual functions.

### Add custom TTS provider
Edit `workers/lib/audio-overview.ts` → `synthesizeWithExternalTTS()`

Add your TTS API (ElevenLabs, Google TTS, etc.)

## 📚 Next Steps

1. **Deploy the Worker**: `npm run workers:deploy`
2. **Add .env variable**: `NEXT_PUBLIC_WORKERS_URL=https://your-worker.workers.dev`
3. **Update your Next.js API routes** to call Workers for AI tasks
4. **Test with real data**: Upload a PDF and try chat/flashcards/study guide
5. **Optimize**: Monitor usage and adjust batch sizes/caching

## 🤝 Support

- Cloudflare Workers Docs: https://developers.cloudflare.com/workers/
- Workers AI Models: https://developers.cloudflare.com/workers-ai/models/
- Vectorize Docs: https://developers.cloudflare.com/vectorize/

## 🔐 Security Notes

- Never commit `.env` or `wrangler.toml` with actual credentials
- Use Wrangler secrets for sensitive data
- Implement rate limiting in production
- Add authentication to Workers endpoints before public deployment

---

**You're now ready to deploy a NotebookLM-style AI system with open-source Llama 3.3!** 🎉
