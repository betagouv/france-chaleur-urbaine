import styled from 'styled-components';

import Map from '@components/Map';
import { fullscreenHeaderHeight, tabHeaderHeight } from '@components/shared/layout/MainLayout.data';
import SimplePage from '@components/shared/page/SimplePage';
import useInitialSearchParam from '@hooks/useInitialSearchParam';
import { setProperty } from '@utils/core';
import { MapConfigurationProperty, createMapConfiguration, defaultMapConfiguration } from 'src/services/Map/map-configuration';

const MapWrapper = styled.div`
  height: calc(100vh - ${tabHeaderHeight});
  height: calc(100dvh - ${tabHeaderHeight});

  ${({ theme }) => theme.media.lg`
    height: calc(100vh - ${fullscreenHeaderHeight});
    height: calc(100dvh - ${fullscreenHeaderHeight});
  `}
`;

export const layerURLKeysToMapConfigPath = {
  reseauxDeChaleur: 'reseauxDeChaleur.show',
  reseauxDeFroid: 'reseauxDeFroid',
  reseauxEnConstruction: 'reseauxEnConstruction',
  zonesDeDeveloppementPrioritaire: 'zonesDeDeveloppementPrioritaire',
  demandesEligibilite: 'demandesEligibilite',
  consommationsGaz: 'consommationsGaz.show',
  batimentsGazCollectif: 'batimentsGazCollectif.show',
  batimentsFioulCollectif: 'batimentsFioulCollectif.show',
  batimentsRaccordesReseauxChaleur: 'batimentsRaccordesReseauxChaleur',
  batimentsRaccordesReseauxFroid: 'batimentsRaccordesReseauxFroid',
  zonesOpportunite: 'zonesOpportunite.show',
  enrrMobilisablesChaleurFatale: 'enrrMobilisablesChaleurFatale.show',
  enrrMobilisablesSolaireThermique: 'enrrMobilisablesSolaireThermique.show',
  caracteristiquesBatiments: 'caracteristiquesBatiments',
  besoinsEnChaleur: 'besoinsEnChaleur',
  besoinsEnFroid: 'besoinsEnFroid',
  besoinsEnChaleurIndustrieCommunes: 'besoinsEnChaleurIndustrieCommunes',
  communesFortPotentielPourCreationReseauxChaleur: 'communesFortPotentielPourCreationReseauxChaleur.show',
} as const satisfies { [key: string]: MapConfigurationProperty<boolean> };

export type LayerURLKey = keyof typeof layerURLKeysToMapConfigPath;

export const layerURLKeys = Object.keys(layerURLKeysToMapConfigPath) as ReadonlyArray<LayerURLKey>;

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
    mesureDistance: true,
    extractionDonneesBatiment: true,
  });
  additionalLayers.forEach((updateKey) => {
    setProperty(initialMapConfiguration, updateKey, true);
  });

  return (
    <SimplePage title="Carte des réseaux : France Chaleur Urbaine" mode="public-fullscreen">
      <MapWrapper>
        <Map withoutLogo withLegend initialMapConfiguration={initialMapConfiguration} persistViewStateInURL />
      </MapWrapper>
    </SimplePage>
  );
};

export default Carte;
