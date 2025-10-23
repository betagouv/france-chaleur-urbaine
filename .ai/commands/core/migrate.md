---
description: Initialize .ai/context files from existing documentation
allowed-tools: Read, Glob, Write, Edit, Task
---

You are a documentation extraction specialist. Extract content from existing project documentation (README.md, CLAUDE.md, AGENTS.md) and organize it into .ai/context/ files based on templates.

## ⚠️ NON-NEGOTIABLE RULE

**DO NOT MODIFY THE TEXT IN ANY WAY**
- Copy text EXACTLY as-is, character for character
- NO rewriting, rewording, or improvements
- NO fixing typos or grammar
- NO adding explanations or clarifications
- NO formatting changes (except where markdown structure requires it)
- You are a MOVER, not an EDITOR
- Any text modification is a FAILURE

## Workflow

1. **DISCOVER**: Find all documentation files
   - Use Glob to find: `**/README.md`, `**/CLAUDE.md`, `**/AGENTS.md`
   - **ALSO FIND**: `**/*.mdc` files (Markdown Context files)
   - **INCLUDE**: Scan `.ai/context/**/*.md` and `.ai/context/**/*.mdc` for existing documentation
   - **EXCLUDE**: Skip files in `node_modules/`, `.git/`, `dist/`, `build/`
   - **EXCLUDE**: Skip `.ai/context/**/*.template.md` files (those are templates, not documentation)
   - Read each discovered file
   - **IF NO DOCUMENTATION FOUND**: Skip to step 6 (Fallback)

2. **RENAME TEMPLATES**: Prepare context files
   - For each `.template.md` file in `.ai/context/`:
     - Read the template file
     - Write same content to file without `.template` suffix
     - Example: `ARCHITECTURE.template.md` → `ARCHITECTURE.md`
     - **DELETE**: Remove the `.template.md` file after successful copy
   - **CLEANUP**: All `.template.md` files should be deleted after migration

3. **EXTRACT CONTENT**: Map documentation to context files
   - Analyze each documentation file for sections
   - **FOR .ai/context FILES**: Treat as valid documentation sources, extract and organize their content
   - **FOR .mdc FILES**: Process them as markdown files (same rules apply)
   - Match sections to appropriate context files:

     **ARCHITECTURE.md**:
     - "Architecture", "System Design", "Technical Stack", "Infrastructure"
     - "Deployment", "Services", "Components", "Modules"

     **OVERVIEW.md**:
     - "About", "Introduction", "What is", "Features"
     - "Goals", "Objectives", "Use Cases", "Getting Started"

     **CODING-STYLE.md**:
     - "Coding Guidelines", "Code Style", "Best Practices"
     - "Conventions", "Code Standards", "Style Guide"

     **TESTING.md**:
     - "Testing", "Tests", "Quality Assurance"
     - "Test Strategy", "Coverage", "Test Guidelines"

     **DATABASE.md**:
     - "Database", "Schema", "Data Model", "Migrations"
     - "Queries", "Database Design", "Data Storage"

     **GIT-WORKFLOW.md**:
     - "Git Workflow", "Branching", "Commits", "Pull Requests"
     - "Version Control", "Contributing", "Development Workflow"

4. **INSERT CONTENT**: Add extracted text to context files
   - **⚠️ CRITICAL**: Copy text EXACTLY as-is, ZERO modifications allowed
   - **NO REWRITING**: You are moving text, NOT improving it
   - **NO TYPO FIXES**: Keep errors exactly as they are
   - **NO GRAMMAR**: Keep grammar exactly as it is
   - **NO CLARIFICATIONS**: Do not add or remove words
   - Replace template placeholders with extracted content
   - If section doesn't exist in template, add new section
   - Preserve markdown formatting exactly
   - Keep original heading levels
   - **SHOW SOURCES**: Add comment at top of each section showing source file
   - Example:
     ```markdown
     ## Coding Guidelines
     <!-- Source: CLAUDE.md -->
     [Original text copied EXACTLY, byte for byte]
     ```

5. **REMOVE EXTRACTED CONTENT**: Clean up original files
   - **SAFETY**: Before removing, verify content was successfully copied to `.ai/context/`
   - For each documentation file that had content extracted:
     - Remove the extracted sections from the original file
     - Keep the file structure (headings hierarchy)
     - Add a reference comment pointing to the new location
     - Example:
       ```markdown
       ## Architecture
       <!-- This section has been moved to .ai/context/ARCHITECTURE.md -->
       ```
   - **PRESERVE**: Keep sections that weren't extracted
   - **SPECIAL HANDLING FOR README.md**:
     - **ALWAYS KEEP** these human-facing sections (do NOT remove):
       - Installation
       - Getting Started
       - Usage
       - Quick Start
       - Requirements
       - Setup
       - Contributing
       - License
     - **REMOVE** technical/AI-specific sections that moved to `.ai/context/`:
       - Architecture
       - Testing
       - Code Style
       - Database Schema
       - Git Workflow
       - Technical Documentation

6. **RENAME CLAUDE.md FILES**: Update to new naming convention
   - Find all `CLAUDE.md` files in the project (excluding `.ai/` folder)
   - For each `CLAUDE.md` file:
     - **CHECK**: Does `AGENTS.md` exist in the same directory?
     - **IF AGENTS.md EXISTS**: Merge the files
       - Read existing `AGENTS.md` content
       - Read `CLAUDE.md` content
       - Create new `AGENTS.md` with:
         1. Original `AGENTS.md` content FIRST
         2. A separator line: `\n---\n\n<!-- Content merged from CLAUDE.md -->\n`
         3. `CLAUDE.md` content SECOND
       - Delete `CLAUDE.md` after successful merge
     - **IF AGENTS.md DOES NOT EXIST**: Simple rename
       - `CLAUDE.md` → `AGENTS.md`
   - **REASONING**: Maintain consistent naming across the project
   - **SKIP**: Don't process if CLAUDE.md is empty or contains only breadcrumb comments
   - **PRESERVE TEXT**: Do NOT modify content during merge, just combine

7. **VERIFY**: Check extraction results
   - List all context files created/updated
   - Show which template files were deleted
   - Show which documentation files were processed
   - Show which sections were removed from originals
   - Show which CLAUDE.md files were renamed to AGENTS.md
   - Report any sections that couldn't be mapped

8. **FALLBACK**: If no documentation found
   - Inform user that no documentation files were found
   - Suggest using `/explore-codebase` to generate documentation from code analysis
   - Display message:
     ```
     ⚠️ No documentation files found in your codebase.

     💡 To generate documentation from your code, run:
     /explore-codebase
     ```

## Extraction Rules

- **⚠️ ZERO TEXT MODIFICATION**: Copy text character-by-character, no changes whatsoever
- **NO IMPROVEMENTS**: Do not fix typos, grammar, wording, or formatting
- **NO ADDITIONS**: Do not add words, explanations, or clarifications
- **NO DELETIONS**: Do not remove words, even if redundant or unclear
- **EXACT COPY**: Never modify, improve, or rewrite extracted text
- **PRESERVE FORMATTING**: Keep markdown, code blocks, lists exactly as-is
- **ADD SECTIONS**: If content doesn't fit template structure, add new sections
- **SOURCE TRACKING**: Always add `<!-- Source: path/to/file -->` comments
- **HANDLE DUPLICATES**: If same content in multiple files, use most detailed version
- **SKIP EMPTY**: Don't extract empty sections or just headings
- **CLEAN ORIGINALS**: After extraction, remove extracted content from original files
- **LEAVE BREADCRUMBS**: Replace removed sections with `<!-- Moved to .ai/context/FILE.md -->` comments
- **MERGE WHEN NEEDED**: If both CLAUDE.md and AGENTS.md exist, merge them (AGENTS.md first, then CLAUDE.md)
- **NO TEXT MODIFICATION DURING MERGE**: Just concatenate the files with a separator
- **PROCESS .mdc FILES**: Treat `.mdc` files as markdown files (same extraction rules)
- **INCLUDE .ai/context**: Process existing files in `.ai/context/` to reorganize their content

## Content Mapping Strategy

### Section Matching
1. Look for exact heading matches first
2. Look for keyword matches in heading
3. Look for content keywords in section body
4. If multiple matches, use primary mapping (listed first in step 3)

### Fallback Sections
If content doesn't match any template:
- Create new section in most relevant context file
- Add at end before final separator
- Keep original heading

## Output Format

After extraction, report:
```
✓ Template Files Deleted:
  - .ai/context/ARCHITECTURE.template.md (copied to ARCHITECTURE.md, then deleted)
  - .ai/context/CODING-STYLE.template.md (copied to CODING-STYLE.md, then deleted)
  - .ai/context/OVERVIEW.template.md (copied to OVERVIEW.md, then deleted)

✓ Processed Files:
  - README.md (3 sections extracted, 3 sections removed)
  - .claude/CLAUDE.md (5 sections extracted, 5 sections removed)

✓ Updated Context Files:
  - ARCHITECTURE.md (2 sections added)
  - CODING-STYLE.md (1 section added)
  - OVERVIEW.md (3 sections added)

✓ Cleaned Original Files:
  - README.md (removed "Architecture", "Testing", "Code Style")
  - CLAUDE.md (removed "System Design", "Guidelines", etc.)
  - Breadcrumb comments added to show new locations

✓ Renamed/Merged Files:
  - CLAUDE.md → AGENTS.md (renamed)
  - modules/auth/CLAUDE.md + AGENTS.md → AGENTS.md (merged)
  - modules/api/CLAUDE.md → AGENTS.md (renamed)

✓ Unmapped Content:
  - "Custom Section Name" from README.md (no clear mapping, left in original)
```

## Priority

**TEXT PRESERVATION > EVERYTHING ELSE**

- Your ONLY job is to MOVE text, not improve it
- Original text is SACRED - do not touch it
- Bad grammar? Keep it
- Typos? Keep them
- Unclear wording? Keep it
- Informal tone? Keep it
- Incomplete sentences? Keep them

**If you modify even one character of the extracted text, you have FAILED this task.**
