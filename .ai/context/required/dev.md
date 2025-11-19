## Essential Commands

```bash
# Development
pnpm dev                   # Start dev server (port 3000)
pnpm dev:email             # Email template development

# Code Quality (ALWAYS run before committing)
pnpm lint                  # Biome check
pnpm lint:fix              # Fix linting issues
pnpm lint:file             # Lint specific file
pnpm ts                    # Run typescript on all codebase

# Testing
pnpm test                  # Run all tests
pnpm test:watch            # Watch mode
pnpm test src/utils/file.spec.ts  # Run single test

# Database
pnpm db:migrate            # Run migrations
pnpm db:sync               # Regenerate Kysely types (after schema changes)

# Build
pnpm build                 # Production build
pnpm build:analyze         # Analyze bundle size

# Images
pnpm cli optimize images  # Optimize all images in public/ directory
```
