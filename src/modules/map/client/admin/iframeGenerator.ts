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
  maitreOuvrage: string[];
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
  layers: ['reseaux-de-chaleur', 'reseaux-de-froid', 'reseaux-en-construction', 'perimetres-de-developpement-prioritaire'],
  legend: 'hidden',
  maitreOuvrage: [],
  mode: 'eligibility',
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
    maitreOuvrage: config.maitreOuvrage,
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

/**
 * Normalizes a user-entered size to a valid CSS value: a bare number (`600`)
 * becomes `600px`; values already carrying a unit (`600px`, `100%`, `50vh`) pass
 * through; empty falls back to the default. Without this, `style={{ height: '600' }}`
 * is invalid CSS and the preview collapses.
 */
export function toCssSize(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }
  return /^\d+(\.\d+)?$/.test(trimmed) ? `${trimmed}px` : trimmed;
}

/** `<iframe>` snippet (+ "Fourni par" credit) to paste on a partner site. */
export function buildIframeCode(config: IframeConfig): string {
  const url = buildIframeUrl(config);
  // Inline `style` (not the HTML width/height attributes) so any CSS unit works — the
  // attributes only accept a bare number or a percentage, breaking on e.g. `600px`.
  const width = toCssSize(config.width, DEFAULT_IFRAME_WIDTH);
  const height = toCssSize(config.height, DEFAULT_IFRAME_HEIGHT);
  return `<iframe src="${url}" style="width:${width};height:${height};border:0;" allowfullscreen loading="lazy" title="Carte France Chaleur Urbaine"></iframe>${fcuBacklinkHtml}`;
}
