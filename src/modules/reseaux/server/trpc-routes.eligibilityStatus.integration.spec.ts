import { beforeAll, describe, expect, it } from 'vitest';

import type { Coords } from '@/modules/geo/types';
import type { EligibilityType } from '@/server/services/addresseInformation';
import { cleanDatabase, seedEligibilityTestsData } from '@/tests/fixtures';
import { eligibilityFixtures } from '@/tests/fixtures/eligibility';
import type { TestCase } from '@/tests/trpc-helpers';
import { createTestCaller } from '@/tests/trpc-helpers';
import type { HeatNetwork } from '@/types/HeatNetworksResponse';

/**
 * Tests d'intégration pour l'endpoint trpc.reseaux.eligibilityStatus.
 * Pour modifier les données de test, exécutez la commande :
 * > pnpm cli test export-eligibility-fixtures
 */
describe('reseauxRouter.eligibilityStatus', () => {
  beforeAll(async () => {
    await cleanDatabase();
    await seedEligibilityTestsData();
  });

  describe("Scénarios d'éligibilité", () => {
    const eligibilityTestCases: TestCase<Coords, HeatNetwork>[] = [
      {
        expectedOutput: {
          co2: null,
          distance: 215,
          futurNetwork: false,
          gestionnaire: 'Gestionnaire',
          hasNoTraceNetwork: null,
          hasPDP: true,
          id: '1301C',
          inPDP: true,
          isClasse: true,
          isEligible: true,
          name: 'Réseau de chaleur PDP',
          tauxENRR: null,
          veryEligibleDistance: 100,
        },
        input: getTestPointCoordinates('dans_pdp_reseau_existant'),
        label: 'dans_pdp_reseau_existant',
      },
      {
        expectedOutput: {
          co2: null,
          distance: 210,
          futurNetwork: true,
          gestionnaire: 'Gestionnaire',
          hasNoTraceNetwork: null,
          hasPDP: true,
          id: null,
          inPDP: true,
          isClasse: null,
          isEligible: true,
          name: 'Réseau en construction PDP',
          tauxENRR: null,
          veryEligibleDistance: 100,
        },
        input: getTestPointCoordinates('dans_pdp_reseau_futur'),
        label: 'dans_pdp_reseau_futur',
      },
      {
        expectedOutput: {
          co2: null,
          distance: 47,
          futurNetwork: false,
          gestionnaire: 'Gestionnaire',
          hasNoTraceNetwork: null,
          hasPDP: false,
          id: '1302C',
          inPDP: false,
          isClasse: false,
          isEligible: true,
          name: 'Réseau de chaleur',
          tauxENRR: null,
          veryEligibleDistance: 100,
        },
        input: getTestPointCoordinates('reseau_existant_tres_proche'),
        label: 'reseau_existant_tres_proche',
      },
      {
        expectedOutput: {
          co2: null,
          distance: 51,
          futurNetwork: true,
          gestionnaire: 'Gestionnaire',
          hasNoTraceNetwork: null,
          hasPDP: false,
          id: null,
          inPDP: false,
          isClasse: null,
          isEligible: true,
          name: 'Réseau en construction',
          tauxENRR: null,
          veryEligibleDistance: 100,
        },
        input: getTestPointCoordinates('reseau_futur_tres_proche'),
        label: 'reseau_futur_tres_proche',
      },
      {
        expectedOutput: {
          co2: null,
          distance: null,
          futurNetwork: true,
          gestionnaire: 'Gestionnaire',
          hasNoTraceNetwork: null,
          hasPDP: false,
          id: null,
          inPDP: false,
          isClasse: null,
          isEligible: true,
          name: 'Réseau en construction',
          tauxENRR: null,
          veryEligibleDistance: null,
        },
        input: getTestPointCoordinates('dans_zone_reseau_futur'),
        label: 'dans_zone_reseau_futur',
      },
      {
        expectedOutput: {
          co2: null,
          distance: 195,
          futurNetwork: false,
          gestionnaire: 'Gestionnaire',
          hasNoTraceNetwork: null,
          hasPDP: false,
          id: '1302C',
          inPDP: false,
          isClasse: false,
          isEligible: true,
          name: 'Réseau de chaleur',
          tauxENRR: null,
          veryEligibleDistance: 100,
        },
        input: getTestPointCoordinates('reseau_existant_proche'),
        label: 'reseau_existant_proche',
      },
      {
        expectedOutput: {
          co2: null,
          distance: 194,
          futurNetwork: true,
          gestionnaire: 'Gestionnaire',
          hasNoTraceNetwork: null,
          hasPDP: false,
          id: null,
          inPDP: false,
          isClasse: null,
          isEligible: true,
          name: 'Réseau en construction',
          tauxENRR: null,
          veryEligibleDistance: 100,
        },
        input: getTestPointCoordinates('reseau_futur_proche'),
        label: 'reseau_futur_proche',
      },
      {
        expectedOutput: {
          co2: null,
          distance: 759,
          futurNetwork: false,
          gestionnaire: 'Gestionnaire',
          hasNoTraceNetwork: null,
          hasPDP: false,
          id: '1302C',
          inPDP: false,
          isClasse: false,
          isEligible: false,
          name: 'Réseau de chaleur',
          tauxENRR: null,
          veryEligibleDistance: 100,
        },
        input: getTestPointCoordinates('reseau_existant_loin'),
        label: 'reseau_existant_loin',
      },
      {
        expectedOutput: {
          co2: null,
          distance: 956,
          futurNetwork: true,
          gestionnaire: 'Gestionnaire',
          hasNoTraceNetwork: null,
          hasPDP: false,
          id: null,
          inPDP: false,
          isClasse: null,
          isEligible: false,
          name: 'Réseau en construction',
          tauxENRR: null,
          veryEligibleDistance: 100,
        },
        input: getTestPointCoordinates('reseau_futur_loin'),
        label: 'reseau_futur_loin',
      },
      {
        expectedOutput: {
          co2: null,
          distance: null,
          futurNetwork: false,
          gestionnaire: null,
          hasNoTraceNetwork: true,
          hasPDP: false,
          id: '1303C',
          inPDP: false,
          isClasse: null,
          isEligible: false,
          name: null,
          tauxENRR: null,
          veryEligibleDistance: null,
        },
        input: getTestPointCoordinates('dans_ville_reseau_existant_sans_trace'),
        label: 'dans_ville_reseau_existant_sans_trace',
      },
      {
        expectedOutput: {
          co2: null,
          distance: null,
          futurNetwork: false,
          gestionnaire: null,
          hasNoTraceNetwork: false,
          hasPDP: null,
          id: null,
          inPDP: false,
          isClasse: null,
          isEligible: false,
          name: null,
          tauxENRR: null,
          veryEligibleDistance: null,
        },
        input: getTestPointCoordinates('trop_eloigne'),
        label: 'trop_eloigne',
      },
    ];

    it.each(eligibilityTestCases)('$label', async ({ input, expectedOutput }) => {
      const result = await createTestCaller(null).reseaux.eligibilityStatus(input);

      expect(result).toStrictEqual(expectedOutput);
    });
  });
});

/**
 * Helper pour extraire les coordonnées d'un point de test depuis les fixtures
 */
function getTestPointCoordinates(expectedEligibilityType: EligibilityType): { lat: number; lon: number } {
  const testPoint = eligibilityFixtures.features.find(
    (f) => f.properties.type === 'test' && f.properties.expectedEligibilityType === expectedEligibilityType
  );
  if (!testPoint || testPoint.geometry.type !== 'Point') {
    throw new Error(`Point de test non trouvé pour ${expectedEligibilityType}`);
  }
  const [lon, lat] = testPoint.geometry.coordinates;
  return { lat, lon };
}
