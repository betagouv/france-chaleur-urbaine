import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';
import { useEffect } from 'react';

import useSimulatorEngine from '@/components/ComparateurPublicodes/useSimulatorEngine';
import Loader from '@/components/ui/Loader';

import { ExplainedValue } from '../ExplainedValue';

// 20 avenue de Ségur 75007 Paris — copied from the publicodes repo sample situations
const demoSituation = {
  'bâtiment . nombre de logements': 40,
  'climat . code département': "'75'",
  'climat . température de référence chaud commune': -5,
  'climatisation . incluse': 'non',
  'ecs . production': 'oui',
  'ecs . type de production': "'Avec équipement chauffage'",
  'réseau de chaleur . caractéristiques . contenu CO2': 0.157,
  'réseau de chaleur . caractéristiques . contenu CO2 ACV': 0.182,
  'réseau de chaleur . caractéristiques . livraisons totales': 3739841,
  'réseau de chaleur . caractéristiques . part fixe': 23.6851545755077,
  'réseau de chaleur . caractéristiques . part variable': 76.3148454244923,
  'réseau de chaleur . caractéristiques . prix moyen': 109.502957238406,
  'réseau de chaleur . caractéristiques . production totale': 5907294.94,
  'réseau de chaleur . caractéristiques . taux EnRR': 48.8,
} satisfies Partial<Record<RuleName, unknown>>;

const demoModes = ['réseau de chaleur', 'gaz coll avec cond', 'PAC air-eau coll', 'radiateur électrique'] as const;

const bilanPosts = [
  { key: 'P1abo', label: 'P1 abonnement' },
  { key: 'P1conso', label: 'P1 consommation' },
  { key: 'P1ECS', label: 'P1 ECS' },
  { key: 'P2', label: 'P2 petit entretien' },
  { key: 'P3', label: 'P3 gros entretien' },
  { key: 'P4 moins aides', label: 'P4 moins aides' },
  { key: 'aides', label: 'Aides' },
  { key: 'total avec aides', label: 'Total avec aides' },
] as const;

/**
 * POC demo: a bilan table (posts × heating modes) on a fixed situation, where every
 * value is clickable and opens the rule explanation dialog.
 */
export function ExplanationDemo() {
  const engine = useSimulatorEngine();

  // Applique la situation de démo une fois le moteur chargé
  useEffect(() => {
    engine.setSituation(demoSituation);
  }, [engine.loaded]);

  if (!engine.loaded) {
    return <Loader />;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="mb-0 text-sm text-gray-600">
        Situation de démo : 20 avenue de Ségur, Paris 7ᵉ — 40 logements, ECS incluse, sans climatisation. Cliquez sur une valeur pour
        comprendre son calcul.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-2">Poste du bilan (€TTC/an)</th>
              {demoModes.map((mode) => (
                <th key={mode} className="p-2 text-right">
                  {mode}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bilanPosts.map((post) => (
              <tr key={post.key} className="odd:bg-gray-50">
                <td className="p-2 font-medium">{post.label}</td>
                {demoModes.map((mode) => (
                  <td key={mode} className="p-2 text-right">
                    <ExplainedValue engine={engine.internalEngine} dottedName={`${mode} . bilan . ${post.key}` as RuleName} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
