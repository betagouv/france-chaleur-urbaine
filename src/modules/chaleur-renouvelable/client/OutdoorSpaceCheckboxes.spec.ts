import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { getNextOutdoorSpaceValue, OutdoorSpaceCheckboxes } from './OutdoorSpaceCheckboxes';

describe('OutdoorSpaceCheckboxes', () => {
  it('never disables outdoor space checkboxes', () => {
    render(React.createElement(OutdoorSpaceCheckboxes, { onChange: () => undefined, value: null }));

    expect(screen.getByLabelText('Cour et/ou jardin')).not.toBeDisabled();
    expect(screen.getByLabelText('Terrasse et/ou balcon')).not.toBeDisabled();
  });
});

describe('getNextOutdoorSpaceValue', () => {
  it('returns a garden/courtyard outdoor space without requiring a housing type', () => {
    expect(
      getNextOutdoorSpaceValue({
        checkboxKey: 'garden',
        checked: true,
        hasGarden: false,
        hasTerrace: false,
      })
    ).toStrictEqual('jardinCours');
  });

  it('returns a terrace/balcony outdoor space', () => {
    expect(
      getNextOutdoorSpaceValue({
        checkboxKey: 'terrace',
        checked: true,
        hasGarden: false,
        hasTerrace: false,
      })
    ).toStrictEqual('terrasseBalcon');
  });

  it('combines garden/courtyard and terrace/balcony', () => {
    expect(
      getNextOutdoorSpaceValue({
        checkboxKey: 'terrace',
        checked: true,
        hasGarden: true,
        hasTerrace: false,
      })
    ).toStrictEqual('terrasseBalconEtJardinCours');
  });

  it('returns no outdoor space when the last checkbox is unchecked', () => {
    expect(
      getNextOutdoorSpaceValue({
        checkboxKey: 'garden',
        checked: false,
        hasGarden: true,
        hasTerrace: false,
      })
    ).toStrictEqual('none');
  });
});
