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
      icon={<LegendIcon type="polygon" stroke={zonePotentielFortFroidColor} fillOpacity={zonePotentielFroidOpacity} />}
      tooltip={tooltip}
    >
      <div className="flex flex-col pt-2 pl-3 pr-1">
        <LegendCheckbox
          path="zonesOpportuniteFroid.zonesPotentielFroid"
          label="Zones à potentiel froid"
          icon={<LegendIcon type="polygon" stroke={zonePotentielFroidColor} fillOpacity={zonePotentielFroidOpacity} />}
        />
        <LegendCheckbox
          path="zonesOpportuniteFroid.zonesPotentielFortFroid"
          label="Zones à fort potentiel froid"
          icon={<LegendIcon type="polygon" stroke={zonePotentielFortFroidColor} fillOpacity={zonePotentielFroidOpacity} />}
        />
      </div>
    </LegendSection>
  );
}
