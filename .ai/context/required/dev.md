## Essential Commands

```bash
# Development
pnpm dev                        # Start dev server (port 3000)
pnpm dev:email                  # Email template development
pnpm dev:clock                  # Background jobs processor (watch mode)

# Code Quality (ALWAYS before commit)
pnpm lint                       # Biome check
pnpm lint:fix                   # Fix linting issues
pnpm ts                         # TypeScript check (all files)

# Testing
pnpm test                       # Run all tests
pnpm test:watch                 # Watch mode
pnpm test src/path/file.spec.ts # Single test

# Database
pnpm db:migrate                 # Run pending migrations
pnpm db:sync --single <table>   # Generate types for ONE table (stdout)
pnpm db:new <name>              # Create new migration
pnpm db:bootstrap               # Seed database with initial data
pnpm cli db:bootstrap           # CLI alternative

# Database Copy (Dev/Prod)
pnpm db:pull:dev                # Copy remote dev table to local
pnpm db:pull:prod               # Copy remote prod table to local

# CLI Commands
pnpm cli                        # List available commands
pnpm cli optimize images        # Optimize images in public/

# Build
pnpm build                      # Production build
pnpm build:analyze              # Analyze bundle size
pnpm start                      # Start production server

# Jobs
pnpm start:clock                # Production job processor
```

## Development Setup

1. Install dependencies: `pnpm install`
2. Setup env: Copy `.env.example` to `.env.local`
3. Database: `pnpm db:migrate`
4. Seed data: `pnpm db:bootstrap`
5. Start dev: `pnpm dev`

## Pre-Commit Checklist

✅ `pnpm lint` - No errors  
✅ `pnpm ts` - TypeScript passes  
✅ `pnpm test` - Tests pass (if applicable)
