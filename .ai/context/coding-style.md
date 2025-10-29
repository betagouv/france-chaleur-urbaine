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
- Add vitest tests for non-trivial logic
- Do not export values by default

## React

- For exported components always use an extracted type for props

## HTML

- Use semantic HTML markup when needed
- Reduce the number of imbricated tags to the bare minimum
