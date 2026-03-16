import { describe, expect, it } from 'vitest';

import { getIframePreset } from './iframe-presets';

describe('getIframePreset', () => {
  it('returns the expected preset for a known gestionnaire', () => {
    expect(getIframePreset('engie')).toMatchObject({
      defaultMapConfiguration: {
        filtreGestionnaire: ['engie'],
      },
      legendLogoOpt: {
        alt: 'logo ENGIE',
      },
    });
  });

  it('is case insensitive', () => {
    expect(getIframePreset('DaLkIa')).toMatchObject({
      defaultMapConfiguration: {
        filtreGestionnaire: ['dalkia'],
      },
    });
  });

  it('returns undefined for an unknown gestionnaire', () => {
    expect(getIframePreset('unknown')).toBeUndefined();
  });
});
