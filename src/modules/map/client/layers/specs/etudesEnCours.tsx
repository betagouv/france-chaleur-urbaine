import { defineLayerPopup, ifHoverElse, type MapSourceLayersSpecification } from '@/modules/map/client/core/common';
import type { EtudesEnCours } from '@/server/db/kysely';
import { darken } from '@/utils/color';
import type { FrontendType } from '@/utils/typescript';

export const etudesEnCoursColor = '#208ee2';
export const etudesEnCoursOpacity = 0.3;

const Popup = defineLayerPopup<FrontendType<EtudesEnCours>>(({ maitre_ouvrage, launched_at, communes }, { Property, TwoColumns }) => {
  const severalMaitreOuvrage = maitre_ouvrage.split(',').length > 1;
  const severalCommunes = (communes || '')?.split(',').length > 1;

  return (
    <TwoColumns>
      <Property label={`Maitre${severalMaitreOuvrage ? 's' : ''} d’ouvrage${severalMaitreOuvrage ? 's' : ''}`} value={maitre_ouvrage} />
      <Property label={`Commune${severalCommunes ? 's' : ''} couverte${severalCommunes ? 's' : ''}`} value={communes} />
      <Property
        label="Débutée le"
        value={new Date(launched_at).toLocaleDateString('fr-FR', {
          dateStyle: 'long',
        })}
      />
    </TwoColumns>
  );
});

export const etudesEnCoursLayersSpec = [
  {
    layers: [
      {
        id: 'etudes-en-cours',
        isVisible: (config) => config.etudesEnCours,
        paint: {
          'fill-color': ifHoverElse(darken(etudesEnCoursColor, 40), etudesEnCoursColor),
          'fill-opacity': etudesEnCoursOpacity,
        },
        popup: Popup,
        type: 'fill',
      },
      {
        id: 'etudesEnCours-contour',
        isVisible: (config) => config.etudesEnCours,
        paint: {
          'line-color': etudesEnCoursColor,
          'line-width': ifHoverElse(4, 2),
        },
        type: 'line',
        unselectable: true,
      },
    ],
    source: { maxzoom: 14 },
    sourceId: 'etudes-en-cours',
  },
] as const satisfies readonly MapSourceLayersSpecification[];
