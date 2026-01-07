import { beforeEach, describe, expect, it } from 'vitest';

import { cleanDatabase, NETWORK_TEST_COORDS, seedNetworksForEligibilityTests } from '@/tests/fixtures';
import type { TestCase } from '@/tests/trpc-helpers';
import { createTestCaller } from '@/tests/trpc-helpers';
import type { HeatNetwork } from '@/types/HeatNetworksResponse';

/**
 * Tests d'intégration pour l'endpoint trpc.reseaux.eligibilityStatus
 *
 * Cet endpoint vérifie l'éligibilité d'une adresse (coordonnées lat/lon) à un réseau de chaleur.
 * Il examine plusieurs critères dans l'ordre de priorité :
 * 1. Réseau existant très proche (< 100m ou 60m pour Paris)
 * 2. Réseau futur très proche (< 100m ou 60m pour Paris)
 * 3. Dans une zone de futur réseau
 * 4. Réseau existant proche (100-200m ou 60-100m pour Paris)
 * 5. Réseau futur proche (100-200m ou 60-100m pour Paris)
 * 6. Réseau existant loin (200-1000m)
 * 7. Réseau futur loin (200-1000m)
 * 8. Réseau sans tracé dans la ville
 * 9. Pas de réseau à proximité
 */

type EligibilityInput = {
  city: string;
  lat: number;
  lon: number;
};

describe('reseauxRouter.eligibilityStatus', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedNetworksForEligibilityTests();
  });

  describe('Permissions', () => {
    it('autorise les utilisateurs non authentifiés (route publique)', async () => {
      const result = await createTestCaller(null).reseaux.eligibilityStatus(NETWORK_TEST_COORDS.testPoint);

      expect(result).toStrictEqual({
        co2: 50,
        distance: expect.any(Number),
        futurNetwork: false,
        gestionnaire: 'CPCU',
        hasNoTraceNetwork: null,
        hasPDP: false,
        id: '7501C',
        inPDP: true,
        isClasse: true,
        isEligible: true,
        name: 'CPCU',
        tauxENRR: 65,
        veryEligibleDistance: 60,
      });
    });
  });

  describe("Scénarios d'éligibilité", () => {
    const eligibilityTestCases: TestCase<EligibilityInput, Partial<HeatNetwork>>[] = [
      {
        expectedOutput: {
          co2: 50,
          distance: expect.any(Number),
          futurNetwork: false,
          gestionnaire: 'CPCU',
          hasNoTraceNetwork: null,
          hasPDP: false,
          id: '7501C',
          inPDP: true,
          isClasse: true,
          isEligible: true,
          name: 'CPCU',
          tauxENRR: 65,
          veryEligibleDistance: 60,
        },
        input: NETWORK_TEST_COORDS.testPoint,
        label: 'retourne éligible pour un réseau existant très proche (< 60m)',
      },
      {
        expectedOutput: {
          co2: 60,
          distance: expect.any(Number),
          futurNetwork: false,
          gestionnaire: 'Test Gestionnaire Loin',
          hasNoTraceNetwork: null,
          hasPDP: false,
          id: '7503C',
          inPDP: false,
          isClasse: false,
          isEligible: expect.any(Boolean),
          name: 'Réseau Loin',
          tauxENRR: 45,
          veryEligibleDistance: 100,
        },
        input: { city: 'Paris', lat: 48.861, lon: 2.357 },
        label: 'retourne les informations même pour réseaux lointains (200-1000m)',
      },
      {
        expectedOutput: {
          co2: null,
          distance: expect.any(Number),
          futurNetwork: true,
          gestionnaire: null,
          hasNoTraceNetwork: null,
          hasPDP: null,
          id: null,
          inPDP: false,
          isClasse: null,
          isEligible: expect.any(Boolean),
          name: null,
          tauxENRR: null,
          veryEligibleDistance: 100,
        },
        input: { city: 'Paris', lat: 48.88, lon: 2.38 },
        label: 'gère le cas du réseau sans tracé (point éloigné - réseau futur retourné)',
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
        input: { city: 'Unknown', lat: 48.9, lon: 2.5 },
        label: 'retourne non éligible quand aucun réseau à proximité',
      },
      {
        expectedOutput: {
          co2: 50,
          distance: expect.any(Number),
          futurNetwork: false,
          gestionnaire: 'CPCU',
          hasNoTraceNetwork: null,
          hasPDP: false,
          id: '7501C',
          inPDP: true,
          isClasse: true,
          isEligible: true,
          name: 'CPCU',
          tauxENRR: 65,
          veryEligibleDistance: 60,
        },
        input: NETWORK_TEST_COORDS.testPoint,
        label: 'priorise le réseau existant très proche sur le réseau futur',
      },
      {
        expectedOutput: {
          co2: 50,
          distance: expect.any(Number),
          futurNetwork: false,
          gestionnaire: 'CPCU',
          hasNoTraceNetwork: null,
          hasPDP: false,
          id: '7501C',
          inPDP: true,
          isClasse: true,
          isEligible: true,
          name: 'CPCU',
          tauxENRR: 65,
          veryEligibleDistance: 60,
        },
        input: NETWORK_TEST_COORDS.testPoint,
        label: 'vérifie la présence du PDP (périmètre de développement prioritaire)',
      },
    ];

    it.each(eligibilityTestCases)('$label', async ({ input, expectedOutput }) => {
      const result = await createTestCaller(null).reseaux.eligibilityStatus(input);

      expect(result).toStrictEqual(expectedOutput);

      // Additional assertions for specific cases
      if (input === NETWORK_TEST_COORDS.testPoint && expectedOutput.distance !== null) {
        expect(result.distance).toBeLessThan(60);
      }
    });
  });

  describe('Cas limites', () => {
    const edgeCaseTestCases: TestCase<EligibilityInput, HeatNetwork>[] = [
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
        input: { city: 'Unknown', lat: 0, lon: 0 },
        label: 'gère les coordonnées invalides (hors France)',
      },
      {
        expectedOutput: {
          co2: 50,
          distance: expect.any(Number),
          futurNetwork: false,
          gestionnaire: 'CPCU',
          hasNoTraceNetwork: null,
          hasPDP: false,
          id: '7501C',
          inPDP: true,
          isClasse: true,
          isEligible: true,
          name: 'CPCU',
          tauxENRR: 65,
          veryEligibleDistance: 60,
        },
        input: { city: 'VilleInconnue', lat: 48.8566, lon: 2.3522 },
        label: 'gère une ville sans réseau référencé (trouve par coordonnées)',
      },
    ];

    it.each(edgeCaseTestCases)('$label', async ({ input, expectedOutput }) => {
      const result = await createTestCaller(null).reseaux.eligibilityStatus(input);

      expect(result).toStrictEqual(expectedOutput);
    });
  });
});
