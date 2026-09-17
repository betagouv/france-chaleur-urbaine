import { render, screen } from '@testing-library/react';
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
    expect(screen.getByText('Échangez avec un conseiller neutre et gratuit du service public')).toBeInTheDocument();
  });
});
