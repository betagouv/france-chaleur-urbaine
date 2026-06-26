/**
 * Iframe carte legacy (`/iframe/map`) — conservée pour les intégrations partenaires existantes.
 * Rendue par le module carte, alignée sur les paramètres de `/iframe/carte` (cf `carteIframeParams`)
 * avec une couche de compatibilité pour les anciens paramètres partenaires :
 *   - `legend` accepte l'ancien booléen (`true`→auto, `false`→off) en plus de l'enum actuel.
 *   - `displayLegend` (`reseau_chaleur,reseau_froid,futur_reseau,pdp`) est un alias legacy de `layers`
 *     (utilisé si `layers` n'est pas fourni).
 *   - `coord` (`lng,lat`) définit le centre initial (param historique de l'ancien formulaire
 *     d'intégration, présent dans les liens partenaires déjà embarqués).
 * Le titre de légende n'est plus paramétrable (`legendTitle` ignoré, titre figé « Légende »).
 *
 * Paramètres : coord, zoom, min-zoom, max-zoom, max-bounds, gestionnaire, reseaux, layers, legend, mode
 * (+ alias legacy `displayLegend`).
 */

import { createParser, parseAsArrayOf, parseAsStringLiteral, useQueryStates } from 'nuqs';

import useRouterReady from '@/hooks/useRouterReady';
import { createMapConfiguration } from '@/modules/map/client/config/map-configuration';
import { FcuLogo } from '@/modules/map/client/controls/FcuLogo';
import {
  carteIframeParams,
  carteIframeUrlKeys,
  type LayerKey,
  type LegendMode,
  layerKeys,
  legendModes,
} from '@/modules/map/client/iframeCarteParams';
import { IframeLegend } from '@/modules/map/client/legend/IframeLegend';
import { Map } from '@/modules/map/client/Map';
import type { BBox } from '@/modules/map/shared/types';
import { parseAsLngLat } from '@/utils/nuqs-parsers';

// Tolère l'ancien `legend` booléen des URLs partenaires en plus de l'enum actuel.
const parseAsLegacyLegend = createParser<LegendMode>({
  parse: (value) => {
    if (value === 'true') return 'auto';
    if (value === 'false') return 'off';
    return (legendModes as readonly string[]).includes(value) ? (value as LegendMode) : null;
  },
  serialize: (value) => value,
}).withDefault('off');

// Mapping de l'ancien `displayLegend` vers les clés de couches actuelles.
const legacyLayerByDisplayLegendKey: Record<string, LayerKey> = {
  futur_reseau: 'reseaux-en-construction',
  pdp: 'perimetres-de-developpement-prioritaire',
  reseau_chaleur: 'reseaux-de-chaleur',
  reseau_froid: 'reseaux-de-froid',
};

// Alias legacy : `?displayLegend=reseau_chaleur,futur_reseau` → ['reseaux-de-chaleur', 'reseaux-en-construction'].
const parseAsDisplayLegend = createParser<LayerKey[]>({
  parse: (value) => {
    const keys = value
      .split(',')
      .map((key) => legacyLayerByDisplayLegendKey[key.trim()])
      .filter((layer): layer is LayerKey => Boolean(layer));
    return keys.length > 0 ? keys : null;
  },
  serialize: (value) => value.join(','),
});

const mapIframeParams = {
  ...carteIframeParams,
  // Centre initial legacy (ancien formulaire d'intégration : `?coord=lng,lat&zoom=12`).
  coord: parseAsLngLat,
  displayLegend: parseAsDisplayLegend,
  // Sans défaut : `null` quand absent, pour pouvoir retomber sur l'alias legacy `displayLegend`.
  layers: parseAsArrayOf(parseAsStringLiteral(layerKeys)),
  legend: parseAsLegacyLegend,
};

const MapPage = () => {
  const [{ coord, zoom, minZoom, maxZoom, maxBounds, gestionnaire, reseaux, layers, displayLegend, legend, mode }] = useQueryStates(
    mapIframeParams,
    { urlKeys: carteIframeUrlKeys }
  );

  // `<Map config>` is mount-only — wait for the router so it mounts with the final params.
  const isRouterReady = useRouterReady();
  if (!isRouterReady) {
    return null;
  }

  // `layers` prime ; à défaut on retombe sur l'alias legacy `displayLegend`, puis sur le défaut.
  const resolvedLayers = layers ?? displayLegend ?? ['reseaux-de-chaleur'];

  const config = createMapConfiguration({
    ...(gestionnaire.length > 0 ? { filtreGestionnaire: gestionnaire.map((value) => value.toLowerCase()) } : {}),
    ...(reseaux.length > 0 ? { filtreIdentifiantReseau: reseaux } : {}),
    reseauxDeChaleur: { show: resolvedLayers.includes('reseaux-de-chaleur') },
    reseauxDeFroid: resolvedLayers.includes('reseaux-de-froid'),
    reseauxEnConstruction: resolvedLayers.includes('reseaux-en-construction'),
    zonesDeDeveloppementPrioritaire: resolvedLayers.includes('perimetres-de-developpement-prioritaire'),
  });

  const validMaxBounds = maxBounds?.length === 4 ? (maxBounds as BBox) : undefined;

  return (
    <div className="h-dvh w-screen">
      <Map
        config={config}
        initialView={coord ? { center: coord, zoom: zoom ?? 13 } : undefined}
        maxBounds={validMaxBounds}
        minZoom={minZoom ?? undefined}
        maxZoom={maxZoom ?? undefined}
        legend={legend === 'off' ? false : legend}
        legendContent={<IframeLegend layers={resolvedLayers} />}
        search={mode}
      >
        <FcuLogo />
      </Map>
    </div>
  );
};

export default MapPage;
