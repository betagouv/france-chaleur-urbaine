import { formatTypeEnergieChauffage } from '@/utils/format';

import { ifHoverElse, type MapSourceLayersSpecification, type PopupStyleHelpers } from './common';

export const demandesEligibiliteLayerStyle = {
  fill: { color: '#FFFFFF', size: 4 },
  stroke: { color: '#FF7576', size: 2 },
};

export const demandesEligibiliteLayersSpec = [
  {
    layers: [
      {
        id: 'demandesEligibilite',
        isVisible: (config) => config.demandesEligibilite,
        paint: {
          'circle-color': demandesEligibiliteLayerStyle.fill.color,
          'circle-radius': ifHoverElse(demandesEligibiliteLayerStyle.fill.size + 2, demandesEligibiliteLayerStyle.fill.size),
          'circle-stroke-color': demandesEligibiliteLayerStyle.stroke.color,
          'circle-stroke-width': demandesEligibiliteLayerStyle.stroke.size,
        },
        popup: Popup,
        type: 'circle',
      },
    ],
    source: { promoteId: 'id' },
    sourceId: 'demands',
  },
] as const satisfies readonly MapSourceLayersSpecification[];

export type DemandeEligibilite = {
  id: string;
  Adresse: string;
  'Mode de chauffage': string;
  'Type de chauffage': string;
  Structure: string;
};

function Popup(demandeEligibilite: DemandeEligibilite, { Property, Title, TwoColumns }: PopupStyleHelpers) {
  return (
    <>
      <Title>{demandeEligibilite.Adresse}</Title>

      <TwoColumns>
        <Property label="Chauffage actuel" value={demandeEligibilite['Mode de chauffage']} formatter={formatTypeEnergieChauffage} />
        <Property label="Mode de chauffage" value={demandeEligibilite['Type de chauffage']} />
        <Property label="Structure" value={demandeEligibilite.Structure} />
      </TwoColumns>
    </>
  );
}
