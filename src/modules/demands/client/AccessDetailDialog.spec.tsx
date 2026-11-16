import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { uuid } from '@/tests/helpers';

import AccessDetailDialog from './AccessDetailDialog';

const mocks = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('@/modules/auth/client/hooks', () => ({ useAuthentication: () => ({ hasRole: () => true }) }));
vi.mock('@/modules/trpc/client', () => ({
  default: { permissions: { listUsersWithAccessToDemand: { useQuery: mocks.query } } },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.query.mockReturnValue({ data: [{ email: 'gestionnaire@example.fr', id: uuid(2), role: 'gestionnaire' }], isLoading: false });
});

describe('AccessDetailDialog', () => {
  it('keeps fetching classic-demand access holders on opening', () => {
    render(<AccessDetailDialog demandId={uuid(1)} open onOpenChange={vi.fn()} />);
    expect(mocks.query).toHaveBeenCalledWith({ demandId: uuid(1) }, { enabled: true, staleTime: 60_000 });
    expect(screen.getByRole('link', { name: 'gestionnaire@example.fr' })).toHaveAttribute('href', 'mailto:gestionnaire@example.fr');
    expect(screen.queryByText('Jamais connecté')).toBeNull();
  });

  it.each([
    ['2026-10-23T23:30:00.000Z', 'Dernière connexion le 24/10/2026'],
    [null, 'Jamais connecté'],
  ])('shows supplied CCRT access and activity (%s) without querying classic-demand permissions', (last_connection, expected) => {
    render(
      <AccessDetailDialog
        demandId={uuid(1)}
        users={[{ email: 'conseiller@example.fr', id: uuid(3), last_connection, role: 'ccrt' }]}
        open
        onOpenChange={vi.fn()}
      />
    );
    expect(mocks.query).toHaveBeenCalledWith({ demandId: uuid(1) }, { enabled: false, staleTime: 60_000 });
    const dialog = screen.getByRole('dialog', { name: 'Utilisateurs avec accès à la demande' });
    expect(within(dialog).getByRole('link', { name: 'conseiller@example.fr' })).toHaveAttribute('href', 'mailto:conseiller@example.fr');
    expect(within(dialog).getByText(expected, { exact: false })).toBeInTheDocument();
    expect(within(dialog).queryByText('gestionnaire@example.fr')).toBeNull();
  });
});
