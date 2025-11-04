# AI Configuration for france-chaleur-urbaine

> Central configuration file for all AI assistants working on this project

## 📁 Project Structure

This project uses a unified `.ai/` folder to configure all AI tools (Claude Code, Cursor, Windsurf, GitHub Copilot, etc.).

```
.ai/
├── AGENTS.md              # This file - main configuration
├── index.yaml             # AI context index (load this first)
├── config.jsonc           # Configuration (committed, supports comments)
├── cli                    # Plugin manager CLI
├── context/               # Project knowledge and guidelines
│   ├── ARCHITECTURE.template.md  # System architecture (run .ai/cli migrate)
│   ├── OVERVIEW.template.md      # Project overview (run .ai/cli migrate)
│   ├── TESTING.template.md       # Testing strategy (run .ai/cli migrate)
│   ├── DATABASE.template.md      # Database schema (run .ai/cli migrate)
│   ├── GIT-WORKFLOW.md           # Git workflow (from git plugin)
│   └── <lang>/                   # Language-specific (from lang-* plugins)
├── commands/              # Custom slash commands (from plugins)
├── agents/                # Specialized agents (from plugins)
├── avatars/               # AI behavior profiles
└── scripts/               # Validation and utility scripts
```

**Note**: Language-specific contexts (node/, typescript/, etc.) are added via plugins.
Run `.ai/cli plugins add lang-node` to add Node.js context, for example.

## 🎯 How to Use This Configuration

### For AI Models

When working on this codebase, you should:

1. **Load `.ai/index.yaml` first** - Contains token-optimized context index
2. **Check context files** - Load relevant files from `.ai/context/` based on task
3. **Look for module docs** - Each module may have:
   - `README.md` - Module overview
   - `AGENTS.md` - AI-specific directives

**Example**: When working in a Node.js module:
- Read `.ai/context/node/` for Node.js best practices
- Check the module's `README.md` for module-specific context
- Check for `AGENTS.md` in the module folder for additional AI directives

## 📚 Context Organization

### Global Context

All cross-cutting concerns and project-wide guidelines should be documented in `.ai/context/` or this file.

### Module-Specific Context

For module or feature-specific directives, create an `AGENTS.md` (or `README.md`) in that module's folder:

```
src/
├── auth/
│   ├── AGENTS.md          # Authentication-specific AI directives
│   └── ...
└── billing/
    ├── AGENTS.md          # Billing-specific AI directives
    └── ...
```

## 🎯 Project Information

**Project**: france-chaleur-urbaine
**Description**: {{PROJECT_DESC}}
**Tech Stack**: Core

### Architecture and Overview
- Read from `.ai/context/architecture.md`


## ⚠️ Git Rules

**NEVER commit or push automatically.** Only commit/push when:
- User explicitly uses `/code-commit` command
- User explicitly asks to commit

## 💡 Development Guidelines

- Follow language-specific conventions in `.ai/context/<language>/`

### Code Style
- Read from `.ai/context/CODING-STYLE.md`

### Testing
- Read from `.ai/context/testing.md`

### Documentation
- Update AGENTS.md when adding features
- Document complex algorithms in comments
- Keep AGENTS.md files up to date

## 🔧 Commands Available

Custom slash commands are available in `.ai/commands/`. Check that folder for available automation.

## 👥 AI Agents

Specialized agents are configured in `.ai/agents/` for complex tasks like codebase exploration, deep search, etc.

---

**Note for AI Models**: This configuration is version-controlled. Always respect the guidelines defined here and in the context folders.
