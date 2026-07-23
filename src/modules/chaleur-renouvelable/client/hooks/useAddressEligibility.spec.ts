import { describe, expect, it } from 'vitest';

import type { BANAddressFeature } from '@/modules/ban/types';

import { getBANAddressFeatureByLabel } from './useAddressEligibility';

const makeFeature = (label: string, type: BANAddressFeature['properties']['type'] = 'housenumber'): BANAddressFeature => ({
  geometry: { coordinates: [2.35, 48.85], type: 'Point' },
  properties: {
    city: 'Paris',
    citycode: '75101',
    context: '75, Paris, Île-de-France',
    housenumber: '1',
    id: '75101_1234',
    importance: 0.7,
    label,
    name: label,
    postcode: '75001',
    score: 0.9,
    street: 'rue de Paris',
    type,
    x: 2.35,
    y: 48.85,
  },
  type: 'Feature',
});

describe('getBANAddressFeatureByLabel', () => {
  it('returns the feature with the exact BAN label', () => {
    const matchingFeature = makeFeature('1 rue de la Paix 75002 Paris');
    const otherFeature = makeFeature('1 rue de Paris 75001 Paris');

    expect(getBANAddressFeatureByLabel([otherFeature, matchingFeature], '1 rue de la Paix 75002 Paris')).toStrictEqual(matchingFeature);
  });

  it('does not fallback to the first BAN result when the saved label does not match', () => {
    const feature = makeFeature('1 rue de Paris 75001 Paris');

    expect(getBANAddressFeatureByLabel([feature], 'Adresse sauvegardée obsolète')).toStrictEqual(undefined);
  });

  it('ignores street results even when the BAN label matches exactly', () => {
    const feature = makeFeature('Rue d’Ernée 35500 Vitré', 'street');

    expect(getBANAddressFeatureByLabel([feature], 'Rue d’Ernée 35500 Vitré')).toStrictEqual(undefined);
  });
});
