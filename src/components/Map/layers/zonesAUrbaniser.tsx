import { darken } from '@/utils/color';
import { isDefined } from '@/utils/core';

import { defineLayerPopup, ifHoverElse, type MapSourceLayersSpecification } from './common';

export const zonesAUrbaniserColor = '#8B4513';
export const zonesAUrbaniserOpacity = 0.4;

type ZoneAUrbaniser = {
  libelle: string; // ex "1AUY"
  libelong?: string; // ex "1AUY : Une zone à urbaniser destinée principalement aux activités économiques"
};

const Popup = defineLayerPopup<ZoneAUrbaniser>((zone, { Property, Title, TwoColumns }) => {
  // supprime le préfixe si le libellé long commence par le libellé + " : "
  const libelong = zone.libelong?.startsWith(`${zone.libelle} : `) ? zone.libelong.substring(zone.libelle.length + 3) : zone.libelong;

  return (
    <>
      <Title>Zone à urbaniser</Title>
      <TwoColumns>
        <Property label="Libellé" value={zone.libelle} />
        {isDefined(libelong) && <Property label="Libellé long" value={libelong} />}
      </TwoColumns>
    </>
  );
});

export const zonesAUrbaniserLayersSpec = [
  {
    layers: [
      {
        id: 'zonesAUrbaniser',
        isVisible: (config) => config.zonesAUrbaniser,
        paint: {
          'fill-color': ifHoverElse(darken(zonesAUrbaniserColor, 40), zonesAUrbaniserColor),
          'fill-opacity': zonesAUrbaniserOpacity,
        },
        popup: Popup,
        type: 'fill',
      },
      {
        id: 'zonesAUrbaniser-contour',
        isVisible: (config) => config.zonesAUrbaniser,
        paint: {
          'line-color': zonesAUrbaniserColor,
          'line-width': ifHoverElse(3, 1),
        },
        type: 'line',
        unselectable: true,
      },
    ],
    source: {
      maxzoom: 12,
      tiles: ['/api/map/zonesAUrbaniser/{z}/{x}/{y}'],
      type: 'vector',
    },
    sourceId: 'zonesAUrbaniser',
  },
] as const satisfies readonly MapSourceLayersSpecification[];
