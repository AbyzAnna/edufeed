# Website feed

*Analyzed: 2025-12-31 | Confidence: high**

## Purpose

EduFeed is an AI-powered educational platform that transforms learning materials (PDFs, URLs, YouTube videos) into interactive study tools including notebooks with AI chat, flashcards with spaced repetition, and collaborative real-time study rooms with WebRTC video/audio.

## Key Concepts

- AI-powered learning notebooks
- Source-based knowledge extraction (PDF, URL, YouTube, Text)
- RAG (Retrieval Augmented Generation) for document chat
- Spaced repetition flashcards (SM-2 algorithm)
- Real-time collaborative study rooms with WebRTC
- AI video generation from educational content
- Text-to-speech narration generation
- Vector embeddings for semantic search

## Patterns

- **Next.js App Router with Server Components** (frontend)
- **PostgreSQL with Prisma ORM** (data)
- **Supabase Authentication (SSR)** (auth)
- **NextAuth.js with JWT Sessions** (auth)
- **Cloudflare Workers with Workers AI** (cloud)
- **Vector Database with Vectorize** (data)
- **Blob Storage (Vercel Blob)** (cloud)
- **WebRTC for Real-time Communication** (api)
- **OpenAI API for AI Generation** (integration)
- **Inngest for Background Jobs** (architecture)
- **React Query (TanStack Query) for Data Fetching** (frontend)
- **Tailwind CSS Styling** (frontend)
- **SendGrid Email Service** (integration)
- **Twilio SMS/Voice** (integration)
- **Replicate AI Models** (integration)
- **Hugging Face Inference** (integration)
- **SM-2 Spaced Repetition Algorithm** (architecture)
- **RAG (Retrieval Augmented Generation)** (architecture)
- **Next.js Middleware for Auth** (auth)
- **Expo/React Native Mobile App** (frontend)
- **SpecWeave Specification-First Development** (structure)
- **Cloudflare D1 Database** (data)
- **Cloudflare R2 Storage** (cloud)
- **Cloudflare KV Cache** (data)

## External Dependencies

- Supabase (PostgreSQL database + Auth)
- OpenAI API (GPT for content generation, TTS)
- Cloudflare Workers (Edge AI, D1, R2, KV, Vectorize)
- Vercel Blob Storage
- SendGrid (Transactional emails)
- Twilio (SMS/Voice)
- Replicate (WAN 2.1 video generation)
- Hugging Face Inference API
- Google OAuth
- Apple Sign-In (iOS mobile)

## Observations

- Dual auth system: NextAuth.js for legacy Google OAuth and Supabase Auth as primary (email + OAuth)
- Edge computing architecture using Cloudflare Workers for AI-intensive operations to reduce latency
- Hybrid storage strategy: Supabase PostgreSQL for relational data, Vectorize for embeddings, R2/Vercel Blob for files
- Multi-platform support: Next.js web app and Expo React Native mobile app sharing backend APIs
- Comprehensive AI pipeline: PDF/URL parsing → embedding → RAG chat → flashcard generation → TTS → video generation
- Real-time collaboration via WebRTC for study rooms with shared annotations and chat
- Background job processing via Inngest for async operations like video generation
- Database schema includes 48 tables with complex relationships for notebooks, sources, study sessions
- Video generation supports multiple modes: slideshow, AI avatar, and WAN 2.1 AI video
- Mobile-first API design with dedicated /api/mobile/ endpoints