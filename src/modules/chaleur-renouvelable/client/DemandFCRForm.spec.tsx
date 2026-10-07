import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { HeatNetwork } from '@/types/HeatNetworksResponse';

import DemandFCRForm from './DemandFCRForm';

const demandCollection = vi.hoisted(() => ({ isEnabled: true }));

vi.mock('@/modules/chaleur-renouvelable/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/modules/chaleur-renouvelable/constants')>()),
  get IS_CCRT_DEMAND_ENABLED() {
    return demandCollection.isEnabled;
  },
}));

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

vi.mock('@/modules/trpc/client', () => ({
  default: {
    batEnr: {
      createDemandeChaleurRenouvelable: {
        useMutation: () => ({
          mutateAsync: vi.fn(),
        }),
      },
      getFranceRenovSpace: {
        useQuery: () => ({
          data: null,
          isLoading: false,
        }),
      },
    },
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
  beforeEach(() => {
    demandCollection.isEnabled = true;
  });

  it.each([
    ['CCRT experimentation', false, true, 'public-advisor'],
    ['previous refusal', true, true, 'public-advisor'],
    ['outside experimentation', false, false, 'network-manager'],
  ] as const)(
    'directs %s to France Rénov when collection is suspended',
    (_, isHeatNetworkEligible, isCcrtExperimentationBuildingEligible, selectedRecipientId) => {
      demandCollection.isEnabled = false;

      const { container } = render(
        <DemandFCRForm
          alternativeHeatingSolutionLabels={[]}
          eligibiliteReseauChaleur={isHeatNetworkEligible ? eligibleHeatNetwork : null}
          isCcrtExperimentationBuildingEligible={isCcrtExperimentationBuildingEligible}
          isHeatNetworkEligible={isHeatNetworkEligible}
          selectedRecipientId={selectedRecipientId}
          onSelectedRecipientChange={vi.fn()}
          topSolution="Réseau de chaleur"
        />
      );

      expect(container.querySelector('#help-ademe')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Afficher les coordonnées' })).toBeInTheDocument();
      expect(container.querySelector('form')).toBeNull();
    }
  );

  it('keeps the classic connection form available when CCRT collection is suspended', () => {
    demandCollection.isEnabled = false;

    const { container } = render(
      <DemandFCRForm
        alternativeHeatingSolutionLabels={[]}
        eligibiliteReseauChaleur={eligibleHeatNetwork}
        isCcrtExperimentationBuildingEligible
        isHeatNetworkEligible
        selectedRecipientId="network-manager"
        onSelectedRecipientChange={vi.fn()}
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
        isCcrtExperimentationBuildingEligible={false}
        isHeatNetworkEligible
        selectedRecipientId="public-advisor"
        onSelectedRecipientChange={vi.fn()}
        topSolution="Réseau de chaleur"
      />
    );

    expect(screen.getByText('Je n’ai pas encore contacté le gestionnaire')).toBeInTheDocument();
    expect(screen.getByText('J’ai déjà reçu un refus ou une réponse négative')).toBeInTheDocument();
    expect(screen.getByText('Échangez avec un·e conseiller·ère neutre et gratuit·e du service public')).toBeInTheDocument();
  });
});
