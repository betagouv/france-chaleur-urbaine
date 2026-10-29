import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import type { ComponentProps, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { uuid } from '@/tests/helpers';

import type { CcrtDemand } from '../types';
import type { CcrtBuildingForm } from './CcrtBuildingForm';
import { CcrtDemandsWorkspace } from './CcrtDemandsWorkspace';
import type { CcrtDemandToolbar } from './CcrtDemandToolbar';

const mocks = vi.hoisted(() => ({
  adminQuery: vi.fn(),
  ccrtQuery: vi.fn(),
  contact: vi.fn(),
  invalidateAdmin: vi.fn(),
  invalidateCcrt: vi.fn(),
  invalidateFollowUp: vi.fn(),
  isMobile: false,
  openEmail: vi.fn(),
  track: vi.fn(),
  trackOpening: vi.fn(),
  validate: vi.fn(),
}));

vi.mock('@/modules/trpc/client', () => ({
  default: {
    batEnr: {
      admin: {
        listDemandesChaleurRenouvelable: { useQuery: mocks.adminQuery },
        validateDemandeChaleurRenouvelable: { useMutation: () => ({ mutateAsync: mocks.validate }) },
      },
      ccrt: { getFollowUp: { useQuery: () => ({ data: { total: 1 } }) }, listDemandesChaleurRenouvelable: { useQuery: mocks.ccrtQuery } },
    },
    useUtils: () => ({
      batEnr: {
        admin: { listDemandesChaleurRenouvelable: { invalidate: mocks.invalidateAdmin } },
        ccrt: {
          getFollowUp: { invalidate: mocks.invalidateFollowUp },
          listDemandesChaleurRenouvelable: { invalidate: mocks.invalidateCcrt },
        },
      },
    }),
  },
}));
vi.mock('@/components/shared/page/SimplePage', () => ({ default: ({ children }: { children: ReactNode }) => children }));
vi.mock('@/modules/analytics/client', () => ({ trackPostHogEvent: mocks.track }));
vi.mock('@/hooks/useIsMobile', () => ({ default: () => mocks.isMobile }));
vi.mock('./hooks/useCcrtDemandActions', () => ({
  useCcrtDemandActions: () => ({
    isUpdating: false,
    openEmail: mocks.openEmail,
    trackContact: mocks.contact,
    trackOpening: mocks.trackOpening,
  }),
}));
vi.mock('./CcrtDemandToolbar', () => ({
  CcrtDemandToolbar: ({ search, onSearchChange }: ComponentProps<typeof CcrtDemandToolbar>) => (
    <input aria-label="Rechercher" value={search} onChange={(event) => onSearchChange(event.target.value)} />
  ),
}));
vi.mock('./CcrtBuildingForm', () => ({
  CcrtBuildingForm: ({ demand }: ComponentProps<typeof CcrtBuildingForm>) => <p>Fiche bâtiment : {demand.address}</p>,
}));
vi.mock('./CcrtDemandFollowUp', () => ({ CcrtDemandFollowUp: () => <p>Suivi de la demande</p> }));
vi.mock('./CcrtBuildingIdentification', () => ({ CcrtBuildingIdentification: () => <p>Identification du bâtiment</p> }));
vi.mock('./CcrtProjectFields', () => ({ CcrtProjectFields: () => <p>Projet initial</p> }));
vi.mock('./CcrtDemandEmailDialog', () => ({ CcrtDemandEmailDialog: () => null }));

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
  validated: false,
};

describe('CcrtDemandsWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isMobile = false;
    mocks.validate.mockResolvedValue({ id: demand.id, validated: true });
    mocks.adminQuery.mockReturnValue({ data: { items: [demand] }, isError: false, isLoading: false });
    mocks.ccrtQuery.mockReturnValue({
      data: { items: [{ ...demand, validated: true }], trackingContext: { departements: ['44'], structure_ccrt: null } },
      isError: false,
      isLoading: false,
    });
  });

  const renderWorkspace = (isAdmin = true) =>
    render(
      <NuqsTestingAdapter hasMemory>
        <CcrtDemandsWorkspace isAdmin={isAdmin} />
      </NuqsTestingAdapter>
    );

  it.each([true, false])('opens and collapses the shared building sheet with admin mode %s', async (isAdmin) => {
    renderWorkspace(isAdmin);
    const expand = screen.getByRole('button', { name: 'Déplier la demande de Joëlle Martini' });
    expect(expand).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/Fiche bâtiment/)).toBeNull();

    fireEvent.click(expand);
    expect(await screen.findByText(/Fiche bâtiment/)).toBeInTheDocument();
    expect(screen.getByText('Suivi de la demande')).toBeInTheDocument();
    expect(screen.queryByText('Affecté à')).toBeNull();
    expect(mocks.trackOpening).toHaveBeenCalledExactlyOnceWith(isAdmin ? demand : { ...demand, validated: true });
    expect(mocks.adminQuery).toHaveBeenCalledWith(undefined, { enabled: isAdmin });
    expect(mocks.ccrtQuery).toHaveBeenCalledWith(undefined, { enabled: !isAdmin });
    expect(screen.queryByRole('button', { name: 'Valider' }) !== null).toStrictEqual(isAdmin);

    fireEvent.click(screen.getByRole('button', { name: 'Replier la demande' }));
    await waitFor(() => expect(screen.queryByText(/Fiche bâtiment/)).toBeNull());
  });

  it('toggles the sheet from a summary cell while contact links and buttons keep their own action', async () => {
    renderWorkspace(false);
    fireEvent.click(screen.getByText('25 logements'));
    expect(await screen.findByText(/Fiche bâtiment/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: demand.email }));
    expect(screen.getByText(/Fiche bâtiment/)).toBeInTheDocument();
    expect(mocks.contact).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Contacter' }));
    expect(screen.getByText(/Fiche bâtiment/)).toBeInTheDocument();
    expect(mocks.openEmail).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('25 logements'));
    await waitFor(() => expect(screen.queryByText(/Fiche bâtiment/)).toBeNull());
  });

  it('sorts statuses alphabetically in both directions without changing the active tab', async () => {
    mocks.adminQuery.mockReturnValue({
      data: {
        items: [
          { ...demand, status: 'Recontacté pour premier échange' },
          { ...demand, first_name: 'Paul', id: uuid(2), status: 'Clôturée' },
          { ...demand, first_name: 'Claire', id: uuid(3), status: 'A traiter' },
        ],
      },
      isError: false,
      isLoading: false,
    });
    renderWorkspace();
    const getNames = () => screen.getAllByRole('button', { name: /^(Joëlle|Paul|Claire) Martini$/ }).map((button) => button.textContent);
    fireEvent.click(screen.getByRole('button', { name: 'Trier les statuts de A à Z' }));
    await waitFor(() => expect(getNames()).toStrictEqual(['Claire Martini', 'Paul Martini', 'Joëlle Martini']));
    expect(screen.getByRole('button', { name: /Toutes les demandes/ })).toHaveAttribute('aria-current', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Trier les statuts de Z à A' }));
    await waitFor(() => expect(getNames()).toStrictEqual(['Joëlle Martini', 'Paul Martini', 'Claire Martini']));
  });

  it.each([false, true])('replaces contact with publication and refreshes shared views with mobile mode %s', async (isMobile) => {
    mocks.isMobile = isMobile;
    renderWorkspace();
    expect(screen.queryByRole('button', { name: /Contacter/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));

    await waitFor(() => expect(mocks.validate).toHaveBeenCalledExactlyOnceWith({ demandId: demand.id }));
    await waitFor(() => expect(mocks.invalidateAdmin).toHaveBeenCalledExactlyOnceWith());
    expect(mocks.invalidateCcrt).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.invalidateFollowUp).toHaveBeenCalledExactlyOnceWith({ demandId: demand.id });
  });

  it.each([false, true])('shows contact after publication with mobile mode %s', (isMobile) => {
    mocks.isMobile = isMobile;
    mocks.adminQuery.mockReturnValue({ data: { items: [{ ...demand, validated: true }] }, isError: false, isLoading: false });
    renderWorkspace();

    expect(screen.queryByRole('button', { name: 'Valider' })).toBeNull();
    expect(screen.queryByText('Validée')).toBeNull();
    expect(screen.getByRole('button', { name: /Contacter/ })).toBeInTheDocument();
  });

  it('keeps all admin demands visible initially, including unvalidated demands already in progress', () => {
    mocks.adminQuery.mockReturnValue({
      data: { items: [{ ...demand, status: 'Recontacté pour premier échange' }] },
      isError: false,
      isLoading: false,
    });
    renderWorkspace();

    expect(screen.getByRole('button', { name: 'Joëlle Martini' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Toutes les demandes/ })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: 'Valider' })).toBeInTheDocument();
  });
  it.each([true, false])('opens the mobile sheet and preserves admin controls with admin mode %s', async (isAdmin) => {
    mocks.isMobile = true;
    renderWorkspace(isAdmin);
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByText('Aucune solution enregistrée')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir la demande de Joëlle Martini' }));
    expect(await screen.findByRole('heading', { name: 'Joëlle Martini' })).toBeInTheDocument();
    expect(screen.getByText('Prendre contact avec l’usager')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Valider' }) !== null).toStrictEqual(isAdmin);
    expect(screen.queryByRole('button', { name: 'Contacter par email' }) !== null).toStrictEqual(!isAdmin);
    const buildingAccordion = screen.getByRole('button', { name: 'Bâtiment et chauffage' });
    fireEvent.click(buildingAccordion);
    expect(await screen.findByText(/Fiche bâtiment/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Suivi de la demande (1)' }));
    expect(await screen.findByText('Suivi de la demande')).toBeInTheDocument();
    expect(screen.queryByText('Affecté à')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Retour aux demandes' }));
    expect(await screen.findByRole('button', { name: 'Ouvrir la demande de Joëlle Martini' })).toBeInTheDocument();
  });
});
