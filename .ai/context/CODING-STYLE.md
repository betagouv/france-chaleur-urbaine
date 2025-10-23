# Coding Style Guidelines

> Coding conventions and best practices for france-chaleur-urbaine

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

## Common Development Tasks

Take all information from .cursor/rules folder

### Comments

- Use comments ONLY when the complexity is strong
- Always use the indicative mood (present tense) in comments, not infinitive
  - ✅ Good: `// Calcule la distance` (describes what the code does)
  - ❌ Bad: `// Calculer la distance` (sounds like an instruction)

### Form

- Always use src/components/form/react-form/useForm.tsx when creating a form
- Take example from src/components/Admin/UserForm.tsx
- Never use a Field.Custom in a Field.Custom

### Colors

- Always use colors from colors.ts (priority to success, warning, accent, etc...)

### Display a Table

- Always use TableSimple.tsx when needing to display a table
- Use existing TableCell through "type" and "cellProps"
- if you see a common pattern for a not existing Cell Type, add it to TableCell.tsx

### Creating a new component

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

### Creating a new hook

1. First check if one already exists in src/hooks or in @react-hookz/web
2. If it does not exist, add one in src/hooks

### Adding a new API endpoint

1. Create a new module or append to an existing module
2. Look into module "trpc" and add or update a `trpc-routes.ts`
3. Add service method in `<module>/server/service.ts`

### Working with the map

1. Map components in `src/components/Map/`
2. Layer definitions in `src/services/Map/layers/`
3. Geospatial utilities in `src/utils/geo/`

### Code Quality

<!-- Source: CLAUDE.md -->

```bash
# Code Quality (ALWAYS run before committing)
pnpm lint                  # ESLint check
pnpm lint:fix              # Fix linting issues
pnpm prettier-check        # Code formatting
pnpm lint:file             # Lint specific file
pnpm ts                    # Run typescript on all codebase
```

### Linting

<!-- Source: README.md -->

[Biome](https://biomejs.dev/fr/) est utilisé comme formatteur de code et linter.

```bash
pnpm lint
```

### Pre-commit Hooks

<!-- Source: README.md -->

Un hook pre-commit Git permet de vérifier que le code est correctement linté avec [lint-staged](https://github.com/lint-staged/lint-staged), et [talisman](https://github.com/thoughtworks/talisman/) est un outil qui permet de détecter les fuites de secrets dans les commits.

À noter que [GitGuardian](https://www.gitguardian.com/) est configuré sur l'organisation beta.gouv et fait la même chose, mais le secret a alors été rendu public et il faut alors l'invalider.

Si talisman détecte une erreur au moment d'un commit, 2 options sont possibles :
- soit corriger l'erreur pour supprimer l'alerte ;
- soit ajouter une exception via la commande `pnpm talisman:add-exception`.

---

**Last updated**: 2025-10-23
**Related**: See [ARCHITECTURE.md](./ARCHITECTURE.md) for architecture patterns
