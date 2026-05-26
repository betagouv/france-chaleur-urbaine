import { createSerializer } from 'nuqs';

import { clientConfig } from '@/client-config';
import type { BBox } from '@/modules/map/shared/types';

import { carteIframeParams, carteIframeUrlKeys, type LayerKey, type LegendMode, type SearchMode } from '../iframeCarteParams';

/** Editable state of the iframe generator form. */
export type IframeConfig = {
  center?: [number, number];
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  maxBounds?: BBox;
  gestionnaire: string[];
  reseaux: string[];
  layers: LayerKey[];
  legend: LegendMode;
  mode: SearchMode;
  /** Iframe tag dimensions (not URL params) — CSS sizes. Empty → the default is used. */
  width: string;
  height: string;
};

/** Defaults used when the size fields are left empty (also shown as their placeholder). */
export const DEFAULT_IFRAME_WIDTH = '100%';
export const DEFAULT_IFRAME_HEIGHT = '600px';

export const defaultIframeConfig: IframeConfig = {
  gestionnaire: [],
  height: '',
  layers: ['reseaux-de-chaleur'],
  legend: 'off',
  mode: 'none',
  reseaux: [],
  width: '',
};

const serializeCarteParams = createSerializer(carteIframeParams, { urlKeys: carteIframeUrlKeys });

/** Full `/iframe/carte` URL for the given config (defaults omitted → clean URL). */
export function buildIframeUrl(config: IframeConfig): string {
  const query = serializeCarteParams({
    center: config.center ?? null,
    gestionnaire: config.gestionnaire,
    layers: config.layers,
    legend: config.legend,
    maxBounds: config.maxBounds ?? null,
    maxZoom: config.maxZoom ?? null,
    minZoom: config.minZoom ?? null,
    mode: config.mode,
    reseaux: config.reseaux,
    zoom: config.zoom ?? null,
  });
  return `${clientConfig.websiteUrl}/iframe/carte${query}`;
}

/** Credit line appended below the iframe, identical to the collectivités embed. */
export const fcuBacklinkHtml = `<div style="font-size:11px;color:#999;text-align:right;">Fourni par <a href="${clientConfig.websiteUrl}" target="_blank" rel="noopener">France Chaleur Urbaine</a></div>`;

/** `<iframe>` snippet (+ "Fourni par" credit) to paste on a partner site. */
export function buildIframeCode(config: IframeConfig): string {
  const url = buildIframeUrl(config);
  const width = config.width || DEFAULT_IFRAME_WIDTH;
  const height = config.height || DEFAULT_IFRAME_HEIGHT;
  return `<iframe src="${url}" width="${width}" height="${height}" frameborder="0" allowfullscreen loading="lazy" title="Carte France Chaleur Urbaine"></iframe>${fcuBacklinkHtml}`;
}
