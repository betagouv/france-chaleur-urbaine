import { beforeAll, describe, expect, it } from 'vitest';

import { cleanDatabase, getTestPointCoordinates, seedEligibilityTestsData } from '@/tests/fixtures';
import { eligibilityScenarios } from '@/tests/fixtures/eligibility';
import { createTestCaller } from '@/tests/trpc-helpers';

/**
 * Tests d'intégration pour l'endpoint trpc.reseaux.eligibilityStatus.
 * Les scénarios attendus sont la source de vérité partagée `eligibilityScenarios`.
 * Pour modifier les données de test, exécutez la commande :
 * > pnpm cli test export-eligibility-fixtures
 */
describe('reseauxRouter.eligibilityStatus', () => {
  beforeAll(async () => {
    await cleanDatabase();
    await seedEligibilityTestsData();
  });

  describe("Scénarios d'éligibilité", () => {
    const scenarios = eligibilityScenarios.map((scenario) => ({ ...scenario, label: scenario.name ?? scenario.type }));

    it.each(scenarios)('$label', async ({ label, heatNetwork }) => {
      const result = await createTestCaller(null).reseaux.eligibilityStatus(getTestPointCoordinates(label));
      expect(result).toStrictEqual(heatNetwork);
    });
  });
});
