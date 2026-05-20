import Button from '@codegouvfr/react-dsfr/Button';
import { parseAsStringLiteral, useQueryState } from 'nuqs';

import { BuildingsDataExtractionTool } from './BuildingsDataExtractionTool';
import { DistancesMeasurementTool } from './DistancesMeasurementTool';
import { LinearHeatDensityTool } from './LinearHeatDensityTool';

const toolIds = ['mesure-distance', 'extraction-batiments', 'densite-thermique-lineaire'] as const;
type ToolId = (typeof toolIds)[number];

const TOOL_LABEL: Record<ToolId, string> = {
  'densite-thermique-lineaire': 'Calculer une densité thermique linéaire',
  'extraction-batiments': 'Extraire des données sur les bâtiments',
  'mesure-distance': 'Mesurer une distance',
};

/** "Outils" tab. URL-persisted sub-tab via `?outil=…`. */
export function ToolsTabContent() {
  const [tool, setTool] = useQueryState('outil', parseAsStringLiteral(toolIds).withOptions({ history: 'replace' }));

  if (tool === null) {
    return (
      <div className="flex flex-col gap-3 px-3">
        <h2 className="text-base font-bold mb-0 text-(--text-title-grey)">Outils</h2>
        <div className="flex flex-col gap-2">
          <Button priority="secondary" size="small" iconId="ri-ruler-line" onClick={() => setTool('mesure-distance')}>
            Mesurer une distance
          </Button>
          <Button priority="secondary" size="small" iconId="ri-shape-line" onClick={() => setTool('extraction-batiments')}>
            Extraire des données sur les bâtiments
          </Button>
          <Button priority="secondary" size="small" iconId="ri-bar-chart-line" onClick={() => setTool('densite-thermique-lineaire')}>
            Calculer une densité thermique linéaire
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 px-3">
        <Button priority="secondary" size="small" iconId="fr-icon-arrow-left-line" onClick={() => setTool(null)}>
          Retour
        </Button>
        <h2 className="text-base font-bold mb-0 text-(--text-title-grey)">{TOOL_LABEL[tool]}</h2>
      </div>
      {tool === 'mesure-distance' && <DistancesMeasurementTool />}
      {tool === 'extraction-batiments' && <BuildingsDataExtractionTool />}
      {tool === 'densite-thermique-lineaire' && <LinearHeatDensityTool />}
    </div>
  );
}
