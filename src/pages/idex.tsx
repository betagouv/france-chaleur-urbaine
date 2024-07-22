import IframeWrapper from '@components/IframeWrapper';
import Map from '@components/Map/Map';
import { createMapConfiguration } from 'src/services/Map/map-configuration';
import { MapPopupType } from 'src/types/MapComponentsInfos';

const IdexMap = () => {
  return (
    <IframeWrapper>
      <Map
        initialMapConfiguration={createMapConfiguration({
          reseauxDeChaleur: {
            show: true,
          },
          filtreGestionnaire: ['idex', 'mixéner'],
        })}
        enabledLegendFeatures={['reseauxDeChaleur', 'reseauxDeFroid', 'reseauxEnConstruction', 'zonesDeDeveloppementPrioritaire']}
        withLegend
        withBorder
        withHideLegendSwitch
        legendLogoOpt={{
          src: '/logo-IDEX.jpg',
          alt: 'logo Idex',
        }}
        popupType={MapPopupType.IDEX}
        withFCUAttribution
      />
    </IframeWrapper>
  );
};

export default IdexMap;
