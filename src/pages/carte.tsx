import styled from 'styled-components';

import { Map } from '@/components/Map/Map.lazy';
import { createMapConfiguration, defaultMapConfiguration, type MapConfigurationProperty } from '@/components/Map/map-configuration';
import { fullscreenHeaderHeight, tabHeaderHeight } from '@/components/shared/layout/MainLayout.data';
import SimplePage from '@/components/shared/page/SimplePage';
import useInitialSearchParam from '@/hooks/useInitialSearchParam';
import { setProperty } from '@/utils/core';

const MapWrapper = styled.div`
  height: calc(100vh - ${tabHeaderHeight});
  height: calc(100dvh - ${tabHeaderHeight});

  ${({ theme }) => theme.media.lg`
    height: calc(100vh - ${fullscreenHeaderHeight});
    height: calc(100dvh - ${fullscreenHeaderHeight});
  `}
`;

export const layerURLKeysToMapConfigPath = {
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
} as const satisfies { [key: string]: MapConfigurationProperty<boolean> };

export type LayerURLKey = keyof typeof layerURLKeysToMapConfigPath;

export const layerURLKeys = Object.keys(layerURLKeysToMapConfigPath) as readonly LayerURLKey[];

const Carte = () => {
  // amend the initial map configuration with additional layers
  const additionalLayersQuery = useInitialSearchParam('additionalLayers');
  const additionalLayers = additionalLayersQuery
    ? additionalLayersQuery
        .split(',')
        .filter((key) => layerURLKeys.includes(key as LayerURLKey))
        .map((key) => layerURLKeysToMapConfigPath[key as LayerURLKey])
    : [];
  const initialMapConfiguration = createMapConfiguration({
    ...defaultMapConfiguration,
    densiteThermiqueLineaire: true,
    extractionDonneesBatiment: true,
    mesureDistance: true,
  });
  additionalLayers.forEach((updateKey) => {
    setProperty(initialMapConfiguration, updateKey, true);
  });

  return (
    <SimplePage
      title="Carte nationale des réseaux de chaleur et de froid en France"
      mode="public-fullscreen"
      description="Découvrez la carte de référence des réseaux de chaleur et de froid, identifiez les opportunités de raccordement pour votre bâtiment."
      includeFooter={false}
    >
      <h1 className="fr-sr-only">Carte nationale des réseaux de chaleur et de froid en France</h1>
      <MapWrapper>
        <Map withoutLogo withLegend initialMapConfiguration={initialMapConfiguration} persistViewStateInURL />
      </MapWrapper>
    </SimplePage>
  );
};

export default Carte;
