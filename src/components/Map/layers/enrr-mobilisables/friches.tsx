import { darken } from '@/utils/color';

import { ifHoverElse, type PopupStyleHelpers, type MapSourceLayersSpecification } from '../common';

export const enrrMobilisablesFrichesLayerColor = '#dc958e';
export const enrrMobilisablesFrichesLayerOpacity = 0.7;

export const enrrMobilisablesFrichesLayersSpec = [
  {
    sourceId: 'enrrMobilisables-friches',
    source: {
      type: 'vector',
      tiles: ['/api/map/enrrMobilisables-friches/{z}/{x}/{y}'],
      promoteId: 'GmlID',
    },
    layers: [
      {
        id: 'enrrMobilisables-friches',
        type: 'fill',
        paint: {
          'fill-color': ifHoverElse(darken(enrrMobilisablesFrichesLayerColor, 30), enrrMobilisablesFrichesLayerColor),
          'fill-opacity': enrrMobilisablesFrichesLayerOpacity,
        },
        isVisible: (config) => config.enrrMobilisablesSolaireThermique.show && config.enrrMobilisablesSolaireThermique.showFriches,
        popup: Popup,
      },
      {
        id: 'enrrMobilisables-friches-contour',
        type: 'line',
        paint: {
          'line-color': ifHoverElse(darken(enrrMobilisablesFrichesLayerColor, 30), enrrMobilisablesFrichesLayerColor),
          'line-width': ifHoverElse(3, 2),
        },
        isVisible: (config) => config.enrrMobilisablesSolaireThermique.show && config.enrrMobilisablesSolaireThermique.showFriches,
        unselectable: true,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;

export type SolaireThermiqueFriche = {
  GmlID: string;
  comm_insee: string;
  'db_gd5kj.hsu_pnjyu.solaire_thermique_friches_solaire_thermique_friches.fid': number;
  site_id: string;
  site_nom: string;
  source_nom: string;
  st_area_shape_: number;
  st_length_shape_: number;
  surf_site: number;
  urba_zone_: string;
};

function Popup(friche: SolaireThermiqueFriche, { Property, Title, TwoColumns }: PopupStyleHelpers) {
  return (
    <>
      <Title subtitle="Friche">{friche.site_nom}</Title>
      <TwoColumns>
        <Property label="Surface" value={friche.surf_site} unit="m²" />
        <Property label="Source" value={friche.source_nom} />
      </TwoColumns>
    </>
  );
}
