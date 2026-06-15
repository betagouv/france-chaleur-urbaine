# State Management

- **Server state is the source of truth** — fetch via tRPC hooks, don't copy it into client state.
- Client state only for UI interactions, form inputs, optimistic updates.

| State | Solution |
|-------|----------|
| Server read | tRPC `useQuery` |
| Server write | tRPC `useMutation` then `utils.<router>.<proc>.invalidate()` |
| URL state (shareable: filters, pagination, map center) | `nuqs` (`useQueryStates`) |
| Form state | TanStack React Form + Zod |
| Local UI (modal, accordion) | `useState` |
| Shared UI (map layers, sidebar) | Jotai atoms |
| Optimistic | `useOptimistic` or tRPC `setData` |

## Rules
- **Don't override React Query per-query options** (`staleTime`, `gcTime`, `refetchOnWindowFocus`…) — rely on the `_app.tsx` defaults (stale 5 min, retry 1× after 3 s) unless there's a concrete reason.
- Forms: **TanStack React Form** (`@/components/form/react-form/useForm`) + Zod schema from `src/modules/<domain>/constants.ts` (shared client/server). Debug with `Ctrl+Shift+D` (dev). React Hook Form is legacy — don't add new RHF forms.
- Jotai: keep minimal (map state, UI toggles, theme).

## Anti-patterns
- Server data in Jotai / `useState` → use tRPC hooks.
- Redux / Zustand / React Context for new state → don't.
- Sensitive data in URL params → don't.
