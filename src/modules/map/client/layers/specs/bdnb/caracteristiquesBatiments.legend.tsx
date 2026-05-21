import Link from '@/components/ui/Link';
import { dataSourcesVersions } from '@/modules/app/constants';
import { ObjectKeys } from '@/utils/typescript';

import { LegendSection } from '../../../legend/LegendSection';
import { caracteristiquesBatimentsLayerStyle } from './caracteristiquesBatiments';

const dpeLetters = ObjectKeys(caracteristiquesBatimentsLayerStyle);

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
      trackingEvent="Carto|DPE"
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
      contentClassName="text-[13px] gap-1"
    >
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
    </LegendSection>
  );
}
