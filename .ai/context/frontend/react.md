## Frontend (React + DSFR)

**Framework**: Next.js Pages Router (NOT App Router)  
**Design System**: DSFR (`@codegouvfr/react-dsfr`) + custom UI components

## Component Structure

**Location**:
- Module components: `src/modules/<module>/client/components/`
- Shared components: `src/components/`
- UI primitives: `src/components/ui/`

**Pattern**:
```typescript
import trpc from '@/modules/trpc/client';
import Button from '@/components/ui/Button';

type MyComponentProps = {
  id: string;
  onSuccess?: () => void;
};

export default function MyComponent({ id, onSuccess }: MyComponentProps) {
  const { data, isLoading } = trpc.module.get.useQuery({ id });
  
  if (isLoading) return <Loader />;
  
  return <div>{data?.name}</div>;
}
```

## TRPC Hooks

### Query (GET)
```typescript
const { data, isLoading, error, refetch } = trpc.module.list.useQuery(
  { filter: 'active' },
  { 
    enabled: true,
    refetchInterval: 5000  // Auto-refresh
  }
);
```

### Mutation (POST/PUT/DELETE)
```typescript
const utils = trpc.useUtils();

const { mutateAsync, isPending } = trpc.module.create.useMutation({
  onSuccess: () => {
    notify('success', 'Created!');
    void utils.module.list.invalidate();  // Refresh list
  },
});

await mutateAsync({ name: 'New item' });
```

### Cache Updates
```typescript
// Invalidate (refetch)
void utils.module.list.invalidate();
void utils.module.get.invalidate({ id });

// Manual cache update
utils.module.get.setData({ id }, (old) => ({ ...old, name: 'Updated' }));
```

## State Management

- **Server state**: TRPC + React Query (preferred)
- **URL state**: `nuqs` (`useQueryState` for strings, `useQueryFlag` for booleans)
- **Client state**: `useState` or Jotai atoms (rarely needed)

## UI Components

**Use custom wrappers** from `@/components/ui/`:
- `Button`, `Heading`, `Text` - DSFR wrappers
- `Dialog`, `Loader`, `Alert` - Common patterns

**DSFR Components**: Import from `@codegouvfr/react-dsfr`

**❌ Deprecated**:
- `Box` component - Use Tailwind classes instead (`flex`, `grid`, etc.)
- `styled-components` - Use Tailwind (except very specific cases)

## Styling

**Preferred**: Tailwind CSS utility classes
```tsx
<div className="flex flex-col gap-4 p-6 bg-blue-france text-white">
  <h1 className="text-2xl font-bold">Title</h1>
</div>
```

**Design tokens**: Use DSFR/Tailwind tokens for consistency
- Colors: `bg-blue-france`, `text-grey-425-625`
- Spacing: `p-4`, `gap-6`, `m-8`
- Typography: `text-xl`, `font-bold`

**❌ Avoid**: `styled-components`, inline styles, `Box` component

## Best Practices

- **Never import server code** in client (use `types.ts` at module root)
- **Extract prop types** for exported components
- **Use TRPC** for all server communication
- **Handle loading states** explicitly
- **Wrap mutations** with `toastErrors()` for error handling

## Forms & Maps

- **Forms**: See `.ai/context/frontend/forms.md`
- **Maps**: See `.ai/context/frontend/maps.md`
