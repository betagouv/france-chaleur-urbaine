import { useMemo } from 'react';

import SimplePage from '@/components/shared/page/SimplePage';
import useInitialSearchParam from '@/hooks/useInitialSearchParam';
import useRouterReady from '@/hooks/useRouterReady';
import { useAuthentication } from '@/modules/auth/client/hooks';
import type { MapConfiguration, MapConfigurationProperty } from '@/modules/map/client/config/map-configuration';
import { MapViewUrlSync } from '@/modules/map/client/interactions/MapViewUrlSync';
import { ReseauxFiltersUrlSync } from '@/modules/map/client/interactions/ReseauxFiltersUrlSync';
import { Map } from '@/modules/map/client/Map';
import type { BBox, InitialView } from '@/modules/map/shared/types';
import { setProperty } from '@/utils/core';
import type { DeepPartial } from '@/utils/typescript';

/**
 * URL layer keys (`?additionalLayers=key1,key2`) → boolean config paths.
 * Kept for backward compatibility with existing deep-links into `/carte`.
 */
const additionalLayersToConfigPath = {
  batimentsFioulCollectif: 'batimentsFioulCollectif.show',
  batimentsGazCollectif: 'batimentsGazCollectif.show',
  batimentsRaccordesReseauxChaleur: 'batimentsRaccordesReseauxChaleur',
  batimentsRaccordesReseauxFroid: 'batimentsRaccordesReseauxFroid',
  besoinsEnChaleur: 'besoinsEnChaleur',
  besoinsEnChaleurIndustrieCommunes: 'besoinsEnChaleurIndustrieCommunes',
  besoinsEnFroid: 'besoinsEnFroid',
  caracteristiquesBatiments: 'caracteristiquesBatiments',
  communesFortPotentielPourCreationReseauxChaleur: 'communesFortPotentielPourCreationReseauxChaleur.show',
  consommationsGaz: 'consommationsGaz.show',
  demandesEligibilite: 'demandesEligibilite',
  enrrMobilisablesChaleurFatale: 'enrrMobilisablesChaleurFatale.show',
  enrrMobilisablesGeothermieProfonde: 'enrrMobilisablesGeothermieProfonde',
  enrrMobilisablesSolaireThermique: 'enrrMobilisablesSolaireThermique.show',
  enrrMobilisablesThalassothermie: 'enrrMobilisablesThalassothermie',
  etudesEnCours: 'etudesEnCours',
  geothermieProfonde: 'geothermieProfonde.show',
  geothermieSurfaceEchangeursFermes: 'geothermieSurfaceEchangeursFermes.show',
  geothermieSurfaceEchangeursOuverts: 'geothermieSurfaceEchangeursOuverts.show',
  installationsGeothermieSurfaceEchangeursFermesDeclarees: 'geothermieSurfaceEchangeursFermes.showInstallationsDeclarees',
  installationsGeothermieSurfaceEchangeursFermesRealisees: 'geothermieSurfaceEchangeursFermes.showInstallationsRealisees',
  installationsGeothermieSurfaceEchangeursOuvertsDeclarees: 'geothermieSurfaceEchangeursOuverts.showInstallationsDeclarees',
  installationsGeothermieSurfaceEchangeursOuvertsRealisees: 'geothermieSurfaceEchangeursOuverts.showInstallationsRealisees',
  ouvragesGeothermieSurfaceEchangeursFermesDeclares: 'geothermieSurfaceEchangeursFermes.showOuvragesDeclares',
  ouvragesGeothermieSurfaceEchangeursFermesRealises: 'geothermieSurfaceEchangeursFermes.showOuvragesRealises',
  ouvragesGeothermieSurfaceEchangeursOuvertsDeclares: 'geothermieSurfaceEchangeursOuverts.showOuvragesDeclares',
  ouvragesGeothermieSurfaceEchangeursOuvertsRealises: 'geothermieSurfaceEchangeursOuverts.showOuvragesRealises',
  quartiersPrioritairesPolitiqueVille: 'quartiersPrioritairesPolitiqueVille.show',
  reseauxDeChaleur: 'reseauxDeChaleur.show',
  reseauxDeFroid: 'reseauxDeFroid',
  reseauxEnConstruction: 'reseauxEnConstruction',
  ressourcesGeothermalesNappes: 'ressourcesGeothermalesNappes',
  testsAdresses: 'testsAdresses',
  zonesDeDeveloppementPrioritaire: 'zonesDeDeveloppementPrioritaire',
  zonesOpportunite: 'zonesOpportunite.show',
  zonesOpportuniteFroid: 'zonesOpportuniteFroid.show',
} as const satisfies Record<string, MapConfigurationProperty<boolean>>;

type AdditionalLayerKey = keyof typeof additionalLayersToConfigPath;

const parseCoordinates = (value: string): [number, number] | null => {
  const [lng, lat] = value.split(',').map(Number);
  return Number.isFinite(lng) && Number.isFinite(lat) ? [lng, lat] : null;
};

const parseBBox = (value: string, asJson: boolean): BBox | null => {
  try {
    const parsed = asJson ? JSON.parse(value) : value.split(',').map(Number);
    return Array.isArray(parsed) && parsed.length === 4 && parsed.every((entry) => Number.isFinite(entry)) ? (parsed as BBox) : null;
  } catch {
    return null;
  }
};

/**
 * Carte nationale (Map V2). Reads the legacy deep-link params from the URL
 * (`coord`/`zoom`/`bounds`/`bbox`, `additionalLayers`, `rdc_filters`) to seed the
 * map, then keeps view + réseau filters in sync with the URL. Right-click
 * eligibility test enabled for admins.
 */
const Carte = () => {
  const isRouterReady = useRouterReady();
  const { hasRole } = useAuthentication();

  const coordParam = useInitialSearchParam('coord');
  const zoomParam = useInitialSearchParam('zoom');
  const boundsParam = useInitialSearchParam('bounds');
  const bboxParam = useInitialSearchParam('bbox');
  const additionalLayersParam = useInitialSearchParam('additionalLayers');
  const rdcFiltersParam = useInitialSearchParam('rdc_filters');

  const initialView = useMemo<InitialView | undefined>(() => {
    const coordinates = coordParam ? parseCoordinates(coordParam) : null;
    if (coordinates) {
      return { center: coordinates, zoom: zoomParam ? Number(zoomParam) : 13 };
    }
    const bbox = boundsParam ? parseBBox(boundsParam, true) : bboxParam ? parseBBox(bboxParam, false) : null;
    return bbox ? { bbox } : undefined;
  }, [coordParam, zoomParam, boundsParam, bboxParam]);

  const config = useMemo<DeepPartial<MapConfiguration>>(() => {
    // V1's `regions` key has no V2 equivalent (region framing is handled via coord/zoom);
    // it's harmless if present and is never re-emitted by the URL sync.
    const rdcFilters = (() => {
      if (!rdcFiltersParam) return {};
      try {
        return JSON.parse(rdcFiltersParam) as DeepPartial<MapConfiguration['reseauxDeChaleur']>;
      } catch {
        return {};
      }
    })();

    const draft: DeepPartial<MapConfiguration> = {
      customGeojson: true,
      reseauxDeChaleur: { show: true, ...rdcFilters },
      reseauxEnConstruction: true,
    };

    additionalLayersParam
      ?.split(',')
      .filter((key): key is AdditionalLayerKey => key in additionalLayersToConfigPath)
      .forEach((key) => setProperty(draft, additionalLayersToConfigPath[key], true));

    return draft;
  }, [additionalLayersParam, rdcFiltersParam]);

  // `<Map config>` is mount-only — wait for the router so it mounts with the final URL params.
  if (!isRouterReady) {
    return null;
  }

  return (
    <SimplePage
      title="Carte nationale des réseaux de chaleur et de froid en France"
      mode="public-fullscreen"
      description="Découvrez la carte de référence des réseaux de chaleur et de froid, identifiez les opportunités de raccordement pour votre bâtiment."
      includeFooter={false}
    >
      <h1 className="fr-sr-only">Carte nationale des réseaux de chaleur et de froid en France</h1>
      {/* Remplit le viewport sous le header. Hauteur mesurée → `--header-height` (cf. useHeaderHeightVar) ; repli 57px avant la mesure. */}
      <div className="w-full h-[calc(100dvh_-_var(--header-height,57px))]">
        <Map config={config} initialView={initialView} legend="auto" search="eligibility" contextMenu={hasRole('admin')}>
          <MapViewUrlSync />
          <ReseauxFiltersUrlSync />
        </Map>
      </div>
    </SimplePage>
  );
};

export default Carte;
