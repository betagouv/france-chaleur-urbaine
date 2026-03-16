import { describe, expect, it } from 'vitest';

import { getIframeMapQueryState } from './iframe-query';

describe('getIframeMapQueryState', () => {
  it('parses iframe filters from query params', () => {
    expect(
      getIframeMapQueryState({
        filtreGestionnaire: 'dalkia,engie',
        filtreIdentifiantReseau: ['id-1', 'id-2'],
      })
    ).toMatchObject({
      initialMapConfiguration: {
        filtreGestionnaire: ['dalkia', 'engie'],
        filtreIdentifiantReseau: ['id-1', 'id-2'],
      },
    });
  });

  it('maps displayLegend query params to legend features and layer visibility', () => {
    expect(
      getIframeMapQueryState({
        displayLegend: 'reseau_chaleur,futur_reseau,zonesDeDeveloppementPrioritaire',
      })
    ).toMatchObject({
      enabledLegendFeatures: ['reseauxDeChaleur', 'reseauxEnConstruction', 'zonesDeDeveloppementPrioritaire'],
      initialMapConfiguration: {
        reseauxDeChaleur: {
          show: true,
        },
        reseauxEnConstruction: true,
        zonesDeDeveloppementPrioritaire: true,
      },
    });
  });

  it('parses legend boolean values', () => {
    expect(
      getIframeMapQueryState({
        legend: 'false',
      })
    ).toMatchObject({
      withLegend: false,
    });

    expect(
      getIframeMapQueryState({
        legend: '1',
      })
    ).toMatchObject({
      withLegend: true,
    });
  });
});
