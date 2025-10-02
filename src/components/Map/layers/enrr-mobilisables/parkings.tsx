import { darken } from '@/utils/color';

import { ifHoverElse, type MapSourceLayersSpecification, type PopupStyleHelpers } from '../common';

export const enrrMobilisablesParkingsLayerColor = '#d0643e';
export const enrrMobilisablesParkingsLayerOpacity = 0.7;

export const enrrMobilisablesParkingsLayersSpec = [
  {
    layers: [
      {
        id: 'enrrMobilisables-parkings',
        isVisible: (config) => config.enrrMobilisablesSolaireThermique.show && config.enrrMobilisablesSolaireThermique.showParkings,
        paint: {
          'fill-color': ifHoverElse(darken(enrrMobilisablesParkingsLayerColor, 30), enrrMobilisablesParkingsLayerColor),
          'fill-opacity': enrrMobilisablesParkingsLayerOpacity,
        },
        popup: Popup,
        type: 'fill',
      },
      {
        id: 'enrrMobilisables-parkings-contour',
        isVisible: (config) => config.enrrMobilisablesSolaireThermique.show && config.enrrMobilisablesSolaireThermique.showParkings,
        paint: {
          'line-color': ifHoverElse(darken(enrrMobilisablesParkingsLayerColor, 30), enrrMobilisablesParkingsLayerColor),
          'line-width': ifHoverElse(3, 2),
        },
        type: 'line',
        unselectable: true,
      },
    ],
    source: {
      promoteId: 'GmlID',
      tiles: ['/api/map/enrrMobilisables-parkings/{z}/{x}/{y}'],
      type: 'vector',
    },
    sourceId: 'enrrMobilisables-parkings',
  },
] as const satisfies readonly MapSourceLayersSpecification[];

type SolaireThermiqueParking = {
  GmlID: string;
  TYPE: string;
  'db_gd5kj.hsu_pnjyu.parkings_sup500m2_parkings_sup500m2.fid': number;
  st_area_shape_: number;
  st_length_shape_: number;
  surfm2: number;
};

function Popup(parking: SolaireThermiqueParking, { Property, Title, TwoColumns }: PopupStyleHelpers) {
  return (
    <>
      <Title>Parking</Title>
      <TwoColumns>
        <Property label="Surface" value={parking.surfm2} unit="m²" />
        <Property label="Source" value="Cerema" />
      </TwoColumns>
    </>
  );
}
