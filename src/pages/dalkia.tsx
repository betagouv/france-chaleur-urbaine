import IframeWrapper from '@components/IframeWrapper';
import Map from '@components/Map/Map';
import { iframeSimpleMapConfiguration } from 'src/services/Map/map-configuration';
import { MapPopupType } from 'src/types/MapComponentsInfos';

const DalkiaMap = () => {
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
          src: '/logo-DALKIA.png',
          alt: 'logo Dalkia',
        }}
        popupType={MapPopupType.DALKIA}
        filter={[
          'any',
          [
            'in',
            'dalkia',
            ['downcase', ['coalesce', ['get', 'gestionnaire'], '']],
          ],
          [
            'in',
            'dalkia',
            ['downcase', ['coalesce', ['get', 'Gestionnaire'], '']],
          ],
        ]}
        withFCUAttribution
      />
    </IframeWrapper>
  );
};

export default DalkiaMap;
