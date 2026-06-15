import Link from '@/components/ui/Link';

import { LegendCheckbox } from '../../legend/LegendCheckbox';
import { LegendIcon } from '../../legend/LegendIcon';
import { LegendSection } from '../../legend/LegendSection';
import { zonePotentielFortFroidColor, zonePotentielFroidColor, zonePotentielFroidOpacity } from './zonesPotentielFroid';

const tooltip = (
  <>
    Modélisation réalisée par le Cerema dans le cadre du projet EnRezo.
    <br />
    <Link
      href="https://reseaux-chaleur.cerema.fr/sites/reseaux-chaleur-v2/files/fichiers/2024/01/Methodologie_zones_opportunite_VF.pdf"
      isExternal
    >
      Accéder à la méthodologie
    </Link>
  </>
);

export function ZonesPotentielFroidLegend() {
  return (
    <LegendSection
      id="zones-potentiel-froid"
      title="Zones d'opportunité pour la création de réseaux de froid"
      togglePath="zonesOpportuniteFroid.show"
      trackingEvent="Carto|Zones d'opportunité froid"
      icon={<LegendIcon type="polygon" stroke={zonePotentielFortFroidColor} fillOpacity={zonePotentielFroidOpacity} />}
      tooltip={tooltip}
    >
      <LegendCheckbox
        path="zonesOpportuniteFroid.zonesPotentielFroid"
        trackingEvent="Carto|Zones à potentiel froid"
        label="Zones à potentiel froid"
        icon={<LegendIcon type="polygon" stroke={zonePotentielFroidColor} fillOpacity={zonePotentielFroidOpacity} />}
      />
      <LegendCheckbox
        path="zonesOpportuniteFroid.zonesPotentielFortFroid"
        trackingEvent="Carto|Zones à potentiel fort froid"
        label="Zones à fort potentiel froid"
        icon={<LegendIcon type="polygon" stroke={zonePotentielFortFroidColor} fillOpacity={zonePotentielFroidOpacity} />}
      />
    </LegendSection>
  );
}
