<!-- SW:META template="claude" version="1.0.173" sections="header,start,autodetect,metarule,rules,workflow,reflect,context,structure,taskformat,secrets,syncing,testing,tdd,api,limits,troubleshooting,lazyloading,principles,linking,mcp,auto,docs" -->

<!-- SW:SECTION:header version="1.0.173" -->
**Framework**: SpecWeave | **Truth**: `spec.md` + `tasks.md`
<!-- SW:END:header -->

<!-- SW:SECTION:start version="1.0.173" -->
## Getting Started

**Initial increment**: `0001-project-setup` (auto-created by `specweave init`)

**Options**:
1. **Start fresh**: `rm -rf .specweave/increments/0001-project-setup` → `/sw:increment "your-feature"`
2. **Customize**: Edit spec.md and use for setup tasks
<!-- SW:END:start -->

<!-- SW:SECTION:autodetect version="1.0.173" -->
## Auto-Detection

SpecWeave auto-detects product descriptions and routes to `/sw:increment`:

**Signals** (5+ = auto-route): Project name | Features list (3+) | Tech stack | Timeline/MVP | Problem statement | Business model

**Opt-out phrases**: "Just brainstorm first" | "Don't plan yet" | "Quick discussion" | "Let's explore ideas"
<!-- SW:END:autodetect -->

<!-- SW:SECTION:metarule version="1.0.173" -->
## Meta-Rule: Think-Before-Act

**Satisfy dependencies BEFORE dependent operations.**

```
❌ node script.js → Error → npm run build
✅ npm run build → node script.js → Success
```
<!-- SW:END:metarule -->

<!-- SW:SECTION:rules version="1.0.173" -->
## Rules

1. **Files** → `.specweave/increments/####-name/` (see Structure section for details)
2. **Update immediately**: `Edit("tasks.md", "[ ] pending", "[x] completed")` + `Edit("spec.md", "[ ] AC-", "[x] AC-")`
3. **Unique IDs**: Check `ls .specweave/increments/ | grep "^[0-9]" | tail -5`
4. **Emergency**: "emergency mode" → 1 edit, 50 lines max, no agents
5. **⛔ Initialization guard**: `.specweave/` folders MUST ONLY exist where `specweave init` was run
6. **⛔ Marketplace refresh**: Use `specweave refresh-marketplace` CLI (not `scripts/refresh-marketplace.sh`)
<!-- SW:END:rules -->

<!-- SW:SECTION:workflow version="1.0.173" -->
## Workflow

`/sw:increment "X"` → `/sw:do` → `/sw:progress` → `/sw:done 0001`

| Cmd | Action |
|-----|--------|
| `/sw:increment` | Plan feature |
| `/sw:do` | Execute tasks |
| `/sw:auto` | Autonomous execution |
| `/sw:auto-status` | Check auto session |
| `/sw:cancel-auto` | ⚠️ EMERGENCY ONLY manual cancel |
| `/sw:validate` | Quality check |
| `/sw:done` | Close |
| `/sw-github:sync` | GitHub sync |
| `/sw-jira:sync` | Jira sync |

**Natural language**: "Let's build X" → `/sw:increment` | "What's status?" → `/sw:progress` | "We're done" → `/sw:done` | "Ship while sleeping" → `/sw:auto`
<!-- SW:END:workflow -->

<!-- SW:SECTION:reflect version="1.0.173" -->
## Skill Memories

SpecWeave learns from corrections. Learnings saved here automatically. Edit or delete as needed.

**Disable**: Set `"reflect": { "enabled": false }` in `.specweave/config.json`
<!-- SW:END:reflect -->

<!-- SW:SECTION:context version="1.0.173" -->
## Context

**Before implementing**: Check ADRs at `.specweave/docs/internal/architecture/adr/`

**Load context**: `/sw:context <topic>` loads relevant living docs into conversation
<!-- SW:END:context -->

<!-- SW:SECTION:structure version="1.0.173" -->
## Structure

```
.specweave/
├── increments/####-name/     # metadata.json, spec.md, plan.md, tasks.md
├── docs/internal/specs/      # Living docs
└── config.json
```

**⛔ Increment root**: ONLY `metadata.json`, `spec.md`, `plan.md`, `tasks.md`

**Everything else → subfolders**: `reports/` | `logs/` | `scripts/` | `backups/`
<!-- SW:END:structure -->

<!-- SW:SECTION:taskformat version="1.0.173" -->
## Task Format

```markdown
### T-001: Title
**User Story**: US-001 | **Satisfies ACs**: AC-US1-01 | **Status**: [x] completed
**Test**: Given [X] → When [Y] → Then [Z]
```
<!-- SW:END:taskformat -->

<!-- SW:SECTION:secrets version="1.0.173" -->
## Secrets Check

**BEFORE CLI tools**: Check existing config first!
```bash
# Check if credentials EXIST (never display values!)
grep -qE "(GITHUB_TOKEN|GH_TOKEN|JIRA_|AZURE_DEVOPS_|ADO_)" .env 2>/dev/null && echo "Credentials found in .env"
cat .specweave/config.json | grep -A5 '"sync"'
gh auth status
```

**SECURITY**: NEVER use `grep TOKEN .env` without `-q` flag - it exposes credentials in terminal!
<!-- SW:END:secrets -->

<!-- SW:SECTION:syncing version="1.0.173" -->
## External Sync (GitHub/JIRA/ADO)

**Commands**: `/sw-github:sync {id}` (issues) | `/sw:sync-specs` (living docs only)

**Mapping**: Feature → Milestone | Story → Issue | Task → Checkbox

**Config**: Set `sync.github.enabled: true` + `canUpdateExternalItems: true` in config.json
<!-- SW:END:syncing -->

<!-- SW:SECTION:testing version="1.0.173" -->
## Testing

BDD in tasks.md | Unit >80% | `.test.ts` (Vitest)

```typescript
// ESM mocking: vi.hoisted() + vi.mock() (Vitest 4.x+)
const { mockFn } = vi.hoisted(() => ({ mockFn: vi.fn() }));
vi.mock('./module', () => ({ func: mockFn }));
```
<!-- SW:END:testing -->

<!-- SW:SECTION:tdd version="1.0.173" -->
## TDD Mode (Test-Driven Development)

**When `testing.defaultTestMode: "TDD"` is configured**, follow RED-GREEN-REFACTOR discipline:

### TDD Workflow (MANDATORY when configured)

```
1. RED:     Write FAILING test first → verify it fails
2. GREEN:   Write MINIMAL code to pass → no extra features
3. REFACTOR: Improve code quality → keep tests green
```

### Check TDD Mode Before Implementation

```bash
# Check if TDD mode is enabled
jq -r '.testing.defaultTestMode' .specweave/config.json
# Returns: "TDD" | "test-first" | "test-after"
```

### TDD Commands

| Command | Phase | Purpose |
|---------|-------|---------|
| `/sw:tdd-red` | RED | Write failing tests |
| `/sw:tdd-green` | GREEN | Minimal implementation |
| `/sw:tdd-refactor` | REFACTOR | Code quality improvement |
| `/sw:tdd-cycle` | ALL | Full orchestrated workflow |

### Enforcement Levels

Set `testing.tddEnforcement` in config.json:

| Level | Behavior |
|-------|----------|
| `strict` | **BLOCKS** task completion if RED not done before GREEN |
| `warn` | Shows warning but allows continuation (default) |
| `off` | No enforcement |

### TDD Task Format

When TDD is enabled, tasks include phase markers:

```markdown
### T-001: [RED] Write auth service tests
**Depends On**: None
**Status**: [ ] pending

### T-002: [GREEN] Implement auth service
**Depends On**: T-001
**Status**: [ ] pending

### T-003: [REFACTOR] Extract token utilities
**Depends On**: T-002
**Status**: [ ] pending
```

**Rule**: Complete dependencies BEFORE dependent tasks (RED before GREEN).
<!-- SW:END:tdd -->

<!-- SW:SECTION:api version="1.0.173" -->
## API Development (OpenAPI-First)

**For API projects only.** Commands: `/sw:api-docs --all` | `--openapi` | `--postman` | `--validate`

Enable in config: `{"apiDocs":{"enabled":true,"openApiPath":"openapi.yaml"}}`
<!-- SW:END:api -->

<!-- SW:SECTION:limits version="1.0.173" -->
## Limits

**Max 1500 lines/file** — extract before adding
<!-- SW:END:limits -->

<!-- SW:SECTION:troubleshooting version="1.0.173" -->
## Troubleshooting

| Issue | Fix |
|-------|-----|
| Skills/commands missing | Restart Claude Code |
| Plugins outdated | `specweave refresh-marketplace` |
| Out of sync | `/sw:sync-tasks` |
| Find increment | `/sw:status` |
| Root polluted | Move to `.specweave/increments/####/reports/` |
| Duplicate IDs | `/sw:fix-duplicates` |
| GitHub sync issues | Check config: `sync.github.enabled`, `canUpdateExternalItems` |
| Edits blocked | Add `"additionalDirectories":["repositories"]` to `.claude/settings.json` |
| Marketplace shows 0 | Normal with auto-load; `/plugin list` shows actual |
<!-- SW:END:troubleshooting -->

<!-- SW:SECTION:lazyloading version="1.0.173" -->
## Plugin Auto-Loading

Plugins load automatically based on project type and keywords. Manual install if needed:

```bash
claude plugin install sw-frontend@specweave  # Install plugin
claude plugin list                           # Check installed
export SPECWEAVE_DISABLE_AUTO_LOAD=1         # Disable auto-load
```

**Token savings**: Core ~3-5K tokens vs all plugins ~60K+
<!-- SW:END:lazyloading -->

<!-- SW:SECTION:principles version="1.0.173" -->
## Principles

1. **Spec-first**: `/sw:increment` before coding
2. **Docs = truth**: Specs guide implementation
3. **Incremental**: Small, validated increments
4. **Traceable**: All work → specs → ACs
<!-- SW:END:principles -->

<!-- SW:SECTION:linking version="1.0.173" -->
## Bidirectional Linking

Tasks ↔ User Stories auto-linked via AC-IDs: `AC-US1-01` → `US-001`

Task format: `**AC**: AC-US1-01, AC-US1-02` (CRITICAL for linking)
<!-- SW:END:linking -->

<!-- SW:SECTION:mcp version="1.0.173" -->
## External Services

**Priority**: CLI tools first (simpler) → MCP for complex integrations

**CLI tools** (check auth first):
```bash
gh auth status          # GitHub
wrangler whoami         # Cloudflare
supabase status         # Supabase
```

**MCP servers** (for richer integrations):
```bash
claude mcp add --transport http github https://api.github.com/mcp
claude mcp add --transport stdio postgres -- npx -y @modelcontextprotocol/server-postgres
/mcp                    # Check status in Claude Code
```

MCP supports lazy-loading (auto mode) - tools load on-demand when >10% context.
<!-- SW:END:mcp -->

<!-- SW:SECTION:auto version="1.0.173" -->
## Auto Mode

**Commands**: `/sw:auto` (start) | `/sw:auto-status` (check) | `/sw:cancel-auto` (emergency only)

**Pattern**: IMPLEMENT → TEST → FAIL? → FIX → PASS → NEXT

**TDD in Auto Mode**: If `testing.defaultTestMode: "TDD"` is configured:
- Use `/sw:auto --tdd` for strict enforcement (ALL tests must pass)
- Auto mode reads config and displays TDD banner
- Follow RED → GREEN → REFACTOR order for task triplets

**Pragmatic completion**: MUST (MVP, security, data integrity) | SHOULD (edge cases) | CAN SKIP (conflicts - ask user)

**STOP & ASK** if: Spec conflicts | Task unnecessary | Requirement ambiguous
<!-- SW:END:auto -->

<!-- SW:SECTION:docs version="1.0.173" -->
## Docs

[spec-weave.com](https://spec-weave.com)
<!-- SW:END:docs -->

---
<!-- ↓ ORIGINAL ↓ -->

# Claude Code Instructions

## CRITICAL: This file MUST be loaded at the start of EVERY Claude Code session!

**AUTO-LOAD REQUIREMENT:** Claude MUST read this file and the `.env` file at the beginning of each session to access Supabase credentials and execute database operations.

---

## CRITICAL: Authentication with Supabase Auth

**IMPORTANT:** Claude MUST implement authentication properly using Supabase Auth. Always execute all Supabase commands yourself - NEVER ask the user to run them manually.

### Supabase Project Details
- **Project ID:** `xsajblfxxeztfzpzoevi`
- **Project URL:** `https://xsajblfxxeztfzpzoevi.supabase.co`
- **Region:** EU Central 1 (Frankfurt)

### Supabase Auth Configuration
- Use `@supabase/supabase-js` for client-side auth
- Use `@supabase/ssr` for server-side auth in Next.js
- All secrets and credentials MUST be stored in `.env` file
- NEVER hardcode API keys, secrets, or credentials in source code

### Auth Implementation Guidelines
1. Always use Supabase Auth for user authentication (email/password, OAuth providers)
2. Use `createServerClient` for server-side auth (API routes, Server Components)
3. Use `createBrowserClient` for client-side auth (Client Components)
4. Implement proper session management with middleware
5. Sync Supabase Auth users with Prisma User model

### Environment Variables (ALL secrets in .env)
The `.env` file contains all required credentials:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL - Public Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY - Public anon key for client-side
SUPABASE_SERVICE_ROLE_KEY - Service role key for server-side (KEEP SECRET!)

# Database
DATABASE_URL - PostgreSQL connection string with pooler
DIRECT_URL - Direct connection for migrations

# SendGrid (USE THIS FOR ALL EMAILS - NOT Supabase email)
SENDGRID_API_KEY - API key for sending transactional emails (starts with SG.)

# Twilio (SMS/Voice)
TWILIO_ACCOUNT_SID - Account SID (starts with AC)
TWILIO_AUTH_TOKEN - Auth token for API access

# Other services
NEXTAUTH_SECRET, OPENAI_API_KEY, etc.
```

---

## CRITICAL: Email Service (SendGrid)

**IMPORTANT:** Use SendGrid for ALL transactional emails instead of Supabase's built-in email.

### SendGrid Configuration
- **Account:** anton.abyzov@gmail.com
- **API Key:** Stored in `.env` as `SENDGRID_API_KEY`
- Use `@sendgrid/mail` package for sending emails

### Email Types to Send via SendGrid
1. Email verification/confirmation
2. Password reset
3. Welcome emails
4. Notification emails
5. Any transactional email

### SendGrid Implementation
```typescript
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
```

---

## Twilio Configuration (SMS/Voice)

### Twilio Credentials
- **Account SID:** Stored in `.env` as `TWILIO_ACCOUNT_SID`
- **Auth Token:** Stored in `.env` as `TWILIO_AUTH_TOKEN`

### Twilio Usage
```typescript
import twilio from 'twilio';
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
```

---

## GitHub Configuration

### GitHub Personal Access Token
- **Token:** Stored in `.env` as `GITHUB_TOKEN`
- **Scopes:** repo, workflow (for CI/CD operations)

### GitHub Usage
```bash
# Use for GitHub API calls
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user

# Use with gh CLI
export GH_TOKEN=$(grep GITHUB_TOKEN .env | cut -d'"' -f2)
gh repo list
```

### When to Use GITHUB_TOKEN
- Creating/managing GitHub issues via API
- GitHub Actions workflows
- Repository operations (clone private repos, push)
- SpecWeave GitHub sync (`/sw-github:sync`)

---

## Database Operations

**IMPORTANT:** Claude MUST execute all database operations with Supabase directly. Do not ask the user to run migrations manually - execute them yourself using the Prisma CLI.

### Session Startup Checklist
At the start of each session, Claude should:
1. **Read `.env` file FIRST** to load ALL credentials (Supabase, GitHub, SendGrid, etc.)
2. Verify database connection is configured
3. Run `npx prisma generate` if Prisma client needs updating
4. Run `npx prisma db push` or migrations as needed

**CRITICAL: Always check `.env` for secrets before any external operation!**
```bash
# Quick check for available tokens
grep -E "^[A-Z_]+=" .env | cut -d= -f1
```

### Supabase Database Configuration
- All database credentials are stored in `.env` file
- Use `npx prisma migrate dev` for development migrations
- Use `npx prisma db push` for quick schema synchronization
- Use `npx prisma generate` to regenerate the Prisma client after schema changes

### Migration Workflow
1. Make schema changes in `prisma/schema.prisma`
2. Run `npx prisma generate` to update the client
3. Run `npx prisma migrate dev --name descriptive_name` to create and apply migration
4. If migration fails, check connection string and try `npx prisma db push` as fallback

### Prisma Schema Configuration
The `prisma/schema.prisma` should include:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

---

## Auth Files Structure
```
src/
├── lib/
│   ├── supabase/
│   │   ├── client.ts      # Browser client
│   │   ├── server.ts      # Server client
│   │   └── middleware.ts  # Auth middleware helpers
│   └── auth.ts            # Auth utilities and helpers
├── middleware.ts          # Next.js middleware for session refresh
└── app/
    ├── auth/
    │   ├── callback/route.ts  # OAuth callback handler
    │   ├── login/page.tsx     # Login page
    │   └── signup/page.tsx    # Signup page
    └── api/auth/...           # API routes for auth
```

---

## Project Structure

### Web Application (Next.js)
- Next.js 16 with App Router
- Prisma ORM with PostgreSQL (Supabase)
- Supabase Auth for authentication
- OpenAI for AI content generation
- TailwindCSS for styling

### Mobile Application (Expo/React Native)
Location: `edufeed-mobile/`
- Expo Router for navigation
- Supabase Auth with `@supabase/supabase-js`
- React Query for data fetching
- NativeWind (Tailwind CSS for React Native)
- Zustand for state management

### Authentication Flow
1. **Primary:** Email/Password (always shown first)
2. **Secondary:** Google OAuth, Apple Sign-In (iOS only)
3. All auth goes through Supabase Auth
4. Backend syncs Supabase users with Prisma User model via `/api/mobile/auth/supabase`

### Mobile Environment Variables
Mobile app uses `EXPO_PUBLIC_*` prefix:
```
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## Commands Claude Must Execute Directly
- `npx prisma generate` - Regenerate Prisma client
- `npx prisma migrate dev --name <name>` - Create and apply migrations
- `npx prisma db push` - Push schema changes
- `npm install <packages>` - Install dependencies
- All other database and setup commands

---

## CRITICAL: Database Migration Tracking

**Claude MUST:**
1. **ALWAYS execute database migrations directly** - NEVER ask the user to run them
2. **Track all pending migrations** and execute them immediately
3. **Verify migrations succeeded** by checking the output
4. **Update the migration log** below after each migration

### Migration Execution Process
1. After any schema change in `prisma/schema.prisma`:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
2. If `db push` fails, try:
   ```bash
   npx prisma migrate dev --name descriptive_name
   ```
3. If connection fails, verify DATABASE_URL and DIRECT_URL in `.env`

### Migration History Log
Track all migrations here with status:

| Date | Migration Name | Status | Notes |
|------|---------------|--------|-------|
| 2024-12-26 | add_notebook_and_study_room_system | COMPLETED | Notebook + StudyRoom models - verified via db pull |

### Pending Migrations
No pending migrations.

### Applied Tables (verified 2024-12-26)
Notebook system:
- `Notebook` - Main notebook container
- `NotebookSource` - Sources (URL, PDF, YouTube, Text, etc.)
- `NotebookChat` - AI chat messages
- `NotebookCitation` - Source citations in responses
- `NotebookOutput` - Generated content (summaries, flashcards, etc.)
- `NotebookCollaborator` - Sharing permissions
- `SourceEmbedding` - Vector embeddings for RAG

Study Room system:
- `StudyRoom` - Collaborative study rooms
- `StudyRoomParticipant` - Room participants
- `StudyRoomMessage` - Real-time chat
- `StudyRoomAnnotation` - Shared highlights/comments
- `StudySession` - Session history
- `StudyRoomInvite` - Private room invitations

---

## Supabase CLI Commands (ALWAYS USE THESE)

**CRITICAL:** Claude MUST use Supabase CLI for all Supabase operations. NEVER ask the user to do these manually.

The access token is stored in `.env` as `SUPABASE_ACCESS_TOKEN`. Always use it:

```bash
# Get API keys
SUPABASE_ACCESS_TOKEN=$(grep SUPABASE_ACCESS_TOKEN .env | cut -d'"' -f2) npx supabase projects api-keys --project-ref xsajblfxxeztfzpzoevi

# List projects
SUPABASE_ACCESS_TOKEN=$(grep SUPABASE_ACCESS_TOKEN .env | cut -d'"' -f2) npx supabase projects list

# Enable/check auth providers
SUPABASE_ACCESS_TOKEN=$(grep SUPABASE_ACCESS_TOKEN .env | cut -d'"' -f2) npx supabase auth list --project-ref xsajblfxxeztfzpzoevi

# Push database changes
npx supabase db push

# Pull remote schema
npx supabase db pull
```

### Quick Access Token Command
```bash
export SUPABASE_ACCESS_TOKEN="sbp_c03e397834f3969bd69548cc68a0eba63bd5a9ce"
```

---

## Supabase Dashboard Settings (REQUIRED)

### Enable Email Authentication
1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/xsajblfxxeztfzpzoevi
2. Navigate to **Authentication > Providers > Email**
3. Ensure **Enable Email provider** is ON
4. Configure email templates as needed
5. For testing, you can disable **Confirm email** temporarily

### Get Correct API Keys
1. Go to **Settings > API** in Supabase Dashboard
2. Copy values to .env:
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon (public) key
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role (secret) key
3. **IMPORTANT:** Service role key starts with `eyJ...` (JWT format)
   - If your key starts with `sbp_...`, that's an ACCESS TOKEN (wrong!)
   - Access tokens are for CLI login, NOT for service role

### Troubleshooting "Invalid API key" Error
1. Check that NEXT_PUBLIC_SUPABASE_URL matches your project URL exactly
2. Verify anon key is copied correctly (no extra spaces)
3. Ensure Email provider is enabled in Authentication settings
4. Check Supabase Dashboard > API for correct keys

---

## Authentication Status (Verified 2025-12-28)

### Current Configuration
- **Email Authentication:** ENABLED and WORKING
- **Email Auto-confirm:** ENABLED (users are auto-verified on signup)
- **API Keys:** Valid and tested
- **Database Connection:** Working

### Verified Tests
| Test | Status | Notes |
|------|--------|-------|
| Anon key validation | PASS | Key is valid JWT |
| Service role key | PASS | Key works for admin operations |
| Email signup | PASS | Users created successfully |
| Email login | PASS | Returns access token |
| Database connection | PASS | Prisma introspected 48 tables |

---

## Common Issues and Solutions

### Issue: Signup returns "Invalid API key"
- Verify NEXT_PUBLIC_SUPABASE_ANON_KEY is correct JWT (starts with `eyJ...`)
- Check Email auth is enabled in Supabase Dashboard
- Ensure URL matches exactly: `https://xsajblfxxeztfzpzoevi.supabase.co`

### Issue: Signup returns "Email address invalid"
- This was caused by Supabase's built-in email validation/spam protection
- FIXED by enabling `mailer_autoconfirm: true` via Management API
- To disable autoconfirm later, configure custom SMTP (SendGrid)

### Issue: Service role operations fail
- SUPABASE_SERVICE_ROLE_KEY must be a JWT (starts with `eyJ...`)
- Get from: Dashboard > Settings > API > service_role key
- Do NOT use access tokens (`sbp_...`) - those are for CLI only

### Issue: OAuth not working
- Configure OAuth providers in Dashboard > Authentication > Providers
- Set correct redirect URLs in each provider
- Add redirect URL: `http://localhost:3000/auth/callback`
