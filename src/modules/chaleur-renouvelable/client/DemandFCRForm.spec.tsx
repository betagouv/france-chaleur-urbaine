import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { HeatNetwork } from '@/types/HeatNetworksResponse';

import DemandFCRForm from './DemandFCRForm';

vi.mock('@/modules/chaleur-renouvelable/client/hooks/useChoixChauffageQueryParams', () => ({
  useChoixChauffageQueryParams: () => ({
    params: {
      adresse: '14 Rue Lecourbe 75015 Paris',
      constructionId: 'bdnb-bc-52RF-32BB-D28T',
      dpe: 'D',
      espaceExterieur: 'terrasseBalconEtJardinCours',
      habitantsMoyen: null,
      modeEauChaudeSanitaire: 'Individuel',
      nbLogements: null,
      originDemandId: null,
      surfaceMoyenne: null,
      typeLogement: 'immeuble_chauffage_collectif',
      typeRadiateur: 'radiateur-eau',
    },
  }),
}));

const { recordOutcome, submitDemand, track } = vi.hoisted(() => ({
  recordOutcome: vi.fn().mockResolvedValue(undefined),
  submitDemand: vi.fn(),
  track: vi.fn(),
}));

const simulationId = '11111111-2222-4333-8444-555555555555';

vi.mock('@/modules/analytics/client', () => ({ trackPostHogEvent: track }));

vi.mock('@/modules/trpc/client', () => ({
  default: {
    batEnr: {
      createDemandeChaleurRenouvelable: {
        useMutation: () => ({
          mutateAsync: submitDemand,
        }),
      },
      getFranceRenovSpace: {
        useQuery: () => ({
          data: null,
          isLoading: false,
        }),
      },
    },
    useUtils: () => ({ client: { simulationTracking: { recordOutcome: { mutate: recordOutcome } } } }),
  },
}));

const eligibleHeatNetwork = {
  co2: null,
  distance: 42,
  futurNetwork: false,
  gestionnaire: 'Gestionnaire test',
  hasNoTraceNetwork: false,
  hasPDP: true,
  id: 'network-1',
  inPDP: true,
  isClasse: true,
  isEligible: true,
  name: 'Réseau test',
  tauxENRR: null,
  veryEligibleDistance: 100,
} satisfies HeatNetwork;

describe('DemandFCRForm', () => {
  it.each([
    { destinataire: 'rcu', isHeatNetworkEligible: true, selectedRecipientId: 'network-manager' },
    { destinataire: 'fcr', isHeatNetworkEligible: false, selectedRecipientId: 'public-advisor' },
    { destinataire: 'fcr', isHeatNetworkEligible: true, selectedRecipientId: 'public-advisor' },
  ] as const)(
    'tracks $form with heat network eligibility $isHeatNetworkEligible',
    async ({ isHeatNetworkEligible, selectedRecipientId, destinataire }) => {
      submitDemand.mockResolvedValueOnce({ demandSubmissionResult: null, id: null });
      render(
        <DemandFCRForm
          alternativeHeatingSolutionLabels={[]}
          eligibiliteReseauChaleur={isHeatNetworkEligible ? eligibleHeatNetwork : null}
          isCcrtDemandEligible
          isHeatNetworkEligible={isHeatNetworkEligible}
          selectedRecipientId={selectedRecipientId}
          onSelectedRecipientChange={vi.fn()}
          simulationId={simulationId}
          topSolution="PAC géothermique"
        />
      );
      fireEvent.change(screen.getByRole('textbox', { name: /^Nom/ }), { target: { value: 'Test' } });
      fireEvent.change(screen.getByRole('textbox', { name: /^Prénom/ }), { target: { value: 'Claire' } });
      fireEvent.change(screen.getByRole('textbox', { name: /^Email/ }), { target: { value: 'claire@example.com' } });
      fireEvent.click(screen.getByRole('checkbox', { name: /J’accepte/ }));
      fireEvent.click(screen.getByRole('button', { name: 'Envoyer' }));

      await waitFor(() => expect(submitDemand).toHaveBeenCalledTimes(1));
      expect(track.mock.calls.filter(([event]) => event === 'fcr_contact:form_submitted')).toStrictEqual([
        [
          'fcr_contact:form_submitted',
          {
            destinataire,
            energy: 'Électricité',
            is_raccordable: destinataire === 'rcu',
            nb_logements: 25,
            non_raccordable_reason: undefined,
            phone_filled: false,
            profile: 'Copropriétaire',
            project_stages: [],
            top_solution: 'PAC géothermique',
          },
        ],
      ]);
    }
  );

  it.each([false, true])('shows the CCRT form in a covered territory (heat network eligible: %s)', (isHeatNetworkEligible) => {
    const { container } = render(
      <DemandFCRForm
        alternativeHeatingSolutionLabels={[]}
        eligibiliteReseauChaleur={isHeatNetworkEligible ? eligibleHeatNetwork : null}
        isCcrtDemandEligible
        isHeatNetworkEligible={isHeatNetworkEligible}
        selectedRecipientId="public-advisor"
        onSelectedRecipientChange={vi.fn()}
        simulationId={simulationId}
        topSolution="PAC géothermique"
      />
    );

    expect(screen.getByText('Faites-vous recontacter par un·e conseiller·ère')).toBeInTheDocument();
    expect(container.querySelector('form')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Afficher les coordonnées' })).not.toBeInTheDocument();
  });

  it.each([
    ['ineligible heat network', false, 'network-manager'],
    ['previous refusal', true, 'public-advisor'],
  ] as const)('directs %s to France Rénov without CCRT coverage', (_, isHeatNetworkEligible, selectedRecipientId) => {
    const { container } = render(
      <DemandFCRForm
        alternativeHeatingSolutionLabels={[]}
        eligibiliteReseauChaleur={isHeatNetworkEligible ? eligibleHeatNetwork : null}
        isCcrtDemandEligible={false}
        isHeatNetworkEligible={isHeatNetworkEligible}
        selectedRecipientId={selectedRecipientId}
        onSelectedRecipientChange={vi.fn()}
        simulationId={simulationId}
        topSolution="Réseau de chaleur"
      />
    );

    expect(container.querySelector('#help-ademe')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Afficher les coordonnées' })).toBeInTheDocument();
    expect(container.querySelector('form')).toBeNull();
  });

  it('shows France Rénov without confirming success when coverage disappears before submission', async () => {
    submitDemand.mockResolvedValueOnce({ demandSubmissionResult: null, id: null });
    const { container } = render(
      <DemandFCRForm
        alternativeHeatingSolutionLabels={[]}
        eligibiliteReseauChaleur={null}
        isCcrtDemandEligible
        isHeatNetworkEligible={false}
        selectedRecipientId="public-advisor"
        onSelectedRecipientChange={vi.fn()}
        simulationId={simulationId}
        topSolution="PAC géothermique"
      />
    );

    fireEvent.change(screen.getByRole('textbox', { name: /^Nom/ }), { target: { value: 'Test' } });
    fireEvent.change(screen.getByRole('textbox', { name: /^Prénom/ }), { target: { value: 'Claire' } });
    fireEvent.change(screen.getByRole('textbox', { name: /^Email/ }), { target: { value: 'claire@example.com' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /J’accepte/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Afficher les coordonnées' })).toBeInTheDocument());
    expect(submitDemand).toHaveBeenCalledTimes(1);
    expect(container.querySelector('form')).toBeNull();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps the classic connection form available without CCRT coverage', () => {
    const { container } = render(
      <DemandFCRForm
        alternativeHeatingSolutionLabels={[]}
        eligibiliteReseauChaleur={eligibleHeatNetwork}
        isCcrtDemandEligible={false}
        isHeatNetworkEligible
        selectedRecipientId="network-manager"
        onSelectedRecipientChange={vi.fn()}
        simulationId={simulationId}
        topSolution="Réseau de chaleur"
      />
    );

    expect(screen.getByText('Faites-vous recontacter par le gestionnaire de réseau')).toBeInTheDocument();
    expect(container.querySelector('form')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Afficher les coordonnées' })).not.toBeInTheDocument();
  });

  it('keeps the contact recipient selector visible when the public advisor path redirects to France Rénov', () => {
    render(
      <DemandFCRForm
        alternativeHeatingSolutionLabels={[]}
        eligibiliteReseauChaleur={eligibleHeatNetwork}
        isCcrtDemandEligible={false}
        isHeatNetworkEligible
        selectedRecipientId="public-advisor"
        onSelectedRecipientChange={vi.fn()}
        simulationId={simulationId}
        topSolution="Réseau de chaleur"
      />
    );

    expect(screen.getByText('Je n’ai pas encore contacté le gestionnaire')).toBeInTheDocument();
    expect(screen.getByText('J’ai déjà reçu un refus ou une réponse négative')).toBeInTheDocument();
    expect(screen.getByText('Échangez avec un·e conseiller·ère neutre et gratuit·e du service public')).toBeInTheDocument();
  });
});

describe('DemandFCRForm simulation outcome', () => {
  const fillAndSubmit = () => {
    fireEvent.change(screen.getByRole('textbox', { name: /^Nom/ }), { target: { value: 'Test' } });
    fireEvent.change(screen.getByRole('textbox', { name: /^Prénom/ }), { target: { value: 'Claire' } });
    fireEvent.change(screen.getByRole('textbox', { name: /^Email/ }), { target: { value: 'claire@example.com' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /J’accepte/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer' }));
  };

  const submittedDemand = {
    address: '',
    createdAt: '',
    distance: null,
    email: '',
    id: 'demand-1',
    isEligible: true,
    networkName: null,
    status: '',
  };

  it.each([
    [
      'a created classic demand → heat network demand',
      { demandSubmissionResult: { ...submittedDemand, isExisting: false }, id: null },
      { demandId: 'demand-1', outcome: 'heat_network_demand' },
    ],
    ['a deduplicated classic demand → nothing', { demandSubmissionResult: { ...submittedDemand, isExisting: true }, id: null }, null],
    ['a created CCRT demand → CCRT demand', { demandSubmissionResult: null, id: 'ccrt-1' }, { demandId: 'ccrt-1', outcome: 'ccrt_demand' }],
    ['no demand created → nothing', { demandSubmissionResult: null, id: null }, null],
  ] as const)('records %s', async (_, result, expectedOutcome) => {
    recordOutcome.mockClear();
    submitDemand.mockResolvedValueOnce(result);
    render(
      <DemandFCRForm
        alternativeHeatingSolutionLabels={[]}
        eligibiliteReseauChaleur={eligibleHeatNetwork}
        isCcrtDemandEligible
        isHeatNetworkEligible
        selectedRecipientId="network-manager"
        onSelectedRecipientChange={vi.fn()}
        simulationId={simulationId}
        topSolution="Réseau de chaleur"
      />
    );
    fillAndSubmit();

    await waitFor(() => expect(submitDemand).toHaveBeenCalledTimes(1));
    if (expectedOutcome) {
      await waitFor(() => expect(recordOutcome).toHaveBeenCalledExactlyOnceWith({ ...expectedOutcome, id: simulationId }));
    } else {
      expect(recordOutcome).not.toHaveBeenCalled();
    }
  });

  it('records the France Rénov orientation when the appointment link is clicked', () => {
    recordOutcome.mockClear();
    render(
      <DemandFCRForm
        alternativeHeatingSolutionLabels={[]}
        eligibiliteReseauChaleur={null}
        isCcrtDemandEligible={false}
        isHeatNetworkEligible={false}
        selectedRecipientId="network-manager"
        onSelectedRecipientChange={vi.fn()}
        simulationId={simulationId}
        topSolution="PAC géothermique"
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Afficher les coordonnées' }));
    expect(recordOutcome).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('link', { name: /Prendre rendez-vous/ }));

    expect(recordOutcome).toHaveBeenCalledExactlyOnceWith({ id: simulationId, outcome: 'france_renov_orientation' });
  });
});
