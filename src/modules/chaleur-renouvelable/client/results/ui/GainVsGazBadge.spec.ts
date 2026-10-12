import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { ModeDeChauffageEnriched } from '@/modules/chaleur-renouvelable/client/modesChauffageData';
import { GainVsGazBadge, getGainPercentVsGaz } from '@/modules/chaleur-renouvelable/client/results/ui/GainVsGazBadge';

import { SolutionConsumptionPanel } from './SolutionConsumptionPanel';

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
  it.each([
    [100, '-50 % vs gaz'],
    [300, '+50 % vs gaz'],
  ])('uses a neutral comparison label for an annual cost of %s', (coutParAn, expected) => {
    const props = { coutParAnGaz: 1_000, coutParAnGazHotWaterOnly: 200, item: { ...SOLAR_THERMAL_HOT_WATER_MODE, coutParAn } };
    const badge = renderToStaticMarkup(createElement(GainVsGazBadge, props));
    const panel = renderToStaticMarkup(createElement(SolutionConsumptionPanel, { ...props, dpeFrom: 'E' }));

    expect(badge).toContain(expected);
    expect(panel).toContain(expected);
    expect(badge).not.toContain('d’économies');
    expect(panel).not.toContain('d’économies');
  });

  it('utilise le pourcentage forcé quand il est défini', () => {
    expect(getGainPercentVsGaz({ ...SOLAR_THERMAL_HOT_WATER_MODE, gainVsGaz: -50 }, 1_000, 200)).toStrictEqual(-50);
  });

  it('calcule le pourcentage depuis le coût ECS gaz sans pourcentage forcé', () => {
    expect(getGainPercentVsGaz({ ...SOLAR_THERMAL_HOT_WATER_MODE, coutParAn: 300 }, 1_000, 200)).toStrictEqual(50);
  });
});
