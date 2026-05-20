import Link from '@/components/ui/Link';

import { LegendIcon } from '../../legend/LegendIcon';
import { LegendSection } from '../../legend/LegendSection';
import { besoinsEnChaleurIndustrieCommunesIntervals } from './besoinsEnChaleurIndustrieCommunes';

const last = besoinsEnChaleurIndustrieCommunesIntervals[besoinsEnChaleurIndustrieCommunesIntervals.length - 1];
const first = besoinsEnChaleurIndustrieCommunesIntervals[0];

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
    >
      <div className="flex flex-col gap-1 pt-2 pl-3 pr-1">
        <div className="flex h-2.5 border border-(--border-default-grey)">
          {besoinsEnChaleurIndustrieCommunesIntervals.map((interval) => (
            <div
              key={interval.color}
              title={`${interval.min} – ${interval.max}`}
              className="flex-1"
              style={{ backgroundColor: interval.color }}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-(--text-mention-grey)">
          <span>{first.min}</span>
          <span>{last.max}</span>
        </div>
      </div>
    </LegendSection>
  );
}
