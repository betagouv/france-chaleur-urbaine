# Dependency Management

> Guidelines for managing dependencies in france-chaleur-urbaine

## 🎯 Dependency Philosophy

### Principles

1. **Minimize Dependencies**: Only add what you truly need
2. **Prefer Standard Library**: Use built-in functionality when possible
3. **Audit Before Adding**: Check bundle size, maintenance, security
4. **Keep Updated**: Regular dependency updates prevent security issues
5. **Lock Versions**: Always commit lock files

## 📦 Adding Dependencies

### Before Adding a Dependency

Ask yourself:
- **Is it necessary?** Can you implement it yourself in < 50 lines?
- **Is it maintained?** Check last commit date, open issues
- **Is it secure?** Check for known vulnerabilities
- **What's the size?** Use [Bundlephobia](https://bundlephobia.com)
- **What's the license?** Ensure compatibility with your project

### Bundle Size Analysis

```bash
# Check bundle size impact
npx bundlephobia <package-name>

# Analyze bundle
npm run build
npx @next/bundle-analyzer
```

### Approval Process

For production dependencies:
1. **Research**: Check alternatives, bundle size, maintenance
2. **Propose**: Open issue/PR with justification
3. **Review**: Team reviews necessity and alternatives
4. **Approve**: Add to project with documentation

## 🔒 Security

### Regular Audits

```bash
# Run security audit
npm audit

# Fix auto-fixable vulnerabilities
npm audit fix

# Check with multiple sources
npx better-npm-audit audit
```

### Automated Scanning

**GitHub Dependabot**:
- Enable Dependabot alerts
- Configure auto-merge for patch updates
- Review minor/major updates manually

### Vulnerability Response

**Priority Levels**:
- **Critical**: Fix immediately (< 24h)
- **High**: Fix within 1 week
- **Medium**: Fix within 1 month
- **Low**: Fix in next maintenance cycle

## 📊 Dependency Categories

### Core Dependencies (Production)

**Criteria**:
- Essential for runtime functionality
- Well-maintained and secure
- Appropriate license
- Reasonable bundle size

**Examples**:
```json
{
  "dependencies": {
    "react": "^19.0.0",
    "next": "^15.0.0"
  }
}
```

### Development Dependencies

**Criteria**:
- Only needed during development/build
- Not shipped to production
- Improve DX or code quality

**Examples**:
```json
{
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^2.0.0",
    "eslint": "^9.0.0"
  }
}
```

### Peer Dependencies

Dependencies required by the package but installed by the consumer.

```json
{
  "peerDependencies": {
    "react": ">=18.0.0"
  }
}
```

## 🔄 Update Strategy

### Update Frequency

- **Patch updates** (1.0.x): Automatic via Dependabot
- **Minor updates** (1.x.0): Weekly review and batch update
- **Major updates** (x.0.0): Quarterly review with testing

### Update Process

```bash
# Check for outdated packages
npm outdated

# Update all patch/minor (respecting semver)
npm update

# Update specific package
npm install <package>@latest

# Update all to latest (use with caution)
npx npm-check-updates -u
npm install
```

### Testing Updates

**Checklist**:
- [ ] Run full test suite
- [ ] Check build succeeds
- [ ] Test in development environment
- [ ] Check for deprecation warnings
- [ ] Review breaking changes in changelogs
- [ ] Test critical user flows

## 🗂️ Dependency Organization

### Import Structure

```typescript
// ✅ Group imports logically
// 1. External dependencies
import { useState } from 'react'
import { useRouter } from 'next/router'

// 2. Internal modules
import { Button } from '@/components/Button'
import { useAuth } from '@/hooks/useAuth'

// 3. Relative imports
import { helper } from './helpers'

// 4. Types
import type { User } from '@/types'
```

### Workspace Management (Monorepo)

```json
{
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

## 🎯 Recommended Dependencies

### Essential Tools

**TypeScript Projects**:
```json
{
  "dependencies": {
    "zod": "^3.0.0",           // Schema validation
    "date-fns": "^3.0.0"       // Date manipulation (prefer over moment)
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0"            // TypeScript execution
  }
}
```

**React Projects**:
```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "eslint-plugin-react-hooks": "^5.0.0"
  }
}
```

**Testing**:
```json
{
  "devDependencies": {
    "vitest": "^2.0.0",        // Fast unit testing
    "playwright": "^1.0.0",    // E2E testing
    "@testing-library/react": "^16.0.0"
  }
}
```

### Alternatives to Consider

| Need | Heavy Option | Lightweight Alternative |
|------|--------------|------------------------|
| Dates | moment (72KB) | date-fns (13KB) or native Intl |
| UUID | uuid (14KB) | crypto.randomUUID() (native) |
| Utilities | lodash (71KB) | radash (7KB) or native methods |
| HTTP Client | axios (30KB) | native fetch |
| Forms | formik (44KB) | react-hook-form (27KB) |

## 🚫 Avoiding Dependency Hell

### Version Pinning

```json
// ❌ Bad - Loose versioning
{
  "dependencies": {
    "package": "*",
    "another": "^1.0.0"
  }
}

// ✅ Good - Specific versions
{
  "dependencies": {
    "package": "1.2.3",
    "another": "~1.2.0"  // Allow patch updates only
  }
}
```

### Resolution Conflicts

```json
// Force specific version for transitive dependency
{
  "overrides": {
    "vulnerable-package": "^2.0.0"
  }
}
```

## 📋 Maintenance Checklist

### Weekly

- [ ] Review Dependabot PRs
- [ ] Check for security alerts
- [ ] Update patch versions

### Monthly

- [ ] Review all outdated packages
- [ ] Update minor versions in batch
- [ ] Clean up unused dependencies
- [ ] Check bundle size trends

### Quarterly

- [ ] Review major version updates
- [ ] Audit entire dependency tree
- [ ] Remove deprecated packages
- [ ] Evaluate alternatives to heavy deps

## 🧹 Cleanup

### Find Unused Dependencies

```bash
# Find unused dependencies
npx depcheck

# Remove package
npm uninstall <package>
```

### Deduplicate

```bash
# Find duplicates
npm dedupe

# Or with pnpm
pnpm dedupe
```

## 📚 Tools

### Package Managers

- **npm**: Default, reliable
- **pnpm**: Fast, disk-efficient, strict
- **yarn**: Fast, good monorepo support

### Analysis Tools

- [Bundlephobia](https://bundlephobia.com) - Bundle size analysis
- [npm.devtool.tech](https://npm.devtool.tech) - Package insights
- [Snyk](https://snyk.io) - Security scanning
- [Socket](https://socket.dev) - Supply chain security

### Automation

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
```

## 🔗 Lock Files

### Importance

**Always commit**:
- `package-lock.json` (npm)
- `pnpm-lock.yaml` (pnpm)
- `yarn.lock` (yarn)

**Benefits**:
- Reproducible builds
- Prevents supply chain attacks
- Consistent environments

### Conflicts

```bash
# If lock file conflicts, regenerate
rm package-lock.json
npm install
```

---

**Last updated**: [Date]
**Review frequency**: Weekly for security, monthly for updates
