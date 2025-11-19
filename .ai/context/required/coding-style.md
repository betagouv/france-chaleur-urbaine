## Coding Style

## General

- Explicit, descriptive names (Clean Code); avoid abbreviations
- Comments only for non-obvious logic/constraints
- Match existing formatting; keep lines short
- Be concise, avoid duplication

## TypeScript

- Prefer types over interfaces; avoid enums (use maps/consts)
- Functions = verbs; variables = meaningful nouns
- Use guard clauses and limit nesting
- Catch only with meaningful handling
- Add tests for non-trivial logic
- Do not export values by default

## React

- For exported components always use an extracted type for props
- Keep components focused and small
- Extract complex logic into custom hooks

## HTML

- Use semantic HTML markup when needed
- Reduce the number of nested tags to the bare minimum

## Project Conventions

- **Code language**: English (functions, variables, comments, logs, docs, commits)
- **UI text**: Language as needed (French, English, etc.)
- **File types**: TypeScript only (.ts, .tsx)
- **Never search**: Other languages not used in this project
