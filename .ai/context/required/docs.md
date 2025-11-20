## Documentation Standards

## Context Files (.ai/context/)

**Purpose**: Minimal, actionable guides for AI agents

**Rules**:
- **≤ 600 tokens** per file
- **1-2 examples** per concept (not all cases)
- **Practical patterns** from the codebase, not theory
- **Clear, concise, unambiguous** for AI understanding

**Structure**:
```
.ai/context/
├── backend/       # API, Database, Migrations
├── frontend/      # React, Forms, Maps
├── quality/       # Testing, Errors, Security
└── required/      # Architecture, Style, Modules
```

## Module Documentation (AGENTS.md)

**Location**: `src/modules/<module>/AGENTS.md`  
**Required**: EVERY module MUST have one

**Template**:
```markdown
# Module Name

Purpose in 1-2 sentences.

## Structure
- File organization

## API
- Exported functions/hooks

## Usage Examples
- 1-2 code examples

## Environment Variables
- Required env vars
```

## Project Documentation

**ARCHITECTURE.md** (root):
- Overall architecture
- Module list
- Legacy areas
- Migration strategy

**When to update**:
- New module created → Update `ARCHITECTURE.md`
- New feature in module → Update module's `AGENTS.md`
- New pattern → Update relevant `.ai/context/` file

## Writing Style

- **English** for code/docs
- **French** for UI text
- **Imperative** tone ("Use X", not "You should use X")
- **Examples over explanation**
