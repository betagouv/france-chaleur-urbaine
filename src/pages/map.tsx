import IframeWrapper from '@components/IframeWrapper';
import Map from '@components/Map/Map';
import { MapLegendFeature } from '@components/Map/components/SimpleMapLegend';
import useRouterReady from '@hooks/useRouterReady';
import { useRouter } from 'next/router';
import { iframeSimpleMapConfiguration } from 'src/services/Map/map-configuration';

export const legendURLKeys = [
  'reseau_chaleur',
  'reseau_froid',
  'futur_reseau',
  'pdp',
] as const;

export type LegendURLKey = (typeof legendURLKeys)[number];

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
    : undefined;

  return (
    <IframeWrapper>
      <Map
        withLegend={legend === 'true'}
        withHideLegendSwitch={legend === 'true'}
        withDrawing={drawing === 'true'}
        withBorder
        enabledLegendFeatures={legendFeatures}
        initialMapConfiguration={iframeSimpleMapConfiguration}
        withFCUAttribution
      />
    </IframeWrapper>
  );
};

export default MapPage;
