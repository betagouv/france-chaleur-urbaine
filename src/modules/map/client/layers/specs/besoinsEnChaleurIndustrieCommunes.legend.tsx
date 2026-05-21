import Link from '@/components/ui/Link';

import { GradientBar } from '../../legend/GradientBar';
import { LegendIcon } from '../../legend/LegendIcon';
import { LegendSection } from '../../legend/LegendSection';
import { besoinsEnChaleurIndustrieCommunesIntervals } from './besoinsEnChaleurIndustrieCommunes';

const last = besoinsEnChaleurIndustrieCommunesIntervals[besoinsEnChaleurIndustrieCommunesIntervals.length - 1];

/**
 * Besoins en chaleur du secteur industriel — toggle + color-gradient bar.
 */
export function BesoinsEnChaleurIndustrieCommunesLegend() {
  return (
    <LegendSection
      id="besoins-chaleur-industrie"
      title="Besoins en chaleur du secteur industriel"
      togglePath="besoinsEnChaleurIndustrieCommunes"
      icon={<LegendIcon type="polygon" stroke={last.color} fillOpacity={0.7} />}
      tooltip={
        <>
          Modélisation réalisée par le Cerema dans le cadre du projet EnRezo.
          <br />
          <Link
            href="https://reseaux-chaleur.cerema.fr/sites/reseaux-chaleur-v2/files/fichiers/2024/06/methodologie_besoin_industrie_2024.pdf"
            isExternal
          >
            Accéder à la méthodologie
          </Link>
        </>
      }
      contentClassName="m-4"
    >
      <GradientBar intervals={besoinsEnChaleurIndustrieCommunesIntervals} />
    </LegendSection>
  );
}
