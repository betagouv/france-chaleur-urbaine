import { LegendCheckbox } from '../../legend/LegendCheckbox';
import { LegendIcon } from '../../legend/LegendIcon';
import { etudesEnCoursColor, etudesEnCoursOpacity } from './etudesEnCours';

/**
 * Standalone toggle for "Études en cours" — no accordion, no body.
 */
export function EtudesEnCoursLegend() {
  return (
    <LegendCheckbox
      path="etudesEnCours"
      trackingEvent="Carto|Etudes en cours"
      label="Communes couvertes par une étude pour la création de réseaux"
      icon={<LegendIcon type="polygon" stroke={etudesEnCoursColor} fillOpacity={etudesEnCoursOpacity} />}
      tooltip={<>Information actuellement majoritairement disponible pour l'Île-de-France. Source : ADEME.</>}
      className="pl-3 pr-9"
    />
  );
}
