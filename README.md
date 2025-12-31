# EduFeed

Transform educational content into engaging TikTok-style videos.

## Features

- **Source Upload**: Upload PDFs, paste URLs, or type course topics
- **AI Video Generation**: Automatically generate short-form educational videos
- **TikTok-Style Feed**: Vertical scrolling video feed with snap scrolling
- **Multiple Video Styles**: Slideshow, AI Avatar, or Cinematic modes
- **User Accounts**: Google authentication with personal libraries

## Tech Stack

- **Frontend**: Next.js 14, React 19, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma
- **Authentication**: NextAuth.js
- **AI**: OpenAI GPT-4 (summarization), OpenAI TTS (narration)
- **Storage**: Vercel Blob
- **Queue**: Inngest (async video generation)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (or Docker)
- OpenAI API key
- Google OAuth credentials (optional, for auth)

### 1. Clone and Install

```bash
cd edufeed
npm install
```

### 2. Set Up Database

Using Docker (recommended):
```bash
docker-compose up -d
```

Or use a cloud database (Supabase, Neon, etc.)

### 3. Configure Environment

Copy the example env file and update with your credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your app URL (http://localhost:3000 for dev)
- `OPENAI_API_KEY` - For AI summarization and TTS
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - For Google login

### 4. Initialize Database

```bash
npm run db:push
npm run db:seed  # Optional: add demo data
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
edufeed/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (main)/            # Authenticated pages
│   │   │   ├── feed/          # Video feed
│   │   │   ├── upload/        # Source upload
│   │   │   ├── library/       # User library
│   │   │   └── profile/       # User profile
│   │   ├── api/               # API routes
│   │   └── login/             # Auth page
│   ├── components/
│   │   ├── feed/              # Feed components
│   │   ├── layout/            # Navigation
│   │   ├── providers/         # Context providers
│   │   ├── ui/                # UI components
│   │   └── upload/            # Upload components
│   └── lib/
│       ├── generation/        # Video generation pipeline
│       │   ├── parser.ts      # PDF/URL parsing
│       │   ├── summarizer.ts  # AI summarization
│       │   ├── tts.ts         # Text-to-speech
│       │   └── slideshow.ts   # Video rendering
│       ├── inngest/           # Background jobs
│       ├── auth.ts            # NextAuth config
│       ├── prisma.ts          # Database client
│       └── storage.ts         # File storage
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Demo data
└── docker-compose.yml         # Local database
```

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sources` | Create new source |
| GET | `/api/sources` | List user's sources |
| POST | `/api/upload` | Upload PDF file |
| POST | `/api/generate` | Trigger video generation |
| GET | `/api/videos` | Get feed videos |
| GET | `/api/user/stats` | Get user statistics |

## Video Generation Pipeline

1. **Content Extraction**: Parse PDFs, scrape URLs, or use text input
2. **AI Summarization**: Generate concise, engaging script using GPT-4
3. **TTS Generation**: Convert script to audio using OpenAI TTS
4. **Video Rendering**: Create slideshow video with animations
5. **Upload**: Store video and thumbnail in cloud storage

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

### Environment Variables for Production

```env
DATABASE_URL=your-production-db-url
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=https://your-domain.com
OPENAI_API_KEY=sk-...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
BLOB_READ_WRITE_TOKEN=...
```

## License

MIT
