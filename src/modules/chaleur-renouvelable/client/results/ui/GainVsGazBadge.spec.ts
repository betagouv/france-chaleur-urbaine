import { describe, expect, it } from 'vitest';

import type { ModeDeChauffageEnriched } from '@/modules/chaleur-renouvelable/client/modesChauffageData';
import { getGainPercentVsGaz } from '@/modules/chaleur-renouvelable/client/results/ui/GainVsGazBadge';

const SOLAR_THERMAL_HOT_WATER_MODE = {
  avantages: [],
  classement: 2,
  coutInstallation: '790 € à 1 186 €',
  coutParAn: 10_000,
  description: 'Solaire thermique',
  estPossible: () => true,
  gainClasse: 1,
  icone: 'img/icon-solaire.webp',
  id: 'collective-solar-thermal-hot-water',
  inconvenients: [],
  label: 'Solaire thermique',
  pertinence: 2,
  prerequis: () => [],
  publicodeKey: 'solaire thermique',
  rafraichissementPossible: false,
  usage: 'hotWaterOnly',
} satisfies ModeDeChauffageEnriched;

describe('getGainPercentVsGaz', () => {
  it('utilise le pourcentage forcé quand il est défini', () => {
    expect(getGainPercentVsGaz({ ...SOLAR_THERMAL_HOT_WATER_MODE, gainVsGaz: -50 }, 1_000, 200)).toStrictEqual(-50);
  });

  it('calcule le pourcentage depuis le coût ECS gaz sans pourcentage forcé', () => {
    expect(getGainPercentVsGaz({ ...SOLAR_THERMAL_HOT_WATER_MODE, coutParAn: 300 }, 1_000, 200)).toStrictEqual(50);
  });
});
