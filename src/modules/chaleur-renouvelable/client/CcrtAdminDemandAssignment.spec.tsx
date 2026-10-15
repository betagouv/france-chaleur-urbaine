import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { uuid } from '@/tests/helpers';

import { CcrtAdminDemandAssignment } from './CcrtAdminDemandAssignment';

const mocks = vi.hoisted(() => ({ candidates: vi.fn(), invalidate: vi.fn(), update: vi.fn() }));

vi.mock('@/modules/trpc/client', () => ({
  default: {
    batEnr: {
      admin: {
        listAssignmentCandidates: { useQuery: mocks.candidates },
        updateDemandeChaleurRenouvelable: { useMutation: () => ({ isPending: false, mutateAsync: mocks.update }) },
      },
    },
    useUtils: () => ({
      batEnr: {
        admin: { listDemandesChaleurRenouvelable: { invalidate: mocks.invalidate } },
        ccrt: {
          getFollowUp: { invalidate: mocks.invalidate },
          listDemandesChaleurRenouvelable: { invalidate: mocks.invalidate },
        },
      },
    }),
  },
}));
describe('CcrtAdminDemandAssignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.update.mockResolvedValue({});
    mocks.candidates.mockReturnValue({
      data: [
        { email: 'conseillere@example.fr', first_name: 'Marie', id: uuid(2), last_name: 'Martin', role: 'ccrt', structure_name: null },
      ],
      isError: false,
      isLoading: false,
    });
  });

  it('offers eligible CCRT accounts without automatically assigning the demand', () => {
    render(<CcrtAdminDemandAssignment demand={{ assigned_to: null, id: uuid(1) }} />);

    expect(screen.getByLabelText('Affecté à')).toHaveValue('');
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toStrictEqual([
      'Non affecté',
      'Marie Martin (conseillere@example.fr)',
    ]);
    expect(mocks.candidates).toHaveBeenCalledWith({ demandId: uuid(1) });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('preserves a historical assignment outside the current candidates', () => {
    render(<CcrtAdminDemandAssignment demand={{ assigned_to: 'Ancienne affectation', id: uuid(1) }} />);

    expect(screen.getByLabelText('Affecté à')).toHaveValue('Ancienne affectation');
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it.each([
    {
      data: [],
      disabled: false,
      isError: false,
      isLoading: false,
      message: 'Aucun compte CCRT actif ne dispose d’une permission couvrant cette demande.',
    },
    {
      data: undefined,
      disabled: true,
      isError: true,
      isLoading: false,
      message: 'Impossible de charger les comptes CCRT. Veuillez réessayer.',
    },
    { data: undefined, disabled: true, isError: false, isLoading: true, message: 'Chargement des comptes CCRT…' },
  ])('explains candidate availability: $message', ({ data, isError, isLoading, message, disabled }) => {
    mocks.candidates.mockReturnValue({ data, isError, isLoading });
    render(<CcrtAdminDemandAssignment demand={{ assigned_to: null, id: uuid(1) }} />);

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Affecté à/ })).toHaveProperty('disabled', disabled);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it.each([
    { assignedTo: 'conseillere@example.fr', initialAssignment: null, selectedAssignment: 'conseillere@example.fr' },
    { assignedTo: null, initialAssignment: 'conseillere@example.fr', selectedAssignment: '' },
  ])('saves assignment $assignedTo through the admin mutation', async ({ initialAssignment, selectedAssignment, assignedTo }) => {
    render(<CcrtAdminDemandAssignment demand={{ assigned_to: initialAssignment, id: uuid(1) }} />);
    fireEvent.change(screen.getByLabelText('Affecté à'), { target: { value: selectedAssignment } });

    await waitFor(() => expect(mocks.update).toHaveBeenCalledExactlyOnceWith({ demandId: uuid(1), values: { assignedTo } }));
    await waitFor(() => expect(mocks.invalidate).toHaveBeenCalledTimes(3));
  });
});
