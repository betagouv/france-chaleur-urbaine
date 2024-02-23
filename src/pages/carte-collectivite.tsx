import IframeWrapper from '@components/IframeWrapper';
import Map from '@components/Map/Map';
import { createMapConfiguration } from 'src/services/Map/map-configuration';

const CollectivityMap = () => {
  return (
    <IframeWrapper>
      <Map
        initialMapConfiguration={createMapConfiguration({
          reseauxDeChaleur: true,
          zonesDeDeveloppementPrioritaire: true,
        })}
        enabledLegendFeatures={[
          'reseauxDeChaleur',
          'zonesDeDeveloppementPrioritaire',
        ]}
        withLegend
        withBorder
        withHideLegendSwitch
        legendTitle="Réseaux de chaleur"
        withFCUAttribution
      />
    </IframeWrapper>
  );
};

export default CollectivityMap;
