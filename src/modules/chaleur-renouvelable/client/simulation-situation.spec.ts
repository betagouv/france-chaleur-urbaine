import { describe, expect, it } from 'vitest';

import { EMPTY_BAT_ENR_INFO } from '@/modules/chaleur-renouvelable/bat-enr';
import { DEFAULT_SIMULATION_PARAMS } from '@/modules/chaleur-renouvelable/constants';

import { buildSimulationSituation } from './simulation-situation';

describe('buildSimulationSituation', () => {
  it('builds the simulation situation from query params and BatEnR context', () => {
    const situation = buildSimulationSituation({
      batEnr: {
        ...EMPTY_BAT_ENR_INFO,
        architecturalProtectionAc1: true,
        geothermalNappePotential: 7,
        geothermiePossible: true,
      },
      eligibiliteReseauChaleur: null,
      params: {
        ...DEFAULT_SIMULATION_PARAMS,
        adresse: '1 rue de la Paix, Paris',
        constructionId: null,
        dpe: 'D',
        habitantsMoyen: '3',
        modeEauChaudeSanitaire: null,
        nbLogements: null,
        surfaceMoyenne: null,
        typeRadiateur: null,
      },
    });

    expect(situation).toStrictEqual({
      adresse: '1 rue de la Paix, Paris',
      architecturalProtectionAc1: true,
      architecturalProtectionAc2: false,
      architecturalProtectionAc3: false,
      architecturalProtectionAc4: false,
      architecturalProtectionAc4bis: false,
      dpe: 'D',
      eligibiliteReseauChaleur: null,
      espaceExterieur: DEFAULT_SIMULATION_PARAMS.espaceExterieur,
      geothermalNappeGmi: null,
      geothermalNappePotential: 7,
      geothermalSondeGmi: null,
      geothermiePossible: true,
      habitantsMoyen: 3,
      hasGeothermalProbeSpace: null,
      modeEauChaudeSanitaire: null,
      nbLogements: DEFAULT_SIMULATION_PARAMS.nbLogements,
      planProtectionAtmosphere: false,
      solarThermalCoverage: null,
      surfaceMoyenne: DEFAULT_SIMULATION_PARAMS.surfaceMoyenne,
      typeRadiateur: null,
    });
  });
});
