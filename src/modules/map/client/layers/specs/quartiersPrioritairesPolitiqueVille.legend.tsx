import Link from '@/components/ui/Link';

import { LegendCheckbox } from '../../legend/LegendCheckbox';
import { LegendIcon } from '../../legend/LegendIcon';
import { LegendSection } from '../../legend/LegendSection';
import {
  quartiersPrioritairesPolitiqueVille2015anruColor,
  quartiersPrioritairesPolitiqueVille2024Color,
  quartiersPrioritairesPolitiqueVilleOpacity,
} from './quartiersPrioritairesPolitiqueVille';

export function QuartiersPrioritairesLegend() {
  return (
    <LegendSection
      id="quartiers-prioritaires"
      title="Quartiers prioritaires de la politique de la ville (QPV)"
      togglePath="quartiersPrioritairesPolitiqueVille.show"
      trackingEvent="Carto|Quartiers Prioritaires politique Ville"
      icon={
        <LegendIcon
          type="polygon"
          stroke={quartiersPrioritairesPolitiqueVille2024Color}
          fillOpacity={quartiersPrioritairesPolitiqueVilleOpacity}
        />
      }
      tooltip={
        <>
          Les périmètres des QPV sont{' '}
          <Link href="https://www.data.gouv.fr/fr/datasets/quartiers-prioritaires-de-la-politique-de-la-ville-qpv/" isExternal>
            diffusés par l'ANCT sur data.gouv.fr
          </Link>
          . Les quartiers engagés dans le Nouveau Programme National de Renouvellement Urbain (ANRU) sont basés sur les périmètres de 2015,
          pas de 2024.
        </>
      }
    >
      <LegendCheckbox
        path="quartiersPrioritairesPolitiqueVille.qpv2015anru"
        trackingEvent="Carto|Quartiers Prioritaires politique Ville 2015 ANRU"
        label="QPV du Nouveau Programme National de Renouvellement Urbain (ANRU)"
        icon={
          <LegendIcon
            type="polygon"
            stroke={quartiersPrioritairesPolitiqueVille2015anruColor}
            fillOpacity={quartiersPrioritairesPolitiqueVilleOpacity}
          />
        }
      />
      <LegendCheckbox
        path="quartiersPrioritairesPolitiqueVille.qpv2024"
        trackingEvent="Carto|Quartiers Prioritaires politique Ville 2024"
        label="QPV 2024"
        icon={
          <LegendIcon
            type="polygon"
            stroke={quartiersPrioritairesPolitiqueVille2024Color}
            fillOpacity={quartiersPrioritairesPolitiqueVilleOpacity}
          />
        }
      />
    </LegendSection>
  );
}
