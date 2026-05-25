import Accordion from '@/components/ui/Accordion';
import { DownloadNetworkGeometryButton } from '@/modules/map/client/components/DownloadNetworkGeometryButton';
import type { PerimetreDeveloppementPrioritaireTile } from '@/modules/tiles/server/tiles.config';

import { defineLayerPopup, type MapSourceLayersSpecification } from './common';

const Popup = defineLayerPopup<PerimetreDeveloppementPrioritaireTile>((perimetre, { Property, Title, TwoColumns }) => {
  return (
    <>
      <Title title={`ID FCU: ${perimetre.id_fcu}`}>Périmètre de développement prioritaire</Title>
      <TwoColumns>
        {perimetre['Identifiant reseau'] && <Property label="Identifiant réseau" value={perimetre['Identifiant reseau']} />}
      </TwoColumns>
      <Accordion label="Informations supplémentaires" simple small>
        <DownloadNetworkGeometryButton
          id_fcu={perimetre.id_fcu}
          type="zone_de_developpement_prioritaire"
          networkName={`pdp_${perimetre['Identifiant reseau']}`}
        />
      </Accordion>
    </>
  );
});

export const perimetresDeDeveloppementPrioritaireColor = '#f0bb00';
export const perimetresDeDeveloppementPrioritaireOpacity = 0.47;

export const perimetresDeDeveloppementPrioritaireLayersSpec = [
  {
    layers: [
      {
        id: 'zonesDeDeveloppementPrioritaire',
        isVisible: (config) => config.zonesDeDeveloppementPrioritaire,
        paint: {
          'fill-color': perimetresDeDeveloppementPrioritaireColor,
          'fill-opacity': perimetresDeDeveloppementPrioritaireOpacity,
        },
        popup: Popup,
        type: 'fill',
      },
    ],
    source: { maxzoom: 14 },
    sourceId: 'perimetres-de-developpement-prioritaire',
  },
] as const satisfies readonly MapSourceLayersSpecification[];
