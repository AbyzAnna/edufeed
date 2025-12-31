# 🚀 How to Use the AI Features

## Overview

Your EduFeed platform now has **NotebookLM-style AI capabilities** powered by Cloudflare Workers and Llama 3.3 70B. This guide shows you how to use them.

## ✅ What's Already Set Up

1. **Cloudflare Workers** - Deployed and running at:
   ```
   https://edufeed-ai-worker.steep-mouse-b843.workers.dev
   ```

2. **Auto-Embeddings** - When users upload content with >100 characters, embeddings are automatically generated

3. **API Routes** - Ready to use:
   - `/api/ai/chat` - Document chat
   - `/api/ai/flashcards/generate` - Flashcard generation
   - `/api/ai/study-guide/generate` - Study guide generation

4. **UI Components** - React components ready to integrate:
   - `ChatInterface.tsx` - Chat with documents
   - `FlashcardGenerator.tsx` - Generate flashcards
   - `StudyGuideDisplay.tsx` - Display study guides

5. **React Hooks** - Easy-to-use hooks at `src/hooks/useAIGeneration.ts`

## 🎯 Quick Start

### 1. Upload a Document (Automatic AI Enabling)

When a user creates a source with content:

```typescript
// This is already set up in src/app/api/sources/route.ts
const response = await fetch('/api/sources', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'PDF',
    title: 'Introduction to Biology',
    content: pdfText, // Must be >100 characters
  }),
});

const source = await response.json();
// source.aiEnabled will be true if embeddings were generated
```

**What happens automatically:**
1. Source is created in database
2. Embeddings are generated in Cloudflare Vectorize
3. AI features become available for that source

### 2. Add Chat Interface to a Page

```typescript
// app/sources/[id]/page.tsx
import { ChatInterface } from '@/components/ai/ChatInterface';

export default function SourcePage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto p-4">
      <ChatInterface
        sourceId={params.id}
        sourceTitle="Document Title"
      />
    </div>
  );
}
```

### 3. Add Flashcard Generator

```typescript
import { FlashcardGenerator } from '@/components/ai/FlashcardGenerator';

export default function StudyPage({ params }: { params: { id: string } }) {
  return (
    <FlashcardGenerator
      sourceId={params.id}
      onGenerated={(deckId) => {
        // Navigate to the new deck
        router.push(`/decks/${deckId}`);
      }}
    />
  );
}
```

### 4. Add Study Guide

```typescript
import { StudyGuideDisplay } from '@/components/ai/StudyGuideDisplay';

export default function StudyGuidePage({ params }: { params: { id: string } }) {
  return (
    <StudyGuideDisplay
      sourceId={params.id}
      sourceTitle="Document Title"
    />
  );
}
```

## 🔧 Using the SDK Directly

If you want more control, use the Workers client SDK:

```typescript
import {
  chatWithDocument,
  generateFlashcards,
  generateStudyGuide,
  storeDocumentEmbeddings,
} from '@/lib/workers-client';

// Chat with a document
const chatResponse = await chatWithDocument(sourceId, "What are the main topics?");
console.log(chatResponse.response); // AI answer
console.log(chatResponse.sources);   // Source citations

// Generate flashcards
const flashcards = await generateFlashcards(sourceId, {
  count: 20,
  difficulty: 'medium',
  topics: ['biology', 'cells']
});

// Generate study guide
const studyGuide = await generateStudyGuide(sourceId, {
  difficulty: 'intermediate'
});

// Manually store embeddings (usually automatic)
await storeDocumentEmbeddings(sourceId, content, {
  title: 'Document Title',
  type: 'PDF'
});
```

## 🎨 Example: Complete Source Detail Page

Here's a full example showing all AI features on one page:

```typescript
// app/sources/[id]/page.tsx
'use client';

import { useState } from 'react';
import { ChatInterface } from '@/components/ai/ChatInterface';
import { FlashcardGenerator } from '@/components/ai/FlashcardGenerator';
import { StudyGuideDisplay } from '@/components/ai/StudyGuideDisplay';

export default function SourceDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<'chat' | 'flashcards' | 'study-guide'>('chat');

  return (
    <div className="container mx-auto p-6">
      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'chat'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600'
          }`}
        >
          💬 Chat
        </button>
        <button
          onClick={() => setActiveTab('flashcards')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'flashcards'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600'
          }`}
        >
          🃏 Flashcards
        </button>
        <button
          onClick={() => setActiveTab('study-guide')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'study-guide'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600'
          }`}
        >
          📚 Study Guide
        </button>
      </div>

      {/* Content */}
      {activeTab === 'chat' && (
        <ChatInterface sourceId={params.id} sourceTitle="Your Document" />
      )}
      {activeTab === 'flashcards' && (
        <FlashcardGenerator sourceId={params.id} />
      )}
      {activeTab === 'study-guide' && (
        <StudyGuideDisplay sourceId={params.id} sourceTitle="Your Document" />
      )}
    </div>
  );
}
```

## 🔥 Features Available

### 1. Document Chat (RAG)
- **What**: Ask questions about documents, get answers with citations
- **How**: `<ChatInterface />` or `useChat()` hook
- **Example**: "What are the main themes?" → AI answers with source references

### 2. Flashcard Generation
- **What**: AI generates flashcards from document content
- **How**: `<FlashcardGenerator />` or `generateFlashcards()`
- **Options**: Count (5-50), Difficulty (easy/medium/hard), Topics
- **Output**: Saves directly to Prisma database as a Deck

### 3. Study Guide Generation
- **What**: Comprehensive study materials with topics, timelines, vocabulary
- **How**: `<StudyGuideDisplay />` or `generateStudyGuide()`
- **Output**:
  - Overview summary
  - Key topics with subtopics
  - Timeline (if chronological content)
  - Vocabulary with definitions
  - Practice questions

### 4. Audio Overviews (NotebookLM Style)
Not enabled yet (requires R2). To enable:
1. Go to Cloudflare Dashboard → R2
2. Enable R2 (10 GB free)
3. Run: `npx wrangler r2 bucket create edufeed-audio`
4. Uncomment R2 binding in `wrangler.toml`
5. Redeploy: `npx wrangler deploy`

## 📊 How It Works

```
User uploads PDF/URL
       ↓
Content extracted
       ↓
Source created in Prisma
       ↓
AUTO: Embeddings generated (Cloudflare Vectorize)
       ↓
AI features now available:
  • Chat with document
  • Generate flashcards
  • Create study guides
  • Audio overviews (if R2 enabled)
```

## 💡 Best Practices

### 1. Check AI Availability
```typescript
const source = await prisma.source.findUnique({
  where: { id: sourceId }
});

// Check if content exists (AI features available)
const hasAI = source.content && source.content.length > 100;

if (hasAI) {
  // Show AI features
} else {
  // Show message: "AI features not available for this source"
}
```

### 2. Handle Loading States
```typescript
const { isGenerating, error } = useFlashcardGeneration();

if (isGenerating) {
  return <div>Generating flashcards...</div>;
}

if (error) {
  return <div>Error: {error}</div>;
}
```

### 3. Provide Feedback
Always show users what's happening:
- Loading indicators during generation
- Success messages when complete
- Error messages if something fails

### 4. Cache Results
Study guides and flashcards can be expensive to generate. Consider:
```typescript
// Cache study guide in database
const existingGuide = await prisma.studyGuide.findUnique({
  where: { sourceId }
});

if (existingGuide) {
  return existingGuide;
}

// Generate if not cached
const newGuide = await generateStudyGuide(sourceId);
// Save to database...
```

## 🎓 Example User Flows

### Flow 1: Student Studies a PDF
1. Student uploads PDF lecture notes
2. System auto-generates embeddings (background)
3. Student clicks "Chat" tab
4. Asks: "What are the 5 main topics?"
5. AI responds with summary + source citations
6. Student clicks "Generate Flashcards"
7. AI creates 20 flashcards
8. Student reviews flashcards with spaced repetition

### Flow 2: Teacher Creates Study Materials
1. Teacher uploads textbook chapter
2. Clicks "Study Guide" tab
3. AI generates comprehensive guide with:
   - Overview
   - Key topics
   - Timeline
   - Vocabulary
   - Practice questions
4. Teacher exports/shares with students

## 🔍 Debugging

### Check if embeddings exist
```typescript
// Make a test chat request
const response = await chatWithDocument(sourceId, "test");
// If it works, embeddings exist
```

### View Workers logs
```bash
npx wrangler tail
```

### Check Workers dashboard
https://dash.cloudflare.com/ → Workers & Pages → edufeed-ai-worker

### Test embeddings endpoint
```bash
curl -X POST https://edufeed-ai-worker.steep-mouse-b843.workers.dev/api/embeddings/store \
  -H "Content-Type: application/json" \
  -d '{"sourceId":"test","content":"test content","metadata":{"title":"Test","type":"TEXT"}}'
```

## 💰 Cost Management

### Free Tier (Current)
- 10,000 AI generations/day
- Enough for ~300 study guides or 1,000 flashcard sets per day
- **Cost: $0**

### If You Exceed Free Tier
- $10-20/month for 10,000 flashcard generations
- $15-25/month for 1,000 study guides
- Still 10-20x cheaper than OpenAI!

### Monitor Usage
Check Cloudflare Dashboard for:
- Daily AI generation count
- Vector search queries
- Cost estimates

## 🚀 Next Steps

1. **Add AI tab to source pages** - Show chat, flashcards, study guides
2. **Add "Generate with AI" buttons** - Make features discoverable
3. **Cache generated content** - Save study guides to avoid regenerating
4. **Add analytics** - Track which AI features users love most
5. **Enable R2** - Add audio overview generation
6. **Custom branding** - Customize the UI components to match your design

## 📚 Reference

- **Workers URL**: `https://edufeed-ai-worker.steep-mouse-b843.workers.dev`
- **SDK**: `src/lib/workers-client.ts`
- **Hooks**: `src/hooks/useAIGeneration.ts`
- **Components**: `src/components/ai/`
- **API Routes**: `src/app/api/ai/`

---

**🎉 You're all set!** Start adding AI features to your pages using the components and hooks provided.

Need help? Check:
- [DEPLOYMENT_SUCCESS.md](DEPLOYMENT_SUCCESS.md) - Deployment details
- [AI_FEATURES_README.md](AI_FEATURES_README.md) - Feature documentation
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
