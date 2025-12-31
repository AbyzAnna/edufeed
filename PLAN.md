# EduFeed - Educational Video Feed Platform

## Overview
A TikTok/Reels-style platform where users upload educational sources (PDFs, links, course names) and the system auto-generates short-form videos displayed in a vertical scrolling feed.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │  Feed    │  │  Upload  │  │  Auth    │  │  Profile/Library │ │
│  │  Player  │  │  Sources │  │  Pages   │  │  Management      │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │  /auth   │  │  /upload │  │  /videos │  │  /generate       │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐
│   Database   │    │   Storage    │    │   Video Generation   │
│  (Postgres)  │    │ (S3/R2/Blob) │    │      Pipeline        │
│   + Prisma   │    │              │    │                      │
└──────────────┘    └──────────────┘    │  ┌────────────────┐  │
                                        │  │ Content Parser │  │
                                        │  │ (PDF/URL/Text) │  │
                                        │  └───────┬────────┘  │
                                        │          ▼           │
                                        │  ┌────────────────┐  │
                                        │  │  AI Summarizer │  │
                                        │  │   (OpenAI)     │  │
                                        │  └───────┬────────┘  │
                                        │          ▼           │
                                        │  ┌────────────────┐  │
                                        │  │ Video Renderer │  │
                                        │  │ (Multi-mode)   │  │
                                        │  └────────────────┘  │
                                        └──────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 14 (App Router) | React framework with SSR |
| Styling | Tailwind CSS | Utility-first CSS |
| Database | PostgreSQL + Prisma | Data persistence & ORM |
| Auth | NextAuth.js | Authentication (Google, Email) |
| Storage | Vercel Blob / AWS S3 | PDF uploads + generated videos |
| Queue | Inngest / QStash | Async video generation jobs |
| AI/LLM | OpenAI GPT-4 | Content summarization & scripting |
| TTS | ElevenLabs / OpenAI TTS | Voice narration |
| Video | Remotion / FFmpeg | Video rendering |
| Avatar (optional) | HeyGen / D-ID API | AI presenter videos |

---

## Database Schema (Prisma)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  createdAt     DateTime  @default(now())
  sources       Source[]
  videos        Video[]
}

model Source {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  type          SourceType // PDF, URL, TEXT
  title         String
  content       String?   // Extracted text content
  originalUrl   String?   // For URL sources
  fileUrl       String?   // For uploaded PDFs
  createdAt     DateTime  @default(now())
  videos        Video[]
}

enum SourceType {
  PDF
  URL
  TEXT
}

model Video {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  sourceId      String
  source        Source    @relation(fields: [sourceId], references: [id])
  title         String
  description   String?
  videoUrl      String?
  thumbnailUrl  String?
  duration      Int?      // seconds
  status        VideoStatus
  generationType GenerationType
  script        String?   // AI-generated script
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum VideoStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

enum GenerationType {
  SLIDESHOW    // Animated slides + TTS
  AI_VIDEO     // Full AI generation (Runway/Pika)
  AVATAR       // AI presenter (HeyGen/D-ID)
}
```

---

## Project Structure

```
/app
├── (auth)/
│   ├── login/page.tsx
│   └── signup/page.tsx
├── (main)/
│   ├── feed/page.tsx          # TikTok-style vertical feed
│   ├── upload/page.tsx        # Upload sources
│   ├── library/page.tsx       # User's sources & videos
│   └── profile/page.tsx       # User profile
├── api/
│   ├── auth/[...nextauth]/route.ts
│   ├── sources/
│   │   ├── route.ts           # POST: create source
│   │   └── [id]/route.ts      # GET, DELETE
│   ├── videos/
│   │   ├── route.ts           # GET: feed videos
│   │   └── [id]/route.ts      # GET single video
│   ├── generate/
│   │   └── route.ts           # POST: trigger generation
│   └── upload/
│       └── route.ts           # POST: file upload to storage
├── layout.tsx
└── page.tsx                   # Landing/redirect

/components
├── feed/
│   ├── VideoPlayer.tsx        # Single video component
│   ├── VideoFeed.tsx          # Vertical scroll container
│   └── VideoControls.tsx      # Play, mute, share
├── upload/
│   ├── SourceUploader.tsx     # PDF/URL/Text input
│   ├── PDFDropzone.tsx
│   └── GenerationOptions.tsx  # Choose video type
├── ui/                        # Reusable UI components
└── layout/
    ├── Navbar.tsx
    └── BottomNav.tsx          # Mobile navigation

/lib
├── prisma.ts                  # Prisma client
├── auth.ts                    # NextAuth config
├── storage.ts                 # S3/Blob helpers
└── generation/
    ├── parser.ts              # Extract content from sources
    ├── summarizer.ts          # AI summarization
    ├── scriptWriter.ts        # Generate video scripts
    ├── tts.ts                 # Text-to-speech
    ├── slideshow.ts           # Remotion slideshow renderer
    └── avatar.ts              # HeyGen/D-ID integration

/prisma
├── schema.prisma
└── migrations/
```

---

## Implementation Steps

### Phase 1: Project Setup & Auth
1. Initialize Next.js 14 with TypeScript, Tailwind, ESLint
2. Set up Prisma with PostgreSQL (local Docker or cloud)
3. Configure NextAuth with Google provider
4. Create basic layout with navigation
5. Build login/signup pages

### Phase 2: Source Upload System
1. Create source upload page with three modes:
   - PDF upload (drag & drop)
   - URL input (paste link)
   - Text input (course name/topic)
2. Implement file upload API (Vercel Blob or S3)
3. Build PDF text extraction (pdf-parse library)
4. Create URL content scraper (cheerio/puppeteer)
5. Save sources to database

### Phase 3: Video Generation Pipeline
1. Create generation queue system (Inngest recommended)
2. Build AI summarization module:
   - Extract key concepts
   - Generate 30-60 second script
   - Create visual prompts/descriptions
3. Implement Slideshow generation (Remotion):
   - Generate animated text cards
   - Add transitions and visuals
   - Integrate TTS narration
4. Add alternative generators (can be added incrementally):
   - AI video (Runway API)
   - Avatar presenter (HeyGen API)
5. Upload generated videos to storage
6. Update video status in database

### Phase 4: Feed & Video Player
1. Build TikTok-style vertical scroll feed:
   - Full-screen video cards
   - Snap scrolling behavior
   - Lazy loading for performance
2. Create video player component:
   - Auto-play on scroll into view
   - Tap to pause/play
   - Mute/unmute toggle
   - Progress indicator
3. Add video metadata overlay:
   - Title, source info
   - Creator info
4. Implement infinite scroll pagination

### Phase 5: User Library & Profile
1. Build user's source library page
2. Show generated videos per source
3. Display generation status (pending/processing/done)
4. Allow re-generation with different style
5. Basic profile page

### Phase 6: Polish & Deployment
1. Add loading states and error handling
2. Implement mobile-responsive design
3. Add video sharing functionality
4. Set up production database (Supabase/Neon)
5. Deploy to Vercel
6. Configure environment variables

---

## Video Generation Approaches (All Supported)

### 1. Slideshow + TTS (Recommended for MVP)
**Cost:** Low (~$0.01-0.05 per video)
**Speed:** Fast (30-60 seconds)
**Quality:** Good for educational content

```
Source → AI Summary → Script → Remotion Slides + OpenAI TTS → MP4
```

### 2. AI Avatar Presenter
**Cost:** Medium (~$0.50-2.00 per video)
**Speed:** 2-5 minutes
**Quality:** Very engaging, feels personal

```
Source → AI Summary → Script → HeyGen/D-ID API → MP4
```

### 3. Full AI Video Generation
**Cost:** High (~$1-5 per video)
**Speed:** 5-15 minutes
**Quality:** Cinematic but less predictable

```
Source → AI Summary → Visual Prompts → Runway/Pika → MP4
```

---

## Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sources` | Create new source (PDF/URL/text) |
| GET | `/api/sources` | List user's sources |
| POST | `/api/upload` | Upload PDF file |
| POST | `/api/generate` | Trigger video generation |
| GET | `/api/videos` | Get feed videos (paginated) |
| GET | `/api/videos/[id]` | Get single video |
| GET | `/api/videos/user` | Get user's videos |

---

## Environment Variables Required

```env
# Database
DATABASE_URL="postgresql://..."

# Auth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Storage
BLOB_READ_WRITE_TOKEN="..." # Vercel Blob
# or AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET

# AI Services
OPENAI_API_KEY="..."
ELEVENLABS_API_KEY="..." # Optional, can use OpenAI TTS

# Video Generation (optional, for advanced modes)
HEYGEN_API_KEY="..."
RUNWAY_API_KEY="..."

# Queue (for async processing)
INNGEST_EVENT_KEY="..."
INNGEST_SIGNING_KEY="..."
```

---

## MVP Feature Checklist

- [ ] User authentication (Google login)
- [ ] Source upload (PDF, URL, text)
- [ ] Content extraction & summarization
- [ ] Video generation (slideshow mode)
- [ ] Video storage & streaming
- [ ] TikTok-style vertical feed
- [ ] User library/dashboard
- [ ] Mobile-responsive design

---

## Future Enhancements (Post-MVP)

- Likes, comments, bookmarks
- Share to social media
- Follow other users
- Explore/discover page
- Video chapters/sections
- Multiple videos per source
- Custom branding/themes
- Analytics dashboard
- API for third-party integrations
