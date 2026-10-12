import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { uuid } from '@/tests/helpers';

import type { CcrtDemand } from '../types';
import { CcrtBuildingForm } from './CcrtBuildingForm';

const mocks = vi.hoisted(() => ({ eligibility: { distance: 96, isEligible: true }, invalidate: vi.fn(), mutateAsync: vi.fn() }));
vi.mock('@/modules/trpc/client', () => {
  const utils = {
    batEnr: {
      admin: { listDemandesChaleurRenouvelable: { invalidate: mocks.invalidate } },
      ccrt: {
        getFollowUp: { invalidate: mocks.invalidate },
        getHeatNetworkEligibility: { invalidate: mocks.invalidate },
        listDemandesChaleurRenouvelable: { invalidate: mocks.invalidate },
      },
    },
  };
  return {
    default: {
      batEnr: {
        ccrt: {
          getHeatNetworkEligibility: { useQuery: () => ({ data: mocks.eligibility, isPending: false }) },
          updateBuilding: { useMutation: () => ({ mutateAsync: mocks.mutateAsync }) },
        },
      },
      useUtils: () => utils,
    },
  };
});

const demand: CcrtDemand = {
  address: '5 avenue Carnot, 44000 Nantes',
  alternative_heating_solutions: [],
  annual_heating_consumption: null,
  assigned_to: null,
  average_area: 70,
  average_residents: 2,
  batiment_construction_id: null,
  comments: null,
  commune_code: '44109',
  created_at: '2026-10-08T10:00:00.000Z',
  demand_concern: null,
  departement_code: '44',
  dpe: 'D',
  email: 'client@example.test',
  epci_code: null,
  ept_code: null,
  first_name: 'Joëlle',
  heating_energy: 'Gaz',
  hot_water_system_type: null,
  housing_count: 25,
  housing_type: 'immeuble_chauffage_collectif',
  id: uuid(1),
  is_public_advisor_selected: false,
  last_name: 'Martini',
  occupant_status: 'Copropriétaire',
  organization_name: null,
  origin_demand_id: null,
  outdoor_space: 'none',
  phone: '',
  project_state: 'En réflexion',
  project_status: [],
  radiator_type: 'radiateur-eau',
  refusal_period: null,
  refusal_reason: null,
  region_code: null,
  rnic_nom_copropriete: null,
  rnic_numero_immatriculation: null,
  rnic_siret_representant_legal: null,
  simulation_url: '/chaleur-renouvelable/resultat',
  status: 'A traiter',
  surface_area: null,
  updated_at: '2026-10-08T10:00:00.000Z',
  validated: true,
};

describe('CcrtBuildingForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mutateAsync.mockResolvedValue({ id: demand.id, updatedAt: '2026-10-08T10:01:00.000Z' });
  });

  it('saves decimal residents with the selected energy label and reuses the saved version for a second edit', async () => {
    render(<CcrtBuildingForm demand={demand} />);
    expect(screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toStrictEqual([
      'Identification du bâtiment',
      'Bâtiment et chauffage',
      'Avancement déclaré par l’usager',
    ]);
    const submit = screen.getByRole('button', { name: 'Enregistrer et recalculer' });
    expect(screen.queryByLabelText('Adresse du bâtiment')).toBeNull();
    expect(screen.getByText(demand.address)).toBeInTheDocument();
    expect(screen.getByText('Syndicat de copropriété :')).toHaveTextContent('Non renseigné');
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Habitants moyens'), { target: { value: '2.5' } });
    fireEvent.change(screen.getByLabelText('DPE'), { target: { value: 'E' } });
    fireEvent.click(submit);

    await waitFor(() => expect(mocks.mutateAsync).toHaveBeenCalledTimes(1));
    expect(mocks.mutateAsync.mock.calls[0][0]).toMatchObject({
      updatedAt: demand.updated_at,
      values: { average_residents: 2.5, dpe: 'E', hot_water_system_type: 'nonRenseigne' },
    });
    await waitFor(() => expect(submit).toBeDisabled());
    fireEvent.change(screen.getByLabelText('DPE'), { target: { value: 'F' } });
    fireEvent.click(submit);

    await waitFor(() => expect(mocks.mutateAsync).toHaveBeenCalledTimes(2));
    expect(mocks.mutateAsync.mock.calls[1][0]).toMatchObject({
      updatedAt: '2026-10-08T10:01:00.000Z',
      values: { average_residents: 2.5, dpe: 'F' },
    });
  });

  it('displays the original project declarations as read-only and preserves them when saving building changes', async () => {
    const comments = 'Le gestionnaire du réseau nous avait répondu défavorablement en 2022.';
    render(<CcrtBuildingForm demand={{ ...demand, comments, project_status: ['DPE déjà réalisé'] }} />);
    expect(screen.queryByRole('button', { name: /Où en êtes-vous de votre projet/ })).toBeNull();
    expect(screen.queryByRole('combobox', { name: /Où en êtes-vous de votre projet/ })).toBeNull();
    expect(screen.queryByRole('textbox', { name: 'Commentaire laissé dans le formulaire' })).toBeNull();
    expect(screen.getByText('DPE déjà réalisé', { selector: '.fr-tag' })).toBeInTheDocument();
    expect(screen.getByText(`« ${comments} »`, { selector: 'blockquote' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Surface moyenne'), { target: { value: '80' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer et recalculer' }));

    await waitFor(() => expect(mocks.mutateAsync).toHaveBeenCalledTimes(1));
    const savedValues = mocks.mutateAsync.mock.calls[0][0].values;
    expect(savedValues.average_area).toStrictEqual(80);
    expect(
      [
        'address',
        'comments',
        'project_status',
        'rnic_nom_copropriete',
        'rnic_numero_immatriculation',
        'rnic_siret_representant_legal',
      ].filter((field) => field in savedValues)
    ).toStrictEqual([]);
  });

  it('preserves a dirty draft and its original conflict token when a colleague updates the demand', async () => {
    const { rerender } = render(<CcrtBuildingForm demand={demand} />);
    fireEvent.change(screen.getByLabelText('Surface moyenne'), { target: { value: '80' } });
    rerender(<CcrtBuildingForm demand={{ ...demand, average_area: 90, updated_at: '2026-10-08T10:02:00.000Z' }} />);
    expect(screen.getByLabelText('Surface moyenne')).toHaveValue(80);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer et recalculer' }));

    await waitFor(() => expect(mocks.mutateAsync).toHaveBeenCalledTimes(1));
    expect(mocks.mutateAsync.mock.calls[0][0]).toMatchObject({ updatedAt: demand.updated_at, values: { average_area: 80 } });
  });

  it('reveals refusal details on their own row and preserves the draft when toggled', async () => {
    render(<CcrtBuildingForm demand={demand} />);
    expect(screen.queryByLabelText('Date ou période du refus de raccordement')).toBeNull();
    expect(screen.queryByLabelText('Motif du refus')).toBeNull();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Refus de raccordement' }));
    fireEvent.change(screen.getByLabelText('Date ou période du refus de raccordement'), { target: { value: '2022' } });
    fireEvent.change(screen.getByLabelText('Motif du refus'), { target: { value: 'Distance trop importante' } });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Refus de raccordement' }));
    expect(screen.queryByLabelText('Motif du refus')).toBeNull();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Refus de raccordement' }));
    expect(screen.getByLabelText('Date ou période du refus de raccordement')).toHaveValue('2022');
    expect(screen.getByLabelText('Motif du refus')).toHaveValue('Distance trop importante');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer et recalculer' }));
    await waitFor(() => expect(mocks.mutateAsync).toHaveBeenCalledTimes(1));
    expect(mocks.mutateAsync.mock.calls[0][0].values).toMatchObject({
      is_public_advisor_selected: true,
      refusal_period: '2022',
      refusal_reason: 'Distance trop importante',
    });
  });

  it('shows network eligibility and distance instead of an alternative heating solution', () => {
    render(<CcrtBuildingForm demand={{ ...demand, alternative_heating_solutions: ['Chaudière biomasse'] }} />);
    expect(screen.getByText('Éligible · 96 m')).toBeInTheDocument();
    expect(screen.queryByText('Chaudière biomasse')).toBeNull();
  });

  it('resets incompatible hot water when switching from collective heating to a house', () => {
    render(<CcrtBuildingForm demand={{ ...demand, hot_water_system_type: 'Collectif' }} />);
    fireEvent.change(screen.getByLabelText('Type de logement'), { target: { value: 'maison_individuelle' } });

    expect(screen.getByLabelText('Mode eau chaude')).toHaveValue('nonRenseigne');
    expect(screen.queryByRole('option', { name: 'Collectif' })).toBeNull();
    expect(screen.getByRole('option', { name: 'Couplé au chauffage' })).toBeInTheDocument();
  });

  it.each([
    ['Surface moyenne', '0'],
    ['Habitants moyens', '-1'],
    ['Nombre de logements', '0'],
  ])('rejects invalid %s before saving', async (label, value) => {
    render(<CcrtBuildingForm demand={demand} />);
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer et recalculer' }));

    await waitFor(() => expect(screen.getByLabelText(label).closest('.fr-input-group')).toHaveClass('fr-input-group--error'));
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });
});
