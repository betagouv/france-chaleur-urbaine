import IframeWrapper from '@/components/IframeWrapper';
import { Map } from '@/components/Map/Map.lazy';
import { createMapConfiguration } from '@/components/Map/map-configuration';

const CollectivityMap = () => {
  return (
    <IframeWrapper>
      <Map
        initialMapConfiguration={createMapConfiguration({
          reseauxDeChaleur: {
            show: true,
          },
          zonesDeDeveloppementPrioritaire: true,
        })}
        enabledLegendFeatures={['reseauxDeChaleur', 'zonesDeDeveloppementPrioritaire']}
        withLegend
        withBorder
        legendTitle="Réseaux de chaleur"
        withFCUAttribution
      />
    </IframeWrapper>
  );
};

export default CollectivityMap;
