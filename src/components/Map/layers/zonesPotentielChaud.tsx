import { darken } from '@/utils/color';
import { formatMWhAn, prettyFormatNumber } from '@/utils/strings';

import { ifHoverElse, type MapSourceLayersSpecification, type PopupStyleHelpers } from './common';

export const zonePotentielChaudColor = '#B9E713';
export const zonePotentielFortChaudColor = '#7CA362';
export const zonePotentielChaudOpacity = 0.3;

export const zonesPotentielChaudLayersSpec = [
  {
    layers: [
      {
        id: 'zones-potentiel-chaud',
        isVisible: (config) => config.zonesOpportunite.show && config.zonesOpportunite.zonesPotentielChaud,
        paint: {
          'fill-color': ifHoverElse(darken(zonePotentielChaudColor, 40), zonePotentielChaudColor),
          'fill-opacity': zonePotentielChaudOpacity,
        },
        popup: buildPopup(false),
        type: 'fill',
      },
      {
        id: 'zonesPotentielChaud-contour',
        isVisible: (config) => config.zonesOpportunite.show && config.zonesOpportunite.zonesPotentielChaud,
        paint: {
          'line-color': zonePotentielChaudColor,
          'line-width': ifHoverElse(4, 2),
        },
        type: 'line',
        unselectable: true,
      },
    ],
    source: {
      maxzoom: 12,
      promoteId: 'id_zone',
    },
    sourceId: 'zones-potentiel-chaud',
  },

  {
    layers: [
      {
        id: 'zones-potentiel-fort-chaud',
        isVisible: (config) => config.zonesOpportunite.show && config.zonesOpportunite.zonesPotentielFortChaud,
        paint: {
          'fill-color': ifHoverElse(darken(zonePotentielFortChaudColor, 40), zonePotentielFortChaudColor),
          'fill-opacity': zonePotentielChaudOpacity,
        },
        popup: buildPopup(true),
        type: 'fill',
      },
      {
        id: 'zonesPotentielFortChaud-contour',
        isVisible: (config) => config.zonesOpportunite.show && config.zonesOpportunite.zonesPotentielFortChaud,
        paint: {
          'line-color': zonePotentielFortChaudColor,
          'line-width': ifHoverElse(4, 2),
        },
        type: 'line',
        unselectable: true,
      },
    ],
    source: {
      maxzoom: 12,
      promoteId: 'id_zone',
    },
    sourceId: 'zones-potentiel-fort-chaud',
  },
] as const satisfies readonly MapSourceLayersSpecification[];

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
  const Popup = (zonePotentielChaud: ZonePotentielChaud, { Property, Title, TwoColumns }: PopupStyleHelpers) => (
    <>
      <Title>Zone à {fortChaud ? ' fort' : ''} potentiel</Title>
      <TwoColumns>
        <Property label="Nombre de bâtiments “intéressants”" value={zonePotentielChaud.bat_imp} />
        <Property label="Besoins en chauffage" value={zonePotentielChaud.chauf_mwh} formatter={formatMWhAn} />
        <Property label="Besoins en eau chaude sanitaire" value={zonePotentielChaud.ecs_mwh} formatter={formatMWhAn} />
        <Property
          label="Part du secteur tertiaire"
          value={zonePotentielChaud.part_ter}
          formatter={(v) => <>{prettyFormatNumber(v * 100, 2)}&nbsp;%</>}
        />
        <Property label="Source" value="Cerema" />
      </TwoColumns>
    </>
  );
  return Popup;
}
