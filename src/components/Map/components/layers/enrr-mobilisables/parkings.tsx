import { darken } from '@/utils/color';

import { ifHoverElse, type PopupStyleHelpers, type MapSourceLayersSpecification } from '../common';

export const enrrMobilisablesParkingsLayerColor = '#d0643e';
export const enrrMobilisablesParkingsLayerOpacity = 0.7;

export const enrrMobilisablesParkingsLayersSpec = [
  {
    sourceId: 'enrrMobilisables-parkings',
    source: {
      type: 'vector',
      tiles: ['/api/map/enrrMobilisables-parkings/{z}/{x}/{y}'],
      promoteId: 'GmlID',
    },
    layers: [
      {
        id: 'enrrMobilisables-parkings',
        type: 'fill',
        paint: {
          'fill-color': ifHoverElse(darken(enrrMobilisablesParkingsLayerColor, 30), enrrMobilisablesParkingsLayerColor),
          'fill-opacity': enrrMobilisablesParkingsLayerOpacity,
        },
        isVisible: (config) => config.enrrMobilisablesSolaireThermique.show && config.enrrMobilisablesSolaireThermique.showParkings,
        popup: Popup,
      },
      {
        id: 'enrrMobilisables-parkings-contour',
        type: 'line',
        paint: {
          'line-color': ifHoverElse(darken(enrrMobilisablesParkingsLayerColor, 30), enrrMobilisablesParkingsLayerColor),
          'line-width': ifHoverElse(3, 2),
        },
        isVisible: (config) => config.enrrMobilisablesSolaireThermique.show && config.enrrMobilisablesSolaireThermique.showParkings,
        unselectable: true,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;

type SolaireThermiqueParking = {
  GmlID: string;
  TYPE: string;
  'db_gd5kj.hsu_pnjyu.parkings_sup500m2_parkings_sup500m2.fid': number;
  st_area_shape_: number;
  st_length_shape_: number;
  surfm2: number;
};

function Popup(parking: SolaireThermiqueParking, { Property, Title }: PopupStyleHelpers) {
  return (
    <>
      <Title>Parking</Title>
      <Property label="Surface" value={parking.surfm2} unit="m²" />
      <Property label="Source" value="Cerema" />
    </>
  );
}
