import type { ReactNode } from 'react';

import { clientConfig } from '@/client-config';
import Link from '@/components/ui/Link';

import type { LayerKey } from '../iframeCarteParams';
import { PerimetresDeDeveloppementPrioritaireLegend } from '../layers/specs/perimetresDeDeveloppementPrioritaire.legend';
import { ReseauxDeChaleurLegend } from '../layers/specs/reseauxDeChaleur.legend';
import { ReseauxDeFroidLegend } from '../layers/specs/reseauxDeFroid.legend';
import { ReseauxEnConstructionLegend } from '../layers/specs/reseauxEnConstruction.legend';

const legendRowByLayer: Record<LayerKey, () => ReactNode> = {
  'perimetres-de-developpement-prioritaire': PerimetresDeDeveloppementPrioritaireLegend,
  'reseaux-de-chaleur': ReseauxDeChaleurLegend,
  'reseaux-de-froid': ReseauxDeFroidLegend,
  'reseaux-en-construction': ReseauxEnConstructionLegend,
};

/**
 * Compact, parameterizable legend for iframes — reuses the shared legend rows
 * (toggle layers via `useMapConfig`). Rendered inside the drawer via `<Map legendContent>`.
 */
export function IframeLegend({ layers, title = 'Légende' }: { layers: readonly LayerKey[]; title?: ReactNode }) {
  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
      <h2 className="text-base font-bold mb-0 text-(--text-title-grey)">{title}</h2>
      <div className="flex flex-col">
        {layers.map((layer) => {
          const LegendRow = legendRowByLayer[layer];
          return <LegendRow key={layer} />;
        })}
      </div>
      <Link
        href={clientConfig.websiteUrl}
        isExternal
        title="France Chaleur Urbaine"
        className="reset-external bg-none! mt-auto flex shrink-0 items-center justify-center pt-2"
      >
        <img src="/logo-fcu-with-typo-tight.webp" alt="France Chaleur Urbaine" className="block h-12 w-auto" />
      </Link>
    </div>
  );
}
