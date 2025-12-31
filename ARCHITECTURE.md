# 🏗️ Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACES                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐         ┌──────────────┐                     │
│  │   Web App    │         │  Mobile App  │                     │
│  │  (Next.js)   │         │ (React Native)│                    │
│  └──────┬───────┘         └──────┬───────┘                     │
│         │                        │                              │
└─────────┼────────────────────────┼──────────────────────────────┘
          │                        │
          │                        │
          ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS BACKEND                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐ │
│  │  Auth Routes   │  │  CRUD Routes   │  │   AI Routes      │ │
│  │  (NextAuth)    │  │  (Sources,     │  │  (New! Workers)  │ │
│  │                │  │   Videos,      │  │                  │ │
│  │                │  │   Flashcards)  │  │                  │ │
│  └────────┬───────┘  └────────┬───────┘  └────────┬─────────┘ │
│           │                   │                     │           │
└───────────┼───────────────────┼─────────────────────┼───────────┘
            │                   │                     │
            │                   │                     │
            ▼                   ▼                     ▼
    ┌───────────────┐  ┌────────────────┐  ┌──────────────────┐
    │   NextAuth    │  │   Supabase     │  │ Cloudflare       │
    │   (Google     │  │   PostgreSQL   │  │ Workers AI       │
    │    OAuth)     │  │   (Prisma)     │  │ (NEW!)           │
    └───────────────┘  └────────────────┘  └──────────────────┘
```

## Cloudflare Workers AI Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE WORKERS AI                        │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                   API Router (workers/index.ts)          │ │
│  │                                                           │ │
│  │  Endpoints:                                               │ │
│  │  • POST /api/embeddings/store                            │ │
│  │  • POST /api/chat                                         │ │
│  │  • POST /api/study-guide/generate                        │ │
│  │  • POST /api/flashcards/generate                         │ │
│  │  • POST /api/audio-overview/generate                     │ │
│  └────────────────────┬──────────────────────────────────────┘ │
│                       │                                         │
│  ┌────────────────────▼──────────────────────────────────────┐ │
│  │                   AI Libraries (workers/lib/)             │ │
│  │                                                           │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │ │
│  │  │ Embeddings   │  │   LLM Core   │  │  Study Guide  │ │ │
│  │  │  - Chunk     │  │  - Generate  │  │  - Topics     │ │ │
│  │  │  - Embed     │  │  - JSON      │  │  - Timeline   │ │ │
│  │  │  - Search    │  │  - Summarize │  │  - Vocab      │ │ │
│  │  └──────────────┘  └──────────────┘  └───────────────┘ │ │
│  │                                                           │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │ │
│  │  │  RAG Chat    │  │  Flashcards  │  │ Audio Overview│ │ │
│  │  │  - Search    │  │  - Generate  │  │  - Script     │ │ │
│  │  │  - Context   │  │  - Rank      │  │  - TTS        │ │ │
│  │  │  - Respond   │  │  - Adapt     │  │  - Multi-voice│ │ │
│  │  └──────────────┘  └──────────────┘  └───────────────┘ │ │
│  └───────────────────────────────────────────────────────────┘ │
│                       │                                         │
│  ┌────────────────────▼──────────────────────────────────────┐ │
│  │              Cloudflare Services                          │ │
│  │                                                           │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  Workers AI                                          │ │ │
│  │  │  • Llama 3.3 70B (text generation)                  │ │ │
│  │  │  • BGE-large-en-v1.5 (embeddings, 1024d)           │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  Vectorize (Vector Database)                        │ │ │
│  │  │  • Store document embeddings                        │ │ │
│  │  │  • Semantic search                                   │ │ │
│  │  │  • Cosine similarity                                 │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  KV (Key-Value Store)                               │ │ │
│  │  │  • Conversation history                              │ │ │
│  │  │  • Session data                                      │ │ │
│  │  │  • Cache                                             │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  R2 (Object Storage)                                │ │ │
│  │  │  • Generated audio files                            │ │ │
│  │  │  • Audio transcripts                                │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. Document Upload & Embedding Storage

```
User → Next.js → Supabase        → Next.js → Workers → Vectorize
       Upload     Store Source      Call AI   Embed    Store
                  (Prisma)                    Chunks   Vectors
```

**Steps:**
1. User uploads PDF/URL via web/mobile app
2. Next.js extracts text content
3. Store in Supabase PostgreSQL via Prisma
4. Call Workers API to generate embeddings
5. Workers chunks document into pieces
6. Generate embeddings using BGE model
7. Store vectors in Vectorize for semantic search

### 2. Chat with Document (RAG)

```
User → Next.js → Workers → Vectorize → Workers → Llama 3.3 → Response
       Question   Search   Find Top 5   Build     Generate    with
                  Chunks   Relevant     Context   Answer      Sources
```

**Steps:**
1. User asks question about document
2. Next.js forwards to Workers API
3. Workers generates embedding for question
4. Search Vectorize for top 5 relevant chunks
5. Build context from chunks
6. Send to Llama 3.3 with context + question
7. Generate answer with source citations
8. Return to user with references

### 3. Study Guide Generation

```
User → Next.js → Workers → Vectorize → Workers → Llama 3.3 → Study Guide
       Request   Get Doc   Get All      Process   Generate    - Overview
       Guide     Chunks    Content      Content   Multiple    - Topics
                                                  Sections    - Timeline
                                                               - Vocab
                                                               - Questions
```

**Steps:**
1. User requests study guide for document
2. Workers retrieves all relevant chunks
3. Generate overview summary
4. Extract hierarchical topics
5. Create timeline (if chronological)
6. Extract vocabulary terms
7. Generate practice questions
8. Combine into comprehensive guide

### 4. Flashcard Generation

```
User → Next.js → Workers → Vectorize → Workers → Llama 3.3 → Flashcards
       Request   Search    Get Key      Generate  Create      - Front
       20 Cards  Topics    Concepts     Batches   Cards       - Back
                                                              - Hints
                                                              - Difficulty
```

**Steps:**
1. User requests flashcards (count, difficulty, topics)
2. Workers searches for relevant content
3. Generate cards in batches of 10
4. Each card has: front, back, hint, difficulty, topic
5. Deduplicate similar cards
6. Rank by quality
7. Return top N cards

### 5. Audio Overview Generation

```
User → Next.js → Workers → Vectorize → Llama 3.3 → TTS → R2 → Audio URL
       Request   Get       Get All      Generate    Synth Store  Return
       Audio     Content   Chunks       Dialogue    Speech Audio  to User
                                        Script
```

**Steps:**
1. User requests audio overview (style, duration)
2. Workers retrieves document content
3. Generate conversation script (2-3 speakers)
4. Create natural dialogue discussing content
5. Synthesize speech for each segment
6. Combine audio chunks
7. Upload to R2 storage
8. Return audio URL + transcript

## Technology Stack

### Frontend
- **Web**: Next.js 16 + React 19 + TailwindCSS
- **Mobile**: React Native + Expo

### Backend (Existing)
- **Framework**: Next.js App Router
- **Database**: Supabase PostgreSQL
- **ORM**: Prisma
- **Auth**: NextAuth (Google OAuth)

### Backend (NEW - AI Layer)
- **Runtime**: Cloudflare Workers
- **LLM**: Meta Llama 3.3 70B (via Workers AI)
- **Embeddings**: BGE-large-en-v1.5 (1024 dimensions)
- **Vector DB**: Cloudflare Vectorize
- **Cache**: Cloudflare KV
- **Storage**: Cloudflare R2

### AI Capabilities
- **Text Generation**: Llama 3.3 70B
- **Embeddings**: BGE-large-en-v1.5
- **RAG**: Vectorize + Llama 3.3
- **TTS**: External service (ElevenLabs, Google, Azure)

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     PRODUCTION SETUP                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐         ┌─────────────────────────┐  │
│  │   Vercel Edge    │         │  Cloudflare Global CDN  │  │
│  │   (Next.js App)  │◄───────►│  (Workers AI)           │  │
│  │                  │   API    │  - 300+ locations       │  │
│  │  - SSR/SSG       │  Calls   │  - <50ms latency        │  │
│  │  - API Routes    │          │  - Auto-scaling         │  │
│  └────────┬─────────┘          └─────────────────────────┘  │
│           │                                                  │
│           │                                                  │
│  ┌────────▼─────────┐                                       │
│  │   Supabase       │                                       │
│  │   (Database)     │                                       │
│  │                  │                                       │
│  │  - PostgreSQL    │                                       │
│  │  - Auth          │                                       │
│  │  - Storage       │                                       │
│  └──────────────────┘                                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Cost Breakdown

### Monthly Costs (Estimated)

#### Existing Infrastructure
- **Supabase**: $0-25/month (generous free tier)
- **Vercel**: $0-20/month (free for hobby, pro at $20)

#### NEW - Cloudflare Workers AI
- **Workers**: $5/month minimum (includes 10M requests)
- **Workers AI**: ~$10-30/month for typical usage
  - 10,000 generations = ~$10
  - Free tier: 10,000/day!
- **Vectorize**: $0-5/month (30M queries free)
- **R2**: $0-5/month (10 GB free)
- **KV**: $0 (100K reads/day free)

**Total AI Addition**: $5-40/month (vs $200-400 with OpenAI!)

## Security & Privacy

### Authentication Flow
```
User → Next.js → NextAuth → Google OAuth → Session
                                          ↓
                                    JWT Token
                                          ↓
                              Verify in API Routes
```

### Authorization
- All AI endpoints check user ownership of sources
- Workers endpoints should validate auth tokens (add middleware)
- Secrets stored in Cloudflare (not in code)

### Data Privacy
- User data stays in Supabase (your control)
- Only document text sent to Workers for embedding
- Embeddings stored in Vectorize (can be deleted)
- Generated content can be deleted anytime

## Monitoring & Observability

### Available Tools
- **Cloudflare Dashboard**: Real-time metrics
- **Wrangler Tail**: Live log streaming
- **Analytics**: Request counts, latency, errors
- **Traces**: Distributed tracing support

### Key Metrics to Track
- AI generation latency
- Embedding storage size
- Vector search performance
- Cache hit rate
- Error rates
- Cost per feature

## Scalability

### Current Capacity (Free Tier)
- **10,000 AI generations/day** = ~300,000/month
- **30M vector searches/month**
- **100K KV reads/day** = 3M/month

### What This Means
- Support 1,000+ active users
- Generate 10,000 flashcards/day
- Handle 100,000 chat messages/day
- Store millions of document embeddings

### When to Scale
Upgrade to paid when you hit free tier limits:
- >10K AI generations/day
- >30M vector searches/month
- >10 GB audio storage

**Cost scaling is linear and predictable!**

---

Built with ❤️ using open-source AI (Llama 3.3) and Cloudflare's edge network.
