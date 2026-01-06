# AI Agent Configuration

## ⚠️ CRITICAL: AI AGENT PROTOCOL

YOU MUST FOLLOW THIS EXACT SEQUENCE:
1. Read this entire file
2. Load ALL files in "Core Context"
3. Match user query keywords to "Context Map"
4. Load ALL matching context files
5. Reply: "✓ Loaded: [list] (~X tokens)" BEFORE answering
6. If uncertain which contexts apply → ASK user

---

## 📋 Core Context (Always Load)
```
.ai/avatars/developer.md                  # Developer persona guidelines
.ai/context/required/architecture.md      # System design, principles
.ai/context/required/coding-style.md      # Conventions, naming
```

---

## 🗺️ Context Map (Match Keywords → Load File)

**Database & SQL**
`.ai/context/backend/database.md`
Keywords: database, sql, kysely, postgis, spatial, query, schema, table, column, geospatial

**API & Backend**
`.ai/context/backend/api.md`
Keywords: api, endpoint, trpc, route, server, procedure, handler, backend

**Database Migrations**
`.ai/context/backend/migrations.md`
Keywords: migration, alter, schema change, drizzle, prisma, create table, drop

**React Components**
`.ai/context/frontend/react.md`
Keywords: component, react, tsx, jsx, hook, state, props, ui, interface

**Forms & Validation**
`.ai/context/frontend/forms.md`
Keywords: form, validation, input, submit, zod, react-hook-form, field, checkbox

**Maps & Geospatial**
`.ai/context/frontend/maps.md`
Keywords: map, maplibre, layer, geojson, marker, coordinates, basemap, popup

**Testing**
`.ai/context/quality/testing.md`
Keywords: test, jest, vitest, spec, mock, coverage, e2e, unit test

**Security**
`.ai/context/quality/security.md`
Keywords: auth, authentication, permission, authorization, security, secret, env, validation, sanitize

**Error Handling**
`.ai/context/quality/errors.md`
Keywords: error, exception, logging, try-catch, error handling, error message

---

## 🎯 Special Rules

**Module-specific context**: If user mentions a module name → also load `.ai/context/required/modules.md`

**Large/complex tasks** (>5 files OR new module OR architecture decision):
→ also load `.ai/context/required/critical-thinking.md` for design review

---

## ✓ Self-Check Before Responding

- [ ] Read AGENTS.md?
- [ ] Loaded all core files?
- [ ] Scanned for matching keywords?
- [ ] Replied with "✓ Loaded: [list]"?

If ANY box unchecked → STOP and complete it first
