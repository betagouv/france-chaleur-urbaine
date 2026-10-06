import { createRequire } from 'node:module';

import Engine from 'publicodes';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/simulator/client/SimulateurCoutRaccordement', () => ({
  getCoutRaccordementResidentiel: () => [1000, 2000],
  prettyPrintCout: (value: number) => `${value} €`,
}));

import { getHeatingModeCosts, setPublicodesSituation } from '@/modules/chaleur-renouvelable/client/heatingModeCosts';
import { getModesDeChauffage } from '@/modules/chaleur-renouvelable/client/modesChauffageData';
import type { Situation } from '@/modules/chaleur-renouvelable/constants';
import type { HeatNetwork } from '@/types/HeatNetworksResponse';

const require = createRequire(import.meta.url);
const rules = require('@betagouv/france-chaleur-urbaine-publicodes/publicodes-build/france-chaleur-urbaine-publicodes.model.json');
type RuleName = keyof typeof rules & string;
type HeatingModeCostEngine = Parameters<typeof setPublicodesSituation>[0];

const options = {
  logger: { error: () => {}, log: () => {}, warn: () => {} },
};

const PUBLICODES_TEST_TIMEOUT_MS = 20_000;

const createHeatNetwork = (): HeatNetwork => ({
  co2: null,
  distance: 100,
  futurNetwork: false,
  gestionnaire: null,
  hasNoTraceNetwork: false,
  hasPDP: false,
  id: null,
  inPDP: false,
  isClasse: false,
  isEligible: true,
  name: null,
  tauxENRR: null,
  veryEligibleDistance: 50,
});

const createSituation = (overrides: Partial<Situation> = {}): Situation => ({
  adresse: '1 rue de la Paix, Paris',
  altitude: 100,
  architecturalProtectionAc1: false,
  architecturalProtectionAc2: false,
  architecturalProtectionAc3: false,
  architecturalProtectionAc4: false,
  architecturalProtectionAc4bis: false,
  dpe: 'D',
  eligibiliteReseauChaleur: createHeatNetwork(),
  eligibiliteReseauFroid: null,
  espaceExterieur: 'terrasseBalconEtJardinCours',
  geothermalNappeGmi: 1,
  geothermalNappePotential: 7,
  geothermalSondeGmi: 1,
  geothermiePossible: true,
  habitantsMoyen: 2,
  hasAlreadyReceivedHeatNetworkRefusal: false,
  hasGeothermalProbeSpace: true,
  modeEauChaudeSanitaire: 'Collectif',
  nbLogements: 25,
  planProtectionAtmosphere: false,
  solarThermalCoverage: 90,
  surfaceMoyenne: 70,
  typeRadiateur: 'radiateur-eau',
  ...overrides,
});

const createTestEngine = (): HeatingModeCostEngine => {
  const internalEngine = new Engine<RuleName>(rules, options);

  return {
    getFieldAsNumber: (rule: RuleName) => Number(internalEngine.evaluate(rule).nodeValue ?? 0),
    getSituation: () => internalEngine.getSituation() as Record<RuleName, number | string>,
    internalEngine,
    resetField: (rule: RuleName) => {
      internalEngine.setSituation(Object.fromEntries(Object.entries(internalEngine.getSituation()).filter(([key]) => key !== rule)));
    },
    setSituation: (situationUpdate: Partial<Record<RuleName, any>>) => {
      internalEngine.setSituation(situationUpdate);
    },
  } as HeatingModeCostEngine;
};

describe('getHeatingModeCosts', () => {
  it(
    'enrichit le solaire thermique collectif au périmètre logement',
    () => {
      const engine = createTestEngine();
      const situation = createSituation();
      setPublicodesSituation(engine, { codeDepartement: '75', situation, temperatureRef: -5 });

      const result = getHeatingModeCosts(engine, getModesDeChauffage('immeuble_chauffage_collectif', situation), situation);
      const heatNetworkMode = result.modesEnriched.find((modeDeChauffage) => modeDeChauffage.id === 'collective-heat-network');
      const solarThermalMode = result.modesEnriched.find((modeDeChauffage) => modeDeChauffage.id === 'collective-solar-thermal-hot-water');

      expect({
        heatNetwork: {
          coutInstallation: heatNetworkMode?.coutInstallation,
        },
        solarThermal: {
          coutInstallation: solarThermalMode?.coutInstallation,
          coutParAn: Math.round((solarThermalMode?.coutParAn ?? 0) * 100) / 100,
        },
      }).toStrictEqual({
        heatNetwork: {
          coutInstallation: '2 967 € à 4 451 €',
        },
        solarThermal: {
          coutInstallation: '790 € à 1 186 €',
          coutParAn: 68.01,
        },
      });
    },
    PUBLICODES_TEST_TIMEOUT_MS
  );

  it(
    'enrichit les solutions solaires de maison individuelle avec le contexte maison',
    () => {
      const engine = createTestEngine();
      const situation = createSituation({
        espaceExterieur: 'terrasseBalcon',
        modeEauChaudeSanitaire: 'Indépendant',
        surfaceMoyenne: 100,
      });
      setPublicodesSituation(engine, { codeDepartement: '69', situation, temperatureRef: -5 });

      const result = getHeatingModeCosts(engine, getModesDeChauffage('maison_individuelle', situation), situation);
      const airWaterHeatPumpMode = result.modesEnriched.find((modeDeChauffage) => modeDeChauffage.id === 'house-air-water-heat-pump');
      const solarThermalMode = result.modesEnriched.find((modeDeChauffage) => modeDeChauffage.id === 'house-solar-thermal-hot-water');
      const combinedSolarSystemMode = result.modesEnriched.find((modeDeChauffage) => modeDeChauffage.id === 'house-combined-solar-system');

      expect({
        airWaterHeatPump: {
          coutInstallation: airWaterHeatPumpMode?.coutInstallation,
        },
        combinedSolarSystem: {
          coutInstallation: combinedSolarSystemMode?.coutInstallation,
          coutParAn: Math.round((combinedSolarSystemMode?.coutParAn ?? 0) * 100) / 100,
        },
        solarThermal: {
          coutInstallation: solarThermalMode?.coutInstallation,
          coutParAn: Math.round((solarThermalMode?.coutParAn ?? 0) * 100) / 100,
        },
      }).toStrictEqual({
        airWaterHeatPump: {
          coutInstallation: '12 000 € à 15 000 €',
        },
        combinedSolarSystem: {
          coutInstallation: '20 400 € à 30 600 €',
          coutParAn: 1523.78,
        },
        solarThermal: {
          coutInstallation: '2 400 € à 3 600 €',
          coutParAn: 141.31,
        },
      });
    },
    PUBLICODES_TEST_TIMEOUT_MS
  );
});
