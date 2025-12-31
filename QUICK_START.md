# 🚀 Quick Start: Deploy NotebookLM-Style AI in 5 Minutes

## What You Get

✅ **RAG-based document chat** with source citations
✅ **Study guide generation** with timelines and vocabulary
✅ **AI flashcard creation** with difficulty adaptation
✅ **Audio overviews** (podcast-style conversations)
✅ **Free Llama 3.3 70B** via Cloudflare Workers AI

## 5-Minute Setup

### 1. Login to Cloudflare
```bash
npx wrangler login
```

### 2. Create Resources
```bash
npm run workers:kv:create
npm run workers:r2:create
npm run workers:vectorize:create
```

Copy the IDs returned and update [wrangler.toml](wrangler.toml):
```toml
[[kv_namespaces]]
binding = "CACHE"
id = "YOUR_KV_ID_HERE"  # ← Paste here
```

### 3. Set Secrets
```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
# Paste your Supabase service role key

npx wrangler secret put DATABASE_URL
# Paste your Supabase DATABASE_URL
```

### 4. Deploy!
```bash
npm run workers:deploy
```

You'll get a URL like: `https://edufeed-ai-worker.YOUR_NAME.workers.dev`

### 5. Add to .env
```env
WORKERS_URL=https://edufeed-ai-worker.YOUR_NAME.workers.dev
```

## Test It Out

### Via cURL:
```bash
# Generate flashcards
curl -X POST https://YOUR_WORKER.workers.dev/api/flashcards/generate \
  -H "Content-Type: application/json" \
  -d '{
    "sourceId": "your-source-id",
    "count": 10
  }'

# Chat with document
curl -X POST https://YOUR_WORKER.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sourceId": "your-source-id",
    "message": "What are the main topics?"
  }'
```

### Via Next.js:
```typescript
// In your API route or server action
import { generateFlashcards, chatWithDocument } from '@/lib/workers-client';

// Generate flashcards
const result = await generateFlashcards('source-id', {
  count: 20,
  difficulty: 'medium'
});

// Chat with document
const chat = await chatWithDocument('source-id', 'Explain the main concept');
```

## Integration Example

When user uploads a PDF:

```typescript
// src/app/api/sources/route.ts
import { storeDocumentEmbeddings } from '@/lib/workers-client';

export async function POST(request: Request) {
  // 1. Parse and extract PDF content
  const content = await extractPDFText(file);

  // 2. Store in Supabase (existing)
  const source = await prisma.source.create({
    data: {
      userId: user.id,
      type: 'PDF',
      title: filename,
      content,
    },
  });

  // 3. NEW: Store embeddings in Cloudflare Vectorize
  await storeDocumentEmbeddings(source.id, content, {
    title: filename,
    type: 'PDF',
  });

  return NextResponse.json(source);
}
```

Now the document is available for:
- ✅ Chat / Q&A
- ✅ Study guide generation
- ✅ Flashcard creation
- ✅ Audio overviews

## Available Features

### 1. Document Chat (RAG)
```typescript
const response = await chatWithDocument(sourceId, "What's the main idea?");
// Returns: { response, sources[], conversationId }
```

### 2. Study Guide
```typescript
const guide = await generateStudyGuide(sourceId, {
  difficulty: 'intermediate'
});
// Returns: { title, overview, keyTopics[], timeline[], vocabulary[], practiceQuestions[] }
```

### 3. Flashcards
```typescript
const flashcards = await generateFlashcards(sourceId, {
  count: 20,
  difficulty: 'medium',
  topics: ['biology', 'cells']
});
// Returns: { cards[], metadata }
```

### 4. Audio Overview
```typescript
const audio = await generateAudioOverview(sourceId, {
  style: 'conversational', // or 'lecture' or 'debate'
  duration: 300 // seconds
});
// Returns: { audioUrl, transcript, speakers[], duration }
```

## Cost

**Free tier is GENEROUS:**
- 10,000 AI generations/day FREE
- 30M vector searches/month FREE
- 10 GB audio storage FREE

That's ~300 flashcard generations or 100 study guides per day for $0!

**Paid tier** (if you exceed free):
- $10-20/month for 10,000 generations
- Compare to OpenAI GPT-4: $200-400/month for same

## Next Steps

1. ✅ Deploy Workers (you just did!)
2. 📝 Update Next.js routes to use Workers AI
3. 🎨 Build UI for new features (chat, study guides, audio)
4. 🧪 Test with real content
5. 🚀 Ship to production!

## Troubleshooting

**Workers AI not available?**
- Sign up for Workers Paid plan ($5/month minimum)
- Or contact Cloudflare to enable beta access

**CORS errors?**
- Workers are configured with `Access-Control-Allow-Origin: *`
- Update if needed in `workers/index.ts`

**Embeddings quota exceeded?**
- Free tier: 5M vectors
- Delete old embeddings: `deleteDocumentEmbeddings(sourceId)`
- Or upgrade to paid plan

## Full Documentation

See [CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md) for complete details.

---

**Built with:**
- 🦙 Llama 3.3 70B (Meta)
- ☁️ Cloudflare Workers AI
- 🔍 Vectorize (embeddings)
- 🎯 BGE-large-en-v1.5 (1024d)
