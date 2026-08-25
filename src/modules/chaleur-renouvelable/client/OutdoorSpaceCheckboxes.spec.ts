import { describe, expect, it } from 'vitest';

import { getNextOutdoorSpaceValue } from './OutdoorSpaceCheckboxes';

describe('getNextOutdoorSpaceValue', () => {
  it('returns a garden/courtyard outdoor space for houses', () => {
    expect(
      getNextOutdoorSpaceValue({
        checkboxKey: 'garden',
        checked: true,
        hasGarden: false,
        hasTerrace: false,
        typeLogement: 'maison_individuelle',
      })
    ).toStrictEqual('jardinCours');
  });

  it('returns a terrace/balcony outdoor space for houses', () => {
    expect(
      getNextOutdoorSpaceValue({
        checkboxKey: 'terrace',
        checked: true,
        hasGarden: false,
        hasTerrace: false,
        typeLogement: 'maison_individuelle',
      })
    ).toStrictEqual('terrasseBalcon');
  });

  it('combines garden/courtyard and terrace/balcony for houses', () => {
    expect(
      getNextOutdoorSpaceValue({
        checkboxKey: 'terrace',
        checked: true,
        hasGarden: true,
        hasTerrace: false,
        typeLogement: 'maison_individuelle',
      })
    ).toStrictEqual('terrasseBalconEtJardinCours');
  });

  it('returns no outdoor space when the last house checkbox is unchecked', () => {
    expect(
      getNextOutdoorSpaceValue({
        checkboxKey: 'garden',
        checked: false,
        hasGarden: true,
        hasTerrace: false,
        typeLogement: 'maison_individuelle',
      })
    ).toStrictEqual('none');
  });

  it('maps the single building checkbox to shared outdoor spaces for collective heating buildings', () => {
    expect(
      getNextOutdoorSpaceValue({
        checkboxKey: 'garden',
        checked: true,
        hasGarden: false,
        hasTerrace: false,
        typeLogement: 'immeuble_chauffage_collectif',
      })
    ).toStrictEqual('shared');
  });

  it('maps the single building checkbox to private outdoor spaces for individual heating buildings', () => {
    expect(
      getNextOutdoorSpaceValue({
        checkboxKey: 'garden',
        checked: true,
        hasGarden: false,
        hasTerrace: false,
        typeLogement: 'immeuble_chauffage_individuel',
      })
    ).toStrictEqual('private');
  });
});
