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

<!-- Source: CLAUDE.md -->

France Chaleur Urbaine is a public service platform for connecting to district heating networks in France. It's a Next.js application with geospatial features, built to French government standards (DSFR).

<!-- Source: README.md -->

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

### Core Technologies

<!-- Extract from package.json, go.mod, requirements.txt, Cargo.toml, etc. -->

<!-- Source: CLAUDE.md -->

**Language**: TypeScript

**Runtime/Framework**: Next.js 15 with Pages Router (not App Router)

**Database**: PostgreSQL + PostGIS for spatial data

**Cache/Queue**: Not specified in documentation

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

<!-- Analyze actual directory structure -->

```
france-chaleur-urbaine/
├── src/                    # [Main source code]
│   ├── [feature1]/         # [Auto-detect top-level folders]
│   ├── [feature2]/         # [Auto-detect top-level folders]
│   └── [feature3]/         # [Auto-detect top-level folders]
├── tests/                  # [If exists]
├── docs/                   # [If exists]
├── public/                 # [If exists]
└── [config files]          # [List key config files]
```

### Key Directories

<!-- For each major folder, infer purpose from:
- Folder name
- Files inside
- Imports/exports
-->

- **`src/[folder]/`**: [Purpose]
- **`tests/`**: [Type of tests]
- **`docs/`**: [Documentation structure]

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

<!-- Extract from README.md "Getting Started" or "Installation" section -->

<!-- Source: README.md -->

### Prerequisites

- Node.js version 20
- pnpm
- Docker
- Posséder un compte Scalingo et avois accès aux applications FCU
- Récupérer le fichier `.env.local` auprès d'un membre de l'équipe

### Quick Start

```bash
# Install dependencies
pnpm i

# Launch Docker containers
docker compose up -d

# Prepare database structure
pnpm db:migrate

# Populate local database
pnpm db:bootstrap
```

### Resources

<!-- Extract from README.md links section -->

- **Documentation**: [Link if available]
- **API Docs**: [Link if available]
- **Examples**: [Link to examples folder if exists]
- **Demos**: [Link to live demo if mentioned]

---

**Last updated**: [Current date]
**Maintained by**: [From package.json or docs]