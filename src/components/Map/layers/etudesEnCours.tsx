import Badge from '@codegouvfr/react-dsfr/Badge';

import { type EtudesEnCours } from '@/server/db/kysely';
import { darken } from '@/utils/color';
import { type FrontendType } from '@/utils/typescript';

import { ifHoverElse, type MapSourceLayersSpecification, type PopupStyleHelpers } from './common';

export const etudesEnCoursColor = '#1E6091';
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

function Popup({ status, maitre_ouvrage, launched_at, description }: FrontendType<EtudesEnCours>, { Title }: PopupStyleHelpers) {
  const isOngoing = status === 'ongoing';
  const isDone = status === 'done';

  return (
    <>
      <Title>{maitre_ouvrage}</Title>
      {!!status && (
        <Badge severity={isOngoing ? 'info' : isDone ? 'success' : undefined} small>
          {isOngoing ? 'Etude en cours' : isDone ? 'Etude terminée' : 'Non renseigné'}
        </Badge>
      )}
      <div className="min-w-[200px]">{description}</div>
      <div className="mt-5 italic text-sm text-right">Débutée le {new Date(launched_at).toLocaleDateString()}</div>
    </>
  );
}
