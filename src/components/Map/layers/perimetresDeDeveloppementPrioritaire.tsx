import Accordion from '@/components/ui/Accordion';
import { DownloadNetworkGeometryButton } from '../components/DownloadNetworkGeometryButton';
import { defineLayerPopup, type MapSourceLayersSpecification } from './common';

type PerimetreDeveloppementPrioritaire = {
  id_fcu: number;
  'Identifiant reseau'?: string;
};

const Popup = defineLayerPopup<PerimetreDeveloppementPrioritaire>((perimetre, { Property, Title, TwoColumns }) => {
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
        'source-layer': 'zoneDP',
        type: 'fill',
      },
    ],
    source: {
      maxzoom: 14,
      tiles: ['/api/map/zoneDP/{z}/{x}/{y}'],
      type: 'vector',
    },
    sourceId: 'zoneDP',
  },
] as const satisfies readonly MapSourceLayersSpecification[];
