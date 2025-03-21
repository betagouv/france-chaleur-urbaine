import { darken } from '@/utils/color';

import { ifHoverElse, type MapSourceLayersSpecification, type PopupStyleHelpers } from '../common';

export const enrrMobilisablesThalassothermieLayerColor = '#4c64c9';
export const enrrMobilisablesThalassothermieLayerOpacity = 0.6;

export const enrrMobilisablesThalassothermieLayersSpec = [
  {
    sourceId: 'enrrMobilisables-thalassothermie',
    source: {
      type: 'vector',
      tiles: ['/api/map/enrrMobilisables-thalassothermie/{z}/{x}/{y}'],
      minzoom: 5,
      maxzoom: 12,
    },
    layers: [
      {
        id: 'enrrMobilisables-thalassothermie',
        type: 'fill',
        paint: {
          'fill-color': ifHoverElse(darken(enrrMobilisablesThalassothermieLayerColor, 30), enrrMobilisablesThalassothermieLayerColor),
          'fill-opacity': enrrMobilisablesThalassothermieLayerOpacity,
        },
        isVisible: (config) => config.enrrMobilisablesThalassothermie,
        popup: Popup,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;

type Thalassothermie = {
  fid: number;
  nature: 'Port' | 'Gare maritime';
  importance: string;
  toponyme: string;
  nature_det: 'Port de plaisance' | 'Halte fluviale' | 'Port de commerce' | ' ' | 'Port de pêche' | 'Bassin' | 'Dégrad';
  SHAPE__Length: number;
  SHAPE__Area: number;
};

function Popup(thalassothermie: Thalassothermie, { Property, Title, TwoColumns }: PopupStyleHelpers) {
  return (
    <>
      <Title>{thalassothermie.toponyme}</Title>
      <TwoColumns>
        <Property label="Nature" value={thalassothermie.nature} />
        {thalassothermie.nature_det !== ' ' && <Property label="Nature détaillée" value={thalassothermie.nature_det} />}
        <Property label="Source" value="Recensement des infrastructures portuaires issues de la BDTOPO" />
      </TwoColumns>
    </>
  );
}
