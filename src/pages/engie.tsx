import IframeWrapper from '@components/IframeWrapper';
import Map from '@components/Map/Map';
import { iframeSimpleMapConfiguration } from 'src/services/Map/map-configuration';
import { MapPopupType } from 'src/types/MapComponentsInfos';

const EngieMap = () => {
  return (
    <IframeWrapper>
      <Map
        initialMapConfiguration={iframeSimpleMapConfiguration}
        enabledLegendFeatures={[
          'reseauxDeChaleur',
          'reseauxDeFroid',
          'reseauxEnConstruction',
          'zonesDeDeveloppementPrioritaire',
        ]}
        withLegend
        withBorder
        withHideLegendSwitch
        legendLogoOpt={{
          src: '/logo-ENGIE.jpg',
          alt: 'logo ENGIE',
        }}
        popupType={MapPopupType.ENGIE}
        filter={[
          'any',
          [
            'in',
            'engie',
            ['downcase', ['coalesce', ['get', 'gestionnaire'], '']],
          ],
          [
            'in',
            'engie',
            ['downcase', ['coalesce', ['get', 'Gestionnaire'], '']],
          ],
        ]}
        withFCUAttribution
      />
    </IframeWrapper>
  );
};

export default EngieMap;
