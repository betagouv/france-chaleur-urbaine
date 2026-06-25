/**
 * Iframe carte paramétrable via query string (générée par /admin/iframes).
 *
 *   center      Centre initial, `longitude,latitude`.          ?center=4.71,49.76
 *   zoom        Zoom initial.                                   ?zoom=12
 *   min-zoom    Zoom minimal autorisé.                          ?min-zoom=8
 *   max-zoom    Zoom maximal autorisé.                          ?max-zoom=16
 *   max-bounds  Limite de déplacement, `w,s,e,n`.               ?max-bounds=4.6,49.7,4.9,49.9
 *   gestionnaire Filtre gestionnaire(s), séparés par virgule.   ?gestionnaire=dalkia,idex
 *   maitre-ouvrage Filtre maître(s) d'ouvrage, séparés par virgule. ?maitre-ouvrage=engie
 *   reseaux     Identifiants SNCU à isoler, séparés par virgule.?reseaux=7412C
 *   layers      Couches affichées parmi reseaux-de-chaleur,reseaux-de-froid,reseaux-en-construction,zones-de-developpement-prioritaire.
 *               Exemple : ?layers=reseaux-de-chaleur,reseaux-de-froid
 *   legend      off | hidden | auto (défaut off).               ?legend=auto
 *   mode        none | network | eligibility (défaut none).     ?mode=eligibility
 */

import { useQueryStates } from 'nuqs';

import useRouterReady from '@/hooks/useRouterReady';
import { useTrackPageView } from '@/modules/conversion-tracking/client/useTrackPageView';
import { createMapConfiguration } from '@/modules/map/client/config/map-configuration';
import { FcuLogo } from '@/modules/map/client/controls/FcuLogo';
import { carteIframeParams, carteIframeUrlKeys } from '@/modules/map/client/iframeCarteParams';
import { IframeLegend } from '@/modules/map/client/legend/IframeLegend';
import { Map } from '@/modules/map/client/Map';
import type { BBox } from '@/modules/map/shared/types';

const CarteIframePage = () => {
  const [{ center, zoom, minZoom, maxZoom, maxBounds, gestionnaire, maitreOuvrage, reseaux, layers, legend, mode }] = useQueryStates(
    carteIframeParams,
    {
      urlKeys: carteIframeUrlKeys,
    }
  );

  // Beacon d'affichage : le `?source=` de l'URL de l'iframe est lu directement par le hook.
  useTrackPageView();

  // `<Map config>` is mount-only — wait for the router so it mounts with the final params.
  const isRouterReady = useRouterReady();
  if (!isRouterReady) {
    return null;
  }

  const config = createMapConfiguration({
    ...(gestionnaire.length > 0 ? { filtreGestionnaire: gestionnaire.map((value) => value.toLowerCase()) } : {}),
    ...(maitreOuvrage.length > 0 ? { filtreMaitreOuvrage: maitreOuvrage } : {}),
    ...(reseaux.length > 0 ? { filtreIdentifiantReseau: reseaux } : {}),
    reseauxDeChaleur: { show: layers.includes('reseaux-de-chaleur') },
    reseauxDeFroid: layers.includes('reseaux-de-froid'),
    reseauxEnConstruction: layers.includes('reseaux-en-construction'),
    zonesDeDeveloppementPrioritaire: layers.includes('perimetres-de-developpement-prioritaire'),
  });

  const validMaxBounds = maxBounds?.length === 4 ? (maxBounds as BBox) : undefined;

  return (
    <div className="h-dvh w-screen">
      <Map
        config={config}
        initialView={center ? { center, zoom: zoom ?? undefined } : undefined}
        maxBounds={validMaxBounds}
        minZoom={minZoom ?? undefined}
        maxZoom={maxZoom ?? undefined}
        legend={legend === 'off' ? false : legend}
        legendContent={<IframeLegend layers={layers} />}
        search={mode}
      >
        <FcuLogo />
      </Map>
    </div>
  );
};

export default CarteIframePage;
