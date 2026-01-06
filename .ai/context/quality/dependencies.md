# Dependency Management & Updates

## Automatic Verification After Dependency Updates

**CRITICAL**: After ANY dependency update (especially framework updates like Next.js, React, etc.), you MUST follow these steps:

### Step 1: Research Changes (BEFORE updating)

**Search for and review** official documentation about the update:
- **Changelog**: Search for "[package name] changelog" or "[package name] releases"
- **Release Notes**: Look for the specific version release notes
- **Upgrade Guide**: Search for "[package name] upgrade guide [version]" or "migrating to [package name] [version]"

Common documentation locations:
- GitHub Releases page (e.g., `https://github.com/vercel/next.js/releases`)
- Official docs migration guides (e.g., Next.js docs → "Upgrading")
- npm package page changelog tab
- CHANGELOG.md or HISTORY.md in the repository

**What to look for:**
- ✅ Breaking changes and migration steps required
- ✅ Deprecated APIs or features removed
- ✅ New features or recommended patterns
- ✅ Known issues or compatibility notes
- ⚠️ Required peer dependency updates

### Step 2: Perform Update

```bash
# Update the package(s)
pnpm update <package>@latest
```

### Step 3: Run Verification Commands

```bash
# 1. Lint check (verify code standards)
pnpm lint

# 2. Type check (verify TypeScript compilation)
pnpm ts

# 3. Test suite (verify functionality)
pnpm test

# 4. Production build (verify build process)
pnpm build
```

### When to Apply This Full Process

- ✅ Updating Next.js, React, or any major framework
- ✅ Updating build tools (Vite, TypeScript, Biome, etc.)
- ✅ Updating multiple dependencies at once
- ✅ Updating any dependency that affects types or build process
- ⚠️  Step 1 (research) optional for minor patch updates of isolated utility libraries

### Expected Results

All commands should complete successfully:
- **pnpm lint**: Exit code 0, no errors reported
- **pnpm ts**: Exit code 0, TypeScript compilation successful
- **pnpm test**: Exit code 0, all tests passing
- **pnpm build**: Exit code 0, production build successful

### Handling Failures

If any command fails:
1. **Read the error output** carefully
2. **Fix the issue** before proceeding
3. **Re-run the failed command** to verify the fix
4. **Document breaking changes** if the update introduced API changes

## Dependency Update Best Practices

### Framework Updates (Next.js, React, etc.)

1. **Check compatibility** between related packages:
   - Next.js version should match @next/* packages
   - React version should be compatible with React-based libraries
   - Check peer dependency warnings

2. **Update related packages together**:
   ```bash
   # Example: Update Next.js ecosystem
   pnpm update next@latest @next/mdx@latest
   
   # Example: Update React ecosystem
   pnpm update react@latest react-dom@latest @types/react@latest @types/react-dom@latest
   ```

3. **Review changelogs** for breaking changes:
   - Check official migration guides
   - Look for deprecation warnings
   - Note new features or recommended patterns

### Peer Dependency Warnings

After updates, you may see peer dependency warnings. Evaluate each:

- ❌ **Critical**: Package expects older React/Next.js and causes runtime errors
  → Find compatible version or alternative package
  
- ⚠️  **Warning**: Package hasn't updated peer dependency range but still works
  → Monitor for issues, consider opening issue with maintainer
  
- ℹ️  **Informational**: Legacy package that works fine
  → Safe to ignore if tests pass

### Common Update Commands

```bash
# Update specific package to latest
pnpm update <package>@latest

# Update all dependencies (careful!)
pnpm update --latest

# Interactive update (recommended for selective updates)
pnpm update --interactive --latest

# Check for outdated packages
pnpm outdated

# View installed versions
pnpm list <package> --depth=0
```

## Node.js Version Requirements

This project requires **Node.js 24** (see `package.json` engines field).

**Note**: The user manages Node.js version configuration. Do not warn about Node.js version mismatches unless it causes actual failures.

## Post-Update Communication

After successful updates, report:
1. 📚 **Key changes found** in changelog/release notes (breaking changes, notable features)
2. ✅ **What was updated** (package names and versions)
3. ✅ **Verification results** (lint, tests, build status)
4. ⚠️  **Any warnings** or peer dependency issues
5. 📝 **Recommended follow-up actions** (if any)

Example:
```
📚 Reviewed Next.js 16.1.1 Release Notes:
- No breaking changes from 16.0.7
- Performance improvements in Turbopack
- Bug fixes for App Router edge cases

✅ Updated Next.js: 16.0.7 → 16.1.1
✅ Updated @next/mdx: 16.0.0 → 16.1.1

Verification:
✅ Lint: No errors (880 files checked)
✅ Tests: All passing
✅ Build: Successful

⚠️  Peer dependency warnings:
- @reach/combobox expects React 16-17 (we use 19)
- Appears functional, monitoring for issues
```
