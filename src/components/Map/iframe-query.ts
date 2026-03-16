import type { ParsedUrlQuery } from 'node:querystring';

import type { MapConfiguration } from '@/components/Map/map-configuration';
import { legendURLKeyToLegendFeature, type MapLegendFeature, mapLegendFeatures } from '@/components/Map/map-layers';
import { deepMergeObjects } from '@/utils/core';
import type { DeepPartial } from '@/utils/typescript';

export type IframeMapQueryState = {
  enabledLegendFeatures?: MapLegendFeature[];
  initialMapConfiguration: DeepPartial<MapConfiguration>;
  withLegend?: boolean;
};

const truthyValues = new Set(['1', 'true', 'yes']);
const falsyValues = new Set(['0', 'false', 'no']);

const legendFeatureConfiguration: Record<MapLegendFeature, DeepPartial<MapConfiguration>> = {
  batimentsRaccordesReseauxChaleur: {
    batimentsRaccordesReseauxChaleur: true,
  },
  batimentsRaccordesReseauxFroid: {
    batimentsRaccordesReseauxFroid: true,
  },
  customGeojson: {
    customGeojson: true,
  },
  geomUpdate: {
    geomUpdate: true,
  },
  reseauxDeChaleur: {
    reseauxDeChaleur: {
      show: true,
    },
  },
  reseauxDeFroid: {
    reseauxDeFroid: true,
  },
  reseauxEnConstruction: {
    reseauxEnConstruction: true,
  },
  testsAdresses: {
    testsAdresses: true,
  },
  zonesDeDeveloppementPrioritaire: {
    zonesDeDeveloppementPrioritaire: true,
  },
};

const getQueryValue = (value: string | string[] | undefined): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

const getQueryList = (value: string | string[] | undefined): string[] => {
  if (!value) {
    return [];
  }

  const values = Array.isArray(value) ? value : [value];

  return values
    .flatMap((entry) => entry.split(','))
    .map((entry) => decodeURIComponent(entry).trim())
    .filter(Boolean);
};

const parseBoolean = (value: string | string[] | undefined): boolean | undefined => {
  const normalizedValue = getQueryValue(value)?.trim().toLowerCase();

  if (!normalizedValue) {
    return undefined;
  }

  if (truthyValues.has(normalizedValue)) {
    return true;
  }

  if (falsyValues.has(normalizedValue)) {
    return false;
  }

  return undefined;
};

const parseLegendFeatures = (value: string | string[] | undefined): MapLegendFeature[] | undefined => {
  const rawFeatures = getQueryList(value);

  if (rawFeatures.length === 0) {
    return undefined;
  }

  const features = rawFeatures.flatMap((rawFeature) => {
    if (mapLegendFeatures.includes(rawFeature as MapLegendFeature)) {
      return [rawFeature as MapLegendFeature];
    }

    const mappedFeature = legendURLKeyToLegendFeature[rawFeature];
    return mappedFeature ? [mappedFeature] : [];
  });

  return [...new Set(features)];
};

export const getIframeMapQueryState = (query: ParsedUrlQuery): IframeMapQueryState => {
  const initialMapConfiguration: DeepPartial<MapConfiguration> = {};
  const filtreGestionnaire = getQueryList(query.filtreGestionnaire);
  const filtreIdentifiantReseau = getQueryList(query.filtreIdentifiantReseau);
  const enabledLegendFeatures = parseLegendFeatures(query.displayLegend);
  const withLegend = parseBoolean(query.legend);

  if (filtreGestionnaire.length > 0) {
    initialMapConfiguration.filtreGestionnaire = filtreGestionnaire;
  }

  if (filtreIdentifiantReseau.length > 0) {
    initialMapConfiguration.filtreIdentifiantReseau = filtreIdentifiantReseau;
  }

  enabledLegendFeatures?.forEach((feature) => {
    Object.assign(initialMapConfiguration, deepMergeObjects(initialMapConfiguration, legendFeatureConfiguration[feature]));
  });

  return {
    enabledLegendFeatures,
    initialMapConfiguration,
    withLegend,
  };
};
