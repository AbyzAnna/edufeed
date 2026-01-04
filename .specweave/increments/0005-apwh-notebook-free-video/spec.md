# Increment 0005: APWH Notebook with FREE Video Generation

## Overview
Create a comprehensive notebook called "APWH" (AP World History) with 40 sources and implement a 100% FREE video generation system using Cloudflare AI services.

## Features

### FS-001: APWH Notebook Creation
Create a notebook with diverse source types:
- 10 YouTube videos (AP World History educational content)
- 10 file uploads (PDF documents)
- 10 website URLs (history education sites)
- 10 pasted text entries (historical notes)

### FS-002: FREE Video Generation System
Implement video generation using exclusively FREE services:
- Cloudflare AI Stable Diffusion XL for images (FREE)
- Cloudflare AI MeloTTS for narration audio (FREE)
- Slideshow format with animated transitions
- No paid API dependencies (no OpenAI video, no ElevenLabs, no paid services)

### FS-003: Video Player Component
Build a video player that renders slideshow-style videos:
- Animated image transitions
- Synchronized audio narration
- Progress bar and playback controls
- Full-screen support

### FS-004: Comprehensive Testing
Write 500 tests covering:
- Video generation pipeline
- Image generation with Cloudflare AI
- Audio generation with MeloTTS
- Slideshow rendering
- Source processing
- Notebook CRUD operations

## User Stories

### US-001: As a user, I want to create an APWH notebook with 40 sources
**Acceptance Criteria:**
- [x] AC-US1-01: Can create notebook named "APWH"
- [x] AC-US1-02: Can add 10 YouTube video sources
- [x] AC-US1-03: Can add 10 PDF file sources
- [x] AC-US1-04: Can add 10 website URL sources
- [x] AC-US1-05: Can add 10 pasted text sources
- [x] AC-US1-06: All sources process successfully

### US-002: As a user, I want FREE video generation (no paid APIs)
**Acceptance Criteria:**
- [x] AC-US2-01: Video uses Cloudflare AI Stable Diffusion for images
- [x] AC-US2-02: Video uses Cloudflare AI MeloTTS for audio
- [x] AC-US2-03: No paid API calls (no OpenAI, ElevenLabs, etc.)
- [x] AC-US2-04: Video renders as slideshow with transitions
- [x] AC-US2-05: Audio narration syncs with slides

### US-003: As a user, I want to play generated videos
**Acceptance Criteria:**
- [x] AC-US3-01: Video player shows slideshow with transitions
- [x] AC-US3-02: Audio plays synchronized with slides
- [x] AC-US3-03: Progress bar shows playback position
- [x] AC-US3-04: Play/pause controls work
- [x] AC-US3-05: Full-screen mode available

### US-004: As a developer, I want comprehensive test coverage
**Acceptance Criteria:**
- [x] AC-US4-01: 500+ tests written
- [x] AC-US4-02: Unit tests for video generation functions
- [x] AC-US4-03: Integration tests for API endpoints
- [x] AC-US4-04: E2E tests for video playback
- [x] AC-US4-05: Mock tests for Cloudflare AI services

## Technical Design

### Video Generation Architecture (100% FREE)
```
User Request
    │
    ▼
POST /api/notebooks/[id]/outputs (type: VIDEO_OVERVIEW)
    │
    ▼
Workers: /api/video-overview/generate
    │
    ├── 1. generateVideoScript() - OpenRouter/Ollama (FREE)
    │       └── Returns: segments[], narration text
    │
    ├── 2. generateSegmentImage() - Cloudflare AI SDXL (FREE)
    │       └── Returns: base64 PNG images
    │
    ├── 3. generateNarrationAudio() - Cloudflare AI MeloTTS (FREE)
    │       └── Returns: base64 MP3 audio
    │
    └── 4. Combine into slideshow format
            └── Returns: {videoUrl, segments, audioUrl}
```

### Frontend Slideshow Player
```typescript
// Renders slideshow from JSON data
interface SlideshowData {
  type: 'slideshow';
  segments: Array<{
    imageUrl: string;     // base64 AI-generated image
    duration: number;     // seconds per slide
    narration: string;    // text for this slide
    title: string;
  }>;
  audioUrl?: string;      // base64 MP3 narration
  totalDuration: number;
}
```

## Test Categories (500 tests)

1. **Unit Tests (200)**: Video generation functions
2. **Integration Tests (150)**: API endpoint flows
3. **E2E Tests (100)**: Full user workflows
4. **Mock Tests (50)**: Cloudflare AI service mocking

## Non-Goals
- Real video rendering (MP4/WebM) - uses slideshow format
- Paid API integration (OpenAI DALL-E, ElevenLabs, etc.)
- Complex video editing features

## Success Metrics
- All 40 sources added to APWH notebook
- Video generation works with 100% free services
- 500+ tests pass
- No paid API calls in video pipeline
