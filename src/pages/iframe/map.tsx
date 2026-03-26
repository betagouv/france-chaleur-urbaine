/**
 * Iframe carte paramétrable via query string.
 *
 * Paramètres supportés :
 *   gestionnaire   Filtre par gestionnaire(s), séparés par virgule.
 *                  Exemple : ?gestionnaire=dalkia
 *                  Exemple : ?gestionnaire=idex,mixéner
 *
 *   legendTitle    Titre affiché au-dessus de la légende.
 *                  Exemple : ?legendTitle=Réseaux+de+chaleur
 *
 *   legend         Affiche le panneau de légende. Valeur : true | false (défaut : false).
 *                  Exemple : ?legend=true
 *
 *   displayLegend  Couches activées, séparées par virgule.
 *                  Clés disponibles : reseau_chaleur, reseau_froid, futur_reseau, pdp
 *                  Exemple : ?displayLegend=reseau_chaleur,futur_reseau,pdp,reseau_froid
 *
 *   center         Centre initial de la carte, format : longitude,latitude.
 *                  Exemple : ?center=4.717692,49.767402
 *
 *   zoom           Niveau de zoom initial (nombre entier).
 *                  Exemple : ?zoom=12
 */

import { parseAsArrayOf, parseAsBoolean, parseAsInteger, parseAsString, useQueryStates } from 'nuqs';

import IframeWrapper from '@/components/IframeWrapper';
import Map from '@/components/Map/Map';
import { createMapConfiguration } from '@/components/Map/map-configuration';
import { legendURLKeyToLegendFeature } from '@/components/Map/map-layers';
import useRouterReady from '@/hooks/useRouterReady';
import { createParserForRecordValues, parseAsLngLat } from '@/utils/nuqs-parsers';

const mapIframeParams = {
  center: parseAsLngLat,
  displayLegend: createParserForRecordValues(legendURLKeyToLegendFeature),
  gestionnaire: parseAsArrayOf(parseAsString).withDefault([]),
  legend: parseAsBoolean.withDefault(false),
  legendTitle: parseAsString,
  zoom: parseAsInteger,
};

const MapPage = () => {
  const [{ gestionnaire, legendTitle, legend, displayLegend: legendFeatures, center, zoom }] = useQueryStates(mapIframeParams);
  const isRouterReady = useRouterReady();
  if (!isRouterReady) {
    return null;
  }

  const initialMapConfiguration = createMapConfiguration({
    ...(gestionnaire.length > 0 ? { filtreGestionnaire: gestionnaire } : {}),
    reseauxDeChaleur: {
      show: legendFeatures.includes('reseauxDeChaleur'),
    },
    reseauxEnConstruction: legendFeatures.includes('reseauxEnConstruction'),
    // Pas d'affichage par défaut pour les couches ci-dessous. Il faudra sans doute passer par une iframe v2 pour changer les paramètres
    // et mieux indiquer ce qu'on souhaite afficher dans la légende et/ou sur la carte...
    // reseauxDeFroid: legendFeatures.includes('reseauxDeFroid'),
    // zonesDeDeveloppementPrioritaire: legendFeatures.includes('zonesDeDeveloppementPrioritaire'),
  });

  return (
    <IframeWrapper>
      <Map
        withLegend={legend}
        withBorder
        legendTitle={legendTitle ?? undefined}
        enabledLegendFeatures={legendFeatures}
        initialMapConfiguration={initialMapConfiguration}
        initialCenter={center ?? undefined}
        initialZoom={zoom ?? undefined}
        withFCUAttribution
      />
    </IframeWrapper>
  );
};

export default MapPage;
