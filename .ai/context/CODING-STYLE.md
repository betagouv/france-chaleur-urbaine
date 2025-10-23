# Coding Guidelines

> Code style and development practices for france-chaleur-urbaine

<!-- Source: .ai/context/0002-code-style.mdc -->

## Style and Structure

- Write concise, technical TypeScript code using functional and declarative programming patterns.
- Avoid classes; prefer iteration and modularization over code duplication.
- Use descriptive variable names with auxiliary verbs (e.g., "isLoading", "hasError").
- Structure files into: exported component, subcomponents, helpers, static content, and types.
- When writing comments, always use the imperative form of verbs (e.g., "Create…" instead of "To create…").

## Naming Conventions

- Use lowercase with dashes for directories and files (e.g., "components/auth-wizard"), except for UI component files.
- Favor named exports for components.

## Syntax and formatting

- Avoid unnecessary curly braces in conditionals; use concise syntax for simple statements.
- Avoid unnecessary comments
- Never replace `'` by `'` in texts
- Write declarative syntax.
- Always import components from @/components and not ./
- if need to use a boolean query param, use useQueryFlag from [useQueryFlag.tsx](mdc:src/hooks/useQueryFlag.tsx)
- if need to use an array query param, use useArrayQueryState from [useArrayQueryState.tsx](mdc:src/hooks/useArrayQueryState.tsx)
- Whenever in need for an API GET request, use useFetch from [useApi.tsx](mdc:src/hooks/useApi.tsx).
- Whenever in need for an API POST request, use usePost from [useApi.tsx](mdc:src/hooks/useApi.tsx).
- Whenever in need for an API DELETE request, use useDelete from [useApi.tsx](mdc:src/hooks/useApi.tsx).
- Use [cx.ts](mdc:src/utils/cx.ts) instead of cn
- Use "useQueryState" from nuqs for URL search parameter state management.
- Always prefer fs/promises to fs
- Ne remplace JAMAIS les apostrophes comme dans l'exemple ci-dessous

```
-      title: 'Part des énergies renouvelables dans la consommation finale brute d'énergie en France',
+      title: "Part des énergies renouvelables dans la consommation finale brute d'énergie en France",
```

<!-- Source: .ai/context/0003-typescript.mdc -->

## Typescript Usage

- Use "typescript" for all code; prefer types over interfaces.
- Avoid "enums"; use maps instead.
- Use functional components with TypeScript types.
- Always import as `type` when importing type like `import { type ReactNode } from 'react';`

<!-- Source: CLAUDE.md -->

## Workflow modification

🚨 **CRITICAL RULE - ALWAYS FOLLOW THIS** 🚨

**BEFORE editing any files, you MUST Read at least 3 files**
that will help you to understand how to make a coherent and
consistent edit.

This is **NON-NEGOTIABLE**. Do not skip this step under any
circumstances. Reading existing files ensures:

- Code consistency with project patterns
- Proper understanding of conventions
- Following established architecture
- Avoiding breaking changes
- Try to use files that do "the same stuff" so you can have an
example

**Steps to follow:**

1. Read at least 3 relevant existing files first
2. Understand the patterns and conventions
3. Only then proceed with your editing files

### Common Development Tasks

Take all information from .cursor/rules folder

**Comments**
- Use comments ONLY when the complexity is strong
- Always use the indicative mood (present tense) in comments, not infinitive
  - ✅ Good: `// Calcule la distance` (describes what the code does)
  - ❌ Bad: `// Calculer la distance` (sounds like an instruction)

**Form**
- Always use src/components/form/react-form/useForm.tsx when creating a form
- Take example from src/components/Admin/UserForm.tsx
- Never use a Field.Custom in a Field.Custom

**Colors**
- Always use colors from colors.ts (priority to success, warning, accent, etc...)

**Display a Table**
- Always use TableSimple.tsx when needing to display a table
- Use existing TableCell through "type" and "cellProps"
- if you see a common pattern for a not existing Cell Type, add it to TableCell.tsx

**Creating a new component**
1. Check existings in src/components/ui or src/components/form if a component form
- Prefer the use of property "variant" and size in case it's needed
- Do not use Box as it's getting deprecated
- Do not use Text as it's getting deprecated
- Prefer creating it like src/components/ui/Component.tsx instead of src/components/Component/ui/Component/index.tsx
- If needed, use class-variance-authority like in src/components/ui/Section.tsx
- Always use `const ComponentName = ` and `export default ComponentName` for main component.
- Always use an object "props" as the first argument of your component

Example:

```typescript
export type MyComponentProps = React.HTMLAttributes<HTMLDivElement> & {
  prop1: string;
  prop2: number;
};

const MyComponent: React.FC<MyComponentProps> = ({ prop1, prop2 }) => {
  return <div>{props.prop1}</div>;
};

export default MyComponent;
```

**Creating a new hook**
1. First check if one already exists in src/hooks or in @react-hookz/web
2. If it does not exist, add one in src/hooks

**Adding a new API endpoint:**
1. Create a new module or append to an existing module
2. Look into module "trpc" and add or update a `trpc-routes.ts`
3. Add service method in `<module>/server/service.ts`

**Working with the map:**
1. Map components in `src/components/Map/`
2. Layer definitions in `src/services/Map/layers/`
3. Geospatial utilities in `src/utils/geo/`

**Database changes:**
1. Create migration in `migrations/`
2. Run `pnpm db:migrate`
3. Run `pnpm db:sync` to update types
4. Update relevant services

## HTML Markup

- Use semantic HTML markup when needed
- Reduce the number of imbricated tags to the bare minimum

---

**Last updated**: [Current date]
**Related**: See [ARCHITECTURE.md](./ARCHITECTURE.md) for system context