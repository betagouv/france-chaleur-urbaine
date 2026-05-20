import type { LayerSymbolSpecification } from './common';
import enrrMobilisablesDatacenter from './icons/enrr_mobilisables_datacenter.png';
import enrrMobilisablesIndustrie from './icons/enrr_mobilisables_industrie.png';
import enrrMobilisablesInstallationsElectrogenes from './icons/enrr_mobilisables_installations_electrogenes.png';
import enrrMobilisablesStationsEpuration from './icons/enrr_mobilisables_stations_epuration.png';
import enrrMobilisablesUnitesIncineration from './icons/enrr_mobilisables_unites_incineration.png';
import markerBlue from './icons/marker-blue.png';
import markerGreen from './icons/marker-green.png';
import markerRed from './icons/marker-red.png';
import square from './icons/square.png';

/**
 * Symbols loaded into every `MapCanvas` instance at mount via
 * `map.loadImage` + `map.addImage`. Layers reference them by `key` in their
 * `layout['icon-image']`.
 *
 * Loaded eagerly (à la V1) — total payload is small (~50ko) and keeps the
 * first frame correct on every layer that uses icons.
 *
 * PNGs are imported as modules so they're emitted by webpack/turbopack under
 * `/_next/static/media/<name>.<hash>.<ext>` with `Cache-Control: immutable` —
 * no cache headaches, no stale assets across deploys.
 */
export const layerSymbolsImagesURLs = [
  {
    key: 'square',
    sdf: true, // SDF = MapLibre can recolor the image at runtime
    url: square.src,
  },
  {
    key: 'marker-red',
    url: markerRed.src,
  },
  {
    key: 'marker-green',
    url: markerGreen.src,
  },
  {
    key: 'marker-blue',
    url: markerBlue.src,
  },
  {
    key: 'enrr_mobilisables_datacenter',
    url: enrrMobilisablesDatacenter.src,
  },
  {
    key: 'enrr_mobilisables_industrie',
    url: enrrMobilisablesIndustrie.src,
  },
  {
    key: 'enrr_mobilisables_installations_electrogenes',
    url: enrrMobilisablesInstallationsElectrogenes.src,
  },
  {
    key: 'enrr_mobilisables_stations_epuration',
    url: enrrMobilisablesStationsEpuration.src,
  },
  {
    key: 'enrr_mobilisables_unites_incineration',
    url: enrrMobilisablesUnitesIncineration.src,
  },
] as const satisfies readonly LayerSymbolSpecification[];

export type LayerSymbolImage = (typeof layerSymbolsImagesURLs)[number]['key'];
