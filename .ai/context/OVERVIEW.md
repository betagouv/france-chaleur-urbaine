# Project Overview

> High-level overview of france-chaleur-urbaine

## 🎯 Instructions for Auto-Fill

This template should be filled by analyzing:
- README.md (primary source)
- package.json or equivalent (name, description, version)
- CHANGELOG.md or releases
- docs/index.md or docs/README.md
- GitHub repository description and topics

## 📋 What is france-chaleur-urbaine?

<!-- Source: CLAUDE.md, README.md -->

France Chaleur Urbaine is a public service platform for connecting to district heating networks in France. It's a Next.js application with geospatial features, built to French government standards (DSFR).

Ce dépôt regroupe le code relatif au site france-chaleur-urbaine.beta.gouv.fr.

Il utilise, entre autre, [Docker](https://www.docker.com), [React](https://reactjs.org), [Next.js](https://nextjs.org), [PostgreSQL](https://www.postgresql.org/) et [MapLibre](https://maplibre.org).

## 🎯 Goals and Objectives

<!-- Extract from:
- README.md "Goals" or "Objectives" section
- Project mission statement
- Documentation overview
-->

### Primary Goals

1. **[Goal 1]**: [Description]
2. **[Goal 2]**: [Description]
3. **[Goal 3]**: [Description]

### Success Metrics

<!-- Extract from:
- OKRs in documentation
- Analytics setup
- Performance benchmarks
-->

- [Metric 1]: [Target]
- [Metric 2]: [Target]

## 🛠️ Technical Stack

<!-- Source: CLAUDE.md -->

### Core Technologies

**Language**: TypeScript

**Runtime/Framework**:
- **Next.js 15** with Pages Router (not App Router)
- **React**
- **TypeScript** with strict mode

**Database**:
- **PostgreSQL + PostGIS** for spatial data
- **Kysely** for type-safe SQL queries

**UI Components**:
- **@codegouvfr/react-dsfr** for French government design system
- **MapLibre GL** for map rendering

### Key Dependencies

<!-- Extract from package.json dependencies (top 10 by usage) or equivalent:
- Count import statements to find most-used packages
- List core libraries that define the architecture
-->

| Package | Version | Purpose |
|---------|---------|---------|
| [package] | [version] | [Inferred from package purpose] |

### Development Tools

<!-- Extract from package.json devDependencies or scripts -->

- **Build**: [Webpack, Vite, esbuild, etc. from scripts]
- **Linting**: [ESLint, Prettier, etc. from devDeps]
- **Testing**: [Jest, Vitest, Playwright, etc. from devDeps]
- **Type Checking**: [TypeScript, Flow, etc. from devDeps]

## 📁 Project Structure

<!-- Source: CLAUDE.md -->

```
src/
├── components/         # React components by feature
├── pages/              # Next.js pages & API routes
├── modules/            # Code separated in modules for separation of concerns
├── server/             # Server-side services
├── services/           # Client-side services
├── utils/              # Shared utilities
└── types/              # TypeScript definitions
```

### Key Directories

- **`src/components/`**: React components organized by feature
- **`src/pages/`**: Next.js pages and API routes
- **`src/modules/`**: Code separated in modules for separation of concerns
- **`src/server/`**: Server-side services
- **`src/services/`**: Client-side services
- **`src/utils/`**: Shared utilities
- **`src/types/`**: TypeScript definitions

## ✨ Key Features

<!-- Extract from:
- README.md "Features" section
- Feature folders in src/
- Route definitions
- API documentation
-->

### Core Features

1. **[Feature 1]**: [Description from README or route analysis]
2. **[Feature 2]**: [Description from README or route analysis]
3. **[Feature 3]**: [Description from README or route analysis]

### Notable Capabilities

<!-- Extract from:
- Unique libraries or integrations
- Advanced features mentioned in docs
- Complex modules
-->

- [Capability 1]: [Brief description]
- [Capability 2]: [Brief description]

## 👥 Target Audience

<!-- Extract from:
- README.md "Who is this for?" section
- User documentation
- User model or role definitions
-->

### Primary Users

- **[User Type 1]**: [Needs, use cases]
- **[User Type 2]**: [Needs, use cases]

### Use Cases

<!-- Extract from:
- Documentation examples
- Test scenarios
- User stories in issues
-->

1. **[Use Case 1]**: [Description]
2. **[Use Case 2]**: [Description]
3. **[Use Case 3]**: [Description]

## 📊 Project Status

### Current State

<!-- Extract from:
- package.json version
- README.md badges
- CHANGELOG.md latest entry
- GitHub releases
-->

**Version**: [From package.json or git tags]
**Status**: [Alpha, Beta, Stable - from README badges or releases]
**Last Release**: [Date from CHANGELOG or GitHub releases]

### Maturity

<!-- Infer from:
- Version number (0.x = early, 1.x = stable, 2.x+ = mature)
- Number of releases
- Activity level
- Test coverage
-->

- **Stability**: [Alpha/Beta/Stable]
- **Test Coverage**: [From coverage reports if available]
- **Documentation**: [Complete/Partial/Minimal]

### Roadmap

<!-- Extract from:
- ROADMAP.md
- GitHub project boards
- Milestones
- "Upcoming Features" in README
-->

#### Planned Features

- [ ] [Feature 1] - [Timeline if mentioned]
- [ ] [Feature 2] - [Timeline if mentioned]
- [ ] [Feature 3] - [Timeline if mentioned]

#### Known Limitations

<!-- Extract from:
- README.md "Limitations" or "Known Issues"
- GitHub issues labeled "limitation"
- TODO comments about missing features
-->

- [Limitation 1]
- [Limitation 2]

## 👨‍💀💀 Team and Contributors

<!-- Extract from:
- package.json author and contributors
- CONTRIBUTING.md
- README.md "Team" section
- GitHub contributors
-->

### Core Team

- **[Name/Role]**: [From package.json author or docs]

### Contributing

<!-- Extract from CONTRIBUTING.md -->

[Brief summary of how to contribute, or link to CONTRIBUTING.md]

**Contribution Guidelines**: [Link to CONTRIBUTING.md if exists]
**Code of Conduct**: [Link to CODE_OF_CONDUCT.md if exists]

## 🔗 External Integrations

<!-- Extract from:
- env.example for API keys
- Integration folders
- Third-party libraries
- Webhook configurations
-->

### Third-Party Services

- **[Service 1]**: [Purpose - e.g., "Authentication", "Payments", "Email"]
- **[Service 2]**: [Purpose]

### APIs

<!-- Extract from:
- API routes
- OpenAPI/Swagger docs
- API client libraries
-->

- **[API 1]**: [Purpose, endpoint if documented]
- **[API 2]**: [Purpose, endpoint if documented]

## 📈 Metrics and Analytics

<!-- Extract from:
- Analytics libraries (GA, Mixpanel, etc.)
- Monitoring services (Sentry, DataDog, etc.)
- Logging configuration
-->

### Monitoring

- **Error Tracking**: [Service from dependencies/env]
- **Performance**: [Service from dependencies/env]
- **Analytics**: [Service from dependencies/env]

### Key Metrics

<!-- Extract from:
- Dashboard configurations
- Analytics events
- Monitoring alerts
-->

[List key metrics being tracked]

## 🚀 Getting Started

<!-- Source: CLAUDE.md -->

### Prerequisites

- **Node.js 20** and **pnpm 8** are required
- Docker
- Posséder un compte Scalingo et avoir accès aux applications FCU
- Récupérer le fichier `.env.local` auprès d'un membre de l'équipe

### Quick Start

```bash
# Development
pnpm dev                   # Start dev server (port 3000)
pnpm dev:email             # Email template development

# Code Quality (ALWAYS run before committing)
pnpm lint                  # ESLint check
pnpm lint:fix              # Fix linting issues
pnpm prettier-check        # Code formatting
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

### Important Notes

<!-- Source: CLAUDE.md -->

- **Node.js 20** and **pnpm 8** are required
- Path aliases configured: `@/` → `src/`, `@cli/` → `scripts/`
- French government design system (DSFR) must be used for UI
- All geographic data uses PostGIS and Turf.js for calculations
- Authentication uses custom session management (see `src/modules/auth/server/service.ts`)
- Environment variables documented in `.env.example`

### Resources

- **Website**: https://france-chaleur-urbaine.beta.gouv.fr
- **Repository**: https://github.com/betagouv/france-chaleur-urbaine

---

**Last updated**: [Current date]
**Maintained by**: [From package.json or docs]
