# State Management

## State strategy

- **Server state is the primary source of truth.** Fetch via tRPC hooks, not client state.
- Client state is only for: UI interactions, form inputs, optimistic updates.
- Minimize duplication. If data comes from the server, don't copy it to client state.

## State categories

| State type | Solution | Example |
|-----------|---------|---------|
| Server data (read) | tRPC `useQuery` | Network list, demand details |
| Server data (mutation) | tRPC `useMutation` | Create demand, update profile |
| URL state | `nuqs` (`useQueryStates`) | Map filters, pagination, search, when state needs to be kept between reloads |
| Form state | TanStack React Form + Zod | Contact form, eligibility form |
| UI state (local) | `useState` | Modal open/close, accordion |
| UI state (shared) | Jotai atoms | Map layer visibility, sidebar state |
| Optimistic updates | `useOptimistic` or tRPC `setData` | Inline edits |

## tRPC + React Query (server state)

```tsx
import { trpc } from '@/modules/trpc/client/next';

// Read
const { data, isLoading, error } = trpc.reseaux.getAll.useQuery(
  { region: 'Île-de-France' },
  {
    enabled: !!region,         // Conditional fetching
    refetchInterval: 30_000,    // Polling every 30s
  }
);

// Write
const mutation = trpc.demands.create.useMutation({
  onSuccess: () => {
    utils.demands.getAll.invalidate();  // Refresh cache
  },
});
```

### Cache management

- **Invalidate after mutation:** `utils.<router>.<procedure>.invalidate()`.
- **Optimistic update:** `utils.<router>.<procedure>.setData()`.
- Global defaults (from `_app.tsx`): stale time 5min, retry 1x after 3s.

## URL state (nuqs)

Use `nuqs` for state that should be shareable/bookmarkable: filters, sort, pagination, map center.

```tsx
import { useQueryStates, parseAsString, parseAsInteger } from 'nuqs';

const [filters, setFilters] = useQueryStates({
  region: parseAsString.withDefault(''),
  page: parseAsInteger.withDefault(1),
});
```

Map configuration uses `useQueryStates` extensively for layer visibility, zoom, center coordinates.

## Form management

**Modern (preferred):** TanStack React Form + Zod.

```tsx
import { useForm } from '@/components/form/react-form/useForm';
import { zCreateDemand } from '@/modules/demands/constants';

function DemandForm() {
  const form = useForm({
    schema: zCreateDemand,
    defaultValues: { email: '', address: '' },
    onSubmit: async ({ value }) => {
      await toastErrors(() => createMutation.mutateAsync(value));
    },
  });

  return (
    <form.Provider>
      <form.Field name="email" children={(field) => (
        <Input label="Email" field={field} />
      )} />
    </form.Provider>
  );
}
```

Zod schemas in `src/modules/<domain>/constants.ts` — shared between client validation and server validation.

Debug forms with `Ctrl+Shift+D` (development mode).

**Legacy:** React Hook Form — still used in some components. Don't create new RHF forms.

## Client state (Jotai)

For truly client-side state shared across components:
```tsx
import { atom, useAtom } from 'jotai';

const sidebarOpenAtom = atom(true);

function Sidebar() {
  const [isOpen, setIsOpen] = useAtom(sidebarOpenAtom);
  // ...
}
```

Keep Jotai usage minimal. Common use cases: map state, UI toggles, theme.

## Anti-patterns

- Do NOT put server data in Jotai or useState — use tRPC hooks.
- Do NOT use Redux, Zustand, or React Context for new state.
- Do NOT store sensitive data in URL params.
- Do NOT create new React Hook Form instances — use TanStack Form.
