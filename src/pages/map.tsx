import IframeWrapper from '@components/IframeWrapper';
import Map from '@components/Map/Map';
import { MapLegendFeature } from '@components/Map/components/SimpleMapLegend';
import useRouterReady from '@hooks/useRouterReady';
import { useRouter } from 'next/router';
import { createMapConfiguration } from 'src/services/Map/map-configuration';

export const selectableLayers = [
  {
    label: 'Les réseaux de chaleur existants',
    key: 'reseau_chaleur',
  },
  {
    label: 'Les réseaux de chaleur en construction',
    key: 'futur_reseau',
  },
  {
    label: 'Les périmètres de développement prioritaire',
    key: 'pdp',
  },
  {
    label: 'Les réseaux de froid',
    key: 'reseau_froid',
  },
] as const;

export type LegendURLKey = (typeof selectableLayers)[number]['key'];

const legendURLKeyToLegendFeature: Record<
  LegendURLKey | string,
  MapLegendFeature
> = {
  reseau_chaleur: 'reseauxDeChaleur',
  futur_reseau: 'reseauxEnConstruction',
  reseau_froid: 'reseauxDeFroid',
  pdp: 'zonesDeDeveloppementPrioritaire',
  demandes: 'demandesEligibilite',
  gaz: 'consommationsGaz',
  conso_gaz: 'batimentsGazCollectif',
  conso_fioul: 'batimentsFioulCollectif',
  raccordements: 'batimentsRaccordes',
  zones_opportunite: 'zonesOpportunite',
  dpe: 'caracteristiquesBatiments',
};

const MapPage = () => {
  const router = useRouter();
  const isRouterReady = useRouterReady();
  if (!isRouterReady) {
    return null;
  }

  const { legend, drawing, displayLegend } = router.query;

  const legendFeatures = displayLegend
    ? decodeURI(displayLegend as string)
        .split(',')
        .map((f) => legendURLKeyToLegendFeature[f])
        .filter((v) => !!v)
    : [];

  // uniquement pour ces 2 couches, on les affiche directement si affichées dans la légende
  const initialMapConfiguration = createMapConfiguration({
    reseauxDeChaleur: {
      show: legendFeatures.includes('reseauxDeChaleur'),
    },
    reseauxEnConstruction: legendFeatures.includes('reseauxEnConstruction'),
  });

  return (
    <IframeWrapper>
      <Map
        withLegend={legend === 'true'}
        withHideLegendSwitch={legend === 'true'}
        withDrawing={drawing === 'true'}
        withBorder
        enabledLegendFeatures={legendFeatures}
        initialMapConfiguration={initialMapConfiguration}
        withFCUAttribution
      />
    </IframeWrapper>
  );
};

export default MapPage;
