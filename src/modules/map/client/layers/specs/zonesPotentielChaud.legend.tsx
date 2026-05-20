import Link from '@/components/ui/Link';

import { LegendCheckbox } from '../../legend/LegendCheckbox';
import { LegendIcon } from '../../legend/LegendIcon';
import { LegendSection } from '../../legend/LegendSection';
import { zonePotentielChaudColor, zonePotentielChaudOpacity, zonePotentielFortChaudColor } from './zonesPotentielChaud';

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

export function ZonesPotentielChaudLegend() {
  return (
    <LegendSection
      id="zones-potentiel-chaud"
      title="Zones d'opportunité pour la création de réseaux de chaleur"
      togglePath="zonesOpportunite.show"
      icon={<LegendIcon type="polygon" stroke={zonePotentielFortChaudColor} fillOpacity={zonePotentielChaudOpacity} />}
      tooltip={tooltip}
    >
      <div className="flex flex-col pt-2 pl-3 pr-1">
        <LegendCheckbox
          path="zonesOpportunite.zonesPotentielChaud"
          label="Zones à potentiel"
          icon={<LegendIcon type="polygon" stroke={zonePotentielChaudColor} fillOpacity={zonePotentielChaudOpacity} />}
        />
        <LegendCheckbox
          path="zonesOpportunite.zonesPotentielFortChaud"
          label="Zones à fort potentiel"
          icon={<LegendIcon type="polygon" stroke={zonePotentielFortChaudColor} fillOpacity={zonePotentielChaudOpacity} />}
        />
      </div>
    </LegendSection>
  );
}
