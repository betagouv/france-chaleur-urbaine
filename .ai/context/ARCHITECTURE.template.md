# Architecture Documentation

> Software architecture documentation for france-chaleur-urbaine

## 🎯 Introduction and Goals

### Business Context

<!-- Describe the business problem this software solves -->

**What**: {{PROJECT_DESC}}

**Why**: [Why does this software exist? What business value does it provide?]

**For whom**: [Target users, stakeholders]

### Quality Goals

<!-- Top 3-5 quality attributes in order of priority -->

1. **[Quality Goal 1]**: [e.g., Performance - Response time < 200ms]
2. **[Quality Goal 2]**: [e.g., Security - GDPR compliance]
3. **[Quality Goal 3]**: [e.g., Maintainability - Easy to onboard new developers]

## 📐 Constraints

### Technical Constraints

- **Framework/Language**: Core
- **Deployment**: [Cloud provider, hosting environment]
- **Databases**: [PostgreSQL, MongoDB, Redis, etc.]
- **External APIs**: [Third-party services]

### Organizational Constraints

- **Team size**: [Number of developers]
- **Timeline**: [Project deadlines]
- **Budget**: [Infrastructure costs]

## 🌍 System Context

### External Interfaces

<!-- What external systems does this software interact with? -->

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
┌──────▼──────────┐      ┌──────────────┐
│  france-chaleur-urbaine │◄────►│  External API │
└──────┬──────────┘      └──────────────┘
       │
┌──────▼──────┐
│  Database   │
└─────────────┘
```

### Users and Roles

- **[Role 1]**: [Permissions, use cases]
- **[Role 2]**: [Permissions, use cases]

## 🏗️ Solution Strategy

### Architecture Pattern

[e.g., Monolithic, Microservices, Serverless, Modular monolith]

### Technology Decisions

| Decision | Rationale |
|----------|-----------|
| Core | [Why this framework?] |
| [Database] | [Why this database?] |
| [Hosting] | [Why this hosting?] |

### Key Design Decisions

<!-- Link to ADRs (Architecture Decision Records) if you use them -->

- **[Decision 1]**: [Brief explanation or link to ADR]
- **[Decision 2]**: [Brief explanation or link to ADR]

## 🧱 Building Block View

### High-Level Structure

```
project/
├── src/
│   ├── [module1]/          # [Description]
│   ├── [module2]/          # [Description]
│   ├── components/         # Shared UI components
│   ├── utils/              # Utility functions
│   └── config/             # Configuration
├── tests/
└── docs/
```

### Module Organization

#### Module: [Module Name]

**Purpose**: [What does this module do?]

**Dependencies**: [What does it depend on?]

**Public API**: [What does it expose?]

**Location**: `src/[module-name]/`

## ⚡ Runtime View

### Key Scenarios

#### Scenario: [User Action]

```
User → Frontend → API → Service → Database
  │        │        │       │         │
  │────────┼────────┼───────┼─────────┤
  │        │        │       │         │
  │        │        │       │         │
  └────────┴────────┴───────┴─────────┘
```

**Steps**:
1. User initiates [action]
2. Frontend validates and sends request
3. API authenticates and authorizes
4. Service processes business logic
5. Database persists changes
6. Response flows back to user

## 🚀 Deployment View

### Infrastructure

[Describe hosting, CI/CD, monitoring]

```
┌─────────────────┐
│   CDN/Edge      │
└────────┬────────┘
         │
┌────────▼────────┐
│  Load Balancer  │
└────────┬────────┘
         │
    ┌────┴────┐
┌───▼──┐  ┌───▼──┐
│ App1 │  │ App2 │
└───┬──┘  └───┬──┘
    └────┬────┘
    ┌────▼────┐
    │   DB    │
    └─────────┘
```

### Environments

- **Development**: [Description]
- **Staging**: [Description]
- **Production**: [Description]

## 🔧 Cross-Cutting Concepts

### Authentication & Authorization

[How users are authenticated and authorized]

### Error Handling

[How errors are handled, logged, and reported to users]

### Logging & Monitoring

[What is logged, where, and how to access logs]

### Performance

[Caching strategy, optimization techniques]

### Security

[Security measures, see also: SECURITY.md]

## 🎨 Design Decisions

### Architectural Decision Records (ADRs)

[If using ADRs, link to them here or list key decisions]

**Example**:
- **ADR-001**: [Use PostgreSQL for main database]
- **ADR-002**: [Adopt module-based architecture]

## 📊 Quality Requirements

### Performance

- **Response time**: < 200ms for 95th percentile
- **Throughput**: [Requests per second]
- **Availability**: 99.9% uptime

### Security

- **Authentication**: JWT with refresh tokens
- **Data encryption**: At rest and in transit
- **Compliance**: GDPR, [other regulations]

### Maintainability

- **Test coverage**: > 80%
- **Code review**: Required for all changes
- **Documentation**: Keep up to date with code

## ⚠️ Risks and Technical Debt

### Current Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| [Risk 1] | High/Med/Low | [How to mitigate] |
| [Risk 2] | High/Med/Low | [How to mitigate] |

### Known Technical Debt

- **[Debt Item 1]**: [Description, priority]
- **[Debt Item 2]**: [Description, priority]

## 📚 Glossary

| Term | Definition |
|------|------------|
| [Term 1] | [Definition] |
| [Term 2] | [Definition] |

---

## 📝 Maintenance

**Last updated**: [Date]
**Maintained by**: [Team/Person]
**Review frequency**: [Quarterly, when architecture changes]

## 🔗 Related Documentation

- [README.md](../../README.md) - Project overview and setup
- [SECURITY.md](./SECURITY.md) - Security guidelines
- [TESTING.md](./TESTING.md) - Testing strategy
- Module-specific docs: Check `AGENTS.md` in each module folder
