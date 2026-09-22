import { describe, expect, it } from 'vitest';

import { EMPTY_BAT_ENR_INFO } from '@/modules/chaleur-renouvelable/bat-enr';
import { DEFAULT_SIMULATION_PARAMS } from '@/modules/chaleur-renouvelable/constants';

import { buildSimulationSituation } from './simulation-situation';

describe('buildSimulationSituation', () => {
  it('builds the simulation situation from query params and BatEnR context', () => {
    const situation = buildSimulationSituation({
      altitude: 1200,
      batEnr: {
        ...EMPTY_BAT_ENR_INFO,
        architecturalProtectionAc1: true,
        geothermalNappePotential: 7,
        geothermiePossible: true,
      },
      eligibiliteReseauChaleur: null,
      eligibiliteReseauFroid: null,
      params: {
        ...DEFAULT_SIMULATION_PARAMS,
        adresse: '1 rue de la Paix, Paris',
        constructionId: null,
        dpe: 'D',
        habitantsMoyen: '3',
        modeEauChaudeSanitaire: null,
        nbLogements: null,
        originDemandId: null,
        surfaceMoyenne: null,
        typeRadiateur: null,
      },
    });

    expect(situation).toStrictEqual({
      adresse: '1 rue de la Paix, Paris',
      altitude: 1200,
      architecturalProtectionAc1: true,
      architecturalProtectionAc2: false,
      architecturalProtectionAc3: false,
      architecturalProtectionAc4: false,
      architecturalProtectionAc4bis: false,
      dpe: 'D',
      eligibiliteReseauChaleur: null,
      eligibiliteReseauFroid: null,
      espaceExterieur: DEFAULT_SIMULATION_PARAMS.espaceExterieur,
      geothermalNappeGmi: null,
      geothermalNappePotential: 7,
      geothermalSondeGmi: null,
      geothermiePossible: true,
      habitantsMoyen: 3,
      hasAlreadyReceivedHeatNetworkRefusal: false,
      hasGeothermalProbeSpace: null,
      modeEauChaudeSanitaire: null,
      nbLogements: DEFAULT_SIMULATION_PARAMS.nbLogements,
      planProtectionAtmosphere: false,
      solarThermalCoverage: null,
      surfaceMoyenne: DEFAULT_SIMULATION_PARAMS.surfaceMoyenne,
      typeRadiateur: null,
    });
  });

  it('marks a heat network refusal when the result URL comes from an origin demand', () => {
    const situation = buildSimulationSituation({
      altitude: null,
      batEnr: EMPTY_BAT_ENR_INFO,
      eligibiliteReseauChaleur: null,
      eligibiliteReseauFroid: null,
      params: {
        ...DEFAULT_SIMULATION_PARAMS,
        adresse: null,
        constructionId: null,
        dpe: 'D',
        habitantsMoyen: null,
        modeEauChaudeSanitaire: null,
        nbLogements: null,
        originDemandId: '96184961-d283-456d-af10-c8f9c9415499',
        surfaceMoyenne: null,
        typeRadiateur: null,
      },
    });

    expect(situation.hasAlreadyReceivedHeatNetworkRefusal).toStrictEqual(true);
  });
});
