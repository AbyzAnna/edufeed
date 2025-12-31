<!-- SW:META template="claude" version="1.0.64" sections="header,start,autodetect,metarule,rules,workflow,context,lsp,structure,taskformat,secrets,syncing,mapping,testing,api,limits,troubleshooting,principles,linking,mcp,autoexecute,auto,docs" -->

<!-- SW:SECTION:header version="1.0.64" -->
**Framework**: SpecWeave | **Truth**: `spec.md` + `tasks.md`
<!-- SW:END:header -->

<!-- SW:SECTION:start version="1.0.64" -->
## Getting Started

**Initial increment**: `0001-project-setup` (auto-created by `specweave init`)

**Options**:
1. **Start fresh**: `rm -rf .specweave/increments/0001-project-setup` → `/sw:increment "your-feature"`
2. **Customize**: Edit spec.md and use for setup tasks
<!-- SW:END:start -->

<!-- SW:SECTION:autodetect version="1.0.64" -->
## Auto-Detection

SpecWeave auto-detects product descriptions and routes to `/sw:increment`:

**Signals** (5+ = auto-route): Project name | Features list (3+) | Tech stack | Timeline/MVP | Problem statement | Business model

**Opt-out phrases**: "Just brainstorm first" | "Don't plan yet" | "Quick discussion" | "Let's explore ideas"
<!-- SW:END:autodetect -->

<!-- SW:SECTION:metarule version="1.0.64" -->
## Meta-Rule: Think-Before-Act

**Satisfy dependencies BEFORE dependent operations.**

```
❌ node script.js → Error → npm run build
✅ npm run build → node script.js → Success
```
<!-- SW:END:metarule -->

<!-- SW:SECTION:rules version="1.0.64" -->
## Rules

1. **Files** → `.specweave/increments/####-name/` (spec.md, plan.md, tasks.md at root; reports/, scripts/, logs/ subfolders)
2. **Update immediately**: `Edit("tasks.md", "[ ] pending", "[x] completed")` + `Edit("spec.md", "[ ] AC-", "[x] AC-")`
3. **Unique IDs**: Check `ls .specweave/increments/ | grep "^[0-9]" | tail -5`
4. **Emergency**: "emergency mode" → 1 edit, 50 lines max, no agents
5. **Root clean**: NEVER create .md/reports/scripts in project root → use increment folders
<!-- SW:END:rules -->

<!-- SW:SECTION:workflow version="1.0.64" -->
## Workflow

`/sw:increment "X"` → `/sw:do` → `/sw:progress` → `/sw:done 0001`

| Cmd | Action |
|-----|--------|
| `/sw:increment` | Plan feature |
| `/sw:do` | Execute tasks |
| `/sw:auto` | Autonomous execution |
| `/sw:auto-status` | Check auto session |
| `/sw:cancel-auto` | Cancel auto session |
| `/sw:validate` | Quality check |
| `/sw:done` | Close |
| `/sw-github:sync` | GitHub sync |
| `/sw-jira:sync` | Jira sync |

**Natural language**: "Let's build X" → `/sw:increment` | "What's status?" → `/sw:progress` | "We're done" → `/sw:done` | "Ship while sleeping" → `/sw:auto`
<!-- SW:END:workflow -->

<!-- SW:SECTION:context version="1.0.64" -->
## Living Docs Context

**Before implementing features**: Check existing docs for patterns and decisions.

```bash
# Search for related docs
grep -ril "keyword" .specweave/docs/internal/

# Key locations
.specweave/docs/internal/specs/       # Feature specifications
.specweave/docs/internal/architecture/adr/  # Architecture decisions (ADRs)
.specweave/docs/internal/architecture/      # System design
```

**Always check ADRs** before making design decisions to avoid contradicting past choices.

**Use `/sw:context <topic>`** to load relevant living docs into conversation.
<!-- SW:END:context -->

<!-- SW:SECTION:lsp version="1.0.64" -->
## LSP-Enhanced Exploration (DEFAULT - Claude Code 2.0.74+)

**LSP is ENABLED BY DEFAULT** for all SpecWeave operations - 100x faster than grep for symbol resolution.

**LSP Operations** (used automatically):
| Operation | Purpose | Example Use |
|-----------|---------|-------------|
| `goToDefinition` | Jump to symbol definition | Find where a function/class is defined |
| `findReferences` | All usages across codebase | Refactoring impact analysis |
| `documentSymbol` | File structure/hierarchy | Understand module organization |
| `hover` | Type info & documentation | Check inferred types, JSDoc |
| `getDiagnostics` | Errors, warnings, hints | Real-time code quality check |

**Living Docs & Init use LSP automatically**:
```bash
# Full scan (LSP enabled by default)
/sw:living-docs --full-scan

# Init also uses LSP for accurate codebase analysis
specweave init

# LSP provides automatically:
# - Accurate API surface extraction (all exports, types, signatures)
# - Cross-module dependency graphs (semantic, not just imports)
# - Dead code detection (unreferenced symbols)
# - Type hierarchy and inheritance maps

# Disable only if language servers unavailable (not recommended):
/sw:living-docs --full-scan --no-lsp
```

**Install Language Servers** (required for LSP):
```bash
# TypeScript/JavaScript (most common)
npm install -g typescript-language-server typescript

# Python
pip install python-lsp-server

# Go
go install golang.org/x/tools/gopls@latest

# Rust
rustup component add rust-analyzer
```

**Configuration** (optional, `.lsp.json` in project root):
```json
{
  "vtsls": {
    "command": "typescript-language-server",
    "args": ["--stdio"],
    "extensionToLanguage": { ".ts": "typescript", ".tsx": "typescriptreact", ".js": "javascript" }
  }
}
```

**Best Practices**:
- Install language servers before running `specweave init` or `/sw:living-docs`
- LSP runs automatically - no flags needed
- Use `findReferences` before refactoring to understand impact
- Combine with Explore agent for comprehensive codebase understanding
<!-- SW:END:lsp -->

<!-- SW:SECTION:structure version="1.0.64" -->
## Structure

```
.specweave/
├── increments/####-name/     # metadata.json, spec.md, tasks.md
├── docs/internal/
│   ├── specs/{project}/      # Living docs (check before implementing!)
│   ├── architecture/adr/     # ADRs (check before design decisions!)
│   └── operations/           # Runbooks
└── config.json
```

### ⚠️ CRITICAL: Multi-Repo Project Paths (MANDATORY)

**ALL multi-project repositories MUST be created in `repositories/` folder - NEVER in project root!**

```
❌ FORBIDDEN (pollutes root):
my-project/
├── frontend/        ← WRONG!
├── backend/         ← WRONG!
├── shared/          ← WRONG!
└── .specweave/

✅ REQUIRED (clean structure):
my-project/
├── repositories/
│   ├── frontend/    ← CORRECT!
│   ├── backend/     ← CORRECT!
│   └── shared/      ← CORRECT!
└── .specweave/
```

**This applies to ALL cases:**
- GitHub multi-repo → `repositories/`
- Azure DevOps multi-repo → `repositories/`
- Bitbucket multi-repo → `repositories/`
- **Local git multi-repo → `repositories/`** ← Same rule!
- Monorepo with multiple packages → `repositories/` or `packages/`

**When spec.md has `projects:` array:**
```yaml
projects:
  - id: my-api
    scope: "Backend API"
```
The implementation path is ALWAYS: `repositories/my-api/` (NOT `my-api/` in root!)

**Multi-repo permissions**: In `.claude/settings.json`:
```json
{"permissions":{"allow":["Write(//**)","Edit(//**)"],"additionalDirectories":["repositories"],"defaultMode":"bypassPermissions"}}
```
**Path syntax**: `//path` = absolute | `/path` = relative to settings file | `**` = recursive | `additionalDirectories` = explicit working dirs
<!-- SW:END:structure -->

<!-- SW:SECTION:taskformat version="1.0.64" -->
## Task Format

```markdown
### T-001: Title
**User Story**: US-001 | **Satisfies ACs**: AC-US1-01 | **Status**: [x] completed
**Test**: Given [X] → When [Y] → Then [Z]
```
<!-- SW:END:taskformat -->

<!-- SW:SECTION:secrets version="1.0.64" -->
## Secrets Check

**BEFORE CLI tools**: Check existing config first!
```bash
grep -E "(GITHUB_TOKEN|JIRA_|ADO_)" .env 2>/dev/null
cat .specweave/config.json | grep -A5 '"sync"'
gh auth status
```
<!-- SW:END:secrets -->

<!-- SW:SECTION:syncing version="1.0.64" -->
## External Sync (GitHub/JIRA/ADO)

**After increment creation**: Run `/sw-github:sync {id}` to create issues!

Living docs sync ≠ External sync. They are separate:
1. `/sw:sync-specs` → Living docs only
2. `/sw-github:sync` → GitHub issues (MUST run explicitly!)

**Required config** (`.specweave/config.json`):
```json
"sync": {
  "settings": {
    "canUpsertInternalItems": true,
    "canUpdateExternalItems": true,
    "autoSyncOnCompletion": true
  },
  "github": {
    "enabled": true,
    "owner": "your-org",
    "repo": "your-repo"
  }
}
```

**Verify tokens**: `grep GITHUB_TOKEN .env` | `gh auth status`
<!-- SW:END:syncing -->

<!-- SW:SECTION:mapping version="1.0.64" -->
## GitHub Mapping

| SpecWeave | GitHub |
|-----------|--------|
| Feature FS-XXX | Milestone |
| Story US-XXX | Issue `[FS-XXX][US-YYY] Title` |
| Task T-XXX | Checkbox |
<!-- SW:END:mapping -->

<!-- SW:SECTION:testing version="1.0.64" -->
## Testing

BDD in tasks.md | Unit >80% | `.test.ts` (Vitest)

```typescript
// Vitest pattern: vi.fn() not jest.fn(), import not require
import { vi } from 'vitest';
vi.mock('fs', () => ({ readFile: vi.fn() }));
```
<!-- SW:END:testing -->

<!-- SW:SECTION:api version="1.0.64" -->
## API Development (OpenAPI-First)

**For API projects only.** Skip this section if your project has no REST/GraphQL endpoints.

**Use OpenAPI as the source of truth for API documentation.** Postman collections and environments are derived from OpenAPI and .env.

### Configuration (`.specweave/config.json`)

```json
{
  "apiDocs": {
    "enabled": true,
    "openApiPath": "openapi.yaml",
    "generatePostman": true,
    "postmanPath": "postman-collection.json",
    "postmanEnvPath": "postman-environment.json",
    "generateOn": "on-increment-done",
    "baseUrl": "http://localhost:3000"
  }
}
```

### Generated Artifacts

| File | Purpose | Source |
|------|---------|--------|
| `openapi.yaml` | API specification (source of truth) | Framework decorators/annotations |
| `postman-collection.json` | API requests for testing | Derived from OpenAPI |
| `postman-environment.json` | Variables (baseUrl, tokens, etc.) | Derived from .env |

### OpenAPI Generation by Framework

| Framework | Auto-Generation | Setup |
|-----------|-----------------|-------|
| **NestJS** | `@nestjs/swagger` | Decorators auto-generate OpenAPI |
| **FastAPI** | Built-in | Auto-generates at `/openapi.json` |
| **Express** | `swagger-jsdoc` | JSDoc comments → OpenAPI |
| **Spring Boot** | `springdoc-openapi` | Annotations auto-generate |
| **Go/Gin** | `swag` | Comments → OpenAPI |

### Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ Code (decorators/annotations)                                │
│         ↓ (auto-generated or manual)                         │
│ openapi.yaml (SOURCE OF TRUTH - version controlled)         │
│         ↓ (derived on /sw:done or /sw:api-docs)             │
│ ├── postman-collection.json (requests with {{baseUrl}})     │
│ └── postman-environment.json (variables from .env)          │
└─────────────────────────────────────────────────────────────┘
```

### Commands

```bash
# Generate all API docs (OpenAPI + Postman collection + environment)
/sw:api-docs --all

# Generate only OpenAPI
/sw:api-docs --openapi

# Generate only Postman collection from existing OpenAPI
/sw:api-docs --postman

# Generate only environment file from .env
/sw:api-docs --env

# Validate existing OpenAPI spec
/sw:api-docs --validate

# Generate on increment close (automatic if enabled)
/sw:done 0001  # → triggers API doc generation
```

### Postman Import

After generation:
1. Postman → Import → `postman-collection.json`
2. Postman → Environments → Import → `postman-environment.json`
3. Fill in secret values (marked as secret type, values empty)
4. Select environment from dropdown

### When Docs Update

| `generateOn` Setting | When API Docs Regenerate |
|---------------------|--------------------------|
| `on-increment-done` | When closing increment (recommended) |
| `on-api-change` | When API files change (hook-based) |
| `manual` | Only via `/sw:api-docs` command |
<!-- SW:END:api -->

<!-- SW:SECTION:limits version="1.0.64" -->
## Limits

**Max 1500 lines/file** — extract before adding
<!-- SW:END:limits -->

<!-- SW:SECTION:troubleshooting version="1.0.64" -->
## Troubleshooting

| Issue | Fix |
|-------|-----|
| Skills missing | Restart Claude Code |
| Commands gone | `/plugin list --installed` |
| Out of sync | `/sw:sync-tasks` |
| Find increment | `/sw:status` |
| Root polluted | Move files to `.specweave/increments/####/reports/` |
| Duplicate IDs | `/sw:fix-duplicates` |
| GitHub not syncing | Check `sync.github.enabled: true` AND `canUpdateExternalItems: true` in config.json |
| GitHub issues not updating | Run `/sw-github:sync {id}` explicitly; check `.specweave/logs/throttle.log` |
| Permission denied | Set `canUpsertInternalItems: true` AND `canUpdateExternalItems: true` in config.json |
| No GITHUB_TOKEN | Check `.env` file or run `gh auth login` |
| Edits blocked in repositories/ | Add `"additionalDirectories":["repositories"]` + `Write(//**)`, `Edit(//**)` to `.claude/settings.json` |
| Path patterns not working | `//path` = absolute, `/path` = relative to settings file, `additionalDirectories` for explicit working dirs |
<!-- SW:END:troubleshooting -->

<!-- SW:SECTION:principles version="1.0.64" -->
## Principles

1. **Spec-first**: `/sw:increment` before coding
2. **Docs = truth**: Specs guide implementation
3. **Incremental**: Small, validated increments
4. **Traceable**: All work → specs → ACs
5. **Clean**: All files in increment folders
<!-- SW:END:principles -->

<!-- SW:SECTION:linking version="1.0.64" -->
## Bidirectional Linking

Tasks ↔ User Stories auto-linked via AC-IDs: `AC-US1-01` → `US-001`

Task format: `**AC**: AC-US1-01, AC-US1-02` (CRITICAL for linking)
<!-- SW:END:linking -->

<!-- SW:SECTION:mcp version="1.0.64" -->
## External Service Connection (MCP + Smart Fallbacks)

**Core principle: Never fight connection issues. Use the path of least resistance.**

### Connection Priority (ALWAYS follow this order)

```
MCP Server → REST API → SDK/Client → CLI → Direct Connection
     ↑                                              ↓
   BEST                                          WORST
```

### Service Connection Matrix

| Service | BEST Method | Fallback | AVOID |
|---------|-------------|----------|-------|
| **Supabase** | MCP Server | REST API / JS Client | Direct `psql` (IPv6 issues) |
| **Cloudflare** | `wrangler` + OAuth | REST API | Manual curl |
| **PostgreSQL** | MCP / Pooler (6543) | `psql` with pooler | Direct port 5432 |
| **MongoDB** | Atlas Data API | MCP / Driver | Direct connection |
| **Redis** | Upstash REST | MCP | `redis-cli` (TCP issues) |
| **AWS** | CLI with SSO | SDK | Hardcoded keys |
| **Vercel** | CLI with OAuth | REST API | Manual deploys |

### Quick Setup Commands

```bash
# MCP Servers (one-time, restart Claude Code after)
npx @anthropic-ai/claude-code-mcp add supabase
npx @anthropic-ai/claude-code-mcp add postgres

# CLI Auth (persistent OAuth sessions)
wrangler login        # Cloudflare
vercel login          # Vercel
aws configure sso     # AWS
supabase login        # Supabase CLI

# Verify auth status
wrangler whoami && vercel whoami && aws sts get-caller-identity
```

### Supabase (Most Common Issues)

```bash
# ❌ DON'T: Direct psql or supabase db push (IPv6 fails)
supabase db push  # Often fails with connection errors

# ✅ DO: Use REST API or MCP
# REST API works everywhere - no network issues
curl "${SUPABASE_URL}/rest/v1/table" \
  -H "apikey: ${SUPABASE_ANON_KEY}"

# For migrations: Use Supabase Dashboard SQL Editor
# OR use connection pooler (port 6543, NOT 5432)
DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-0-region.pooler.supabase.com:6543/postgres"
```

### Cloudflare Workers

```bash
# One-time login (saves OAuth session)
wrangler login

# All operations then work:
wrangler deploy                          # Deploy worker
echo "value" | wrangler secret put KEY   # Set secret
wrangler kv:key put --binding=KV k v     # KV operations
wrangler d1 execute DB --command "SQL"   # D1 database
```

### Auto-Detection (Run Before External Ops)

```bash
# Check configured services
grep -E "SUPABASE_|DATABASE_URL|MONGODB|UPSTASH|CF_API" .env 2>/dev/null
wrangler whoami 2>/dev/null
aws sts get-caller-identity 2>/dev/null
```

**Full reference**: See `/sw:service-connect` skill for complete patterns.
<!-- SW:END:mcp -->

<!-- SW:SECTION:autoexecute version="1.0.64" -->
## Auto-Execute Rule (CRITICAL)

**NEVER output "Manual Step Required" or "Next Steps" when credentials are available.**

### The Golden Rule

```
❌ FORBIDDEN: "Manual Step Required: Open Supabase SQL Editor..."
❌ FORBIDDEN: "Next Steps: 1. Run wrangler deploy..."
❌ FORBIDDEN: "Execute this SQL in your database console..."

✅ REQUIRED: Execute commands directly using available credentials
```

### Decision Tree

```
Credentials in .env? ──YES──→ EXECUTE IMMEDIATELY
         │
         NO
         │
         ▼
ASK for credentials (don't show manual steps!)
         │
         ▼
Save to .env → EXECUTE IMMEDIATELY → Continue
```

### Credential Lookup (MANDATORY before any external operation)

```bash
# 1. Check .env
grep -E "(SUPABASE_|DATABASE_URL|CF_API_|GITHUB_TOKEN)" .env 2>/dev/null

# 2. Check CLI auth
supabase status 2>/dev/null     # Supabase
wrangler whoami 2>/dev/null     # Cloudflare
gh auth status 2>/dev/null      # GitHub
aws sts get-caller-identity 2>/dev/null  # AWS

# 3. Use MCP server if available
# MCP servers provide direct API access
```

### Auto-Execute Examples

```bash
# Supabase SQL execution
if [ -n "$DATABASE_URL" ]; then
  psql "$DATABASE_URL" -f schema.sql  # ✅ Execute directly
fi

# Wrangler secrets
if wrangler whoami 2>/dev/null; then
  echo "$SECRET" | wrangler secret put MY_SECRET  # ✅ Execute directly
  wrangler deploy  # ✅ Deploy directly
fi
```

### If Credentials Missing → ASK, Don't Show Manual Steps

```markdown
🔐 **Credential Required**

I need your DATABASE_URL to execute the migration.

**Paste your connection string:**
[I will save to .env and execute automatically]
```
<!-- SW:END:autoexecute -->

<!-- SW:SECTION:auto version="1.0.64" -->
## Auto Mode (Autonomous Execution)

**Auto mode enables continuous autonomous execution** until all tasks are complete.

### 🚨 CRITICAL: Zero Manual Steps in Auto Mode

**Auto mode MUST be fully autonomous. NEVER ask user to:**
- Open a web dashboard (Supabase, AWS Console, etc.)
- Copy/paste SQL into an editor
- Run commands manually
- Click buttons in UIs

**If you need external access:**
1. Check for credentials in `.env`
2. Use CLI tools (`supabase`, `wrangler`, `gh`, `aws`)
3. Use MCP servers for direct API access
4. If credentials missing → ASK for them, save to `.env`, then EXECUTE

### 🧪 Test Execution Loop (MANDATORY)

**After EVERY implementation task, run tests in a self-healing loop:**

```bash
# 1. Run unit/integration tests
npm test  # or: npx vitest run

# 2. If UI exists, run E2E tests
npx playwright test

# 3. If tests fail → FIX → RE-RUN (max 3 attempts)
```

**Test Loop Pattern (Ralph Loop):**
```
┌─────────────────────────────────────────────────────────────┐
│ IMPLEMENT → TEST → FAIL? → FIX → TEST → PASS → NEXT TASK   │
│                     ↑________________↓                       │
│                    (max 3 iterations)                        │
└─────────────────────────────────────────────────────────────┘
```

**E2E Test Execution (when UI exists):**
```bash
# Install Playwright browsers if needed
npx playwright install --with-deps chromium

# Run E2E tests with proper reporting
npx playwright test --reporter=list

# On failure, capture screenshot/trace
npx playwright test --trace on
```

**Focus on MVP Critical Paths:**
1. **Authentication flows** (login, logout, register)
2. **Core business transactions** (create, update, delete)
3. **Payment/checkout flows** (if applicable)
4. **Data integrity scenarios**

### ⚠️ Pragmatic Completion (NOT 100% Blindly!)

**Don't blindly follow 100% completion rules!** Reality:
- Specs have bugs, ambiguities, conflicts
- Requirements change mid-implementation
- Some planned tasks become irrelevant
- Edge cases may not be worth the effort

**Smart Completion Criteria:**
```
┌─────────────────────────────────────────────────────────────┐
│ MUST COMPLETE (block release):                               │
│ • MVP critical paths (auth, core CRUD, payments)            │
│ • Security-sensitive flows                                   │
│ • Data integrity operations                                  │
│ • User-facing error handling                                 │
├─────────────────────────────────────────────────────────────┤
│ SHOULD COMPLETE (aim for, but pragmatic):                    │
│ • Edge case handling                                         │
│ • Performance optimizations                                  │
│ • Nice-to-have features                                      │
├─────────────────────────────────────────────────────────────┤
│ CAN SKIP/DEFER (if blocking progress):                       │
│ • Conflicting requirements (flag and ask user)              │
│ • Over-engineered edge cases                                 │
│ • Tasks made obsolete by other changes                       │
└─────────────────────────────────────────────────────────────┘
```

**When to STOP and ask user:**
- Spec conflicts with another spec
- Task seems unnecessary given implementation
- Edge case would require major refactoring
- Requirement is ambiguous

### 🧑‍🤝‍🧑 Smart Test User Strategy

**Create test users strategically, not blindly:**

```typescript
// Good: Create users with specific roles/states
const testUsers = {
  admin: { email: 'admin@test.com', role: 'admin' },
  regularUser: { email: 'user@test.com', role: 'user' },
  premiumUser: { email: 'premium@test.com', plan: 'premium' },
  blockedUser: { email: 'blocked@test.com', status: 'blocked' },
};

// When to create multiple test users:
// ✅ Testing role-based access control
// ✅ Testing subscription tiers
// ✅ Testing user states (active, blocked, pending)
// ✅ Testing multi-user interactions (sharing, permissions)

// When ONE test user is enough:
// ✅ Basic CRUD operations
// ✅ Form validation
// ✅ UI component tests
// ✅ API endpoint tests (mocked auth)
```

**E2E Test User Setup:**
```typescript
// playwright/fixtures/users.ts
export const testUsers = {
  // Seeded in database before tests
  admin: { id: 'test-admin-001', email: 'admin@test.local' },
  user: { id: 'test-user-001', email: 'user@test.local' },
};

// Use fixtures, don't create users per test!
test.use({ storageState: 'playwright/.auth/user.json' });
```

### 🔐 E2E Authentication (CRITICAL - Avoid Flaky Tests!)

**Auth is the #1 cause of flaky E2E tests. Be ULTRASMART:**

| Strategy | Speed | Reliability | Use When |
|----------|-------|-------------|----------|
| **storageState** | ⚡⚡⚡ | ⭐⭐⭐ | Default - login ONCE, reuse |
| **API auth** | ⚡⚡ | ⭐⭐⭐ | When UI is unstable |
| **UI login per test** | ⚡ | ⭐ | Only testing login flow |

**Playwright Auth Setup (MANDATORY):**

```typescript
// playwright/auth.setup.ts - Global setup
import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'testpass123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
```

```typescript
// playwright.config.ts - Reuse auth state
projects: [
  { name: 'setup', testMatch: /.*\.setup\.ts/ },
  {
    name: 'chromium',
    use: { storageState: 'playwright/.auth/user.json' },
    dependencies: ['setup'],
  },
]
```

**Common Auth Fixes:**

| Problem | Solution |
|---------|----------|
| Session expires | Increase TTL for test env |
| Rate limited | Use API auth, seed users |
| Captcha blocks | Disable in test env |
| OAuth fails | Mock provider |

**Auto Mode E2E Checklist:**
```
✅ Test users seeded with known passwords
✅ Auth state files generated
✅ Tests DON'T login (except login flow tests)
✅ Captcha/2FA disabled in test env
```

### 🔄 Continuous Refactoring (Part of Auto Loop)

**As tests grow, REFACTOR proactively:**

```
After every 3-5 tasks:
1. Review test organization → Extract shared fixtures
2. Review code duplication → Extract utilities
3. Review file sizes → Split if >300 lines
4. Review imports → Consolidate, remove unused
```

**Refactoring Triggers:**
- Test file > 200 lines → Split by feature
- Duplicate test setup → Extract to fixtures
- Same assertion pattern 3+ times → Create helper
- Source file > 300 lines → Extract module

### 📊 Test Status Reporting (MANDATORY in Auto Mode)

**After EVERY task, report test status to user:**

```markdown
## 🧪 Test Status Report

| Type | Status | Pass/Total | Coverage |
|------|--------|------------|----------|
| Unit | ✅ | 42/42 | 87% |
| Integration | ✅ | 12/12 | - |
| E2E | ⚠️ | 8/10 | - |

**Failing tests:**
- `auth.spec.ts:45` - Login redirect not working
- `checkout.spec.ts:112` - Payment timeout

**Next:** Fixing E2E failures before continuing...
```

### 🏠 Local-First Development

**If no deployment instructions provided, BUILD AND TEST LOCALLY FIRST:**

```
1. Implement feature locally
2. Run ALL tests (unit, integration, E2E)
3. Verify everything works
4. THEN ask user about deployment preferences
```

**Don't assume deployment target!** Ask user:
```markdown
🚀 **Deployment Options**

Your scraper is ready and all tests pass locally.

**Where would you like to deploy?**
- Vercel Cron (serverless, free tier available)
- Railway (always-on, $5/mo)
- GitHub Actions (CI-based, free)
- Local cron (self-hosted)
- Other?
```

### 🔧 Infrastructure Decision-Making

**For scrapers, cron jobs, background tasks - ULTRATHINK on best approach:**

```
┌─────────────────────────────────────────────────────────────┐
│ INFRASTRUCTURE DECISION TREE                                 │
├─────────────────────────────────────────────────────────────┤
│ Scraper/Cron Job:                                           │
│ ├─ Frequency < 1/hour → Vercel Cron, GitHub Actions         │
│ ├─ Frequency ≥ 1/hour → Railway, Render, dedicated server   │
│ ├─ Heavy compute → Dedicated VM, Docker container           │
│ └─ Real-time → Always-on server, WebSocket                  │
│                                                              │
│ Data Storage:                                                │
│ ├─ Simple KV → Upstash Redis, Vercel KV                     │
│ ├─ Relational → Supabase, PlanetScale, Neon                 │
│ ├─ Document → MongoDB Atlas, Supabase                       │
│ └─ Time-series → TimescaleDB, InfluxDB                      │
│                                                              │
│ File Storage:                                                │
│ ├─ Static assets → Cloudflare R2, S3                        │
│ └─ Large files → S3, GCS, Backblaze B2                      │
└─────────────────────────────────────────────────────────────┘
```

**When implementing scrapers/cron jobs:**
1. **Ultrathink** on best hosting options given requirements
2. **Research** rate limits, costs, reliability
3. **Propose** 2-3 options with trade-offs
4. **Build locally first** with tests
5. **Deploy** only after user confirms target

### For Claude Code Users

Auto mode uses Claude Code's Stop Hook to create a feedback loop:
- `/sw:do` continues until all tasks complete
- `/sw:auto-status` shows session progress
- `/sw:cancel-auto` stops autonomous execution

Session state stored in `.specweave/state/auto-session.json`.

### For Non-Claude AI Systems

If using SpecWeave with other AI systems (GPT, Gemini, etc.), implement this loop pattern:

```bash
# Bash loop for autonomous execution
while true; do
    # Check if all tasks complete
    TOTAL=$(grep -c "^### T-" .specweave/increments/*/tasks.md 2>/dev/null || echo "0")
    DONE=$(grep -c '\[x\].*completed' .specweave/increments/*/tasks.md 2>/dev/null || echo "0")

    if [ "$TOTAL" -gt 0 ] && [ "$DONE" -ge "$TOTAL" ]; then
        echo "All tasks complete!"
        break
    fi

    # Feed prompt to your AI
    cat PROMPT.md | your-ai-cli

    # Safety: max iterations
    ITER=$((ITER + 1))
    if [ "$ITER" -ge 100 ]; then
        echo "Max iterations reached"
        break
    fi
done
```

**Key Concepts**:
- **Completion Detection**: Check tasks.md for `[x] completed` status
- **Completion Tag**: Output `<auto-complete>DONE</auto-complete>` when finished
- **Max Iterations**: Always set a limit (default: 100)
- **Human Gates**: Pause for sensitive ops (deploy, publish, force-push)

**Human-Gated Operations** (require manual approval):
- `npm publish`, `git push --force`, `rm -rf /`
- Any `production` deployment
- API key or credential changes
- Database migrations (`drop`, `delete from`, `migrate`)

**Circuit Breaker Pattern**: If external API (GitHub, JIRA) fails 3+ times, queue operations and continue.
<!-- SW:END:auto -->

<!-- SW:SECTION:docs version="1.0.64" -->
## Docs

[spec-weave.com](https://spec-weave.com) | `.specweave/docs/internal/`
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

## Database Operations

**IMPORTANT:** Claude MUST execute all database operations with Supabase directly. Do not ask the user to run migrations manually - execute them yourself using the Prisma CLI.

### Session Startup Checklist
At the start of each session, Claude should:
1. Read `.env` file to load Supabase credentials
2. Verify database connection is configured
3. Run `npx prisma generate` if Prisma client needs updating
4. Run `npx prisma db push` or migrations as needed

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

