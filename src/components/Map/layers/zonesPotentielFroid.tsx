import { darken } from '@/utils/color';
import { formatMWhAn, prettyFormatNumber } from '@/utils/strings';

import { ifHoverElse, type MapSourceLayersSpecification, type PopupStyleHelpers } from './common';

export const zonePotentielFroidColor = '#0094FF';
export const zonePotentielFortFroidColor = '#005A9E';
export const zonePotentielFroidOpacity = 0.3;

export const zonesPotentielFroidLayersSpec = [
  {
    sourceId: 'zonesPotentielFroid',
    source: {
      type: 'vector',
      tiles: ['/api/map/zonesPotentielFroid/{z}/{x}/{y}'],
      maxzoom: 12,
      promoteId: 'id_zone',
    },
    layers: [
      {
        id: 'zonesPotentielFroid',
        type: 'fill',
        paint: {
          'fill-color': ifHoverElse(darken(zonePotentielFroidColor, 40), zonePotentielFroidColor),
          'fill-opacity': zonePotentielFroidOpacity,
        },
        isVisible: (config) => config.zonesOpportuniteFroid.show && config.zonesOpportuniteFroid.zonesPotentielFroid,
        popup: buildPopup(false),
      },
      {
        id: 'zonesPotentielFroid-contour',
        type: 'line',
        paint: {
          'line-color': zonePotentielFroidColor,
          'line-width': ifHoverElse(4, 2),
        },
        isVisible: (config) => config.zonesOpportuniteFroid.show && config.zonesOpportuniteFroid.zonesPotentielFroid,
        unselectable: true,
      },
    ],
  },

  {
    sourceId: 'zonesPotentielFortFroid',
    source: {
      type: 'vector',
      tiles: ['/api/map/zonesPotentielFortFroid/{z}/{x}/{y}'],
      maxzoom: 12,
      promoteId: 'id_zone',
    },
    layers: [
      {
        id: 'zonesPotentielFortFroid',
        type: 'fill',
        paint: {
          'fill-color': ifHoverElse(darken(zonePotentielFortFroidColor, 40), zonePotentielFortFroidColor),
          'fill-opacity': zonePotentielFroidOpacity,
        },
        isVisible: (config) => config.zonesOpportuniteFroid.show && config.zonesOpportuniteFroid.zonesPotentielFortFroid,
        popup: buildPopup(true),
      },
      {
        id: 'zonesPotentielFortFroid-contour',
        type: 'line',
        paint: {
          'line-color': zonePotentielFortFroidColor,
          'line-width': ifHoverElse(4, 2),
        },
        isVisible: (config) => config.zonesOpportuniteFroid.show && config.zonesOpportuniteFroid.zonesPotentielFortFroid,
        unselectable: true,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;

type ZonePotentielFroid = {
  fid: number;
  thalassothermie: number;
  surf_sol_8: number;
  part_ter: number;
  dep: string;
  rdt_bt: number;
  froid_mwh: number;
  surf_sol_1: number;
  id_zone: string;
  rdt_ht: number;
  surf_capt_: number;
  code_com_i: string;
  surf_cap_1: number;
  bat_imp: number;
  com_arr: string;
  SHAPE__Length: number;
  sol_moy: number;
  SHAPE__Area: number;
};

function buildPopup(fortFroid?: boolean) {
  const Popup = (zonePotentielFroid: ZonePotentielFroid, { Property, Title, TwoColumns }: PopupStyleHelpers) => (
    <>
      <Title>Zone à {fortFroid ? ' fort' : ''} potentiel froid</Title>
      <TwoColumns>
        <Property label="Nombre de bâtiments “intéressants”" value={zonePotentielFroid.bat_imp} />
        <Property label="Besoins en froid" value={zonePotentielFroid.froid_mwh} formatter={formatMWhAn} />
        <Property
          label="Part du secteur tertiaire"
          value={zonePotentielFroid.part_ter}
          formatter={(v) => <>{prettyFormatNumber(v * 100, 2)}&nbsp;%</>}
        />
        <Property label="Source" value="Cerema" />
      </TwoColumns>
    </>
  );
  return Popup;
}
