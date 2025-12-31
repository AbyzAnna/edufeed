# Operational Runbooks

*Generated: 12/30/2025 | Runbooks: 3*

## Quick Reference

| Runbook | Type | Description |
|---------|------|-------------|
| [Application Restart](#application-restart) | standard | Steps to safely restart the application... |
| [Dependency Update](#dependency-update) | standard | Process for updating npm dependencies... |
| [Cache Cleanup](#cache-cleanup) | standard | Clear various caches to resolve issues... |

## Runbook Details

### Application Restart

**Type**: standard

Steps to safely restart the application

**Steps**:

1. Check current service health
2. Notify stakeholders
3. Stop the service: `npm stop` or `systemctl stop app`
4. Clear cache if needed: `npm cache clean --force`
5. Start the service: `npm start` or `systemctl start app`
6. Verify health: check logs and health endpoint
7. Notify stakeholders of completion

### Dependency Update

**Type**: standard

Process for updating npm dependencies

**Steps**:

1. Create a new branch: `git checkout -b deps-update`
2. Check for updates: `npm outdated`
3. Update dependencies: `npm update`
4. Run tests: `npm test`
5. Review changes: `git diff package-lock.json`
6. Commit and create PR

### Cache Cleanup

**Type**: standard

Clear various caches to resolve issues

**Steps**:

1. Clear npm cache: `npm cache clean --force`
2. Clear build artifacts: `rm -rf dist/ build/`
3. Clear node_modules if needed: `rm -rf node_modules && npm install`
4. Clear SpecWeave cache: `rm -rf .specweave/cache/`
5. Restart the application

---
*Last updated: 2025-12-31T04:51:02.273Z*