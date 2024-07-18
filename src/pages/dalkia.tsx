import IframeWrapper from '@components/IframeWrapper';
import Map from '@components/Map/Map';
import { createMapConfiguration } from 'src/services/Map/map-configuration';
import { MapPopupType } from 'src/types/MapComponentsInfos';

const DalkiaMap = () => {
  return (
    <IframeWrapper>
      <Map
        initialMapConfiguration={createMapConfiguration({
          reseauxDeChaleur: {
            show: true,
          },
          filtreGestionnaire: ['dalkia'],
        })}
        enabledLegendFeatures={['reseauxDeChaleur', 'reseauxDeFroid', 'reseauxEnConstruction', 'zonesDeDeveloppementPrioritaire']}
        withLegend
        withBorder
        withHideLegendSwitch
        legendLogoOpt={{
          src: '/logo-DALKIA.png',
          alt: 'logo Dalkia',
        }}
        popupType={MapPopupType.DALKIA}
        withFCUAttribution
      />
    </IframeWrapper>
  );
};

export default DalkiaMap;
