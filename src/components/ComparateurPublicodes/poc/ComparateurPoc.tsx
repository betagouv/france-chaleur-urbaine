import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';
import { useDebouncedEffect } from '@react-hookz/web';
import { useQueryState } from 'nuqs';
import { useEffect, useMemo, useRef, useState } from 'react';

import { FormProvider } from '@/components/form/publicodes/FormProvider';
import Button from '@/components/ui/Button';
import { copyToClipboard } from '@/components/ui/ButtonCopy';
import Loader from '@/components/ui/Loader';
import Notice from '@/components/ui/Notice';
import { notify } from '@/modules/notification';
import { RuleExplanationDialog } from '@/modules/publicodes/client/RuleExplanationDialog';
import type { FCUEngine } from '@/modules/publicodes/explanation-model';
import type { SimulatorSituation } from '@/modules/simulator/constants';
import { ObjectEntries } from '@/utils/typescript';

import { addresseToPublicodesRules } from '../mappings';
import useSimulatorEngine from '../useSimulatorEngine';
import { ContexteBatiment } from './ContexteBatiment';
import { ScenarioEditorDrawer } from './ScenarioEditorDrawer';
import { ScenariosChart } from './ScenariosChart';
import { ScenariosTable } from './ScenariosTable';
import { createScenarioEngine, getModeLabel, type ModePublicodesKey, type Scenario } from './scenario-model';
import { decodeComparateurUrlState, encodeComparateurUrlState, toKnownRules } from './url-state';

const DEFAULT_ADDRESS = '20 avenue de Ségur 75007 Paris';

const initialScenarios: Scenario[] = [
  { id: 'rdc', label: 'Réseau de chaleur', mode: 'réseau de chaleur', overrides: {} },
  { id: 'gaz', label: 'Gaz collectif', mode: 'gaz coll avec cond', overrides: {} },
  { id: 'pac', label: 'PAC air/air individuelle', mode: 'PAC air-air indiv', overrides: {} },
];

// Same initial choices as the current comparator (ECS produced by the heating equipment, no cooling)
const initialSituation: SimulatorSituation = {
  'climatisation . incluse': 'non',
  'ecs . production': 'oui',
  'ecs . type de production': "'Avec équipement chauffage'",
};

/**
 * POC of the next comparator: a shared building context on top, then side-by-side scenarios (a heating mode plus its own
 * parameter overrides) where every figure explains its formula. The whole simulation lives in the `c` URL parameter
 * (compressed), so a shared link lands on the same figures.
 */
export function ComparateurPoc() {
  const engine = useSimulatorEngine();
  const [, setUrlToken] = useQueryState('c', { history: 'replace', throttleMs: 500 });
  const [scenarios, setScenarios] = useState(initialScenarios);
  const [address, setAddress] = useState<string | null>(null);
  const [isRestored, setIsRestored] = useState(false);
  const [unknownRules, setUnknownRules] = useState<string[]>([]);
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);
  const [explained, setExplained] = useState<{ engine: FCUEngine; rule: RuleName } | null>(null);
  // Read from the location itself: with the Pages Router, router.query (hence nuqs) is still empty on the first render
  const initialTokenRef = useRef(new URLSearchParams(window.location.search).get('c'));

  // Restores the simulation from the URL once the engine is ready, or starts from the defaults
  useEffect(() => {
    if (!engine.loaded) {
      return;
    }
    let isCancelled = false;
    const restore = async () => {
      const decoded = initialTokenRef.current
        ? await decodeComparateurUrlState(
            initialTokenRef.current,
            toKnownRules(Object.keys(engine.internalEngine.getParsedRules()) as RuleName[])
          )
        : null;
      if (isCancelled) {
        return;
      }
      engine.updateSituation({ ...initialSituation, ...decoded?.state.baseInputs });
      setScenarios(decoded?.state.scenarios ?? initialScenarios);
      setAddress(decoded ? decoded.state.address : DEFAULT_ADDRESS);
      setUnknownRules(decoded?.unknownRules ?? []);
      if (initialTokenRef.current && !decoded) {
        notify('error', 'Le lien ne contenait pas de simulation valide : simulation par défaut.');
      }
      setIsRestored(true);
    };
    void restore();
    return () => {
      isCancelled = true;
    };
  }, [engine.loaded]);

  // The hook re-renders on every situation change: serializing it gives a stable memo key for the scenario engines
  const baseSituation = engine.getSituation();
  const baseSituationKey = JSON.stringify(baseSituation);
  // One engine per scenario, rebuilt only when its inputs change (shared context, mode, overrides): renaming a scenario costs nothing
  const engineCacheRef = useRef(new Map<string, { inputsKey: string; engine: FCUEngine }>());
  const scenarioEngines = useMemo(() => {
    const cache = engineCacheRef.current;
    const engines = Object.fromEntries(
      scenarios.map((scenario) => {
        const inputsKey = `${baseSituationKey}|${scenario.mode}|${JSON.stringify(scenario.overrides)}`;
        const cached = cache.get(scenario.id);
        const scenarioEngine =
          cached?.inputsKey === inputsKey ? cached.engine : createScenarioEngine(engine.internalEngine, baseSituation, scenario);
        cache.set(scenario.id, { engine: scenarioEngine, inputsKey });
        return [scenario.id, scenarioEngine];
      })
    );
    [...cache.keys()].filter((scenarioId) => !(scenarioId in engines)).forEach((scenarioId) => cache.delete(scenarioId));
    return engines;
  }, [baseSituationKey, scenarios]);

  // Mirrors the simulation into the URL: only the user's own inputs of the shared context (address-derived values are re-resolved)
  useDebouncedEffect(
    () => {
      if (!isRestored) {
        return;
      }
      const baseInputs = ObjectEntries(baseSituation).reduce<SimulatorSituation>((accumulator, [rule, value]) => {
        if (!(rule in addresseToPublicodesRules) && !engine.isDefaultValue(rule, value)) {
          accumulator[rule] = value;
        }
        return accumulator;
      }, {});
      void encodeComparateurUrlState({ address, baseInputs, scenarios }).then((token) => setUrlToken(token));
    },
    [isRestored, baseSituationKey, scenarios, address],
    500
  );

  if (!engine.loaded || !isRestored) {
    return <Loader size="xl" variant="section" />;
  }

  const updateScenario = (scenarioId: string, patch: Partial<Scenario>) =>
    setScenarios((current) => current.map((scenario) => (scenario.id === scenarioId ? { ...scenario, ...patch } : scenario)));

  const duplicateScenario = (scenarioId: string) =>
    setScenarios((current) =>
      current.flatMap((scenario) =>
        scenario.id === scenarioId
          ? [scenario, { ...scenario, id: `${scenario.id}-${Date.now()}`, label: `${scenario.label} (copie)` }]
          : [scenario]
      )
    );

  const addScenario = () =>
    setScenarios((current) => [
      ...current,
      { id: `scenario-${Date.now()}`, label: `Scénario ${current.length + 1}`, mode: 'gaz coll avec cond', overrides: {} },
    ]);

  const copyLink = () => {
    copyToClipboard(window.location.href);
    notify('success', 'Lien de la simulation copié dans le presse-papiers.');
  };

  const editingScenario = scenarios.find((scenario) => scenario.id === editingScenarioId) ?? null;
  const isTertiaire = engine.getField('bâtiment . type') === 'tertiaire';

  return (
    <FormProvider engine={engine}>
      <div className="flex flex-col gap-6">
        {unknownRules.length > 0 && (
          <Notice variant="warning" size="sm">
            Certains paramètres du lien n'existent plus dans le modèle de calcul et ont été ignorés : {unknownRules.join(', ')}.
          </Notice>
        )}
        <section>
          <h2 className="mb-2 text-lg">1. Contexte commun à tous les scénarios</h2>
          <ContexteBatiment engine={engine} address={address} onAddressChange={setAddress} />
        </section>
        <section>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="mb-0 text-lg">2. Scénarios comparés</h2>
            <div className="flex gap-2">
              <Button size="small" priority="tertiary" iconId="fr-icon-link" onClick={copyLink}>
                Copier le lien
              </Button>
              <Button size="small" priority="secondary" iconId="fr-icon-add-line" onClick={addScenario}>
                Ajouter un scénario
              </Button>
            </div>
          </div>
          <p className="mb-2 text-xs text-faded">
            Un scénario = un mode de chauffage + ses propres paramètres (prix de l'énergie, rendement, durée de vie…). Cliquez sur un
            chiffre pour voir comment il est calculé dans ce scénario.
          </p>
          <ScenariosTable
            scenarios={scenarios}
            engines={scenarioEngines}
            isTertiaire={isTertiaire}
            onEdit={setEditingScenarioId}
            onDuplicate={duplicateScenario}
            onRemove={(scenarioId) => setScenarios((current) => current.filter((scenario) => scenario.id !== scenarioId))}
            onRename={(scenarioId, label) => updateScenario(scenarioId, { label })}
            onChangeMode={(scenarioId: string, mode: ModePublicodesKey) =>
              updateScenario(scenarioId, { label: getModeLabel(mode), mode, overrides: {} })
            }
            onExplain={(scenarioEngine, rule) => setExplained({ engine: scenarioEngine, rule })}
          />
        </section>
        <section>
          <h2 className="mb-2 text-lg">3. Vue graphique</h2>
          <ScenariosChart scenarios={scenarios} engines={scenarioEngines} isTertiaire={isTertiaire} />
        </section>
      </div>
      <ScenarioEditorDrawer
        scenario={editingScenario}
        baseEngine={engine.internalEngine}
        onClose={() => setEditingScenarioId(null)}
        onChangeOverrides={(scenarioId: string, overrides: SimulatorSituation) => updateScenario(scenarioId, { overrides })}
        onExplain={(rule) => editingScenario && setExplained({ engine: scenarioEngines[editingScenario.id], rule })}
      />
      {explained && (
        <RuleExplanationDialog
          engine={explained.engine}
          dottedName={explained.rule}
          open
          onOpenChange={(open) => !open && setExplained(null)}
        />
      )}
    </FormProvider>
  );
}
