import IframeWrapper from '@components/IframeWrapper';
import Map from '@components/Map/Map';
import { iframeSimpleMapConfiguration } from 'src/services/Map/map-configuration';
import { MapPopupType } from 'src/types/MapComponentsInfos';

const IdexMap = () => {
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
          src: '/logo-IDEX.jpg',
          alt: 'logo Idex',
        }}
        popupType={MapPopupType.IDEX}
        //Filter : gestionnaire for futurNetwork and Gestionnaire for coldNetwork and network
        filter={[
          'any',
          [
            'in',
            'idex',
            ['downcase', ['coalesce', ['get', 'gestionnaire'], '']],
          ],
          [
            'in',
            'idex',
            ['downcase', ['coalesce', ['get', 'Gestionnaire'], '']],
          ],
          [
            'in',
            'mixéner',
            ['downcase', ['coalesce', ['get', 'gestionnaire'], '']],
          ],
          [
            'in',
            'mixéner',
            ['downcase', ['coalesce', ['get', 'Gestionnaire'], '']],
          ],
        ]}
        withFCUAttribution
      />
    </IframeWrapper>
  );
};

export default IdexMap;
