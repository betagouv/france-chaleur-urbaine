import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CcrtIdentificationForm } from './CcrtIdentificationForm';
import { makeCcrtDemand } from './ccrt-demand-fixture';

const mocks = vi.hoisted(() => ({ invalidate: vi.fn(), mutateAsync: vi.fn() }));
vi.mock('@/modules/trpc/client', async () => {
  const { useState } = await import('react');
  return {
    default: {
      batEnr: {
        ccrt: {
          getHeatNetworkEligibility: { useQuery: () => ({ data: null }) },
          updateIdentification: {
            useMutation: () => {
              const [error, setError] = useState<Error | null>(null);
              return {
                error,
                isError: error !== null,
                mutateAsync: async (input: unknown) => {
                  try {
                    return await mocks.mutateAsync(input);
                  } catch (error) {
                    setError(error as Error);
                    throw error;
                  }
                },
                reset: () => setError(null),
              };
            },
          },
        },
      },
      useUtils: () => ({
        batEnr: {
          admin: { listDemandesChaleurRenouvelable: { invalidate: mocks.invalidate } },
          ccrt: { getFollowUp: { invalidate: mocks.invalidate }, listDemandesChaleurRenouvelable: { invalidate: mocks.invalidate } },
        },
      }),
    },
  };
});

const demand = makeCcrtDemand();

describe('CcrtIdentificationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mutateAsync.mockResolvedValue({ id: demand.id, updatedAt: '2026-10-08T10:01:00.000Z' });
  });

  it('autosaves both blocks and renews the version for a second correction', async () => {
    render(<CcrtIdentificationForm demand={demand} />);
    fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'Marie' } });
    fireEvent.change(screen.getByLabelText(/Syndicat de copropriété/), { target: { value: 'Les Lilas' } });
    expect(screen.queryByRole('button', { name: 'Enregistrer l’identification' })).toBeNull();
    await waitFor(() => expect(mocks.mutateAsync).toHaveBeenCalledTimes(1), { timeout: 3000 });
    expect(mocks.mutateAsync.mock.calls[0][0]).toMatchObject({
      demandId: demand.id,
      updatedAt: demand.updated_at,
      values: { first_name: 'Marie', rnic_nom_copropriete: 'Les Lilas' },
    });
    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Durand' } });
    fireEvent.blur(screen.getByLabelText('Nom'));
    await waitFor(() => expect(mocks.mutateAsync).toHaveBeenCalledTimes(2));
    expect(mocks.mutateAsync.mock.calls[1][0]).toMatchObject({
      updatedAt: '2026-10-08T10:01:00.000Z',
      values: { first_name: 'Marie', last_name: 'Durand', rnic_nom_copropriete: 'Les Lilas' },
    });
  });

  it('finishes edits made during an in-flight save without losing the newer draft', async () => {
    let finish!: (value: unknown) => void;
    mocks.mutateAsync.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    render(<CcrtIdentificationForm demand={demand} />);
    fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'Marie' } });
    fireEvent.blur(screen.getByLabelText('Prénom'));
    await waitFor(() => expect(mocks.mutateAsync).toHaveBeenCalledTimes(1));
    expect(screen.getByLabelText('Prénom')).not.toBeDisabled();
    fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'Marielle' } });
    finish({ id: demand.id, updatedAt: '2026-10-08T10:01:00.000Z' });
    await waitFor(() => expect(mocks.mutateAsync).toHaveBeenCalledTimes(2));
    expect(mocks.mutateAsync.mock.calls[1][0]).toMatchObject({ updatedAt: '2026-10-08T10:01:00.000Z', values: { first_name: 'Marielle' } });
    expect(screen.getByLabelText('Prénom')).toHaveValue('Marielle');
  });

  it('keeps a stale draft on conflict, pauses autosave and lets the user reload', async () => {
    mocks.mutateAsync.mockRejectedValueOnce(Object.assign(new Error('Demande modifiée'), { data: { code: 'CONFLICT' } }));
    const { rerender } = render(<CcrtIdentificationForm demand={demand} />);
    fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'Marie' } });
    rerender(<CcrtIdentificationForm demand={{ ...demand, first_name: 'Jean', updated_at: '2026-10-08T10:02:00.000Z' }} />);
    fireEvent.blur(screen.getByLabelText('Prénom'));
    await screen.findByRole('alert');
    expect(screen.getByLabelText('Prénom')).toHaveValue('Marie');
    expect(mocks.mutateAsync.mock.calls[0][0]).toMatchObject({ updatedAt: demand.updated_at });
    fireEvent.change(screen.getByLabelText('Prénom'), { target: { value: 'Paul' } });
    await new Promise((resolve) => setTimeout(resolve, 900));
    expect(mocks.mutateAsync).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Abandonner mes modifications et recharger' }));
    expect(screen.getByLabelText('Prénom')).toHaveValue('Jean');
  });

  it('does not autosave invalid contact details and leaves the address read-only', async () => {
    render(<CcrtIdentificationForm demand={demand} />);
    expect(screen.queryByLabelText('Adresse du bâtiment')).toBeNull();
    expect(screen.getByText(demand.address)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'incorrect' } });
    fireEvent.blur(screen.getByLabelText('Email'));
    await screen.findByText("Votre adresse email n'est pas valide");
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });

  it.each([
    'Copropriétaire',
    'Propriétaire de maison individuelle',
    'Bailleur social',
    "Bureau d'étude ou AMO",
    'Grande entreprise ou Foncière',
    'Mandataire ou Délégataire CEE',
    'Syndicat de copropriété',
    'TPE ou PME',
  ])('shows the organization field only for organizational applicants: %s', (type) => {
    render(<CcrtIdentificationForm demand={{ ...demand, occupant_status: type }} />);
    const field = screen.queryByLabelText(/Nom de la structure/);
    expect(field !== null).toStrictEqual(!['Copropriétaire', 'Propriétaire de maison individuelle'].includes(type));
  });

  it('preserves the organization name when its field is temporarily hidden', () => {
    render(<CcrtIdentificationForm demand={{ ...demand, occupant_status: 'Bailleur social', organization_name: 'Structure' }} />);
    fireEvent.change(screen.getByLabelText('Type de demandeur'), { target: { value: 'Copropriétaire' } });
    expect(screen.queryByLabelText(/Nom de la structure/)).toBeNull();
    fireEvent.change(screen.getByLabelText('Type de demandeur'), { target: { value: 'Bailleur social' } });
    expect(screen.getByLabelText(/Nom de la structure/)).toHaveValue('Structure');
  });

  it('keeps archived identities read-only', () => {
    render(<CcrtIdentificationForm demand={{ ...demand, archived_at: '2026-11-16T10:00:00Z' }} />);
    expect(screen.getByLabelText('Prénom')).toBeDisabled();
    expect(screen.getByLabelText(/Syndicat de copropriété/)).toBeDisabled();
  });
});
