import Badge from '@codegouvfr/react-dsfr/Badge';

import { type EtudesEnCours } from '@/server/db/kysely';
import { darken } from '@/utils/color';
import { type FrontendType } from '@/utils/typescript';

import { ifHoverElse, type MapSourceLayersSpecification, type PopupStyleHelpers } from './common';

export const etudesEnCoursColor = '#208ee2';
export const etudesEnCoursOpacity = 0.3;

export const etudesEnCoursLayersSpec = [
  {
    sourceId: 'etudesEnCours',
    source: {
      type: 'vector',
      tiles: ['/api/map/etudesEnCours/{z}/{x}/{y}'],
      maxzoom: 14,
    },
    layers: [
      {
        id: 'etudesEnCours',
        type: 'fill',
        paint: {
          'fill-color': ifHoverElse(darken(etudesEnCoursColor, 40), etudesEnCoursColor),
          'fill-opacity': etudesEnCoursOpacity,
        },
        isVisible: (config) => config.etudesEnCours,
        popup: Popup,
      },
      {
        id: 'etudesEnCours-contour',
        type: 'line',
        paint: {
          'line-color': etudesEnCoursColor,
          'line-width': ifHoverElse(4, 2),
        },
        isVisible: (config) => config.etudesEnCours,
        unselectable: true,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;

function Popup(
  { status, maitre_ouvrage, launched_at, communes }: FrontendType<EtudesEnCours>,
  { Property, TwoColumns }: PopupStyleHelpers
) {
  const isOngoing = status === 'ongoing';
  const isDone = status === 'done';
  const severalMaitreOuvrage = maitre_ouvrage.split(',').length > 1;
  const severalCommunes = (communes || '')?.split(',').length > 1;

  return (
    <>
      {!!status && (
        <Badge severity={isOngoing ? 'info' : isDone ? 'success' : undefined} small className="mt-2">
          {isOngoing ? 'Etude en cours' : isDone ? 'Etude terminée' : 'Non renseigné'}
        </Badge>
      )}
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
    </>
  );
}
