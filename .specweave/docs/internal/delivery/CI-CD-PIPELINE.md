# CI/CD Pipeline Documentation

*Generated: 12/30/2025 | Pipelines: 1*

## Overview

| Pipeline | Provider | Triggers | Jobs |
|----------|----------|----------|------|
| NPM Scripts | npm | manual | 2 |

## Pipeline Details

### NPM Scripts

**Provider**: npm
**File**: `package.json`

**Triggers**:

- manual

**Jobs/Steps**:

- **build**: prisma generate && next build
- **lint**: eslint .

## Pipeline Flow

```mermaid
graph LR
    trigger_NPM_Scripts((manual)) --> NPM_Scripts[NPM Scripts]
    NPM_Scripts --> NPM_Scripts_build[build]
    NPM_Scripts_build --> NPM_Scripts_lint[lint]
```

---
*Last updated: 2025-12-31T04:51:02.212Z*