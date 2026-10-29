import { describe, expect, it } from 'vitest';

import type { BANAddressFeature } from '@/modules/ban/types';
import type { TestCase } from '@/tests/trpc-helpers';

import {
  buildComparatorResultUrl,
  heatingTypeToTypeLogement,
  parseHeatingParam,
  typeLogementToHeatingType,
  zHomeComparatorForm,
  zHomeEligibilityForm,
} from './home-form';

const geoAddress = {
  geometry: { coordinates: [2.3522, 48.8566], type: 'Point' },
  properties: { city: 'Paris', citycode: '75115', id: '75115_5456_00014', label: '14 Rue Lecourbe 75015 Paris', type: 'housenumber' },
  type: 'Feature',
} as BANAddressFeature;

describe('parseHeatingParam', () => {
  const cases: TestCase<string | null, ReturnType<typeof parseHeatingParam>>[] = [
    { expectedOutput: 'collectif', input: 'collectif', label: 'collectif' },
    { expectedOutput: 'individuel', input: 'individuel', label: 'individuel' },
    { expectedOutput: undefined, input: 'autre', label: 'valeur inconnue → ignorée' },
    { expectedOutput: undefined, input: null, label: 'absent → ignoré' },
  ];
  it.each(cases)('$label', ({ input, expectedOutput }) => {
    expect(parseHeatingParam(input)).toStrictEqual(expectedOutput);
  });
});

describe('heatingTypeToTypeLogement', () => {
  const cases: TestCase<Parameters<typeof heatingTypeToTypeLogement>[0], ReturnType<typeof heatingTypeToTypeLogement>>[] = [
    { expectedOutput: 'immeuble_chauffage_collectif', input: 'collectif', label: 'collectif → immeuble en chauffage collectif' },
    { expectedOutput: 'immeuble_chauffage_individuel', input: 'individuel', label: 'individuel → immeuble en chauffage individuel' },
    { expectedOutput: '', input: undefined, label: 'inconnu → champ vide' },
  ];
  it.each(cases)('$label', ({ input, expectedOutput }) => {
    expect(heatingTypeToTypeLogement(input)).toStrictEqual(expectedOutput);
  });
});

describe('typeLogementToHeatingType', () => {
  const cases: TestCase<Parameters<typeof typeLogementToHeatingType>[0], ReturnType<typeof typeLogementToHeatingType>>[] = [
    { expectedOutput: 'collectif', input: 'immeuble_chauffage_collectif', label: 'immeuble collectif → collectif' },
    { expectedOutput: 'individuel', input: 'immeuble_chauffage_individuel', label: 'immeuble individuel → individuel' },
    { expectedOutput: 'individuel', input: 'maison_individuelle', label: 'maison individuelle → individuel' },
  ];
  it.each(cases)('$label', ({ input, expectedOutput }) => {
    expect(typeLogementToHeatingType(input)).toStrictEqual(expectedOutput);
  });
});

describe('zHomeEligibilityForm', () => {
  it('keeps only the eligibility fields', () => {
    const result = zHomeEligibilityForm.parse({
      espaceExterieur: 'none',
      geoAddress,
      typeLogement: 'immeuble_chauffage_collectif',
      typeRadiateur: '',
    });

    expect(result).toStrictEqual({ geoAddress, typeLogement: 'immeuble_chauffage_collectif' });
  });

  it('rejects a missing address and housing type', () => {
    const result = zHomeEligibilityForm.safeParse({ espaceExterieur: 'none', geoAddress: undefined, typeLogement: '', typeRadiateur: '' });

    expect(result.error?.issues.map((issue) => issue.path)).toStrictEqual([['geoAddress'], ['typeLogement']]);
  });
});

describe('zHomeComparatorForm', () => {
  it.each(['street', 'municipality', 'locality'] as const)('rejects a %s only in comparator mode', (type) => {
    const values = {
      espaceExterieur: 'none',
      geoAddress: { ...geoAddress, properties: { ...geoAddress.properties, type } },
      typeLogement: 'immeuble_chauffage_collectif',
      typeRadiateur: 'radiateur-eau',
    };

    expect(zHomeEligibilityForm.safeParse(values).success).toStrictEqual(true);
    expect(
      zHomeComparatorForm.safeParse(values).error?.issues.map((issue) => ({ message: issue.message, path: issue.path }))
    ).toStrictEqual([
      {
        message: 'Une adresse précise est nécessaire pour identifier votre bâtiment et proposer des solutions pertinentes',
        path: ['geoAddress'],
      },
    ]);
  });

  it('requires the radiator type', () => {
    const result = zHomeComparatorForm.safeParse({
      espaceExterieur: 'none',
      geoAddress,
      typeLogement: 'immeuble_chauffage_collectif',
      typeRadiateur: '',
    });

    expect(result.success).toStrictEqual(false);
    expect(result.error?.issues.map((issue) => issue.path)).toStrictEqual([['typeRadiateur']]);
  });
});

describe('buildComparatorResultUrl', () => {
  it('serializes the simulator parameters expected by the result page', () => {
    const url = buildComparatorResultUrl({
      espaceExterieur: 'terrasseBalcon',
      geoAddress,
      typeLogement: 'immeuble_chauffage_collectif',
      typeRadiateur: 'radiateur-eau',
    });

    expect(url).toStrictEqual(
      '/chaleur-renouvelable/resultat?adresse=14+Rue+Lecourbe+75015+Paris&espaceExterieur=terrasseBalcon&typeLogement=immeuble_chauffage_collectif&typeRadiateur=radiateur-eau'
    );
  });
});
