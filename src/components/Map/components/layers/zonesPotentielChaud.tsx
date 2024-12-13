import { darken } from '@/utils/color';
import { formatMWhAn, prettyFormatNumber } from '@/utils/strings';

import { ifHoverElse, type PopupStyleHelpers, type MapSourceLayersSpecification } from './common';

export const zonePotentielChaudColor = '#b0cc4e';
export const zonePotentielFortChaudColor = '#448d60';
export const zonePotentielChaudOpacity = 0.3;

export const zonesPotentielChaudLayersSpec = [
  {
    sourceId: 'zonesPotentielChaud',
    source: {
      type: 'vector',
      tiles: ['/api/map/zonesPotentielChaud/{z}/{x}/{y}'],
      maxzoom: 12,
      promoteId: 'id_zone',
    },
    layers: [
      {
        id: 'zonesPotentielChaud',
        type: 'fill',
        paint: {
          'fill-color': ifHoverElse(darken(zonePotentielChaudColor, 40), zonePotentielChaudColor),
          'fill-opacity': zonePotentielChaudOpacity,
        },
        isVisible: (config) => config.zonesOpportunite.show && config.zonesOpportunite.zonesPotentielChaud,
        popup: buildPopup(false),
      },
      {
        id: 'zonesPotentielChaud-contour',
        type: 'line',
        paint: {
          'line-color': zonePotentielChaudColor,
          'line-width': ifHoverElse(4, 2),
        },
        isVisible: (config) => config.zonesOpportunite.show && config.zonesOpportunite.zonesPotentielChaud,
        unselectable: true,
      },
    ],
  },

  {
    sourceId: 'zonesPotentielFortChaud',
    source: {
      type: 'vector',
      tiles: ['/api/map/zonesPotentielFortChaud/{z}/{x}/{y}'],
      maxzoom: 12,
      promoteId: 'id_zone',
    },
    layers: [
      {
        id: 'zonesPotentielFortChaud',
        type: 'fill',
        paint: {
          'fill-color': ifHoverElse(darken(zonePotentielFortChaudColor, 40), zonePotentielFortChaudColor),
          'fill-opacity': zonePotentielChaudOpacity,
        },
        isVisible: (config) => config.zonesOpportunite.show && config.zonesOpportunite.zonesPotentielFortChaud,
        popup: buildPopup(true),
      },
      {
        id: 'zonesPotentielFortChaud-contour',
        type: 'line',
        paint: {
          'line-color': zonePotentielFortChaudColor,
          'line-width': ifHoverElse(4, 2),
        },
        isVisible: (config) => config.zonesOpportunite.show && config.zonesOpportunite.zonesPotentielFortChaud,
        unselectable: true,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;

type ZonePotentielChaud = {
  fid: number;
  geothermie: number;
  surf_sol_8: number;
  part_ter: number;
  dep: string;
  rdt_bt: number;
  chauf_mwh: number;
  ecs_mwh: number;
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
  part_ecs: number;
  SHAPE__Area: number;
};

function buildPopup(fortChaud?: boolean) {
  const Popup = (zonePotentielChaud: ZonePotentielChaud, { Property, Title }: PopupStyleHelpers) => (
    <>
      <Title>Zone à {fortChaud ? ' fort' : ''} potentiel</Title>
      <Property label="Nombre de bâtiments “intéressants”" value={zonePotentielChaud.bat_imp} />
      <Property label="Besoins en chauffage" value={zonePotentielChaud.chauf_mwh} formatter={formatMWhAn} />
      <Property label="Besoins en eau chaude sanitaire" value={zonePotentielChaud.ecs_mwh} formatter={formatMWhAn} />
      <Property
        label="Part du secteur tertiaire"
        value={zonePotentielChaud.part_ter}
        formatter={(v) => <>{prettyFormatNumber(v * 100, 2)}&nbsp;%</>}
      />
      <Property label="Source" value="Cerema" />
    </>
  );
  return Popup;
}
