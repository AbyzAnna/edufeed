# EduFeed Core Platform Team

The primary development team responsible for the EduFeed AI-powered educational platform. This team owns the full-stack application including the Next.js web application, mobile app, and all AI-powered learning features.

## Responsibilities

- Develop and maintain the Next.js web application with App Router and Server Components
- Build and manage AI-powered notebook features with RAG-based document chat
- Implement and optimize spaced repetition flashcard system using SM-2 algorithm
- Maintain real-time collaborative study rooms with WebRTC video/audio capabilities
- Manage Expo/React Native mobile application development

## Domain Expertise

- AI/ML integration (OpenAI, Replicate, Hugging Face)
- RAG (Retrieval Augmented Generation)
- WebRTC real-time communication
- Spaced repetition learning algorithms
- Full-stack TypeScript development
- Mobile development with React Native/Expo

## Technology Stack

- Next.js 16
- React
- TypeScript
- PostgreSQL
- Prisma ORM
- Supabase
- Tailwind CSS
- OpenAI API
- WebRTC
- Expo/React Native
- React Query

## Repositories

- [Website feed](../../../modules/Website feed.md)

## Integration Boundaries

Upstream: Supabase (auth/database), OpenAI API, Replicate AI, Hugging Face, SendGrid, Twilio. Downstream: Cloudflare Workers for AI processing, Inngest for background jobs.

---
*Clustering reasoning: This is a monolithic full-stack application with a single repository containing both web and mobile applications. The team structure follows a single ownership model for the entire EduFeed platform.*
*Generated on 2025-12-31*