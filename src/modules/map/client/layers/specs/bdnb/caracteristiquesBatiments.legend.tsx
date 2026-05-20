import Link from '@/components/ui/Link';
import { dataSourcesVersions } from '@/modules/app/constants';

import { LegendSection } from '../../../legend/LegendSection';
import { caracteristiquesBatimentsLayerStyle } from './caracteristiquesBatiments';

const dpeLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const;

/**
 * Caractéristiques des bâtiments — master toggle + DPE color palette.
 * Icon is a custom "C"-letter colored box (DPE class C, mid palette) — matches V1.
 */
export function CaracteristiquesBatimentsLegend() {
  return (
    <LegendSection
      id="caracteristiques-batiments"
      title="Caractéristiques des bâtiments"
      togglePath="caracteristiquesBatiments"
      icon={
        <span
          aria-hidden
          className="mt-0.5 inline-grid size-4 place-content-center text-xs text-white"
          style={{ backgroundColor: caracteristiquesBatimentsLayerStyle.C }}
        >
          C
        </span>
      }
      tooltip={
        <>
          Les DPE affichés par bâtiment résultent d'une extrapolation des DPE par logement ancienne définition. Ils sont donnés à titre
          informatif et non-officiel, sans aucune valeur légale.
          <br />
          Données :{' '}
          <Link href={dataSourcesVersions.bdnb.link} isExternal>
            {dataSourcesVersions.bdnb.version}
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-1 pl-3 pr-1 pt-2">
        <div className="italic">Cliquer sur le bâtiment souhaité</div>
        <div>Diagnostic de performance énergétique</div>
        <div className="flex gap-1">
          {dpeLetters.map((letter) => (
            <span
              key={letter}
              className="inline-grid size-6 place-content-center text-[18px] text-white"
              style={{ backgroundColor: caracteristiquesBatimentsLayerStyle[letter] }}
              title={`DPE ${letter}`}
            >
              {letter}
            </span>
          ))}
        </div>
      </div>
    </LegendSection>
  );
}
