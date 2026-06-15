import Link from '@/components/ui/Link';

import { LegendIcon } from '../../legend/LegendIcon';
import { LegendIntervalSlider } from '../../legend/LegendIntervalSlider';
import { LegendSection } from '../../legend/LegendSection';
import {
  communesFortPotentielPourCreationReseauxChaleurLayerColor,
  communesFortPotentielPourCreationReseauxChaleurLayerOpacity,
} from './communesFortPotentielPourCreationReseauxChaleur';

/**
 * Legend section for "Communes à fort potentiel" — master toggle + a population
 * range slider with a static domain (no tRPC-fetched limits here).
 */
export function CommunesFortPotentielLegend() {
  return (
    <LegendSection
      id="communes-fort-potentiel"
      title="Communes à fort potentiel pour la création de réseaux de chaleur"
      togglePath="communesFortPotentielPourCreationReseauxChaleur.show"
      trackingEvent="Carto|Communes à fort potentiel pour la création de réseaux de chaleur"
      icon={
        <LegendIcon
          type="circle"
          color={communesFortPotentielPourCreationReseauxChaleurLayerColor}
          opacity={communesFortPotentielPourCreationReseauxChaleurLayerOpacity}
        />
      }
      tooltip={
        <>
          Communes sans réseau de chaleur sur lesquelles au moins une zone d'opportunité à fort potentiel est identifiée par le Cerema dans
          le cadre du projet EnRezo.
          <br />
          <Link
            href="https://reseaux-chaleur.cerema.fr/sites/reseaux-chaleur-v2/files/fichiers/2024/06/methodologie_besoin_industrie_2024.pdf"
            isExternal
          >
            Accéder à la méthodologie
          </Link>
        </>
      }
      contentClassName="mx-4"
    >
      <LegendIntervalSlider
        path="communesFortPotentielPourCreationReseauxChaleur.population"
        domain={[0, 100_000]}
        label="Nombre d'habitants"
        classes={{ label: 'text-sm' }}
        openEndedBounds
      />
    </LegendSection>
  );
}
