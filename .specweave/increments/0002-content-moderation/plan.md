# Technical Plan - AI Content Moderation System

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Content Creation Flow                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   User Input → API Route → ModerationService → AI Check         │
│                     │              │                             │
│                     │              ├── Cloudflare Workers AI     │
│                     │              │   (Primary - Low Latency)   │
│                     │              │                             │
│                     │              └── OpenAI Moderation API     │
│                     │                  (Fallback)                │
│                     │                                            │
│                     ▼                                            │
│              Decision Gate                                       │
│              ├── APPROVED → Save Content → Publish              │
│              ├── REJECTED → Block → Notify User                 │
│              └── NEEDS_REVIEW → Save → Queue for Admin          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. ContentModerationService

**Location**: `src/lib/moderation/content-moderation-service.ts`

```typescript
interface ModerationResult {
  approved: boolean;
  requiresReview: boolean;
  violations: ViolationCategory[];
  confidenceScore: number;
  report: ContentModerationReport;
}

interface ViolationCategory {
  category: 'hate' | 'harassment' | 'violence' | 'sexual' | 'self-harm' | 'spam' | 'misinformation';
  confidence: number;
  details: string;
}

class ContentModerationService {
  async moderate(content: string, type: ContentType, userId: string): Promise<ModerationResult>;
  async checkWithWorker(content: string): Promise<AIResponse>;
  async checkWithOpenAI(content: string): Promise<AIResponse>;
  async createReport(result: AIResponse, content: string, type: ContentType, userId: string): Promise<Report>;
}
```

### 2. Cloudflare Worker Integration

**Location**: `workers/moderation.ts`

```typescript
// Add moderation endpoint to existing worker
export async function moderateContent(content: string, env: Env): Promise<ModerationResponse> {
  // Use Workers AI for fast moderation
  const ai = new Ai(env.AI);

  // Run moderation model
  const result = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
    prompt: MODERATION_PROMPT,
    messages: [{ role: 'user', content }]
  });

  return parseResponse(result);
}
```

### 3. Database Schema Updates

**Location**: `prisma/schema.prisma`

- Add `ContentModerationReport` model
- Add `UserModerationHistory` model
- Add enums: `ContentType`, `ModerationStatus`, `ModerationDecision`, `UserModerationStatus`
- Add relations to `User` model

### 4. API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/moderation/check` | POST | Pre-check content before submission |
| `/api/admin/moderation/reports` | GET | List reports with filters |
| `/api/admin/moderation/reports/[id]` | PATCH | Update report decision |
| `/api/moderation/appeal/[reportId]` | POST | Submit user appeal |

### 5. Integration Points

Each content creation flow needs moderation integration:

```typescript
// Example: Comment creation with moderation
async function createComment(data: CreateCommentInput) {
  // 1. Check content
  const modResult = await moderationService.moderate(
    data.content,
    'COMMENT',
    data.userId
  );

  // 2. Handle decision
  if (!modResult.approved) {
    throw new ContentBlockedError(modResult.violations);
  }

  // 3. Create content if approved
  return prisma.comment.create({ data });
}
```

## Implementation Phases

### Phase 1: Core Infrastructure (T-001 to T-005)
1. Add Prisma models and run migration
2. Create ContentModerationService
3. Implement Cloudflare Worker moderation endpoint
4. Create OpenAI fallback integration
5. Write unit tests for service

### Phase 2: API & Integration (T-006 to T-010)
6. Create moderation check API endpoint
7. Integrate into Comment creation
8. Integrate into DirectMessage sending
9. Integrate into StudyRoomMessage posting
10. Integrate into Notebook content

### Phase 3: User Experience (T-011 to T-015)
11. Create blocked content error responses
12. Add user notification for blocked content
13. Implement UserModerationHistory tracking
14. Add progressive penalty system
15. Create appeal submission endpoint

### Phase 4: Admin Dashboard (T-016 to T-020)
16. Create admin reports listing API
17. Build moderation dashboard UI
18. Implement bulk actions
19. Add appeal review workflow
20. Create moderation analytics

## Testing Strategy

### Unit Tests
- ModerationService.moderate() with various content types
- Violation detection accuracy
- Threshold configuration

### Integration Tests
- API endpoint responses
- Database report creation
- Worker ↔ API communication

### E2E Tests
- Full content submission flow with moderation
- Blocked content user experience
- Admin dashboard functionality

## Configuration

```typescript
// src/lib/moderation/config.ts
export const MODERATION_CONFIG = {
  thresholds: {
    autoReject: 85,      // Confidence > 85% = auto reject
    manualReview: 60,    // Confidence 60-85% = manual review
    autoApprove: 60,     // Confidence < 60% = auto approve
  },
  penalties: {
    warningThreshold: 2,    // Violations before warning
    muteThreshold: 5,       // Violations before mute
    muteDuration: 24 * 60,  // Mute duration in minutes
    reviewThreshold: 10,    // Violations before account review
  },
  contentTypes: {
    COMMENT: { sensitivity: 'medium' },
    DIRECT_MESSAGE: { sensitivity: 'high' },
    STUDY_ROOM_MESSAGE: { sensitivity: 'medium' },
    NOTEBOOK_CONTENT: { sensitivity: 'low' },
    FLASHCARD: { sensitivity: 'low' },
  }
};
```

## Security Considerations

1. **Rate Limiting**: Prevent moderation API abuse
2. **Content Hashing**: Detect duplicate violations
3. **Audit Logging**: Track all moderation decisions
4. **PII Protection**: Sanitize stored content appropriately
5. **Admin Access Control**: Role-based dashboard access

## Monitoring & Alerts

- Track moderation latency (P95 < 500ms)
- Alert on high rejection rates
- Monitor AI model accuracy
- Track appeal success rates
