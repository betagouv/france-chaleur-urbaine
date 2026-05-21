import Button from '@codegouvfr/react-dsfr/Button';
import { useQueryState } from 'nuqs';

import { defaultTabState, tabsParser } from '../tabsUrl';
import { BuildingsDataExtractionTool } from './BuildingsDataExtractionTool';
import { DistancesMeasurementTool } from './DistancesMeasurementTool';
import { LinearHeatDensityTool } from './LinearHeatDensityTool';

const TOOL_LABEL = {
  'densite-thermique-lineaire': 'Calculer une densité thermique linéaire',
  'extraction-batiments': 'Extraire des données sur les bâtiments',
  'mesure-distance': 'Mesurer une distance',
} as const;

/**
 * "Outils" tab. Reads/writes the slash-encoded `?tab=` param (`outils` or
 * `outils/<id>`). Clicking the tab itself lands on the index — sub-tools are
 * only reached by an explicit button click.
 */
export function ToolsTabContent() {
  const [state, setState] = useQueryState('tab', tabsParser.withDefault(defaultTabState).withOptions({ history: 'push' }));
  const subTabId = state.tabId === 'outils' ? state.subTabId : null;

  if (subTabId === null) {
    return (
      <div className="flex flex-col gap-3 px-3 flex-1 min-h-0 overflow-y-auto">
        <h2 className="text-base font-bold mb-0 text-(--text-title-grey)">Outils</h2>
        <div className="flex flex-col gap-2">
          <Button
            priority="secondary"
            size="small"
            iconId="ri-ruler-line"
            onClick={() => setState({ subTabId: 'mesure-distance', tabId: 'outils' })}
          >
            Mesurer une distance
          </Button>
          <Button
            priority="secondary"
            size="small"
            iconId="ri-shape-line"
            onClick={() => setState({ subTabId: 'extraction-batiments', tabId: 'outils' })}
          >
            Extraire des données sur les bâtiments
          </Button>
          <Button
            priority="secondary"
            size="small"
            iconId="ri-bar-chart-line"
            onClick={() => setState({ subTabId: 'densite-thermique-lineaire', tabId: 'outils' })}
          >
            Calculer une densité thermique linéaire
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex flex-col gap-2 px-3 pb-2">
        <Button
          priority="secondary"
          size="small"
          iconId="fr-icon-arrow-left-line"
          onClick={() => setState({ subTabId: null, tabId: 'outils' })}
          className="self-start"
        >
          Retour
        </Button>
        <h2 className="text-base font-bold mb-0 text-(--text-title-grey)">{TOOL_LABEL[subTabId]}</h2>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {subTabId === 'mesure-distance' && <DistancesMeasurementTool />}
        {subTabId === 'extraction-batiments' && <BuildingsDataExtractionTool />}
        {subTabId === 'densite-thermique-lineaire' && <LinearHeatDensityTool />}
      </div>
    </div>
  );
}
