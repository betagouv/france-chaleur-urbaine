import { LegendCheckbox } from '../../legend/LegendCheckbox';
import { LegendIcon } from '../../legend/LegendIcon';
import { demandesEligibiliteLayerStyle } from './demandesEligibilite';

/**
 * Standalone toggle for "Demandes de raccordement" — no accordion, no body.
 * Renders as a plain `LegendCheckbox` with a fill + stroke circle icon.
 */
export function DemandesEligibiliteLegend() {
  return (
    <LegendCheckbox
      path="demandesEligibilite"
      trackingEvent="Carto|Demandes de raccordement"
      label="Demandes de raccordement sur France Chaleur Urbaine"
      icon={
        <LegendIcon type="circle" color={demandesEligibiliteLayerStyle.fill.color} stroke={demandesEligibiliteLayerStyle.stroke.color} />
      }
    />
  );
}
